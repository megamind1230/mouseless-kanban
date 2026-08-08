import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { AppState, BoardAction, Board, Card } from './core/types'

const initialState: AppState = {
  board: null,
  activeLane: 0,
  activeCard: 0,
  mode: 'normal',
  clipboard: [],
  history: [],
  historyIndex: -1,
  selectedIds: [],
  selectionMode: 'none',
  visualAnchor: null,
  preVisualIds: [],
  searchQuery: null,
  searchMatches: [],
  searchMatchIdx: -1,
  foldedLanes: [],
  showArchive: false,
}

type HistoryEntry = { board: Board; activeLane: number; activeCard: number }

// ponytail: snapshot pre-mutation board + cursor for undo, cap at 20
function snap(state: AppState, prevBoard: Board): Partial<AppState> {
  const entry: HistoryEntry = {
    board: JSON.parse(JSON.stringify(prevBoard)),
    activeLane: state.activeLane,
    activeCard: state.activeCard,
  }
  const h = state.history.slice(0, state.historyIndex + 1)
  h.push(entry)
  if (h.length > 20) h.shift()
  return { history: h, historyIndex: h.length - 1 }
}

function clone(board: Board): Board {
  return JSON.parse(JSON.stringify(board))
}

function reducer(state: AppState, action: BoardAction): AppState {
  if (!state.board && !['SET_BOARD'].includes(action.type)) return state

  switch (action.type) {
    case 'SET_BOARD':
      return { ...state, board: action.board, activeLane: 0, activeCard: 0 }

    case 'SET_FOLDED_LANES':
      return { ...state, foldedLanes: action.ids }

    case 'SET_ACTIVE_LANE':
      return { ...state, activeLane: action.index, activeCard: 0, selectedIds: [], selectionMode: 'none', visualAnchor: null, preVisualIds: [] }

    case 'SET_ACTIVE_CARD':
      return { ...state, activeCard: action.index }

    case 'ENTER_INSERT':
      return { ...state, mode: 'insert' }

    case 'ENTER_NORMAL':
      return { ...state, mode: 'normal' }

    case 'ADD_LANE': {
      const prev = state.board!
      const b = clone(prev)
      b.lanes.push({ id: `k${Date.now()}`, name: 'New Lane', cards: [] })
      return { ...state, ...snap(state, prev), board: b, activeLane: b.lanes.length - 1, activeCard: 0 }
    }

    case 'RENAME_LANE': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      lane.name = action.name
      return { ...state, ...snap(state, prev), board: b }
    }

    case 'DELETE_LANE': {
      const prev = state.board!
      const b = clone(prev)
      const idx = b.lanes.findIndex(l => l.id === action.laneId)
      if (idx === -1) return state
      b.lanes.splice(idx, 1)
      return {
        ...state,
        ...snap(state, prev),
        board: b,
        activeLane: Math.min(state.activeLane, b.lanes.length - 1),
        activeCard: 0,
      }
    }

    case 'MOVE_LANE': {
      const prev = state.board!
      const b = clone(prev)
      const idx = b.lanes.findIndex(l => l.id === action.laneId)
      if (idx === -1) return state
      const t = action.direction === 'left' ? idx - 1 : idx + 1
      if (t < 0 || t >= b.lanes.length) return state
      const [lane] = b.lanes.splice(idx, 1)
      b.lanes.splice(t, 0, lane)
      return { ...state, ...snap(state, prev), board: b, activeLane: t }
    }

    case 'ADD_CARD': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      const card = { id: `k${Date.now()}`, title: '', status: 'todo' as const }
      let idx = lane.cards.length
      if (action.position === 'above') idx = state.activeCard
      if (action.position === 'below') idx = state.activeCard + 1
      lane.cards.splice(idx, 0, card)
      return { ...state, ...snap(state, prev), board: b, activeCard: idx }
    }

    case 'DELETE_CARD': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      if (state.selectedIds.length > 0) {
        const toDelete = new Set(state.selectedIds)
        const deleted = lane.cards.filter(c => toDelete.has(c.id))
        lane.cards = lane.cards.filter(c => !toDelete.has(c.id))
        return { ...state, ...snap(state, prev), board: b, clipboard: deleted, activeCard: Math.max(0, Math.min(state.activeCard, lane.cards.length - 1)), selectedIds: [], selectionMode: 'none', visualAnchor: null, preVisualIds: [] }
      }
      const idx = lane.cards.findIndex(c => c.id === action.cardId)
      if (idx === -1) return state
      const [deleted] = lane.cards.splice(idx, 1)
      return { ...state, ...snap(state, prev), board: b, clipboard: [deleted], activeCard: Math.max(0, Math.min(state.activeCard, lane.cards.length - 1)) }
    }

    case 'MOVE_CARD': {
      const prev = state.board!
      const b = clone(prev)
      const laneIdx = state.activeLane
      const cardIdx = state.activeCard
      const lane = b.lanes[laneIdx]
      if (!lane?.cards[cardIdx]) return state

      if (state.selectedIds.length > 0) {
        const toMove = new Set(state.selectedIds)
        const cards = lane.cards.filter(c => toMove.has(c.id))
        lane.cards = lane.cards.filter(c => !toMove.has(c.id))
        if (action.direction === 'up') {
          const insertIdx = Math.max(0, cardIdx - 1)
          lane.cards.splice(insertIdx, 0, ...cards)
        } else if (action.direction === 'down') {
          lane.cards.push(...cards)
        } else {
          const t = action.direction === 'prev-lane'
            ? Math.max(0, laneIdx - 1)
            : Math.min(b.lanes.length - 1, laneIdx + 1)
          b.lanes[t].cards.push(...cards)
          return { ...state, ...snap(state, prev), board: b, activeLane: t }
        }
        return { ...state, ...snap(state, prev), board: b }
      }

      const [card] = lane.cards.splice(cardIdx, 1)

      if (action.direction === 'up') {
        const t = Math.max(0, cardIdx - 1)
        lane.cards.splice(t, 0, card)
        return { ...state, ...snap(state, prev), board: b, activeCard: t }
      }
      if (action.direction === 'down') {
        const t = Math.min(lane.cards.length, cardIdx + 1)
        lane.cards.splice(t, 0, card)
        return { ...state, ...snap(state, prev), board: b, activeCard: t }
      }
      // prev-lane / next-lane
      const t = action.direction === 'prev-lane'
        ? Math.max(0, laneIdx - 1)
        : Math.min(b.lanes.length - 1, laneIdx + 1)
      b.lanes[t].cards.push(card)
      return { ...state, ...snap(state, prev), board: b, activeLane: t, activeCard: b.lanes[t].cards.length - 1 }
    }

    case 'TOGGLE_CARD': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      const toggle = (c: Card) => {
        c.status = c.status === 'done' ? 'todo' : 'done'
      }
      if (state.selectedIds.length > 0) {
        const toToggle = new Set(state.selectedIds)
        lane.cards.forEach(c => { if (toToggle.has(c.id)) toggle(c) })
        return { ...state, ...snap(state, prev), board: b }
      }
      const card = lane.cards.find(c => c.id === action.cardId)
      if (!card) return state
      toggle(card)
      return { ...state, ...snap(state, prev), board: b }
    }

    case 'TOGGLE_IN_PROGRESS': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      const toggle = (c: Card) => {
        c.status = c.status === 'doing' ? 'todo' : 'doing'
      }
      if (state.selectedIds.length > 0) {
        const toToggle = new Set(state.selectedIds)
        lane.cards.forEach(c => { if (toToggle.has(c.id)) toggle(c) })
        return { ...state, ...snap(state, prev), board: b }
      }
      const card = lane.cards.find(c => c.id === action.cardId)
      if (!card) return state
      toggle(card)
      return { ...state, ...snap(state, prev), board: b }
    }

    case 'EDIT_CARD': {
      const b = clone(state.board!)
      const card = b.lanes.find(l => l.id === action.laneId)?.cards.find(c => c.id === action.cardId)
      if (!card) return state
      card.title = action.title
      return { ...state, board: b }
    }

    case 'YANK_CARD': {
      if (state.selectedIds.length > 0) {
        const lane = state.board!.lanes[state.activeLane]
        const toYank = new Set(state.selectedIds)
        return { ...state, clipboard: lane.cards.filter(c => toYank.has(c.id)) }
      }
      return { ...state, clipboard: [action.card] }
    }

    case 'PASTE_CARD': {
      if (state.clipboard.length === 0) return state
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes[state.activeLane]
      if (!lane) return state
      const now = Date.now()
      const newCards = state.clipboard.map((c, i) => ({ ...c, id: `k${now + i}` }))
      lane.cards.splice(state.activeCard + 1, 0, ...newCards)
      return { ...state, ...snap(state, prev), board: b, activeCard: state.activeCard + newCards.length }
    }

    case 'UNDO': {
      if (state.historyIndex < 0) return state
      const prev = state.history[state.historyIndex]
      return {
        ...state,
        board: clone(prev.board),
        activeLane: prev.activeLane,
        activeCard: prev.activeCard,
        historyIndex: state.historyIndex - 1,
        selectedIds: [],
        selectionMode: 'none',
        visualAnchor: null,
        preVisualIds: [],
      }
    }

    case 'TOGGLE_SELECT_CARD': {
      const lane = state.board!.lanes[state.activeLane]
      if (!lane) return state
      const card = lane.cards[state.activeCard]
      if (!card) return state
      const id = card.id
      const ids = state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id]
      return { ...state, selectedIds: ids, selectionMode: ids.length > 0 ? 'multi' : 'none', visualAnchor: null }
    }

    case 'START_VISUAL': {
      return { ...state, selectionMode: 'visual', visualAnchor: state.activeCard, preVisualIds: [...state.selectedIds], selectedIds: [state.board!.lanes[state.activeLane]?.cards[state.activeCard]?.id].filter(Boolean) }
    }

    case 'EXTEND_VISUAL': {
      const lane = state.board!.lanes[state.activeLane]
      if (!lane || state.visualAnchor === null) return state
      const a = Math.min(state.visualAnchor, state.activeCard)
      const b = Math.max(state.visualAnchor, state.activeCard)
      const rangeIds = lane.cards.slice(a, b + 1).map(c => c.id)
      const ids = [...new Set([...state.preVisualIds, ...rangeIds])]
      return { ...state, selectedIds: ids }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: [], selectionMode: 'none', visualAnchor: null, preVisualIds: [] }

    case 'MOVE_CARD_TO_TOP': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes[state.activeLane]
      if (!lane || state.activeCard === 0) return state
      const [card] = lane.cards.splice(state.activeCard, 1)
      lane.cards.unshift(card)
      return { ...state, ...snap(state, prev), board: b, activeCard: 0 }
    }

    case 'MOVE_CARD_TO_BOTTOM': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes[state.activeLane]
      if (!lane || state.activeCard === lane.cards.length - 1) return state
      const [card] = lane.cards.splice(state.activeCard, 1)
      lane.cards.push(card)
      return { ...state, ...snap(state, prev), board: b, activeCard: lane.cards.length - 1 }
    }

    case 'MOVE_CARD_TO_LANE': {
      const prev = state.board!
      const b = clone(prev)
      const srcLane = b.lanes[state.activeLane]
      const tgtLane = b.lanes[action.targetLaneIndex]
      if (!srcLane || !tgtLane || state.activeLane === action.targetLaneIndex) return state
      if (state.selectedIds.length > 0) {
        const toMove = new Set(state.selectedIds)
        const cards = srcLane.cards.filter(c => toMove.has(c.id))
        srcLane.cards = srcLane.cards.filter(c => !toMove.has(c.id))
        tgtLane.cards.push(...cards)
        return { ...state, ...snap(state, prev), board: b, activeLane: action.targetLaneIndex, activeCard: tgtLane.cards.length - 1 }
      }
      const [card] = srcLane.cards.splice(state.activeCard, 1)
      tgtLane.cards.push(card)
      return { ...state, ...snap(state, prev), board: b, activeLane: action.targetLaneIndex, activeCard: tgtLane.cards.length - 1 }
    }

    case 'SORT_CARDS': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes[state.activeLane]
      if (!lane) return state
      if (state.selectedIds.length > 0) {
        const toSort = new Set(state.selectedIds)
        const sorted = lane.cards.filter(c => toSort.has(c.id)).sort((a, b) => a.title.localeCompare(b.title))
        let si = 0
        const result = lane.cards.map(c => toSort.has(c.id) ? sorted[si++] : c)
        lane.cards = result
        return { ...state, ...snap(state, prev), board: b }
      }
      lane.cards.sort((a, b) => a.title.localeCompare(b.title))
      return { ...state, ...snap(state, prev), board: b }
    }

    case 'INCREMENT_NUMBER':
    case 'DECREMENT_NUMBER': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes[state.activeLane]
      if (!lane) return state
      const ids = state.selectedIds.length > 0 ? state.selectedIds : (lane.cards[state.activeCard] ? [lane.cards[state.activeCard].id] : [])
      if (ids.length === 0) return state
      const idSet = new Set(ids)
      const dir = action.type === 'INCREMENT_NUMBER' ? 1 : -1
      for (const c of lane.cards) {
        if (!idSet.has(c.id)) continue
        // find last number in title
        const m = c.title.match(/(\d+)/g)
        if (m) {
          const last = m[m.length - 1]
          const idx = c.title.lastIndexOf(last)
          const num = parseInt(last, 10) + dir
          c.title = c.title.slice(0, idx) + String(num) + c.title.slice(idx + last.length)
        }
      }
      return { ...state, ...snap(state, prev), board: b }
    }

    case 'MOVE_LANE_LEFT': {
      const prev = state.board!
      const b = clone(prev)
      const idx = state.activeLane
      if (idx <= 0) return state
      const [lane] = b.lanes.splice(idx, 1)
      b.lanes.splice(idx - 1, 0, lane)
      return { ...state, ...snap(state, prev), board: b, activeLane: idx - 1 }
    }

    case 'MOVE_LANE_RIGHT': {
      const prev = state.board!
      const b = clone(prev)
      const idx = state.activeLane
      if (idx >= b.lanes.length - 1) return state
      const [lane] = b.lanes.splice(idx, 1)
      b.lanes.splice(idx + 1, 0, lane)
      return { ...state, ...snap(state, prev), board: b, activeLane: idx + 1 }
    }

    case 'TOGGLE_LANE_FOLD': {
      const lane = state.board?.lanes[state.activeLane]
      if (!lane) return state
      const folded = state.foldedLanes.includes(lane.id)
      return { ...state, foldedLanes: folded ? state.foldedLanes.filter(id => id !== lane.id) : [...state.foldedLanes, lane.id] }
    }

    case 'FOLD_ALL_LANES': {
      if (!state.board) return state
      const allFolded = state.board.lanes.every(l => state.foldedLanes.includes(l.id))
      return { ...state, foldedLanes: allFolded ? [] : state.board.lanes.map(l => l.id) }
    }

    case 'MERGE_LANES': {
      const prev = state.board!
      const b = clone(prev)
      const srcLane = b.lanes[state.activeLane]
      const tgtLane = b.lanes[action.targetLaneIndex]
      if (!srcLane || !tgtLane || state.activeLane === action.targetLaneIndex) return state
      tgtLane.cards.push(...srcLane.cards)
      b.lanes.splice(state.activeLane, 1)
      const newActive = state.activeLane < action.targetLaneIndex ? action.targetLaneIndex - 1 : action.targetLaneIndex
      return { ...state, ...snap(state, prev), board: b, activeLane: Math.min(newActive, b.lanes.length - 1), activeCard: 0 }
    }

    case 'SEARCH_START':
      return { ...state, searchQuery: '', searchMatches: [], searchMatchIdx: -1 }

    case 'SEARCH_SET_MATCHES':
      return { ...state, searchQuery: action.query, searchMatches: action.matches, searchMatchIdx: action.matches.length > 0 ? 0 : -1 }

    case 'SEARCH_NEXT': {
      if (state.searchMatches.length === 0) return state
      const next = (state.searchMatchIdx + 1) % state.searchMatches.length
      const m = state.searchMatches[next]
      return { ...state, searchMatchIdx: next, activeLane: m.laneIndex, activeCard: m.cardIndex }
    }

    case 'SEARCH_PREV': {
      if (state.searchMatches.length === 0) return state
      const prev2 = (state.searchMatchIdx - 1 + state.searchMatches.length) % state.searchMatches.length
      const m2 = state.searchMatches[prev2]
      return { ...state, searchMatchIdx: prev2, activeLane: m2.laneIndex, activeCard: m2.cardIndex }
    }

    case 'MOVE_CARD_BY_ID': {
      const b2 = clone(state.board!)
      const srcLane = b2.lanes.find(l => l.id === action.sourceLaneId)
      const tgtLane = b2.lanes.find(l => l.id === action.targetLaneId)
      if (!srcLane || !tgtLane || action.sourceLaneId === action.targetLaneId) return state
      const idx = srcLane.cards.findIndex(c => c.id === action.cardId)
      if (idx === -1) return state

      if (state.selectedIds.length > 0 && state.selectedIds.includes(action.cardId)) {
        const toMove = new Set(state.selectedIds)
        const cards = srcLane.cards.filter(c => toMove.has(c.id))
        srcLane.cards = srcLane.cards.filter(c => !toMove.has(c.id))
        tgtLane.cards.push(...cards)
        return {
          ...state, ...snap(state, state.board!), board: b2,
          activeLane: b2.lanes.indexOf(tgtLane),
          activeCard: tgtLane.cards.length - 1,
          selectedIds: [], selectionMode: 'none',
        }
      }

      const [card] = srcLane.cards.splice(idx, 1)
      tgtLane.cards.push(card)
      return {
        ...state, ...snap(state, state.board!), board: b2,
        activeLane: b2.lanes.indexOf(tgtLane),
        activeCard: tgtLane.cards.length - 1,
      }
    }

    case 'SEARCH_DISMISS':
      return { ...state, searchQuery: null, searchMatches: [], searchMatchIdx: -1 }

    case 'ARCHIVE_CARD': {
      const prev = state.board!
      const b = clone(prev)
      const lane = b.lanes.find(l => l.id === action.laneId)
      if (!lane) return state
      if (state.selectedIds.length > 0) {
        const toArchive = new Set(state.selectedIds)
        const archived = lane.cards.filter(c => toArchive.has(c.id))
        lane.cards = lane.cards.filter(c => !toArchive.has(c.id))
        b.archivedCards.push(...archived)
        return { ...state, ...snap(state, prev), board: b, activeCard: Math.max(0, Math.min(state.activeCard, lane.cards.length - 1)), selectedIds: [], selectionMode: 'none', visualAnchor: null, preVisualIds: [] }
      }
      const idx = lane.cards.findIndex(c => c.id === action.cardId)
      if (idx === -1) return state
      const [archived] = lane.cards.splice(idx, 1)
      b.archivedCards.push(archived)
      return { ...state, ...snap(state, prev), board: b, activeCard: Math.max(0, Math.min(state.activeCard, lane.cards.length - 1)) }
    }

    case 'ARCHIVE_ALL_DONE': {
      const prev = state.board!
      const b = clone(prev)
      for (const lane of b.lanes) {
        const done = lane.cards.filter(c => c.status === 'done')
        b.archivedCards.push(...done)
        lane.cards = lane.cards.filter(c => c.status !== 'done')
      }
      return { ...state, ...snap(state, prev), board: b, activeCard: 0 }
    }

    case 'TOGGLE_ARCHIVE':
      return { ...state, showArchive: !state.showArchive }

    case 'HIDE_ARCHIVE':
      return { ...state, showArchive: false }

    case 'DELETE_FROM_ARCHIVE': {
      const b = clone(state.board!)
      b.archivedCards = b.archivedCards.filter(c => c.id !== action.cardId)
      return { ...state, board: b }
    }

    case 'COPY_FROM_ARCHIVE': {
      const card = state.board?.archivedCards.find(c => c.id === action.cardId)
      if (!card) return state
      return { ...state, clipboard: [{ ...card }] }
    }

    case 'MOVE_FROM_ARCHIVE_TO_LANE': {
      const b = clone(state.board!)
      const card = b.archivedCards.find(c => c.id === action.cardId)
      if (!card) return state
      const tgtLane = b.lanes[action.targetLane]
      if (!tgtLane) return state
      b.archivedCards = b.archivedCards.filter(c => c.id !== action.cardId)
      tgtLane.cards.push(card)
      return { ...state, board: b, activeLane: action.targetLane, activeCard: tgtLane.cards.length - 1 }
    }

    default:
      return state
  }
}

const Ctx = createContext<AppState>(initialState)
const Dtx = createContext<React.Dispatch<BoardAction>>(() => {})

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <Ctx.Provider value={state}>
      <Dtx.Provider value={dispatch}>{children}</Dtx.Provider>
    </Ctx.Provider>
  )
}

export const useBoardState = () => useContext(Ctx)
export const useBoardDispatch = () => useContext(Dtx)

// Exported for testing only
export { reducer, initialState }
