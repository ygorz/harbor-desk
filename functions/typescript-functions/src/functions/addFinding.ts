import { analyst, finding, investigationCase, organization, person, wallet } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import {
    cappedRisk,
    FINDING_OPEN,
    severityWeight,
    STATUS_CLOSED,
    statusAfterRisk,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof finding> | Edits.Object<typeof investigationCase>;

function optionalPk(
    row: Osdk.Instance<person> | Osdk.Instance<organization> | Osdk.Instance<wallet> | undefined,
): string | undefined {
    if (row == null) {
        return undefined;
    }
    if ("id" in row && row.id != null && String(row.id) !== "") {
        return String(row.id);
    }
    return String(row.$primaryKey);
}

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
    if (caseToUpdate.status === STATUS_CLOSED) {
        throw new UserFacingError("Closed cases cannot take new findings.");
    }
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
        throw new UserFacingError("A finding needs a title.");
    }

    const nextScore = cappedRisk(
        (caseToUpdate.riskScore ?? 0) + severityWeight(severity),
    );
    const nextStatus = statusAfterRisk(caseToUpdate.status, nextScore);
    const personId = optionalPk(relatedPerson);
    const organizationId = optionalPk(relatedOrganization);
    const walletId = optionalPk(relatedWallet);

    const batch = createEditBatch<OntologyEdit>(client);
    batch.create(finding, {
        id: `FIND-${Date.now()}`,
        title: trimmedTitle,
        body: body.trim(),
        severity,
        status: FINDING_OPEN,
        caseId: caseToUpdate.id ?? String(caseToUpdate.$primaryKey),
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
