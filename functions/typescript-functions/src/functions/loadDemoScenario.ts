import {
    analyst,
    finding,
    investigationCase,
    organization,
    ownershipInterest,
    person,
    wallet,
} from "@ontology/sdk";
import { Client, isOk } from "@osdk/client";
import { createEditBatch, Edits, UserFacingError } from "@osdk/functions";
import {
    analysts,
    cases,
    DEMO_CASE_ID,
    findings,
    organizations,
    ownershipInterests,
    people,
    wallets,
} from "../lib/demoScenario.js";

type OntologyEdit =
    | Edits.Object<typeof analyst>
    | Edits.Object<typeof person>
    | Edits.Object<typeof organization>
    | Edits.Object<typeof ownershipInterest>
    | Edits.Object<typeof wallet>
    | Edits.Object<typeof investigationCase>
    | Edits.Object<typeof finding>;

/**
 * Writes the Northwind graph. Seed does this locally; this action does it
 * after deploy, where seed never runs.
 */
async function loadDemoScenario(client: Client): Promise<OntologyEdit[]> {
    const existing = await client(investigationCase).fetchOneWithErrors(DEMO_CASE_ID);
    if (isOk(existing)) {
        throw new UserFacingError(
            "Demo scenario is already loaded (CASE-2041 exists).",
        );
    }

    const batch = createEditBatch<OntologyEdit>(client);

    for (const row of analysts) {
        batch.create(analyst, { ...row });
    }
    for (const row of people) {
        batch.create(person, { ...row });
    }
    for (const row of organizations) {
        batch.create(organization, { ...row });
    }
    for (const row of ownershipInterests) {
        batch.create(ownershipInterest, { ...row });
    }
    for (const row of wallets) {
        batch.create(wallet, { ...row });
    }
    for (const row of cases) {
        batch.create(investigationCase, { ...row });
    }
    for (const row of findings) {
        batch.create(finding, { ...row });
    }

    return batch.getEdits();
}

export const config = {
    apiName: "loadDemoScenario",
};

export default loadDemoScenario;
