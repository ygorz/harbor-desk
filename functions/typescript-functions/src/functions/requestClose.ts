import { analyst, finding, investigationCase } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { objectId } from "../lib/ids.js";
import {
    FINDING_OPEN,
    STATUS_CLOSED,
    STATUS_PENDING_CLOSE,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof investigationCase>;

/**
 * Moves a case to Pending close. Open findings are rejected here, not in the
 * UI — the desk may still let the analyst click so this error can surface.
 */
async function requestClose(
    client: Client,
    caseToClose: Osdk.Instance<investigationCase>,
    actingAnalyst: Osdk.Instance<analyst>,
): Promise<OntologyEdit[]> {
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

    const caseId = objectId(caseToClose);
    // First page covers the demo queue. Same scale as openCase.
    const page = await client(finding).fetchPage({ $pageSize: 50 });
    const hasOpen = page.data.some(
        (row) =>
            row.status === FINDING_OPEN && String(row.caseId ?? "") === caseId,
    );
    if (hasOpen) {
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
