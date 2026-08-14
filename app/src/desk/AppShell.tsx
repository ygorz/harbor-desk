import { useState, type ReactElement } from "react";
import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  Spinner,
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
import { errorMessage, HERO_CASE_ID, isActiveCase } from "./status";
import css from "./desk.module.css";

export interface DeskOutletContext {
  analysts: Osdk.Instance<analyst>[];
  cases: Osdk.Instance<investigationCase>[];
  casesLoading: boolean;
  onError: (message: string | undefined) => void;
}

type SubjectOption =
  | { kind: "Person"; object: Osdk.Instance<person> }
  | { kind: "Organization"; object: Osdk.Instance<organization> };

function subjectKey(row: SubjectOption): string {
  return `${row.kind}:${String(row.object.id ?? row.object.$primaryKey)}`;
}

function OpenCaseDialog({
  cases,
  people,
  organizations,
  isOpen,
  onClose,
  onError,
}: {
  cases: Osdk.Instance<investigationCase>[];
  people: Osdk.Instance<person>[];
  organizations: Osdk.Instance<organization>[];
  isOpen: boolean;
  onClose: () => void;
  onError: (message: string | undefined) => void;
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
      onError("Select an analyst first.");
      return;
    }
    if (subject == null) {
      onError("Pick a person or company that does not already have an open case.");
      return;
    }
    onError(undefined);
    try {
      await openAction.applyAction({
        actingAnalyst: actingAs,
        ...(subject.kind === "Person"
          ? { subjectPerson: subject.object }
          : { subjectOrganization: subject.object }),
      });
      closeDialog();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={closeDialog} title="Open a case on">
      <DialogBody>
        <FormGroup
          label="Person or company"
          labelFor="case-subject"
          helperText="The left list is investigation files. This opens a new file on a person or company that does not already have one open."
        >
          {available.length === 0 ? (
            <p className={css.brandMark}>
              Every person and company already has an open case.
            </p>
          ) : (
            <HTMLSelect
              id="case-subject"
              fill
              value={selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            >
              <option value="">Select subject</option>
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
              Open case
            </Button>
          </>
        }
      />
    </Dialog>
  );
}

function DeskHeader({
  analysts,
  demoLoaded,
  casesLoading,
  onError,
  onOpenCase,
}: {
  analysts: Osdk.Instance<analyst>[];
  demoLoaded: boolean;
  casesLoading: boolean;
  onError: (message: string | undefined) => void;
  onOpenCase: () => void;
}): ReactElement {
  const { actingAs, setAnalystId } = useActingAs();
  const loadAction = useOsdkAction(loadDemoScenarioAction);
  const navigate = useNavigate();

  async function loadDemo(): Promise<void> {
    onError(undefined);
    try {
      await loadAction.applyAction({});
      void navigate(`/cases/${HERO_CASE_ID}`);
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <header className={css.header}>
      <div className={css.brand}>
        <h1 className={css.brandName}>Harbor Desk</h1>
        <span className={css.brandMark}>Casework</span>
      </div>
      <div className={css.headerActions}>
        <div className={css.actingAs}>
          <span className={css.actingAsLabel} id="acting-as-label">
            Acting as
          </span>
          <HTMLSelect
            aria-labelledby="acting-as-label"
            value={actingAs?.id ?? ""}
            disabled={analysts.length === 0}
            onChange={(event) => setAnalystId(event.currentTarget.value)}
          >
            {analysts.map((row) => (
              <option key={row.$primaryKey} value={String(row.id ?? row.$primaryKey)}>
                {row.name} · {row.role}
              </option>
            ))}
          </HTMLSelect>
        </div>
        <Button icon="plus" onClick={onOpenCase}>
          Open case
        </Button>
        {!casesLoading && !demoLoaded && (
          <Button
            icon="import"
            loading={loadAction.isPending}
            onClick={() => void loadDemo()}
          >
            Load demo
          </Button>
        )}
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

  const [error, setError] = useState<string>();
  const [openCase, setOpenCase] = useState(false);
  const caseRows = cases ?? [];
  const demoLoaded = caseRows.some(
    (row) => String(row.id ?? row.$primaryKey) === HERO_CASE_ID,
  );

  const outletContext: DeskOutletContext = {
    analysts,
    cases: caseRows,
    casesLoading,
    onError: setError,
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
        <DeskHeader
          analysts={analysts}
          demoLoaded={demoLoaded}
          casesLoading={casesLoading}
          onError={setError}
          onOpenCase={() => setOpenCase(true)}
        />
        <div className={css.body}>
          {casesLoading ? (
            <aside className={css.queue}>
              <div className={css.queueHeader}>Queue</div>
              <Spinner />
            </aside>
          ) : (
            <CaseQueue cases={caseRows} subjectNames={subjectNames} />
          )}
          <main className={css.workspace}>
            {error != null && (
              <Callout intent="warning">
                <div className={css.queueItemTop}>
                  <span>{error}</span>
                  <Button
                    variant="minimal"
                    icon="cross"
                    aria-label="Dismiss error"
                    onClick={() => setError(undefined)}
                  />
                </div>
              </Callout>
            )}
            <Outlet context={outletContext} />
          </main>
        </div>
        <OpenCaseDialog
          cases={caseRows}
          people={people}
          organizations={organizations}
          isOpen={openCase}
          onClose={() => setOpenCase(false)}
          onError={setError}
        />
      </div>
    </ActingAsProvider>
  );
}
