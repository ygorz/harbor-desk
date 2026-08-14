import { analyst, investigationCase, organization, person } from "@ontology/sdk";
import { Client, Osdk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import {
    isActiveCase,
    SEVERITY_MEDIUM,
    STATUS_OPEN,
} from "../lib/policy.js";

type OntologyEdit = Edits.Object<typeof investigationCase>;

function primaryKey(
    row: Osdk.Instance<person> | Osdk.Instance<organization> | Osdk.Instance<analyst>,
): string {
    if (row.id != null && row.id !== "") {
        return String(row.id);
    }
    return String(row.$primaryKey);
}

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

    if (subjectPerson != null && subjectOrganization != null) {
        throw new UserFacingError(
            "Open a case on exactly one person or one organization.",
        );
    }
    if (subjectPerson == null && subjectOrganization == null) {
        throw new UserFacingError(
            "Open a case on exactly one person or one organization.",
        );
    }

    let subjectId: string;
    let title: string;
    if (subjectPerson != null) {
        subjectId = primaryKey(subjectPerson);
        title = subjectPerson.name ?? subjectId;
    } else if (subjectOrganization != null) {
        subjectId = primaryKey(subjectOrganization);
        title = subjectOrganization.name ?? subjectId;
    } else {
        throw new UserFacingError(
            "Open a case on exactly one person or one organization.",
        );
    }

    const existing = await client(investigationCase).fetchPage({ $pageSize: 50 });
    const alreadyActive = existing.data.some((item) => {
        if (!isActiveCase(item.status)) {
            return false;
        }
        if (subjectPerson != null) {
            return item.personId === subjectId;
        }
        return item.organizationId === subjectId;
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
        ownerId: primaryKey(actingAnalyst),
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
