# menuyukti inventory

Standalone **JSON-only** kitchen inventory example + TypeScript web viewer.

```text
inventory/
  data/                 # schemas + example state (source of truth)
    schemas/
      board.schema.json
      item.schema.json
      items.schema.json
      event.schema.json
    board.json
    items.json
    events.jsonl
  src/                  # TypeScript viewer
```

## Run

```bash
cd /Users/danieldihardja/dev/AI-Products/menuyukti/inventory
pnpm install
pnpm dev
```

Open the URL Vite prints (default http://localhost:5173).

## How it works

1. TypeScript loads JSON schemas from `data/schemas/`
2. Validates `board.json`, `items.json`, and `events.jsonl` with [Ajv](https://ajv.js.org/)
3. Renders the kanban board, item cards, transitions, and event history

No database. Edit files under `data/` and refresh.
