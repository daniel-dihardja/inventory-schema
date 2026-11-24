export type JsonSchema = {
  type?: string | string[]
  format?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: Array<string | number | boolean>
  const?: unknown
  required?: string[]
  properties?: Record<string, JsonSchema>
  additionalProperties?: boolean | JsonSchema
  items?: JsonSchema
  title?: string
  [key: string]: unknown
}

export type InventoryStage = {
  id: string
  label: string
  order: number
  props_schema: JsonSchema
}

export type InventoryBoard = {
  id: string
  version: number
  label: string
  initial_stage_id: string
  item_schema: JsonSchema
  stages: InventoryStage[]
  transitions: [string, string][]
}

export type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit: string
  sku?: string | null
  lot?: string | null
  supplier?: string | null
  expires_at?: string | null
  notes?: string | null
  stage_id: string
  stage_props: Record<string, unknown>
  board_id: string
  board_version: number
  created_at: string
  updated_at: string
}

export type InventoryEvent = {
  id: string
  type: "item_created" | "item_moved" | "item_updated"
  at: string
  item_id: string
  from_stage_id: string | null
  to_stage_id: string
  stage_props: Record<string, unknown>
  item_snapshot?: Record<string, unknown> | null
}

export type InventoryState = {
  exampleId: string
  board: InventoryBoard
  items: InventoryItem[]
  events: InventoryEvent[]
}
