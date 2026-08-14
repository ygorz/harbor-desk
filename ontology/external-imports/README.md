# External ontology imports

`ontology-full-metadata.json` holds ontology entities imported from a Foundry
environment. `foundry.yml` wires it in via:

```yaml
imports:
  - ontology: ontology/external-imports/ontology-full-metadata.json
```

The imported object/action/query/interface/shared-property types are made
available as inputs to the OSDK, TypeScript functions, and website blocks, so
you can reference existing Foundry entities from your ontology and functions
without redefining them.

## Refreshing the import

Regenerate this file with the CLI (overwrites the placeholder shipped with the
template):

```sh
foundry import ontology --ontology-rid ri.ontology.main.ontology.<uuid>
```

Import only specific entities by api name:

```sh
foundry import ontology \
  --ontology-rid ri.ontology.main.ontology.<uuid> \
  --objects Employee Department \
  --actions createEmployee
```

When entity filters are supplied the requested entities are merged into the
existing file; otherwise the full fetched metadata replaces it. The checked-in
file starts as an empty placeholder so the project builds before you run an
import.
