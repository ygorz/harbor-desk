# app

React (Vite) frontend for Harbor Desk. Blueprint dark ops console in `src/desk/`.

- `useOsdkObjects` / `useOsdkObject` / `useLinks` for reads
- `useOsdkAction` for function-backed policy actions (`openCaseAction`, `addFindingAction`, `requestCloseAction`, …)
- Acting-as is an analyst object in `sessionStorage` (local mock auth has no Foundry user)

Run from the repository root (`pnpm run dev`) so ontology, functions, and the app stay in lock-step.

See [docs/study-guide.md](../docs/study-guide.md) for the request-close / four-eyes traces through these hooks.
