import { analyst, investigationCase } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { STATUS_CLOSED, STATUS_PENDING_CLOSE } from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof investigationCase>;

/**
 * Four-eyes close. The approving analyst cannot be the one who requested close.
 */
function approveClose(
    client: Client,
    caseToClose: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
): OntologyEdit[] {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before approving close.");
    }
    if (caseToClose.status !== STATUS_PENDING_CLOSE) {
        throw new UserFacingError(
            `${caseToClose.title ?? caseToClose.$primaryKey} is not waiting for close approval.`,
        );
    }

    const requesterId = caseToClose.closeRequestedById;
    const actorId = actingAnalyst.id ?? String(actingAnalyst.$primaryKey);
    if (requesterId != null && requesterId === actorId) {
        throw new UserFacingError(
            `${actingAnalyst.name ?? actorId} requested this close. A second analyst has to approve it.`,
        );
    }

    const batch = createEditBatch<OntologyEdit>(client);
    batch.update(caseToClose, { status: STATUS_CLOSED });
    return batch.getEdits();
}

export const config = {
    apiName: "approveClose",
};

export default approveClose;
