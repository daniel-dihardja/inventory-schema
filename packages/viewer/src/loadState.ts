import Ajv2020 from "ajv/dist/2020"
import addFormats from "ajv-formats"

import type {
  InventoryBoard,
  InventoryEvent,
  InventoryItem,
  InventoryState,
  JsonSchema,
} from "@menuyukti/inventory-spec"
import boardJson from "@menuyukti/inventory-spec/examples/kitchen/board.json"
import eventsRaw from "@menuyukti/inventory-spec/examples/kitchen/events.jsonl?raw"
import itemsJson from "@menuyukti/inventory-spec/examples/kitchen/items.json"
import boardSchema from "@menuyukti/inventory-spec/schemas/board.schema.json"
import eventSchema from "@menuyukti/inventory-spec/schemas/event.schema.json"
import itemSchema from "@menuyukti/inventory-spec/schemas/item.schema.json"
import itemsSchema from "@menuyukti/inventory-spec/schemas/items.schema.json"

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)

function assertValid(schema: object, data: unknown, label: string): void {
  const validate = ajv.compile(schema)
  if (validate(data)) return
  const messages = (validate.errors ?? []).map((err) => err.message ?? "invalid")
  throw new Error(`Invalid ${label}: ${messages.join("; ")}`)
}

function parseEvents(raw: string): InventoryEvent[] {
  const events: InventoryEvent[] = []
  for (const [index, line] of raw.split("\n").entries()) {
    const text = line.trim()
    if (!text) continue
    const parsed: unknown = JSON.parse(text)
    assertValid(eventSchema, parsed, `events.jsonl line ${index + 1}`)
    events.push(parsed as InventoryEvent)
  }
  return events
}

function canTransition(board: InventoryBoard, from: string, to: string): boolean {
  return board.transitions.some(([source, target]) => source === from && target === to)
}

function assertEventRules(
  board: InventoryBoard,
  event: InventoryEvent,
  itemIds: Set<string>,
): void {
  if (!itemIds.has(event.item_id)) {
    throw new Error(`Event ${event.id} references unknown item ${event.item_id}`)
  }
  const stageIds = new Set(board.stages.map((stage) => stage.id))
  if (!stageIds.has(event.to_stage_id)) {
    throw new Error(`Event ${event.id} has unknown to_stage_id ${event.to_stage_id}`)
  }
  if (event.from_stage_id != null) {
    if (!stageIds.has(event.from_stage_id)) {
      throw new Error(`Event ${event.id} has unknown from_stage_id ${event.from_stage_id}`)
    }
    if (!canTransition(board, event.from_stage_id, event.to_stage_id)) {
      throw new Error(
        `Event ${event.id} transition ${event.from_stage_id} -> ${event.to_stage_id} not allowed`,
      )
    }
  } else if (
    event.type === "item_created" &&
    event.to_stage_id !== board.initial_stage_id
  ) {
    throw new Error(`Event ${event.id} create must enter ${board.initial_stage_id}`)
  }

  const stage = board.stages.find((entry) => entry.id === event.to_stage_id)
  if (!stage) throw new Error(`Missing stage ${event.to_stage_id}`)
  assertValid(stage.props_schema, event.stage_props, `event ${event.id} stage_props`)
}

function assertItemRules(board: InventoryBoard, item: InventoryItem): void {
  if (item.board_id !== board.id) {
    throw new Error(`Item ${item.id} board_id mismatch`)
  }
  if (item.board_version !== board.version) {
    throw new Error(`Item ${item.id} board_version mismatch`)
  }
  const stage = board.stages.find((entry) => entry.id === item.stage_id)
  if (!stage) {
    throw new Error(`Item ${item.id} unknown stage ${item.stage_id}`)
  }
  assertValid(stage.props_schema, item.stage_props, `item ${item.id} stage_props`)
}

/**
 * Load schemas first, then validate board / items / events against them.
 */
export function loadInventoryState(): InventoryState {
  // 1) Schemas are importable JSON — compile to ensure they are valid JSON Schema.
  ajv.compile(boardSchema)
  ajv.compile(itemSchema)
  ajv.compile(itemsSchema)
  ajv.compile(eventSchema)

  // 2) Validate data files against those schemas.
  assertValid(boardSchema, boardJson, "board.json")
  assertValid(itemsSchema, itemsJson, "items.json")

  const board: InventoryBoard = {
    id: boardJson.id,
    version: boardJson.version,
    label: boardJson.label,
    initial_stage_id: boardJson.initial_stage_id,
    item_schema: itemSchema as JsonSchema,
    stages: boardJson.stages as unknown as InventoryBoard["stages"],
    transitions: boardJson.transitions as [string, string][],
  }

  for (const stage of board.stages) {
    ajv.compile(stage.props_schema)
  }

  const items = (itemsJson as InventoryItem[]).map((item) => {
    const cleaned = Object.fromEntries(
      Object.entries(item).filter(([, value]) => value != null),
    )
    assertValid(itemSchema, cleaned, `item ${item.id}`)
    assertItemRules(board, item)
    return item
  })

  const events = parseEvents(eventsRaw)
  const itemIds = new Set(items.map((item) => item.id))
  for (const event of events) {
    assertEventRules(board, event, itemIds)
  }

  return {
    exampleId: "kitchen_receiving",
    board,
    items,
    events,
  }
}
