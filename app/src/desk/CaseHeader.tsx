import type { ReactElement } from "react";
import { ProgressBar, Tag } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import { analyst, investigationCase } from "@ontology/sdk";
import { statusIntent } from "./status";
import css from "./desk.module.css";

export default function CaseHeader({
  item,
  owner,
  requester,
}: {
  item: Osdk.Instance<investigationCase>;
  owner: Osdk.Instance<analyst> | undefined;
  requester: Osdk.Instance<analyst> | undefined;
}): ReactElement {
  const risk = item.riskScore ?? 0;

  return (
    <header className={css.caseHeader}>
      <div className={css.caseTitleRow}>
        <h1 className={css.caseTitle}>{item.title ?? item.$primaryKey}</h1>
        <Tag large intent={statusIntent(item.status)}>
          {item.status ?? "Unknown"}
        </Tag>
      </div>
      <div className={css.caseMeta}>
        <span className={css.queueId}>{item.id}</span>
        <span>Owner {owner?.name ?? item.ownerId ?? "—"}</span>
        {item.closeRequestedById != null && item.closeRequestedById !== "" && (
          <span>Close requested by {requester?.name ?? item.closeRequestedById}</span>
        )}
      </div>
      {item.summary != null && item.summary !== "" && (
        <p className={css.findingBody}>{item.summary}</p>
      )}
      <div className={css.riskRow}>
        <span className={css.riskLabel}>Risk</span>
        <ProgressBar
          animate={false}
          stripes={false}
          intent={risk >= 50 ? "warning" : "primary"}
          value={Math.min(1, risk / 100)}
        />
        <span className={css.riskValue}>{risk}</span>
      </div>
    </header>
  );
}
