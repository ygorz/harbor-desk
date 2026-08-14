import {
    defineInterface,
    defineLink,
    defineObject,
    defineSharedPropertyType,
} from "@osdk/maker";
import type {
    ActionType,
    InterfaceType,
    LinkType,
    ObjectTypeDefinition,
} from "@osdk/maker";
import { defineFunctionBackedAction } from "@osdk/maker-experimental";

const optionalString = {
    type: "string" as const,
    nullability: { noNulls: false, noEmptyCollections: false },
};

const longTextType = { type: "string" as const, isLongText: true };

const hiddenFk = (
    displayName: string,
    optional: boolean,
    description: string,
) => ({
    type: "string" as const,
    displayName,
    description,
    visibility: "HIDDEN" as const,
    ...(optional ? { nullability: optionalString.nullability } : {}),
});

const nameProperty = defineSharedPropertyType({
    apiName: "name",
    type: "string",
    displayName: "Name",
    description: "Human-readable name of a person or organization.",
});

const jurisdictionProperty = defineSharedPropertyType({
    apiName: "jurisdiction",
    type: "string",
    displayName: "Jurisdiction",
    description: "Residency or legal jurisdiction.",
});

const notesProperty = defineSharedPropertyType({
    apiName: "notes",
    type: longTextType,
    displayName: "Notes",
    description: "Free-text context. Relationships belong on links, not only here.",
});

/**
 * Taxonomic interface for case subjects. Person and Organization implement it.
 * Interface-typed links are not used: Palantir still lists those as in development,
 * so concrete person/organization links duplicate the shape for now.
 */
export const HarborInvestigatable: InterfaceType = defineInterface({
    apiName: "investigatable",
    displayName: "Investigatable",
    description:
        "A person or organization that can be the subject of a case. Implemented by Person and Organization.",
    icon: { locator: "search", color: "#7961DB" },
    properties: {
        id: {
            type: "string",
            description: "Primary key of the implementing person or organization.",
        },
        name: nameProperty,
        jurisdiction: jurisdictionProperty,
        notes: notesProperty,
    },
});

const investigatableMapping = [
    { interfaceProperty: "id", mapsTo: "id" },
    { interfaceProperty: "name", mapsTo: "name" },
    { interfaceProperty: "jurisdiction", mapsTo: "jurisdiction" },
    { interfaceProperty: "notes", mapsTo: "notes" },
];

export const HarborAnalyst: ObjectTypeDefinition = defineObject({
    apiName: "analyst",
    displayName: "Analyst",
    pluralDisplayName: "Analysts",
    description:
        "An investigator who owns and reviews cases. Demo acting-as stands in for the Foundry user.",
    titlePropertyApiName: "name",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "person", color: "#2D72D2" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable analyst identifier (ANALYST-MAYA, …).",
        },
        name: {
            type: "string",
            displayName: "Name",
            description: "Display name used in acting-as and case ownership.",
        },
        role: {
            type: "string",
            displayName: "Role",
            description: "Desk role. Demo values: Lead, Reviewer.",
        },
    },
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

export const HarborPerson: ObjectTypeDefinition = defineObject({
    apiName: "person",
    displayName: "Person",
    pluralDisplayName: "People",
    description: "A natural person who can be the subject of a case or a related party.",
    titlePropertyApiName: "name",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "person", color: "#7961DB" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable person identifier (PER-VARGA, …).",
        },
        name: {
            type: "string",
            displayName: "Name",
            sharedPropertyType: nameProperty,
        },
        jurisdiction: {
            type: "string",
            displayName: "Jurisdiction",
            sharedPropertyType: jurisdictionProperty,
        },
        notes: {
            type: longTextType,
            displayName: "Notes",
            sharedPropertyType: notesProperty,
        },
    },
    implementsInterfaces: [
        {
            implements: HarborInvestigatable,
            propertyMapping: investigatableMapping,
        },
    ],
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

export const HarborOrganization: ObjectTypeDefinition = defineObject({
    apiName: "organization",
    displayName: "Organization",
    pluralDisplayName: "Organizations",
    description: "A legal entity that can be the subject of a case.",
    titlePropertyApiName: "name",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "office", color: "#7157D9" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable organization identifier (ORG-NORTHWIND, …).",
        },
        name: {
            type: "string",
            displayName: "Name",
            sharedPropertyType: nameProperty,
        },
        legalForm: {
            type: "string",
            displayName: "Legal form",
            description: "Corporate form. Demo values: LLC, Inc.",
        },
        jurisdiction: {
            type: "string",
            displayName: "Jurisdiction",
            sharedPropertyType: jurisdictionProperty,
        },
        notes: {
            type: longTextType,
            displayName: "Notes",
            sharedPropertyType: notesProperty,
        },
    },
    implementsInterfaces: [
        {
            implements: HarborInvestigatable,
            propertyMapping: investigatableMapping,
        },
    ],
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

export const HarborWallet: ObjectTypeDefinition = defineObject({
    apiName: "wallet",
    displayName: "Wallet",
    pluralDisplayName: "Wallets",
    description:
        "A blockchain address attributed to a person or an organization. Entered by analysts, not synced from chain. Seed and demo pick exactly one owner; the schema cannot XOR personId vs organizationId.",
    titlePropertyApiName: "label",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "credit-card", color: "#F0B726" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable wallet identifier (WALLET-TREASURY, …).",
        },
        address: {
            type: "string",
            displayName: "Address",
            description: "On-chain address as typed by an analyst. Not synced.",
        },
        chain: {
            type: "string",
            displayName: "Chain",
            description: "Network ticker. Demo value: ETH.",
        },
        label: {
            type: "string",
            displayName: "Label",
            description: "Human label (Northwind treasury, Varga personal).",
        },
        personId: hiddenFk(
            "Person",
            true,
            "Owner when this wallet is attributed to a person. Hidden; use ownerPerson.",
        ),
        organizationId: hiddenFk(
            "Organization",
            true,
            "Owner when this wallet is attributed to an organization. Hidden; use ownerOrganization.",
        ),
    },
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

/**
 * `investigationCase` rather than `case` — `case` is a reserved word in
 * JavaScript, so the generated OSDK export would not be importable.
 */
export const HarborCase: ObjectTypeDefinition = defineObject({
    apiName: "investigationCase",
    displayName: "Case",
    pluralDisplayName: "Cases",
    description:
        "An investigation file. status and riskScore are written by function-backed actions. severity is a priority band, not the live risk rollup. Subject is exactly one of personId or organizationId; openCase enforces that XOR because the schema cannot.",
    titlePropertyApiName: "title",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "folder-open", color: "#215DB0" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable case identifier (CASE-2041, or CASE-{timestamp} from openCase).",
        },
        title: {
            type: "string",
            displayName: "Title",
            description: "Short investigation title. openCase copies the subject name.",
        },
        status: {
            type: "string",
            displayName: "Status",
            description: "Open, In review, Pending close, or Closed. Written by functions.",
        },
        severity: {
            type: "string",
            displayName: "Severity",
            description: "Case priority band. Independent of live riskScore.",
        },
        riskScore: {
            type: "integer",
            displayName: "Risk score",
            description:
                "Live rollup of open finding weights. Every mutating action updates it. Not a derived property: these types are writeback.",
        },
        summary: {
            type: longTextType,
            displayName: "Summary",
            description: "Analyst narrative for the file. Relationships belong on links.",
        },
        personId: hiddenFk(
            "Person",
            true,
            "Subject when the case is on a person. Mutually exclusive with organizationId in openCase. Hidden; use subjectPerson.",
        ),
        organizationId: hiddenFk(
            "Organization",
            true,
            "Subject when the case is on an organization. Mutually exclusive with personId in openCase. Hidden; use subjectOrganization.",
        ),
        ownerId: hiddenFk(
            "Owner",
            false,
            "Assigned analyst. Hidden; use owner.",
        ),
        closeRequestedById: hiddenFk(
            "Close requested by",
            true,
            "Analyst who requested close. Four-eyes compares this to the approver. Hidden; use closeRequester.",
        ),
    },
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

export const HarborFinding: ObjectTypeDefinition = defineObject({
    apiName: "finding",
    displayName: "Finding",
    pluralDisplayName: "Findings",
    description:
        "Object-backed evidence on a case (severity, status, body). Open findings block close.",
    titlePropertyApiName: "title",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "search", color: "#C87619" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable finding identifier (FIND-2041-1, …).",
        },
        title: {
            type: "string",
            displayName: "Title",
            description: "Short finding headline.",
        },
        body: {
            type: longTextType,
            displayName: "Body",
            description: "Evidence narrative. Targets are on relatedPerson / relatedOrganization / relatedWallet.",
        },
        severity: {
            type: "string",
            displayName: "Severity",
            description: "Critical, High, Medium, or Low. Feeds the case riskScore rollup.",
        },
        status: {
            type: "string",
            displayName: "Status",
            description: "Open or Mitigated. Open findings block close.",
        },
        caseId: hiddenFk(
            "Case",
            false,
            "Parent investigation file. Hidden; use parentCase.",
        ),
        personId: hiddenFk(
            "Person",
            true,
            "Optional related person. Hidden; use relatedPerson.",
        ),
        organizationId: hiddenFk(
            "Organization",
            true,
            "Optional related organization. Hidden; use relatedOrganization.",
        ),
        walletId: hiddenFk(
            "Wallet",
            true,
            "Optional related wallet. Hidden; use relatedWallet.",
        ),
    },
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

export const HarborOwnershipInterest: ObjectTypeDefinition = defineObject({
    apiName: "ownershipInterest",
    displayName: "Ownership interest",
    pluralDisplayName: "Ownership interests",
    description:
        "Object-backed link from a person to an organization (for example beneficial owner). Role is metadata on the relationship, not a note on either party.",
    titlePropertyApiName: "role",
    primaryKeyPropertyApiName: "id",
    icon: { locator: "layout-hierarchy", color: "#8F4B95" },
    properties: {
        id: {
            type: "string",
            displayName: "ID",
            description: "Stable ownership-interest identifier (OWN-NORTHWIND-VARGA, …).",
        },
        role: {
            type: "string",
            displayName: "Role",
            description: "Role on the relationship. Demo value: Beneficial owner.",
        },
        personId: hiddenFk(
            "Person",
            false,
            "The person who holds the interest. Hidden; use beneficialOwner.",
        ),
        organizationId: hiddenFk(
            "Organization",
            false,
            "The organization that is owned. Hidden; use ownedOrganization.",
        ),
    },
    editsEnabled: true,
    includeEmptyBackingDatasource: true,
});

/** Analyst who owns the case ↔ that analyst's assigned cases. */
export const assignedCases: LinkType = defineLink({
    apiName: "assignedCases",
    one: {
        object: HarborAnalyst,
        metadata: {
            apiName: "assignedCases",
            displayName: "Assigned case",
            pluralDisplayName: "Assigned cases",
        },
    },
    toMany: {
        object: HarborCase,
        metadata: {
            apiName: "owner",
            displayName: "Owner",
            pluralDisplayName: "Owners",
        },
    },
    manyForeignKeyProperty: "ownerId",
    editsEnabled: true,
});

/** Analyst who requested close ↔ cases waiting on that requester (four-eyes). */
export const closeRequestedCases: LinkType = defineLink({
    apiName: "closeRequestedCases",
    one: {
        object: HarborAnalyst,
        metadata: {
            apiName: "closeRequestedCases",
            displayName: "Close requested case",
            pluralDisplayName: "Close requested cases",
        },
    },
    toMany: {
        object: HarborCase,
        metadata: {
            apiName: "closeRequester",
            displayName: "Close requester",
            pluralDisplayName: "Close requesters",
        },
    },
    manyForeignKeyProperty: "closeRequestedById",
    editsEnabled: true,
});

/** Person as case subject ↔ that person's cases. Paired with organizationCases until interface links exist. */
export const personCases: LinkType = defineLink({
    apiName: "personCases",
    one: {
        object: HarborPerson,
        metadata: {
            apiName: "personCases",
            displayName: "Case",
            pluralDisplayName: "Cases",
        },
    },
    toMany: {
        object: HarborCase,
        metadata: {
            apiName: "subjectPerson",
            displayName: "Subject person",
            pluralDisplayName: "Subject people",
        },
    },
    manyForeignKeyProperty: "personId",
    editsEnabled: true,
});

/** Organization as case subject ↔ that organization's cases. Paired with personCases until interface links exist. */
export const organizationCases: LinkType = defineLink({
    apiName: "organizationCases",
    one: {
        object: HarborOrganization,
        metadata: {
            apiName: "organizationCases",
            displayName: "Case",
            pluralDisplayName: "Cases",
        },
    },
    toMany: {
        object: HarborCase,
        metadata: {
            apiName: "subjectOrganization",
            displayName: "Subject organization",
            pluralDisplayName: "Subject organizations",
        },
    },
    manyForeignKeyProperty: "organizationId",
    editsEnabled: true,
});

/** Person who owns a wallet ↔ that person's wallets. */
export const personWallets: LinkType = defineLink({
    apiName: "personWallets",
    one: {
        object: HarborPerson,
        metadata: {
            apiName: "personWallets",
            displayName: "Wallet",
            pluralDisplayName: "Wallets",
        },
    },
    toMany: {
        object: HarborWallet,
        metadata: {
            apiName: "ownerPerson",
            displayName: "Owner person",
            pluralDisplayName: "Owner people",
        },
    },
    manyForeignKeyProperty: "personId",
    editsEnabled: true,
});

/** Organization that owns a wallet ↔ that organization's wallets. */
export const organizationWallets: LinkType = defineLink({
    apiName: "organizationWallets",
    one: {
        object: HarborOrganization,
        metadata: {
            apiName: "organizationWallets",
            displayName: "Wallet",
            pluralDisplayName: "Wallets",
        },
    },
    toMany: {
        object: HarborWallet,
        metadata: {
            apiName: "ownerOrganization",
            displayName: "Owner organization",
            pluralDisplayName: "Owner organizations",
        },
    },
    manyForeignKeyProperty: "organizationId",
    editsEnabled: true,
});

/** Case ↔ its findings (object-backed evidence). */
export const caseFindings: LinkType = defineLink({
    apiName: "caseFindings",
    one: {
        object: HarborCase,
        metadata: {
            apiName: "caseFindings",
            displayName: "Finding",
            pluralDisplayName: "Findings",
        },
    },
    toMany: {
        object: HarborFinding,
        metadata: {
            apiName: "parentCase",
            displayName: "Case",
            pluralDisplayName: "Cases",
        },
    },
    manyForeignKeyProperty: "caseId",
    editsEnabled: true,
});

/** Optional finding target: person. */
export const findingPerson: LinkType = defineLink({
    apiName: "findingPerson",
    one: {
        object: HarborPerson,
        metadata: {
            apiName: "personFindings",
            displayName: "Finding",
            pluralDisplayName: "Findings",
        },
    },
    toMany: {
        object: HarborFinding,
        metadata: {
            apiName: "relatedPerson",
            displayName: "Related person",
            pluralDisplayName: "Related people",
        },
    },
    manyForeignKeyProperty: "personId",
    editsEnabled: true,
});

/** Optional finding target: organization. */
export const findingOrganization: LinkType = defineLink({
    apiName: "findingOrganization",
    one: {
        object: HarborOrganization,
        metadata: {
            apiName: "organizationFindings",
            displayName: "Finding",
            pluralDisplayName: "Findings",
        },
    },
    toMany: {
        object: HarborFinding,
        metadata: {
            apiName: "relatedOrganization",
            displayName: "Related organization",
            pluralDisplayName: "Related organizations",
        },
    },
    manyForeignKeyProperty: "organizationId",
    editsEnabled: true,
});

/** Optional finding target: wallet. */
export const findingWallet: LinkType = defineLink({
    apiName: "findingWallet",
    one: {
        object: HarborWallet,
        metadata: {
            apiName: "walletFindings",
            displayName: "Finding",
            pluralDisplayName: "Findings",
        },
    },
    toMany: {
        object: HarborFinding,
        metadata: {
            apiName: "relatedWallet",
            displayName: "Related wallet",
            pluralDisplayName: "Related wallets",
        },
    },
    manyForeignKeyProperty: "walletId",
    editsEnabled: true,
});

/** Person ↔ ownership interests they hold (role lives on the interest). */
export const personOwnership: LinkType = defineLink({
    apiName: "personOwnership",
    one: {
        object: HarborPerson,
        metadata: {
            apiName: "personOwnership",
            displayName: "Ownership interest",
            pluralDisplayName: "Ownership interests",
        },
    },
    toMany: {
        object: HarborOwnershipInterest,
        metadata: {
            apiName: "beneficialOwner",
            displayName: "Beneficial owner",
            pluralDisplayName: "Beneficial owners",
        },
    },
    manyForeignKeyProperty: "personId",
    editsEnabled: true,
});

/** Organization ↔ ownership interests over it (role lives on the interest). */
export const organizationOwnership: LinkType = defineLink({
    apiName: "organizationOwnership",
    one: {
        object: HarborOrganization,
        metadata: {
            apiName: "organizationOwnership",
            displayName: "Ownership interest",
            pluralDisplayName: "Ownership interests",
        },
    },
    toMany: {
        object: HarborOwnershipInterest,
        metadata: {
            apiName: "ownedOrganization",
            displayName: "Owned organization",
            pluralDisplayName: "Owned organizations",
        },
    },
    manyForeignKeyProperty: "organizationId",
    editsEnabled: true,
});

export const openCaseAction: ActionType = defineFunctionBackedAction({
    functionApiName: "openCase",
    apiName: "open-case-action",
    displayName: "Open case",
});

export const addFindingAction: ActionType = defineFunctionBackedAction({
    functionApiName: "addFinding",
    apiName: "add-finding-action",
    displayName: "Add finding",
});

export const resolveFindingAction: ActionType = defineFunctionBackedAction({
    functionApiName: "resolveFinding",
    apiName: "resolve-finding-action",
    displayName: "Resolve finding",
});

export const requestCloseAction: ActionType = defineFunctionBackedAction({
    functionApiName: "requestClose",
    apiName: "request-close-action",
    displayName: "Request close",
});

export const approveCloseAction: ActionType = defineFunctionBackedAction({
    functionApiName: "approveClose",
    apiName: "approve-close-action",
    displayName: "Approve close",
});

export const loadDemoScenarioAction: ActionType = defineFunctionBackedAction({
    functionApiName: "loadDemoScenario",
    apiName: "load-demo-scenario-action",
    displayName: "Load demo scenario",
    status: "experimental",
});
