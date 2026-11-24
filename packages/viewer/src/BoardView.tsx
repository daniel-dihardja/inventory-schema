import type {
  InventoryBoard,
  InventoryEvent,
  InventoryItem,
  InventoryStage,
  JsonSchema,
} from "@menuyukti/inventory-spec"

type BoardViewProps = {
  board: InventoryBoard
  items: InventoryItem[]
  events: InventoryEvent[]
}

function propTypeLabel(schema: JsonSchema): string {
  const rawType = schema.type
  const typePart = Array.isArray(rawType) ? rawType.join(" | ") : (rawType ?? "any")
  if (schema.format) return `${typePart} (${schema.format})`
  return typePart
}

function constraintHints(schema: JsonSchema): string[] {
  const hints: string[] = []
  if (typeof schema.minimum === "number") hints.push(`min ${schema.minimum}`)
  if (typeof schema.maximum === "number") hints.push(`max ${schema.maximum}`)
  if (typeof schema.minLength === "number") hints.push(`minLength ${schema.minLength}`)
  if (typeof schema.maxLength === "number") hints.push(`maxLength ${schema.maxLength}`)
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    hints.push(`enum: ${schema.enum.map(String).join(", ")}`)
  }
  return hints
}

function SchemaFieldList({ schema }: { schema: JsonSchema }) {
  const required = new Set(schema.required ?? [])
  const properties = Object.entries(schema.properties ?? {})
  if (properties.length === 0) {
    return <p className="muted">No fields defined</p>
  }
  return (
    <ul className="field-list">
      {properties.map(([key, fieldSchema]) => {
        const hints = constraintHints(fieldSchema)
        return (
          <li key={key}>
            <div className="field-row">
              <code>{key}</code>
              <span className={required.has(key) ? "badge required" : "badge"}>
                {required.has(key) ? "required" : "optional"}
              </span>
            </div>
            <p className="muted">type: {propTypeLabel(fieldSchema)}</p>
            {hints.length > 0 ? <p className="muted">{hints.join(" · ")}</p> : null}
          </li>
        )
      })}
    </ul>
  )
}

function ItemCard({ item }: { item: InventoryItem }) {
  const meta = [
    item.unit_price != null && item.currency
      ? `price: ${item.unit_price} ${item.currency} / ${item.unit}`
      : null,
    item.supplier ? `supplier: ${item.supplier}` : null,
    item.lot ? `lot: ${item.lot}` : null,
    item.expires_at ? `expires: ${item.expires_at}` : null,
  ].filter(Boolean)

  const stageProps = Object.entries(item.stage_props)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ")

  return (
    <article className="item-card">
      <div className="item-card-top">
        <h3>{item.name}</h3>
        <code>
          {item.quantity} {item.unit}
        </code>
      </div>
      {meta.length > 0 ? <p className="muted">{meta.join(" · ")}</p> : null}
      {stageProps ? <p className="stage-props">{stageProps}</p> : null}
    </article>
  )
}

function StageColumn({
  stage,
  isInitial,
  items,
}: {
  stage: InventoryStage
  isInitial: boolean
  items: InventoryItem[]
}) {
  return (
    <section className="stage-column">
      <header>
        <div className="stage-title">
          <h2>{stage.label}</h2>
          {isInitial ? <span className="badge">initial</span> : null}
        </div>
        <code className="muted">{stage.id}</code>
      </header>

      <div>
        <p className="section-label">Stage props</p>
        <SchemaFieldList schema={stage.props_schema} />
      </div>

      <div className="items-block">
        <p className="section-label">
          Items ({items.length})
        </p>
        {items.length === 0 ? (
          <p className="muted">No items in this stage</p>
        ) : (
          <div className="item-stack">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function BoardView({ board, items, events }: BoardViewProps) {
  const stages = [...board.stages].sort((a, b) => a.order - b.order)
  const itemsByStage = new Map<string, InventoryItem[]>()
  const itemNameById = new Map(items.map((item) => [item.id, item.name]))

  for (const stage of stages) itemsByStage.set(stage.id, [])
  for (const item of items) {
    itemsByStage.get(item.stage_id)?.push(item)
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )

  return (
    <div className="board">
      <section className="panel meta-panel">
        <div className="meta-row">
          <span>
            Board id: <code>{board.id}</code>
          </span>
          <span>Version: {board.version}</span>
          <span>
            Initial: <code>{board.initial_stage_id}</code>
          </span>
        </div>
        <h1>{board.label}</h1>
      </section>

      <section className="panel">
        <h2>Item schema</h2>
        <SchemaFieldList schema={board.item_schema} />
      </section>

      <div className="columns-scroll">
        <div className="columns">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              isInitial={stage.id === board.initial_stage_id}
              items={itemsByStage.get(stage.id) ?? []}
            />
          ))}
        </div>
      </div>

      <section className="panel">
        <h2>Allowed transitions</h2>
        <ul className="chip-list">
          {board.transitions.map(([from, to]) => (
            <li key={`${from}->${to}`}>
              <code>
                {from} → {to}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Events ({sortedEvents.length})</h2>
        <ul className="event-list">
          {sortedEvents.map((event) => {
            const name = itemNameById.get(event.item_id) ?? event.item_id.slice(0, 8)
            const move =
              event.from_stage_id == null
                ? `→ ${event.to_stage_id}`
                : `${event.from_stage_id} → ${event.to_stage_id}`
            return (
              <li key={event.id}>
                <div className="event-top">
                  <code className="muted">{event.at}</code>
                  <span className="badge">{event.type}</span>
                </div>
                <p>
                  {name} <code className="muted">{move}</code>
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
