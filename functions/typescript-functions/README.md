# Harbor Desk functions

TypeScript functions that encode casework policy. Each function returns ontology edits; the matching action in `ontology.mts` applies them.

| Function | Rule |
|---|---|
| `openCase` | Exactly one person or organization; Open / Medium / risk 0 |
| `addFinding` | Write a finding, recompute `riskScore`, maybe escalate Open → In review |
| `resolveFinding` | Only open findings; lower risk |
| `requestClose` | Refuse Closed / Pending close, and refuse while `riskScore > 0` |
| `approveClose` | Only Pending close; acting analyst cannot be the requester |
| `loadDemoScenario` | Write the Northwind graph if `CASE-2041` is missing |

Shared weights and status transitions live in `src/lib/policy.ts`. Keep `src/lib/demoScenario.ts` in sync with `ontology/seed/001-harbor.mts`.

See [study-guide.md](../../study-guide.md) for how these sit between the ontology and the desk UI.
