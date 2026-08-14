import type { ReactElement } from "react";
import { Spinner } from "@blueprintjs/core";
import { investigationCase } from "@ontology/sdk";
import { useOsdkObject } from "@osdk/react";
import { useOutletContext, useParams } from "react-router-dom";
import ActionRail from "./ActionRail";
import type { DeskOutletContext } from "./AppShell";
import CaseHeader from "./CaseHeader";
import FindingsList from "./FindingsList";
import SubjectPanel from "./SubjectPanel";
import css from "./desk.module.css";

export default function CasePage(): ReactElement {
  const { caseId } = useParams();
  const { analysts, onError } = useOutletContext<DeskOutletContext>();
  const { object: item, isLoading } = useOsdkObject(
    investigationCase,
    caseId ?? "",
    { enabled: caseId != null && caseId !== "" },
  );

  if (isLoading || caseId == null) {
    return (
      <div className={css.empty}>
        <Spinner />
      </div>
    );
  }

  if (item == null) {
    return (
      <div className={css.empty}>
        <h2 className={css.caseTitle}>Case not found</h2>
        <p>No case with id {caseId}.</p>
      </div>
    );
  }

  const owner = analysts.find((row) => row.id === item.ownerId);
  const requester = analysts.find((row) => row.id === item.closeRequestedById);

  return (
    <div className={css.stack}>
      <CaseHeader item={item} owner={owner} requester={requester} />
      <ActionRail item={item} onError={onError} />
      <SubjectPanel
        personId={item.personId}
        organizationId={item.organizationId}
      />
      <FindingsList item={item} onError={onError} />
    </div>
  );
}
