import { analyst, finding, investigationCase } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { objectId } from "../lib/ids.js";
import {
    cappedRisk,
    FINDING_MITIGATED,
    FINDING_OPEN,
    isFindingsFrozen,
    severityWeight,
    STATUS_CLOSED,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof finding> | Edits.Object<typeof investigationCase>;

/**
 * Marks a finding mitigated, records why and who, and lowers case.riskScore
 * by that finding's weight. Does not de-escalate In review.
 */
function resolveFinding(
    client: Client,
    findingToResolve: Osdk.Instance<finding>,
    caseToUpdate: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
    mitigationNote: string,
): OntologyEdit[] {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before resolving a finding.");
    }
    if (isFindingsFrozen(caseToUpdate.status)) {
        throw new UserFacingError(
            caseToUpdate.status === STATUS_CLOSED
                ? "Closed cases cannot change findings."
                : "Cannot resolve findings while a close is waiting for four-eyes.",
        );
    }
    if (String(findingToResolve.caseId ?? "") !== objectId(caseToUpdate)) {
        throw new UserFacingError("That finding does not belong to this case.");
    }
    if (findingToResolve.status !== FINDING_OPEN) {
        throw new UserFacingError(
            `${findingToResolve.title ?? findingToResolve.$primaryKey} is already mitigated.`,
        );
    }
    const trimmedNote = mitigationNote.trim();
    if (trimmedNote === "") {
        throw new UserFacingError("A finding needs a mitigation note.");
    }

    const nextScore = cappedRisk(
        (caseToUpdate.riskScore ?? 0) - severityWeight(findingToResolve.severity),
    );

    const batch = createEditBatch<OntologyEdit>(client);
    batch.update(findingToResolve, {
        status: FINDING_MITIGATED,
        mitigationNote: trimmedNote,
        resolvedById: objectId(actingAnalyst),
    });
    batch.update(caseToUpdate, { riskScore: nextScore });
    return batch.getEdits();
}

export const config = {
    apiName: "resolveFinding",
};

export default resolveFinding;
