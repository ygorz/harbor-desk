# Ontology

`src/ontology.mts` is the source of truth for Harbor Desk object types, links, and actions.

The local development server watches this file and regenerates `osdk-output/` after every change. Never edit generated OSDK files directly.

Seed in `seed/001-harbor.mts` is local only. After deploy, use the **Load demo** action.

See [docs/study-guide.md](../docs/study-guide.md) for how types, links, and actions join the functions and desk UI.
See [docs/ontology-guide.md](../docs/ontology-guide.md) for Palantir design mapped onto this file.
