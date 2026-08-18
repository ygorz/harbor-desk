import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  Icon,
  Menu,
  MenuItem,
  Popover,
  Tooltip,
} from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import {
  analyst,
  investigationCase,
  loadDemoScenarioAction,
  openCaseAction,
  organization,
  person,
} from "@ontology/sdk";
import { useOsdkAction, useOsdkObjects } from "@osdk/react";
import { Outlet, useNavigate } from "react-router-dom";
import { ActingAsProvider, useActingAs } from "./ActingAsContext";
import CaseQueue from "./CaseQueue";
import { initials } from "./format";
import { errorMessage, HERO_CASE_ID, isActiveCase } from "./status";
import { showError, showSuccess } from "./toast";
import css from "./desk.module.css";

export interface DeskOutletContext {
  analysts: Osdk.Instance<analyst>[];
  cases: Osdk.Instance<investigationCase>[];
  casesLoading: boolean;
  demoLoaded: boolean;
  loadDemoPending: boolean;
  onLoadDemo: () => Promise<void>;
}

type SubjectOption =
  | { kind: "Person"; object: Osdk.Instance<person> }
  | { kind: "Organization"; object: Osdk.Instance<organization> };

function subjectKey(row: SubjectOption): string {
  return `${row.kind}:${String(row.object.id ?? row.object.$primaryKey)}`;
}

function HarborMark(): ReactElement {
  return (
    <svg
      className={css.brandMark}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3 2.5h1.75v11H3zM11.25 2.5H13v11h-1.75zM3 7.125h10v1.75H3z"
      />
    </svg>
  );
}

function OpenCaseDialog({
  cases,
  people,
  organizations,
  isOpen,
  onClose,
  onOpened,
}: {
  cases: Osdk.Instance<investigationCase>[];
  people: Osdk.Instance<person>[];
  organizations: Osdk.Instance<organization>[];
  isOpen: boolean;
  onClose: () => void;
  onOpened: (subject: SubjectOption) => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const openAction = useOsdkAction(openCaseAction);
  const [selected, setSelected] = useState("");

  const available: SubjectOption[] = [
    ...people.map((object) => ({ kind: "Person" as const, object })),
    ...organizations.map((object) => ({
      kind: "Organization" as const,
      object,
    })),
  ]
    .filter((row) => {
      const id = String(row.object.id ?? row.object.$primaryKey);
      return !cases.some((item) => {
        if (!isActiveCase(item.status)) return false;
        return row.kind === "Person"
          ? item.personId === id
          : item.organizationId === id;
      });
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "Person" ? -1 : 1;
      }
      return (left.object.name ?? "").localeCompare(right.object.name ?? "");
    });

  const subject = available.find((row) => subjectKey(row) === selected);

  function closeDialog(): void {
    setSelected("");
    onClose();
  }

  async function submit(): Promise<void> {
    if (actingAs == null) {
      showError("Select an analyst first.");
      return;
    }
    if (subject == null) {
      showError("Pick a person or organization that does not already have an open case.");
      return;
    }
    try {
      await openAction.applyAction({
        actingAnalyst: actingAs,
        ...(subject.kind === "Person"
          ? { subjectPerson: subject.object }
          : { subjectOrganization: subject.object }),
      });
      showSuccess("Case opened.");
      onOpened(subject);
      closeDialog();
    } catch (caught) {
      showError(errorMessage(caught));
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog} title="Open Case">
      <DialogBody>
        <FormGroup
          label="Person or organization"
          labelFor="case-subject"
          helperText="Opens a file on a person or organization that does not already have an active case."
        >
          {available.length === 0 ? (
            <p className={css.muted}>
              Every person and organization already has an open case.
            </p>
          ) : (
            <HTMLSelect
              id="case-subject"
              fill
              autoComplete="off"
              value={selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            >
              <option value="">Select subject…</option>
              {available.map((row) => (
                <option key={subjectKey(row)} value={subjectKey(row)}>
                  {row.object.name} · {row.kind}
                </option>
              ))}
            </HTMLSelect>
          )}
        </FormGroup>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              intent="primary"
              loading={openAction.isPending}
              disabled={selected === "" || actingAs == null || available.length === 0}
              onClick={() => void submit()}
            >
              Open Case
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

function ActingAsChip({
  analysts,
}: {
  analysts: Osdk.Instance<analyst>[];
}): ReactElement {
  const { actingAs, setAnalystId } = useActingAs();

  if (analysts.length === 0) {
    return <span className={css.muted}>No analysts</span>;
  }

  const menu = (
    <Menu>
      {analysts.map((row) => {
        const id = String(row.id ?? row.$primaryKey);
        const current = id === String(actingAs?.id ?? actingAs?.$primaryKey);
        return (
          <MenuItem
            key={row.$primaryKey}
            text={row.name}
            label={row.role}
            icon={current ? "tick" : "blank"}
            onClick={() => setAnalystId(id)}
          />
        );
      })}
    </Menu>
  );

  return (
    <Popover content={menu} position="bottom-right" minimal>
      <Tooltip
        compact
        content="Policy functions receive this analyst. Switch to approve your own close request."
        placement="bottom"
      >
        <button
          type="button"
          className={css.identity}
          aria-label={`Acting as ${actingAs?.name ?? "analyst"}`}
        >
          <span className={css.identityAvatar} aria-hidden="true">
            {initials(actingAs?.name)}
          </span>
          <span className={css.identityText}>
            <span className={css.identityName}>{actingAs?.name ?? "Analyst"}</span>
            <span className={css.identityRole}>{actingAs?.role ?? "—"}</span>
          </span>
          <Icon className={css.identityCaret} icon="caret-down" size={12} />
        </button>
      </Tooltip>
    </Popover>
  );
}

function DeskHeader({
  analysts,
  onOpenCase,
}: {
  analysts: Osdk.Instance<analyst>[];
  onOpenCase: () => void;
}): ReactElement {
  return (
    <header className={css.header}>
      <div className={css.brand}>
        <HarborMark />
        <div className={css.brandText}>
          <p className={css.brandName}>Harbor Desk</p>
          <span className={css.brandTag}>Investigations</span>
        </div>
      </div>
      <div className={css.headerActions}>
        <ActingAsChip analysts={analysts} />
        <Button icon="plus" onClick={onOpenCase}>
          Open Case
        </Button>
      </div>
    </header>
  );
}

export default function AppShell(): ReactElement {
  const { data: cases, isLoading: casesLoading } = useOsdkObjects(
    investigationCase,
    { pageSize: 50, streamUpdates: true },
  );
  const { data: analysts = [] } = useOsdkObjects(analyst, {
    pageSize: 50,
    streamUpdates: true,
  });
  const { data: people = [] } = useOsdkObjects(person, {
    pageSize: 50,
    streamUpdates: true,
  });
  const { data: organizations = [] } = useOsdkObjects(organization, {
    pageSize: 50,
    streamUpdates: true,
  });
  const loadAction = useOsdkAction(loadDemoScenarioAction);
  const navigate = useNavigate();

  const [openCase, setOpenCase] = useState(false);
  const [pendingSubject, setPendingSubject] = useState<SubjectOption>();
  const caseRows = useMemo(() => cases ?? [], [cases]);
  const demoLoaded = caseRows.some(
    (row) => String(row.id ?? row.$primaryKey) === HERO_CASE_ID,
  );

  useEffect(() => {
    if (pendingSubject == null) return;
    const subjectId = String(
      pendingSubject.object.id ?? pendingSubject.object.$primaryKey,
    );
    const created = caseRows.find((item) => {
      if (!isActiveCase(item.status)) return false;
      return pendingSubject.kind === "Person"
        ? item.personId === subjectId
        : item.organizationId === subjectId;
    });
    if (created != null) {
      void navigate(`/cases/${created.$primaryKey}`);
      setPendingSubject(undefined);
    }
  }, [caseRows, pendingSubject, navigate]);

  async function loadDemo(): Promise<void> {
    try {
      await loadAction.applyAction({});
      showSuccess("Demo loaded.");
      void navigate(`/cases/${HERO_CASE_ID}`);
    } catch (caught) {
      showError(errorMessage(caught));
    }
  }

  const outletContext: DeskOutletContext = {
    analysts,
    cases: caseRows,
    casesLoading,
    demoLoaded,
    loadDemoPending: loadAction.isPending,
    onLoadDemo: loadDemo,
  };

  const subjectNames = Object.fromEntries([
    ...people.map((row) => [String(row.id ?? row.$primaryKey), row.name ?? ""]),
    ...organizations.map((row) => [
      String(row.id ?? row.$primaryKey),
      row.name ?? "",
    ]),
  ]);

  return (
    <ActingAsProvider analysts={analysts}>
      <div className={css.shell}>
        <a className={css.skipLink} href="#workspace">
          Skip to case
        </a>
        <DeskHeader
          analysts={analysts}
          onOpenCase={() => setOpenCase(true)}
        />
        <div className={css.body}>
          <CaseQueue
            cases={caseRows}
            casesLoading={casesLoading}
            subjectNames={subjectNames}
            demoLoaded={demoLoaded}
            loadDemoPending={loadAction.isPending}
            onLoadDemo={() => void loadDemo()}
          />
          <main id="workspace" className={css.workspace} tabIndex={-1}>
            <Outlet context={outletContext} />
          </main>
        </div>
        <OpenCaseDialog
          cases={caseRows}
          people={people}
          organizations={organizations}
          isOpen={openCase}
          onClose={() => setOpenCase(false)}
          onOpened={setPendingSubject}
        />
      </div>
    </ActingAsProvider>
  );
}
