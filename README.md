# Harbor Desk

A Foundry SuperRepo casework desk: ontology-as-code, TypeScript functions that encode close policy, and a React OSDK ops console. One git tag ships all three as a Marketplace product.

Analysts open cases, attach findings to people, organizations, and wallets, and close a case only when every open finding is resolved and a second analyst approves. The demo story is **Case 2041 — Northwind Holdings**, a newly formed Delaware LLC whose treasury wallet was funded within 48 hours of incorporation.

This is a writeback application. Instances exist because actions (or local seed) created them. SuperRepo cannot yet own pipelines, external HTTP from functions, or chain ingest. Those stay on classic Foundry; this repo can import those types later with `foundry import ontology`.

How the pieces connect — Enrollment, Project, Ontology, Marketplace, then a request-close trace through ontology / functions / the desk — is in [study-guide.md](./study-guide.md). Use that file to teach SuperRepo from this product.

## Architecture

```
ontology.mts  -->  generated OSDK
                      |
          +-----------+-----------+
          |                       |
   TypeScript functions      React desk
   (return edits)            (@osdk/react hooks)
          |                       |
          +-----------+-----------+
                      |
              function-backed actions
              apply the edits
```

| Layer | Owns |
|---|---|
| `ontology/src/ontology.mts` | Object types, interface, links, function-backed actions |
| `functions/typescript-functions/src/functions/` | Risk, close rules, four-eyes, demo load |
| `app/src/desk/` | Queue, case workspace, acting-as |

## Ontology

Seven writeback types (`editsEnabled`, empty backing datasource) plus an `investigatable` interface:

- **Analyst** — Maya Chen (lead), Jordan Hale (reviewer), Priya Shah
- **Person** / **Organization** — implement `investigatable`. Elena Varga; Northwind, Harbor Retail, Clearstream
- **Ownership interest** — object-backed UBO link (Elena → Northwind)
- **Wallet** — chain + address, attributed to a person or organization (typed in, not synced)
- **Case** (`investigationCase` in code; `case` is a reserved word) — status, risk score, owner, close requester
- **Finding** — object-backed evidence; open findings block close

Subject of a case is exactly one person or one organization (two optional FKs; `openCase` enforces the XOR because the schema cannot). Interface links are not used yet. Every FK is a named link. `entity` was removed.

`riskScore` is function-owned: Critical 40, High 25, Medium 12, Low 5, capped at 100. At 50 an `Open` case becomes `In review`. `severity` on a case is a priority band, not that live rollup.

## Policy (in functions, not in React)

- **Open case** — exactly one person or organization; starts Open / Medium / risk 0
- **Add finding** — writes the finding, recomputes risk, may escalate status
- **Resolve finding** — only `Open` findings; lowers risk
- **Request close** — refuses `Closed` / `Pending close`, and refuses while risk is above 0 (open findings remain)
- **Approve close** — only `Pending close`; the acting analyst cannot be the requester
- **Load demo** — experimental bootstrap; writes the Northwind graph if `CASE-2041` is missing (seed never deploys)

Acting-as in the header is a stand-in for the Foundry user. Local preview uses mock auth, so four-eyes has to be an ontology object you can switch.

## Run locally

```bash
foundry login
foundry install pnpm
pnpm run dev
```

App: http://localhost:8080 (or the port the CLI prints). Seed loads Northwind on every ontology start.

### Demo script (~90 seconds)

1. Queue shows **Northwind — treasury funding** at risk 65, status In review.
2. Open it: LLC, Elena Varga’s personal wallet, treasury wallet, two open findings.
3. Add a finding — risk jumps.
4. **Request close** as Maya — error: open findings.
5. Resolve open findings until risk is 0.
6. Request close as Maya — Pending close.
7. Stay Maya, **Approve close** — error: four-eyes.
8. Switch acting-as to Jordan Hale, approve — Closed.

## Deploy

Configure once so Marketplace store, Project, and hosted subdomain match this product (`harbor-desk`):

```bash
pnpm run configure
FOUNDRY_PRODUCT_VERSION=1.0.0 pnpm run build
foundry deploy
```

Then Developer Console: approve the website domain and deploy the latest asset. After install the ontology is empty — click **Load demo**.

This product adds seven object types. Watch the Dev-tier object-type cap. If an older SuperRepo from this same folder is already installed, uninstall it first — `entity` is gone and singleton upgrade may need that type deleted.

`env.yml` is local (store RID, folder RID, markings, subdomain). Copy `env.yml.example`. Do not commit it.

## What SuperRepo cannot do yet

No PySpark / pipelines, no Python functions, no outbound HTTP from functions, no Automate, no Agent SDK. Harbor Desk is the casework layer. Ingest (Alchemy, bank files, …) would live in classic Foundry; this SuperRepo would import those object types.

## Layout

- `ontology/src/ontology.mts` — source of truth
- `ontology/seed/001-harbor.mts` — local only
- `functions/typescript-functions/src/functions/` — policy
- `app/src/desk/` — Blueprint ops console
- `foundry.yml` — SuperRepo manifest
- `study-guide.md` — how the layers connect; teaching path for this repo

Generated: `ontology/osdk-output/`, `ontology/src/generated-imports/`. Do not edit.

Tags that deploy must be exact `MAJOR.MINOR.PATCH` (no `v`). `0.0.1` is reserved.
