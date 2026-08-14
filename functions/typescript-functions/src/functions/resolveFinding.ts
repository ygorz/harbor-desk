import { analyst, finding, investigationCase } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import {
    cappedRisk,
    FINDING_MITIGATED,
    FINDING_OPEN,
    severityWeight,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof finding> | Edits.Object<typeof investigationCase>;

/**
 * Marks a finding mitigated and lowers case.riskScore by that finding's weight.
 */
function resolveFinding(
    client: Client,
    findingToResolve: Osdk.Instance<finding>,
    caseToUpdate: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
): OntologyEdit[] {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before resolving a finding.");
    }
    if (findingToResolve.status !== FINDING_OPEN) {
        throw new UserFacingError(
            `${findingToResolve.title ?? findingToResolve.$primaryKey} is already mitigated.`,
        );
    }

    const nextScore = cappedRisk(
        (caseToUpdate.riskScore ?? 0) - severityWeight(findingToResolve.severity),
    );

    const batch = createEditBatch<OntologyEdit>(client);
    batch.update(findingToResolve, { status: FINDING_MITIGATED });
    batch.update(caseToUpdate, { riskScore: nextScore });
    return batch.getEdits();
}

export const config = {
    apiName: "resolveFinding",
};

export default resolveFinding;
