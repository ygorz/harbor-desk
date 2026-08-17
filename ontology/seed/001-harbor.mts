import {
    analyst,
    finding,
    investigationCase,
    organization,
    ownershipInterest,
    person,
    wallet,
} from "@ontology/sdk";
import { createSeed } from "@osdk/seed-helpers";

/**
 * Case 2041 — Northwind Holdings. Local preview boots into this graph.
 * Keep in sync with functions/.../lib/demoScenario.ts (seed is never deployed).
 */
export default createSeed((seed) => {
    seed.add(analyst, {
        id: "ANALYST-MAYA",
        name: "Maya Chen",
        role: "Lead",
    });
    seed.add(analyst, {
        id: "ANALYST-JORDAN",
        name: "Jordan Hale",
        role: "Reviewer",
    });
    seed.add(analyst, {
        id: "ANALYST-PRIYA",
        name: "Priya Shah",
        role: "Reviewer",
    });

    seed.add(person, {
        id: "PER-VARGA",
        name: "Elena Varga",
        jurisdiction: "Cyprus",
        notes: "Cyprus resident. Personal ETH wallet attributed during Northwind intake.",
    });

    seed.add(organization, {
        id: "ORG-NORTHWIND",
        name: "Northwind Holdings LLC",
        legalForm: "LLC",
        jurisdiction: "Delaware, US",
        notes: "Formed 11 days before the first inbound transfer to the treasury wallet.",
    });
    seed.add(organization, {
        id: "ORG-RETAIL",
        name: "Harbor Retail LLC",
        legalForm: "LLC",
        jurisdiction: "New York, US",
        notes: "High-volume refunds. No on-chain footprint in this case.",
    });
    seed.add(organization, {
        id: "ORG-CLEARSTREAM",
        name: "Clearstream Payments Inc",
        legalForm: "Inc",
        jurisdiction: "United Kingdom",
        notes: "Prior SAR filed. Case closed after four-eyes review.",
    });

    seed.add(ownershipInterest, {
        id: "OWN-NORTHWIND-VARGA",
        role: "Beneficial owner",
        personId: "PER-VARGA",
        organizationId: "ORG-NORTHWIND",
    });

    seed.add(wallet, {
        id: "WALLET-TREASURY",
        address: "0xA11CE7a5C0E0e00000000000000000000000a11c",
        chain: "ETH",
        label: "Northwind treasury",
        organizationId: "ORG-NORTHWIND",
    });
    seed.add(wallet, {
        id: "WALLET-PERSONAL",
        address: "0xb0bA11CE0000000000000000000000000000b0b",
        chain: "ETH",
        label: "Varga personal",
        personId: "PER-VARGA",
    });

    seed.add(investigationCase, {
        id: "CASE-2041",
        title: "Northwind — treasury funding",
        status: "In review",
        severity: "High",
        riskScore: 65,
        summary:
            "Newly formed Delaware LLC. Treasury wallet funded within 48 hours of incorporation from a personal wallet attributed to the beneficial owner.",
        organizationId: "ORG-NORTHWIND",
        ownerId: "ANALYST-MAYA",
    });
    seed.add(investigationCase, {
        id: "CASE-1988",
        title: "Harbor Retail — structured refunds",
        status: "Open",
        severity: "Medium",
        riskScore: 29,
        summary: "Repeated refunds just under reporting thresholds across three merchant IDs.",
        organizationId: "ORG-RETAIL",
        ownerId: "ANALYST-PRIYA",
    });
    seed.add(investigationCase, {
        id: "CASE-1902",
        title: "Clearstream — SAR close",
        status: "Closed",
        severity: "High",
        riskScore: 0,
        summary: "Narrative filed. Closed after four-eyes review.",
        organizationId: "ORG-CLEARSTREAM",
        ownerId: "ANALYST-JORDAN",
        closeRequestedById: "ANALYST-MAYA",
    });

    seed.add(finding, {
        id: "FIND-2041-1",
        title: "Treasury funded within 48h of incorporation",
        body: "Northwind Holdings LLC was formed in Delaware. Within 48 hours the treasury wallet received its first inbound ETH transfer.",
        severity: "Critical",
        status: "Open",
        caseId: "CASE-2041",
        organizationId: "ORG-NORTHWIND",
        walletId: "WALLET-TREASURY",
    });
    seed.add(finding, {
        id: "FIND-2041-2",
        title: "Personal wallet funded the treasury in two hops",
        body: "The Varga personal wallet sent ETH through one intermediate address into the Northwind treasury. Amounts split just below round figures.",
        severity: "High",
        status: "Open",
        caseId: "CASE-2041",
        personId: "PER-VARGA",
        walletId: "WALLET-PERSONAL",
    });
    seed.add(finding, {
        id: "FIND-2041-3",
        title: "Registered agent is a mass-formation service",
        body: "The Delaware registered agent appears on several hundred same-week formations.",
        severity: "Medium",
        status: "Mitigated",
        mitigationNote: "Counsel confirmed it is a standard registered-agent product.",
        resolvedById: "ANALYST-MAYA",
        caseId: "CASE-2041",
        organizationId: "ORG-NORTHWIND",
    });

    seed.add(finding, {
        id: "FIND-1988-1",
        title: "Refunds cluster just under the reporting threshold",
        body: "Fourteen refunds in 11 days, each $9,400–$9,850, across three Harbor Retail merchant IDs.",
        severity: "Medium",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    });
    seed.add(finding, {
        id: "FIND-1988-2",
        title: "Same device fingerprint on two merchant IDs",
        body: "Checkout device hash repeats on merchant IDs that Harbor Retail booked as unrelated storefronts.",
        severity: "Medium",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    });
    seed.add(finding, {
        id: "FIND-1988-3",
        title: "Chargeback rate elevated vs peer cohort",
        body: "90-day chargeback rate is 3.1x the peer merchant cohort. Low confidence until acquiring bank file is attached.",
        severity: "Low",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    });

    seed.add(finding, {
        id: "FIND-1902-1",
        title: "Correspondent-bank narrative filed",
        body: "Clearstream Payments could not source funds for a £1.8m corridor payment.",
        severity: "High",
        status: "Mitigated",
        mitigationNote: "SAR narrative filed with the correspondent bank.",
        resolvedById: "ANALYST-JORDAN",
        caseId: "CASE-1902",
        organizationId: "ORG-CLEARSTREAM",
    });
});
