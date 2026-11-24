import { BoardView } from "./BoardView"
import { loadInventoryState } from "./loadState"

export function App() {
  try {
    const state = loadInventoryState()
    return (
      <main className="page">
        <header className="page-header">
          <p className="eyebrow">JSON-only inventory</p>
          <h1>Kitchen receiving</h1>
          <p className="lede">
            Schemas and sample state live under <code>data/</code>. TypeScript loads
            schemas first, validates the JSON, then renders this board.
          </p>
        </header>
        <BoardView board={state.board} items={state.items} events={state.events} />
      </main>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load inventory"
    return (
      <main className="page">
        <header className="page-header">
          <h1>Inventory failed to load</h1>
          <p className="error">{message}</p>
        </header>
      </main>
    )
  }
}
