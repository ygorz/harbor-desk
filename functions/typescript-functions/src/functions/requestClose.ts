import { analyst, investigationCase } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { objectId } from "../lib/ids.js";
import { STATUS_CLOSED, STATUS_PENDING_CLOSE } from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof investigationCase>;

/**
 * Moves a case to Pending close. Open findings (riskScore > 0) are rejected
 * here, not in the UI.
 */
function requestClose(
    client: Client,
    caseToClose: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
): OntologyEdit[] {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before requesting close.");
    }

    const status = caseToClose.status;
    if (status === STATUS_CLOSED) {
        throw new UserFacingError(
            `${caseToClose.title ?? caseToClose.$primaryKey} is already closed.`,
        );
    }
    if (status === STATUS_PENDING_CLOSE) {
        throw new UserFacingError(
            `${caseToClose.title ?? caseToClose.$primaryKey} is already waiting for four-eyes approval.`,
        );
    }

    if ((caseToClose.riskScore ?? 0) > 0) {
        throw new UserFacingError(
            "Cannot request close while findings are still open. Resolve every open finding first.",
        );
    }

    const batch = createEditBatch<OntologyEdit>(client);
    batch.update(caseToClose, {
        status: STATUS_PENDING_CLOSE,
        closeRequestedById: objectId(actingAnalyst),
    });
    return batch.getEdits();
}

export const config = {
    apiName: "requestClose",
};

export default requestClose;
