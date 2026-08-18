import { useState, type ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  InputGroup,
  NonIdealState,
  NonIdealStateIconSize,
  TextArea,
} from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import {
  addFindingAction,
  finding,
  investigationCase,
  organization,
  person,
  resolveFindingAction,
  wallet,
} from "@ontology/sdk";
import { useLinks, useOsdkAction } from "@osdk/react";
import { useActingAs } from "./ActingAsContext";
import StatusPip from "./StatusPip";
import WalletRow from "./WalletRow";
import {
  errorMessage,
  FINDING_MITIGATED,
  FINDING_OPEN,
  isFindingsFrozen,
  SEVERITIES,
  severityIntent,
  severityRank,
} from "./status";
import { showError, showSuccess } from "./toast";
import css from "./desk.module.css";

function sortFindings(
  rows: Osdk.Instance<finding>[],
): Osdk.Instance<finding>[] {
  return [...rows].sort((left, right) => {
    const leftOpen = left.status === FINDING_OPEN ? 0 : 1;
    const rightOpen = right.status === FINDING_OPEN ? 0 : 1;
    if (leftOpen !== rightOpen) return leftOpen - rightOpen;
    return severityRank(left.severity) - severityRank(right.severity);
  });
}

function WalletSelect({
  wallets,
  selected,
  onChange,
}: {
  wallets: Osdk.Instance<wallet>[];
  selected: Osdk.Instance<wallet> | undefined;
  onChange: (row: Osdk.Instance<wallet> | undefined) => void;
}): ReactElement {
  const value =
    selected != null ? String(selected.id ?? selected.$primaryKey) : "";
  return (
    <FormGroup label="Wallet (optional)" labelFor="finding-wallet">
      <HTMLSelect
        id="finding-wallet"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const id = event.currentTarget.value;
          onChange(
            wallets.find((row) => String(row.id ?? row.$primaryKey) === id),
          );
        }}
      >
        <option value="">None</option>
        {wallets.map((row) => (
          <option key={row.$primaryKey} value={String(row.id ?? row.$primaryKey)}>
            {row.label} · {row.chain}
          </option>
        ))}
      </HTMLSelect>
    </FormGroup>
  );
}

function PersonWalletSelect({
  subject,
  selected,
  onChange,
}: {
  subject: Osdk.Instance<person>;
  selected: Osdk.Instance<wallet> | undefined;
  onChange: (row: Osdk.Instance<wallet> | undefined) => void;
}): ReactElement {
  const { links } = useLinks(subject, "personWallets", { pageSize: 50 });
  return (
    <WalletSelect
      wallets={links?.filter(Boolean) ?? []}
      selected={selected}
      onChange={onChange}
    />
  );
}

function OrganizationWalletSelect({
  subject,
  selected,
  onChange,
}: {
  subject: Osdk.Instance<organization>;
  selected: Osdk.Instance<wallet> | undefined;
  onChange: (row: Osdk.Instance<wallet> | undefined) => void;
}): ReactElement {
  const { links } = useLinks(subject, "organizationWallets", { pageSize: 50 });
  return (
    <WalletSelect
      wallets={links?.filter(Boolean) ?? []}
      selected={selected}
      onChange={onChange}
    />
  );
}

function AddFindingDialog({
  item,
  isOpen,
  onClose,
}: {
  item: Osdk.Instance<investigationCase>;
  isOpen: boolean;
  onClose: () => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const addAction = useOsdkAction(addFindingAction);
  const { links: people } = useLinks(item, "subjectPerson", { pageSize: 1 });
  const { links: orgs } = useLinks(item, "subjectOrganization", { pageSize: 1 });
  const subjectPerson = people?.find(Boolean);
  const subjectOrganization = orgs?.find(Boolean);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<string>("Medium");
  const [relatedWallet, setRelatedWallet] = useState<
    Osdk.Instance<wallet> | undefined
  >();

  async function submit(): Promise<void> {
    if (actingAs == null) {
      showError("Select an analyst first.");
      return;
    }
    try {
      await addAction.applyAction({
        caseToUpdate: item,
        actingAnalyst: actingAs,
        title,
        body,
        severity,
        ...(subjectPerson != null ? { relatedPerson: subjectPerson } : {}),
        ...(subjectOrganization != null
          ? { relatedOrganization: subjectOrganization }
          : {}),
        ...(relatedWallet != null ? { relatedWallet } : {}),
      });
      setTitle("");
      setBody("");
      setSeverity("Medium");
      setRelatedWallet(undefined);
      showSuccess("Finding added.");
      onClose();
    } catch (caught) {
      showError(errorMessage(caught));
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add Finding">
      <DialogBody>
        <div className={css.stack}>
          <FormGroup label="Title" labelFor="finding-title">
            <InputGroup
              id="finding-title"
              autoComplete="off"
              spellCheck={false}
              placeholder="Short title for what you observed"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label="Severity" labelFor="finding-severity">
            <HTMLSelect
              id="finding-severity"
              autoComplete="off"
              value={severity}
              onChange={(event) => setSeverity(event.currentTarget.value)}
            >
              {SEVERITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </HTMLSelect>
          </FormGroup>
          {subjectPerson != null && (
            <PersonWalletSelect
              subject={subjectPerson}
              selected={relatedWallet}
              onChange={setRelatedWallet}
            />
          )}
          {subjectOrganization != null && (
            <OrganizationWalletSelect
              subject={subjectOrganization}
              selected={relatedWallet}
              onChange={setRelatedWallet}
            />
          )}
          <FormGroup label="Body" labelFor="finding-body">
            <TextArea
              id="finding-body"
              fill
              rows={5}
              placeholder="What did you observe, and why does it matter for this file?"
              value={body}
              onChange={(event) => setBody(event.currentTarget.value)}
            />
          </FormGroup>
        </div>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              intent="primary"
              loading={addAction.isPending}
              disabled={title.trim() === "" || actingAs == null}
              onClick={() => void submit()}
            >
              Add Finding
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

function FindingWallet({
  item,
}: {
  item: Osdk.Instance<finding>;
}): ReactElement | null {
  const { links } = useLinks(item, "relatedWallet", { pageSize: 1 });
  const related = links?.find(Boolean);
  if (related == null) return null;
  return <WalletRow item={related} />;
}

function FindingMitigation({
  item,
}: {
  item: Osdk.Instance<finding>;
}): ReactElement | null {
  const hasNote = item.mitigationNote != null && item.mitigationNote !== "";
  const hasResolver = item.resolvedById != null && item.resolvedById !== "";
  const { links } = useLinks(item, "resolvedBy", {
    pageSize: 1,
    enabled: hasResolver,
  });
  if (!hasNote && !hasResolver) return null;
  const resolver = links?.find(Boolean);

  return (
    <div className={css.findingMitigation}>
      {hasResolver && (
        <span className={css.findingMitigationBy}>
          Mitigated by {resolver?.name ?? item.resolvedById}
        </span>
      )}
      {hasNote && (
        <p className={css.findingMitigationNote}>{item.mitigationNote}</p>
      )}
    </div>
  );
}

function ResolveFindingDialog({
  item,
  findingToResolve,
  isOpen,
  onClose,
}: {
  item: Osdk.Instance<investigationCase>;
  findingToResolve: Osdk.Instance<finding> | undefined;
  isOpen: boolean;
  onClose: () => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const resolveAction = useOsdkAction(resolveFindingAction);
  const [note, setNote] = useState("");

  function close(): void {
    setNote("");
    onClose();
  }

  async function submit(): Promise<void> {
    if (actingAs == null) {
      showError("Select an analyst first.");
      return;
    }
    if (findingToResolve == null) {
      return;
    }
    try {
      await resolveAction.applyAction({
        findingToResolve,
        caseToUpdate: item,
        actingAnalyst: actingAs,
        mitigationNote: note,
      });
      showSuccess("Finding resolved.");
      close();
    } catch (caught) {
      showError(errorMessage(caught));
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={close} title="Resolve Finding">
      <DialogBody>
        <div className={css.stack}>
          {findingToResolve != null && (
            <p className={css.muted}>{findingToResolve.title}</p>
          )}
          <p className={css.muted}>
            Resolving as {actingAs?.name ?? "an analyst"}
          </p>
          <FormGroup label="Why this is mitigated" labelFor="finding-mitigation">
            <TextArea
              id="finding-mitigation"
              fill
              rows={4}
              placeholder="Why this finding is no longer a concern"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
            />
          </FormGroup>
        </div>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={close}>Cancel</Button>
            <Button
              intent="primary"
              loading={resolveAction.isPending}
              disabled={
                note.trim() === "" ||
                actingAs == null ||
                findingToResolve == null
              }
              onClick={() => void submit()}
            >
              Resolve Finding
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

function FindingCard({
  item,
  canResolve,
  onResolve,
}: {
  item: Osdk.Instance<finding>;
  canResolve: boolean;
  onResolve: (row: Osdk.Instance<finding>) => void;
}): ReactElement {
  const open = item.status === FINDING_OPEN;

  return (
    <article
      className={`${css.finding} ${open ? "" : css.findingMitigated}`}
      data-severity={item.severity ?? "Low"}
    >
      <div className={css.findingHead}>
        <h3 className={css.findingTitle}>{item.title}</h3>
        <div className={css.row}>
          <StatusPip intent={severityIntent(item.severity)}>
            {item.severity ?? "Low"}
          </StatusPip>
          <StatusPip intent={open ? "warning" : "success"}>
            {item.status ?? FINDING_MITIGATED}
          </StatusPip>
          {open && canResolve && (
            <Button
              size="small"
              variant="minimal"
              intent="primary"
              onClick={() => onResolve(item)}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
      {item.body != null && item.body !== "" && (
        <p className={css.findingBody}>{item.body}</p>
      )}
      <FindingWallet item={item} />
      {!open && <FindingMitigation item={item} />}
    </article>
  );
}

export default function FindingsList({
  item,
  findings,
  findingsLoading,
}: {
  item: Osdk.Instance<investigationCase>;
  findings: Osdk.Instance<finding>[];
  findingsLoading: boolean;
}): ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolving, setResolving] = useState<Osdk.Instance<finding>>();

  const rows = sortFindings(findings);
  const openCount = rows.filter((row) => row.status === FINDING_OPEN).length;
  const mitigatedCount = rows.length - openCount;
  const frozen = isFindingsFrozen(item.status);

  return (
    <section className={css.section} aria-labelledby="findings-heading">
      <div className={css.sectionHead}>
        <h2 id="findings-heading" className={css.sectionTitle}>
          Findings
        </h2>
        <div className={css.row}>
          <span className={css.sectionMeta}>
            {openCount} open · {mitigatedCount} mitigated
          </span>
          {!frozen && (
            <Button
              size="small"
              icon="plus"
              intent="primary"
              onClick={() => setDialogOpen(true)}
            >
              Add Finding
            </Button>
          )}
        </div>
      </div>
      {findingsLoading && <p className={css.muted}>Loading findings…</p>}
      {!findingsLoading && rows.length === 0 && (
        <NonIdealState
          icon="document"
          iconSize={NonIdealStateIconSize.SMALL}
          layout="horizontal"
          title="No findings yet"
          description="Add the first observation on this file."
        />
      )}
      {rows.map((row) => (
        <FindingCard
          key={row.$primaryKey}
          item={row}
          canResolve={!frozen}
          onResolve={setResolving}
        />
      ))}
      <AddFindingDialog
        item={item}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <ResolveFindingDialog
        item={item}
        findingToResolve={resolving}
        isOpen={resolving != null}
        onClose={() => setResolving(undefined)}
      />
    </section>
  );
}
