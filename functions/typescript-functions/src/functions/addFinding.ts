import { analyst, finding, investigationCase, organization, person, wallet } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { objectId, optionalObjectId } from "../lib/ids.js";
import {
    assertKnownSeverity,
    cappedRisk,
    FINDING_OPEN,
    isFindingsFrozen,
    severityWeight,
    STATUS_CLOSED,
    statusAfterRisk,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof finding> | Edits.Object<typeof investigationCase>;

/**
 * Adds a finding and recomputes case.riskScore. Escalates Open → In review at 50.
 */
function addFinding(
    client: Client,
    caseToUpdate: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
    title: string,
    body: string,
    severity: string,
    relatedPerson?: Osdk.Instance<person>,
    relatedOrganization?: Osdk.Instance<organization>,
    relatedWallet?: Osdk.Instance<wallet>,
): OntologyEdit[] {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before adding a finding.");
    }
    if (isFindingsFrozen(caseToUpdate.status)) {
        throw new UserFacingError(
            caseToUpdate.status === STATUS_CLOSED
                ? "Closed cases cannot take new findings."
                : "Cannot add findings while a close is waiting for four-eyes.",
        );
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
        throw new UserFacingError("A finding needs a title.");
    }
    assertKnownSeverity(severity);

    const nextScore = cappedRisk(
        (caseToUpdate.riskScore ?? 0) + severityWeight(severity),
    );
    const nextStatus = statusAfterRisk(caseToUpdate.status, nextScore);
    const personId = optionalObjectId(relatedPerson);
    const organizationId = optionalObjectId(relatedOrganization);
    const walletId = optionalObjectId(relatedWallet);

    const batch = createEditBatch<OntologyEdit>(client);
    batch.create(finding, {
        id: `FIND-${Date.now()}`,
        title: trimmedTitle,
        body: body.trim(),
        severity,
        status: FINDING_OPEN,
        caseId: objectId(caseToUpdate),
        ...(personId != null ? { personId } : {}),
        ...(organizationId != null ? { organizationId } : {}),
        ...(walletId != null ? { walletId } : {}),
    });
    batch.update(caseToUpdate, {
        riskScore: nextScore,
        status: nextStatus,
    });
    return batch.getEdits();
}

export const config = {
    apiName: "addFinding",
};

export default addFinding;
