import type { ReactElement } from "react";
import { Tag } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import { investigationCase } from "@ontology/sdk";
import { NavLink } from "react-router-dom";
import { statusIntent } from "./status";
import css from "./desk.module.css";

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

export default function CaseQueue({
  cases,
  subjectNames,
}: {
  cases: Osdk.Instance<investigationCase>[];
  subjectNames: Record<string, string>;
}): ReactElement {
  const ordered = sortCases(cases);

  return (
    <aside className={css.queue}>
      <div className={css.queueHeader}>
        <span>Cases</span>
        <span>{ordered.length}</span>
      </div>
      <div className={css.queueList}>
        {ordered.map((item) => {
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
                <Tag
                  minimal
                  intent={statusIntent(item.status)}
                >
                  {item.status ?? "Unknown"}
                </Tag>
              </div>
              <div className={css.queueItemTop}>
                <span className={css.queueMeta}>
                  <span className={css.queueId}>{item.id}</span>
                  {subject != null && subject !== "" && (
                    <span className={css.queueSubject}>{subject}</span>
                  )}
                </span>
                <span className={css.riskValue}>{item.riskScore ?? 0}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
