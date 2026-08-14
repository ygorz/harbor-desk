import { useState, type ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  InputGroup,
  Tag,
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
import { useLinks, useOsdkAction, useOsdkObject } from "@osdk/react";
import { useActingAs } from "./ActingAsContext";
import { errorMessage, FINDING_OPEN, SEVERITIES, severityIntent } from "./status";
import css from "./desk.module.css";

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
  onError,
}: {
  item: Osdk.Instance<investigationCase>;
  isOpen: boolean;
  onClose: () => void;
  onError: (message: string | undefined) => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const addAction = useOsdkAction(addFindingAction);
  const { object: subjectPerson } = useOsdkObject(person, item.personId ?? "", {
    enabled: item.personId != null && item.personId !== "",
  });
  const { object: subjectOrganization } = useOsdkObject(
    organization,
    item.organizationId ?? "",
    { enabled: item.organizationId != null && item.organizationId !== "" },
  );

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<string>("Medium");
  const [relatedWallet, setRelatedWallet] = useState<
    Osdk.Instance<wallet> | undefined
  >();

  async function submit(): Promise<void> {
    if (actingAs == null) {
      onError("Select an analyst first.");
      return;
    }
    onError(undefined);
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
      onClose();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add finding">
      <DialogBody>
        <div className={css.stack}>
          <FormGroup label="Title" labelFor="finding-title">
            <InputGroup
              id="finding-title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </FormGroup>
          <FormGroup label="Severity" labelFor="finding-severity">
            <HTMLSelect
              id="finding-severity"
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
              Add finding
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

function FindingCard({
  item,
  resolvingId,
  onResolve,
}: {
  item: Osdk.Instance<finding>;
  resolvingId: string | undefined;
  onResolve: (row: Osdk.Instance<finding>) => Promise<void>;
}): ReactElement {
  const open = item.status === FINDING_OPEN;

  return (
    <article className={css.card}>
      <div className={css.findingHead}>
        <strong>{item.title}</strong>
        <div className={css.row}>
          <Tag minimal intent={severityIntent(item.severity)}>
            {item.severity}
          </Tag>
          <Tag minimal intent={open ? "warning" : "success"}>
            {item.status}
          </Tag>
          {open && (
            <Button
              size="small"
              variant="minimal"
              intent="primary"
              loading={resolvingId === item.$primaryKey}
              onClick={() => void onResolve(item)}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
      {item.body != null && item.body !== "" && (
        <p className={css.findingBody}>{item.body}</p>
      )}
      {item.walletId != null && item.walletId !== "" && (
        <span className={css.queueId}>Wallet {item.walletId}</span>
      )}
    </article>
  );
}

export default function FindingsList({
  item,
  onError,
}: {
  item: Osdk.Instance<investigationCase>;
  onError: (message: string | undefined) => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const { links, isLoading } = useLinks(item, "caseFindings", { pageSize: 50 });
  const resolveAction = useOsdkAction(resolveFindingAction);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string>();

  const rows = links?.filter(Boolean) ?? [];

  async function resolve(row: Osdk.Instance<finding>): Promise<void> {
    if (actingAs == null) {
      onError("Select an analyst first.");
      return;
    }
    onError(undefined);
    setResolvingId(String(row.$primaryKey));
    try {
      await resolveAction.applyAction({
        findingToResolve: row,
        caseToUpdate: item,
        actingAnalyst: actingAs,
      });
    } catch (caught) {
      onError(errorMessage(caught));
    } finally {
      setResolvingId(undefined);
    }
  }

  return (
    <section className={css.section} aria-labelledby="findings-heading">
      <div className={css.queueItemTop}>
        <h2 id="findings-heading" className={css.sectionTitle}>
          Findings
        </h2>
        <Button
          size="small"
          icon="plus"
          intent="primary"
          onClick={() => setDialogOpen(true)}
        >
          Add finding
        </Button>
      </div>
      {isLoading && <p className={css.brandMark}>Loading findings…</p>}
      {!isLoading && rows.length === 0 && (
        <div className={css.card}>No findings yet.</div>
      )}
      {rows.map((row) => (
        <FindingCard
          key={row.$primaryKey}
          item={row}
          resolvingId={resolvingId}
          onResolve={resolve}
        />
      ))}
      <AddFindingDialog
        item={item}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onError={onError}
      />
    </section>
  );
}
