import { analyst, investigationCase, organization, person } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import { objectId } from "../lib/ids.js";
import {
    isActiveCase,
    SEVERITY_MEDIUM,
    STATUS_OPEN,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof investigationCase>;

const EXACTLY_ONE_SUBJECT =
    "Open a case on exactly one person or one organization.";

/**
 * Opens a case on exactly one person or organization. status, severity, and
 * riskScore are set here — not by the caller.
 */
async function openCase(
    client: Client,
    actingAnalyst: Osdk.Instance<analyst>,
    subjectPerson?: Osdk.Instance<person>,
    subjectOrganization?: Osdk.Instance<organization>,
): Promise<OntologyEdit[]> {
    if (actingAnalyst == null) {
        throw new UserFacingError("Select an analyst before opening a case.");
    }

    if ((subjectPerson != null) === (subjectOrganization != null)) {
        throw new UserFacingError(EXACTLY_ONE_SUBJECT);
    }

    const subjectId =
        subjectPerson != null
            ? objectId(subjectPerson)
            : objectId(subjectOrganization!);
    const title =
        (subjectPerson != null ? subjectPerson.name : subjectOrganization!.name) ??
        subjectId;

    // First page covers the demo queue. Not a query-by-subject.
    const existing = await client(investigationCase).fetchPage({ $pageSize: 50 });
    const alreadyActive = existing.data.some((item) => {
        if (!isActiveCase(item.status)) {
            return false;
        }
        return subjectPerson != null
            ? item.personId === subjectId
            : item.organizationId === subjectId;
    });
    if (alreadyActive) {
        throw new UserFacingError(`${title} already has an open case.`);
    }

    const batch = createEditBatch<OntologyEdit>(client);
    batch.create(investigationCase, {
        id: `CASE-${Date.now()}`,
        title,
        status: STATUS_OPEN,
        severity: SEVERITY_MEDIUM,
        riskScore: 0,
        summary: "",
        ownerId: objectId(actingAnalyst),
        ...(subjectPerson != null
            ? { personId: subjectId }
            : { organizationId: subjectId }),
    });
    return batch.getEdits();
}

export const config = {
    apiName: "openCase",
};

export default openCase;
