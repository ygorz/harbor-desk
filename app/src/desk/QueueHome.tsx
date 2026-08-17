import type { ReactElement } from "react";
import { Button, NonIdealState } from "@blueprintjs/core";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DeskOutletContext } from "./AppShell";
import { HERO_CASE_ID } from "./status";
import css from "./desk.module.css";

function WorkspaceSkeleton(): ReactElement {
  return (
    <div className={css.casePage} aria-hidden="true">
      <div className={css.skeletonRow}>
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineNarrow}`} />
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineWide}`} />
      </div>
      <div className={css.skeletonRow}>
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineWide}`} />
      </div>
    </div>
  );
}

export default function QueueHome(): ReactElement {
  const { cases, casesLoading, demoLoaded, loadDemoPending, onLoadDemo } =
    useOutletContext<DeskOutletContext>();

  if (casesLoading) {
    return <WorkspaceSkeleton />;
  }

  const hero = cases.find((item) => item.id === HERO_CASE_ID);
  if (hero != null) {
    return <Navigate to={`/cases/${hero.$primaryKey}`} replace />;
  }

  return (
    <div className={css.empty}>
      <NonIdealState
        icon="folder-open"
        title="No investigation files yet"
        description="Load the Northwind scenario to open a queue of cases, subjects, and findings."
        action={
          !demoLoaded ? (
            <Button
              intent="primary"
              icon="import"
              loading={loadDemoPending}
              onClick={() => void onLoadDemo()}
            >
              Load Demo
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
