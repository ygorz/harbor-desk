import type { ReactElement } from "react";
import type { Osdk } from "@osdk/client";
import { analyst, investigationCase } from "@ontology/sdk";
import RiskMeter from "./RiskMeter";
import StatusPip from "./StatusPip";
import { statusIntent } from "./status";
import css from "./desk.module.css";

export default function CaseHeader({
  item,
  owner,
  requester,
  openFindingCount,
}: {
  item: Osdk.Instance<investigationCase>;
  owner: Osdk.Instance<analyst> | undefined;
  requester: Osdk.Instance<analyst> | undefined;
  openFindingCount: number;
}): ReactElement {
  const risk = item.riskScore ?? 0;

  return (
    <header className={css.caseChrome}>
      <div className={css.caseEyebrow}>
        <span className={css.queueId} translate="no">
          {item.id}
        </span>
        <StatusPip intent={statusIntent(item.status)}>
          {item.status ?? "Unknown"}
        </StatusPip>
      </div>
      <div className={css.caseTitleRow}>
        <h1 className={css.caseTitle}>{item.title ?? item.$primaryKey}</h1>
      </div>
      <div className={css.caseMeta}>
        <span>Owner {owner?.name ?? item.ownerId ?? "—"}</span>
        {item.closeRequestedById != null && item.closeRequestedById !== "" && (
          <span>
            Close requested by {requester?.name ?? item.closeRequestedById}
          </span>
        )}
        <span>
          {openFindingCount} open finding{openFindingCount === 1 ? "" : "s"}
        </span>
      </div>
      {item.summary != null && item.summary !== "" && (
        <p className={css.caseSummary}>{item.summary}</p>
      )}
      <div className={css.riskBlock}>
        <div className={css.row}>
          <span className={css.riskLabel}>Risk</span>
          <RiskMeter value={risk} size="full" />
        </div>
        <p className={css.riskCaption}>
          Open findings raise this. Resolve to drop. Close blocked above 0.
        </p>
      </div>
    </header>
  );
}
