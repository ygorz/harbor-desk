import type { ReactElement } from "react";
import { Spinner } from "@blueprintjs/core";
import { Navigate, useOutletContext } from "react-router-dom";
import type { DeskOutletContext } from "./AppShell";
import { HERO_CASE_ID } from "./status";
import css from "./desk.module.css";

export default function QueueHome(): ReactElement {
  const { cases, casesLoading } = useOutletContext<DeskOutletContext>();

  if (casesLoading) {
    return (
      <div className={css.empty}>
        <Spinner />
      </div>
    );
  }

  const hero = cases.find((item) => item.id === HERO_CASE_ID);
  if (hero != null) {
    return <Navigate to={`/cases/${hero.$primaryKey}`} replace />;
  }

  return (
    <div className={css.empty}>
      <h2 className={css.caseTitle}>No cases yet</h2>
      <p>
        Seed fills this queue in local preview. After deploy, use{" "}
        <strong>Load demo</strong> to write the Northwind scenario.
      </p>
    </div>
  );
}
