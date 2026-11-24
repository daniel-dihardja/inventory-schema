# menuyukti inventory

**Inventory specification** (JSON Schema + TypeScript types + kitchen example), with a reference viewer as a separate package.

## Kanban-inspired inventory

These specs are modeled after a **kanban board**. In kanban, work items move through columns (stages) along allowed transitions, carrying whatever details matter in each column. An inventory system behaves the same way: stock items move through lifecycle stages (e.g. delivered → quality check → store → preparation), and each stage can require its own fields.

| Kanban | Inventory |
| --- | --- |
| Columns | Stages (`board.json` → `stages`) |
| Cards | Items (`items.json`) |
| Move rules | Transitions (`board.json` → `transitions`) |
| Per-column fields | Per-stage `props_schema` |
| Activity log | Append-only events (`events.jsonl`) |

That parallel is intentional: instead of hard-coding one warehouse or kitchen flow, you **define a custom inventory setup by shaping the board schema**—which stages exist, which moves are allowed, and which properties each stage needs. The kitchen receiving example (`examples/kitchen/`) is one such setup; a retail stockroom, cold-chain receiving line, or prep-only board would use the same schema shapes with different stage labels, transitions, and `props_schema` definitions.

```text
inventory/
  packages/
    spec/                   # @menuyukti/inventory-spec  ← the product
      schemas/              # board, item, items, event
      examples/kitchen/     # board.json, items.json, events.jsonl
      types.ts
    viewer/                 # @menuyukti/inventory-viewer  ← example consumer
      src/
```

## Specification

| Artifact | Role |
| --- | --- |
| `packages/spec/schemas/*.schema.json` | Canonical shapes for board, items, and events |
| `packages/spec/types.ts` | TypeScript types aligned with those schemas |
| `packages/spec/examples/kitchen/` | One valid instance (kitchen receiving board) |

Consumers should treat schemas as the source of truth. Edit example JSON under `examples/kitchen/` and re-validate; do not invent parallel shapes in app code.

### Files in an inventory instance

1. **`board.json`** — stages, transitions, initial stage, per-stage `props_schema`
2. **`items.json`** — current item state (quantity, stage, stage props, …)
3. **`events.jsonl`** — append-only history (`item_created` / `item_moved` / `item_updated`)

## Packages

| Package | Name | Purpose |
| --- | --- | --- |
| Spec | `@menuyukti/inventory-spec` | Schemas, types, kitchen example |
| Viewer | `@menuyukti/inventory-viewer` | Vite + React UI that loads and validates the kitchen example |

Import from the spec package:

```ts
import type { InventoryItem } from "@menuyukti/inventory-spec"
import itemSchema from "@menuyukti/inventory-spec/schemas/item.schema.json"
import board from "@menuyukti/inventory-spec/examples/kitchen/board.json"
```

## Run the example viewer

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (default http://localhost:5173).

```bash
pnpm typecheck   # all packages
pnpm build       # viewer production build
```

No database. Change files under `packages/spec/` and refresh the viewer.
