/**
 * Northwind graph for Load demo. Keep in sync with ontology/seed/001-harbor.mts
 * (seed is local-only and never deployed).
 */

export const DEMO_CASE_ID = "CASE-2041";

// =============================================================================
// Analysts
// =============================================================================

export const analysts = [
    { id: "ANALYST-MAYA", name: "Maya Chen", role: "Lead" },
    { id: "ANALYST-JORDAN", name: "Jordan Hale", role: "Reviewer" },
    { id: "ANALYST-PRIYA", name: "Priya Shah", role: "Reviewer" },
] as const;

// =============================================================================
// People
// =============================================================================

export const people = [
    {
        id: "PER-VARGA",
        name: "Elena Varga",
        jurisdiction: "Cyprus",
        notes: "Cyprus resident. Beneficial owner of Northwind Holdings. A personal ETH wallet was linked to her during this investigation.",
    },
] as const;

// =============================================================================
// Organizations
// =============================================================================

export const organizations = [
    {
        id: "ORG-NORTHWIND",
        name: "Northwind Holdings LLC",
        legalForm: "LLC",
        jurisdiction: "Delaware, US",
        notes: "Delaware LLC. The treasury wallet received its first inbound transfer within 48 hours of formation.",
    },
    {
        id: "ORG-RETAIL",
        name: "Harbor Retail LLC",
        legalForm: "LLC",
        jurisdiction: "New York, US",
        notes: "New York retailer with a high volume of customer refunds. No crypto wallets on this file.",
    },
    {
        id: "ORG-CLEARSTREAM",
        name: "Clearstream Payments Inc",
        legalForm: "Inc",
        jurisdiction: "United Kingdom",
        notes: "UK payments firm. A suspicious activity report was filed on the prior case, which is now closed.",
    },
] as const;

// =============================================================================
// Ownership interests
// =============================================================================

export const ownershipInterests = [
    {
        id: "OWN-NORTHWIND-VARGA",
        role: "Beneficial owner",
        personId: "PER-VARGA",
        organizationId: "ORG-NORTHWIND",
    },
] as const;

// =============================================================================
// Wallets
// =============================================================================

export const wallets = [
    {
        id: "WALLET-TREASURY",
        address: "0xA11CE7a5C0E0e00000000000000000000000a11c",
        chain: "ETH",
        label: "Northwind treasury",
        organizationId: "ORG-NORTHWIND",
    },
    {
        id: "WALLET-PERSONAL",
        address: "0xb0bA11CE0000000000000000000000000000b0b",
        chain: "ETH",
        label: "Elena Varga — personal",
        personId: "PER-VARGA",
    },
] as const;

// =============================================================================
// Cases
// =============================================================================

export const cases = [
    {
        id: DEMO_CASE_ID,
        title: "Northwind Holdings — treasury funding",
        status: "In review",
        severity: "High",
        riskScore: 65,
        summary:
            "Newly formed Delaware LLC. The company treasury wallet was funded within 48 hours of incorporation, from a personal wallet linked to the beneficial owner.",
        organizationId: "ORG-NORTHWIND",
        ownerId: "ANALYST-MAYA",
    },
    {
        id: "CASE-1988",
        title: "Harbor Retail — refunds under reporting thresholds",
        status: "Open",
        severity: "Medium",
        riskScore: 29,
        summary:
            "Repeated customer refunds just under reporting thresholds across three merchant accounts.",
        organizationId: "ORG-RETAIL",
        ownerId: "ANALYST-PRIYA",
    },
    {
        id: "CASE-1902",
        title: "Clearstream Payments — source of funds (closed)",
        status: "Closed",
        severity: "High",
        riskScore: 0,
        summary:
            "Could not establish source of funds on a large cross-border payment. Suspicious activity report filed. Closed after four-eyes review.",
        organizationId: "ORG-CLEARSTREAM",
        ownerId: "ANALYST-JORDAN",
        closeRequestedById: "ANALYST-MAYA",
    },
] as const;

// =============================================================================
// Findings
// =============================================================================

export const findings = [
    {
        id: "FIND-2041-1",
        title: "Treasury funded within 48 hours of incorporation",
        body: "Northwind Holdings LLC was formed in Delaware. Within 48 hours, the company treasury wallet received its first inbound ETH transfer.",
        severity: "Critical",
        status: "Open",
        caseId: DEMO_CASE_ID,
        organizationId: "ORG-NORTHWIND",
        walletId: "WALLET-TREASURY",
    },
    {
        id: "FIND-2041-2",
        title: "Beneficial owner's wallet funded the treasury through an intermediate address",
        body: "Elena Varga's personal ETH wallet sent funds to the Northwind treasury through one intermediate address rather than directly. The amounts were split into several transfers just below round figures.",
        severity: "High",
        status: "Open",
        caseId: DEMO_CASE_ID,
        personId: "PER-VARGA",
        walletId: "WALLET-PERSONAL",
    },
    {
        id: "FIND-2041-3",
        title: "Registered agent listed on hundreds of same-week formations",
        body: "Northwind's Delaware registered agent appears on several hundred LLC formations filed the same week. High-volume agents can be used to stand up companies quickly.",
        severity: "Medium",
        status: "Mitigated",
        mitigationNote:
            "Legal reviewed the agent. High-volume Delaware registered agents are common for new LLCs and this one does not, by itself, indicate concealment.",
        resolvedById: "ANALYST-MAYA",
        caseId: DEMO_CASE_ID,
        organizationId: "ORG-NORTHWIND",
    },
    {
        id: "FIND-1988-1",
        title: "Refunds cluster just under the reporting threshold",
        body: "Fourteen refunds in 11 days, each between $9,400 and $9,850, across three Harbor Retail merchant accounts.",
        severity: "Medium",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    },
    {
        id: "FIND-1988-2",
        title: "Same checkout device on two merchant accounts",
        body: "The same checkout device was used on two Harbor Retail merchant accounts that the company listed as separate storefronts.",
        severity: "Medium",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    },
    {
        id: "FIND-1988-3",
        title: "Chargeback rate well above similar merchants",
        body: "Chargebacks over the last 90 days are 3.1 times the rate for similar merchants. Treat as low confidence until the card processor's report is on file.",
        severity: "Low",
        status: "Open",
        caseId: "CASE-1988",
        organizationId: "ORG-RETAIL",
    },
    {
        id: "FIND-1902-1",
        title: "Source of funds not established on a £1.8m payment",
        body: "Clearstream Payments could not establish the source of funds for a £1.8 million cross-border payment.",
        severity: "High",
        status: "Mitigated",
        mitigationNote:
            "A suspicious activity report was filed. The case was closed after a second analyst approved.",
        resolvedById: "ANALYST-JORDAN",
        caseId: "CASE-1902",
        organizationId: "ORG-CLEARSTREAM",
    },
] as const;
