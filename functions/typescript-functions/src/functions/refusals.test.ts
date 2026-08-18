import { describe, expect, it } from "vitest";
import type { Client, Osdk } from "@osdk/client";
import { UserFacingError } from "@osdk/functions";
import type { analyst, finding, investigationCase } from "@ontology/sdk";
import addFinding from "./addFinding.js";
import approveClose from "./approveClose.js";
import requestClose from "./requestClose.js";
import resolveFinding from "./resolveFinding.js";
import {
    FINDING_OPEN,
    STATUS_CLOSED,
    STATUS_IN_REVIEW,
    STATUS_OPEN,
    STATUS_PENDING_CLOSE,
} from "../lib/policy.js";

const dummyClient = {} as Client;

function listingClient(rows: Array<{ caseId?: string; status?: string }>): Client {
    return ((() => ({
        fetchPage: async () => ({ data: rows }),
    })) as unknown) as Client;
}

function asAnalyst(
    fields: { $primaryKey: string; id?: string; name?: string },
): Osdk.Instance<analyst> {
    return fields as Osdk.Instance<analyst>;
}

function asCase(
    fields: {
        $primaryKey: string;
        id?: string;
        title?: string;
        status?: string;
        riskScore?: number;
        closeRequestedById?: string;
    },
): Osdk.Instance<investigationCase> {
    return fields as Osdk.Instance<investigationCase>;
}

function asFinding(
    fields: {
        $primaryKey: string;
        id?: string;
        title?: string;
        status?: string;
        severity?: string;
        caseId?: string;
    },
): Osdk.Instance<finding> {
    return fields as Osdk.Instance<finding>;
}

const maya = asAnalyst({
    $primaryKey: "ANALYST-MAYA",
    id: "ANALYST-MAYA",
    name: "Maya Chen",
});

async function expectFacing(
    work: () => unknown | Promise<unknown>,
    message: string,
): Promise<void> {
    try {
        await work();
        throw new Error("expected UserFacingError");
    } catch (caught) {
        expect(caught).toBeInstanceOf(UserFacingError);
        expect((caught as Error).message).toBe(message);
    }
}

describe("addFinding refusals", () => {
    it("refuses Closed", async () => {
        await expectFacing(
            () =>
                addFinding(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_CLOSED,
                    }),
                    maya,
                    "Title",
                    "",
                    "High",
                ),
            "Closed cases cannot take new findings.",
        );
    });

    it("refuses Pending close", async () => {
        await expectFacing(
            () =>
                addFinding(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_PENDING_CLOSE,
                    }),
                    maya,
                    "Title",
                    "",
                    "High",
                ),
            "Cannot add findings while a close is waiting for four-eyes.",
        );
    });

    it("refuses an empty title", async () => {
        await expectFacing(
            () =>
                addFinding(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_OPEN,
                    }),
                    maya,
                    "   ",
                    "",
                    "High",
                ),
            "A finding needs a title.",
        );
    });

    it("refuses unknown severity", async () => {
        await expectFacing(
            () =>
                addFinding(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_OPEN,
                    }),
                    maya,
                    "Title",
                    "",
                    "Extreme",
                ),
            "Severity must be Low, Medium, High, or Critical.",
        );
    });
});

describe("resolveFinding refusals", () => {
    const openFinding = asFinding({
        $primaryKey: "FIND-1",
        id: "FIND-1",
        title: "Hop",
        status: FINDING_OPEN,
        severity: "High",
        caseId: "CASE-1",
    });

    it("refuses a frozen case", async () => {
        await expectFacing(
            () =>
                resolveFinding(
                    dummyClient,
                    openFinding,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_PENDING_CLOSE,
                    }),
                    maya,
                    "Cleared.",
                ),
            "Cannot resolve findings while a close is waiting for four-eyes.",
        );
    });

    it("refuses a finding that belongs to another case", async () => {
        await expectFacing(
            () =>
                resolveFinding(
                    dummyClient,
                    openFinding,
                    asCase({
                        $primaryKey: "CASE-2",
                        id: "CASE-2",
                        status: STATUS_IN_REVIEW,
                    }),
                    maya,
                    "Cleared.",
                ),
            "That finding does not belong to this case.",
        );
    });

    it("refuses an empty mitigation note", async () => {
        await expectFacing(
            () =>
                resolveFinding(
                    dummyClient,
                    openFinding,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        status: STATUS_IN_REVIEW,
                    }),
                    maya,
                    "  ",
                ),
            "A finding needs a mitigation note.",
        );
    });
});

describe("requestClose refusals", () => {
    it("refuses while an open finding is on the case", async () => {
        const client = listingClient([
            { caseId: "CASE-1", status: FINDING_OPEN },
        ]);
        await expectFacing(
            () =>
                requestClose(
                    client,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        title: "Northwind",
                        status: STATUS_IN_REVIEW,
                        riskScore: 0,
                    }),
                    maya,
                ),
            "Cannot request close while findings are still open. Resolve every open finding first.",
        );
    });

    it("refuses Closed", async () => {
        await expectFacing(
            () =>
                requestClose(
                    listingClient([]),
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        title: "Northwind",
                        status: STATUS_CLOSED,
                    }),
                    maya,
                ),
            "Northwind is already closed.",
        );
    });
});

describe("approveClose refusals", () => {
    it("requires a requester", async () => {
        await expectFacing(
            () =>
                approveClose(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        title: "Northwind",
                        status: STATUS_PENDING_CLOSE,
                    }),
                    maya,
                ),
            "Northwind has no close requester on file. Request close first.",
        );
    });

    it("refuses the same analyst", async () => {
        await expectFacing(
            () =>
                approveClose(
                    dummyClient,
                    asCase({
                        $primaryKey: "CASE-1",
                        id: "CASE-1",
                        title: "Northwind",
                        status: STATUS_PENDING_CLOSE,
                        closeRequestedById: "ANALYST-MAYA",
                    }),
                    maya,
                ),
            "Maya Chen requested this close. A second analyst has to approve it.",
        );
    });
});
