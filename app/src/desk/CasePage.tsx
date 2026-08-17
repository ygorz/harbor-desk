import type { ReactElement } from "react";
import { investigationCase } from "@ontology/sdk";
import { useLinks, useOsdkObject } from "@osdk/react";
import { useOutletContext, useParams } from "react-router-dom";
import { NonIdealState } from "@blueprintjs/core";
import ClosePath from "./ClosePath";
import type { DeskOutletContext } from "./AppShell";
import CaseHeader from "./CaseHeader";
import FindingsList from "./FindingsList";
import SubjectPanel from "./SubjectPanel";
import { FINDING_OPEN } from "./status";
import css from "./desk.module.css";

function CaseSkeleton(): ReactElement {
  return (
    <div className={css.casePage} aria-hidden="true">
      <div className={css.skeletonRow}>
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineNarrow}`} />
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineWide}`} />
      </div>
      <div className={css.skeletonRow}>
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineWide}`} />
        <div className={`${css.skeleton} ${css.skeletonLine} ${css.skeletonLineNarrow}`} />
      </div>
    </div>
  );
}

export default function CasePage(): ReactElement {
  const { caseId } = useParams();
  const { analysts } = useOutletContext<DeskOutletContext>();
  const { object: item, isLoading } = useOsdkObject(
    investigationCase,
    caseId ?? "",
    { enabled: caseId != null && caseId !== "" },
  );
  const { links, isLoading: findingsLoading } = useLinks(
    item,
    "caseFindings",
    { pageSize: 50, enabled: item != null },
  );

  if (isLoading || caseId == null) {
    return <CaseSkeleton />;
  }

  if (item == null) {
    return (
      <div className={css.empty}>
        <NonIdealState
          icon="search"
          title="Case not found"
          description={`No case with id ${caseId}.`}
        />
      </div>
    );
  }

  const findings = links?.filter(Boolean) ?? [];
  const openFindingCount = findings.filter(
    (row) => row.status === FINDING_OPEN,
  ).length;
  const owner = analysts.find((row) => row.id === item.ownerId);
  const requester = analysts.find((row) => row.id === item.closeRequestedById);

  return (
    <div className={css.casePage}>
      <CaseHeader
        item={item}
        owner={owner}
        requester={requester}
        openFindingCount={openFindingCount}
      />
      <ClosePath item={item} findings={findings} analysts={analysts} />
      <div className={css.workspaceCols}>
        <SubjectPanel item={item} />
        <FindingsList
          item={item}
          findings={findings}
          findingsLoading={findingsLoading}
        />
      </div>
    </div>
  );
}
