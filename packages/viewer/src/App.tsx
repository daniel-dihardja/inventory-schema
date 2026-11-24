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
            Spec lives in <code>@menuyukti/inventory-spec</code>. This viewer loads
            the kitchen example, validates it against the schemas, then renders the board.
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
