import { useState, type ReactElement } from "react";
import {
  Button,
  NonIdealState,
  NonIdealStateIconSize,
  SegmentedControl,
} from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import { investigationCase } from "@ontology/sdk";
import { NavLink } from "react-router-dom";
import RiskMeter from "./RiskMeter";
import StatusPip from "./StatusPip";
import { isActiveCase, statusIntent } from "./status";
import css from "./desk.module.css";

type QueueFilter = "all" | "open" | "closed";

function sortCases(
  items: Osdk.Instance<investigationCase>[],
): Osdk.Instance<investigationCase>[] {
  return [...items].sort((left, right) => {
    const leftClosed = left.status === "Closed" ? 1 : 0;
    const rightClosed = right.status === "Closed" ? 1 : 0;
    if (leftClosed !== rightClosed) return leftClosed - rightClosed;
    return (right.riskScore ?? 0) - (left.riskScore ?? 0);
  });
}

function QueueSkeleton(): ReactElement {
  return (
    <div className={css.queueList} aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className={css.skeletonRow}>
          <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineWide}`} />
          <div
            className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineNarrow}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function CaseQueue({
  cases,
  casesLoading,
  subjectNames,
  demoLoaded,
  loadDemoPending,
  onLoadDemo,
}: {
  cases: Osdk.Instance<investigationCase>[];
  casesLoading: boolean;
  subjectNames: Record<string, string>;
  demoLoaded: boolean;
  loadDemoPending: boolean;
  onLoadDemo: () => void;
}): ReactElement {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const openCount = cases.filter((item) => isActiveCase(item.status)).length;
  const closedCount = cases.length - openCount;

  const ordered = sortCases(cases).filter((item) => {
    if (filter === "open") return isActiveCase(item.status);
    if (filter === "closed") return item.status === "Closed";
    return true;
  });

  return (
    <nav className={css.queue} aria-label="Case queue">
      <div className={css.queueHeader}>
        <div className={css.queueTitleRow}>
          <p className={css.queueHeading}>Queue</p>
          <span className={css.queueCounts}>
            {openCount} open · {closedCount} closed
          </span>
        </div>
        <SegmentedControl
          fill
          size="small"
          value={filter}
          onValueChange={(value) => setFilter(value as QueueFilter)}
          options={[
            { label: "All", value: "all" },
            { label: "Open", value: "open" },
            { label: "Closed", value: "closed" },
          ]}
        />
      </div>
      {casesLoading ? (
        <QueueSkeleton />
      ) : cases.length === 0 ? (
        <div className={css.queueEmpty}>
          <NonIdealState
            icon="folder-open"
            iconSize={NonIdealStateIconSize.SMALL}
            title="No files yet"
            description="Load the Northwind scenario to populate this queue."
            action={
              !demoLoaded ? (
                <Button
                  intent="primary"
                  icon="import"
                  loading={loadDemoPending}
                  onClick={onLoadDemo}
                >
                  Load Demo
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className={css.queueList}>
          {ordered.length === 0 ? (
            <p className={css.muted}>No cases in this filter.</p>
          ) : (
            ordered.map((item) => {
              const id = String(item.$primaryKey);
              const subjectKey = item.personId ?? item.organizationId;
              const subject =
                subjectKey != null ? subjectNames[subjectKey] : undefined;
              return (
                <NavLink
                  key={id}
                  to={`/cases/${id}`}
                  className={({ isActive }) =>
                    `${css.queueItem} ${isActive ? css.queueItemActive : ""}`
                  }
                >
                  <div className={css.queueItemTop}>
                    <span className={css.queueTitle}>
                      {item.title ?? item.$primaryKey}
                    </span>
                    <StatusPip intent={statusIntent(item.status)}>
                      {item.status ?? "Unknown"}
                    </StatusPip>
                  </div>
                  <div className={css.queueItemTop}>
                    <span className={css.queueMeta}>
                      {subject != null && subject !== "" && (
                        <span className={css.queueSubject}>{subject}</span>
                      )}
                      <span className={css.queueId} translate="no">
                        {item.id}
                      </span>
                    </span>
                    <span className={css.queueRisk}>
                      <RiskMeter value={item.riskScore ?? 0} />
                    </span>
                  </div>
                </NavLink>
              );
            })
          )}
        </div>
      )}
    </nav>
  );
}
