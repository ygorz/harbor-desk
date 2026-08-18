# Harbor Desk functions

TypeScript functions that encode casework policy. Each function returns ontology edits; the matching action in `ontology.mts` applies them.

| Function | Rule |
|---|---|
| `openCase` | Exactly one person or organization; Open / Medium / risk 0 |
| `addFinding` | Refuse Closed / Pending close; known severity; title required; bump `riskScore` |
| `resolveFinding` | Case not frozen; finding belongs to the case; mitigation note; write resolver |
| `requestClose` | Refuse Closed / Pending close; refuse while any finding on the case is Open |
| `approveClose` | Only Pending close; requester must be set; acting analyst cannot be the requester |
| `loadDemoScenario` | Write the Northwind graph if `CASE-2041` is missing |

Shared weights and status transitions live in `src/lib/policy.ts`. Object ids go through `src/lib/ids.ts`. Keep `src/lib/demoScenario.ts` in sync with `ontology/seed/001-harbor.mts`.

See [docs/study-guide.md](../../docs/study-guide.md) for how these sit between the ontology and the desk UI.
