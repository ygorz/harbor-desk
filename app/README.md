# app

React (Vite) frontend for Harbor Desk. Blueprint dark ops console in `src/desk/`.

- `useOsdkObjects` / `useOsdkObject` / `useLinks` for reads
- `useOsdkAction` for the plain create-case action and function-backed policy actions
- Acting-as is an analyst object in `sessionStorage` (local mock auth has no Foundry user)

Run from the repository root (`pnpm run dev`) so ontology, functions, and the app stay in lock-step.

See [study-guide.md](../study-guide.md) for the request-close / four-eyes traces through these hooks.
