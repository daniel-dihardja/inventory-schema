# `@menuyukti/inventory-spec`

Canonical inventory specification for menuyukti.

- **`schemas/`** — JSON Schema (draft 2020-12) for board, item, items file, and event
- **`examples/kitchen/`** — filled kitchen-receiving instance that validates against the schemas
- **`types.ts`** — TypeScript types aligned with the schemas

```ts
import type { InventoryBoard, InventoryItem } from "@menuyukti/inventory-spec"
import boardSchema from "@menuyukti/inventory-spec/schemas/board.schema.json"
import kitchenBoard from "@menuyukti/inventory-spec/examples/kitchen/board.json"
```
