export interface Card {
  id: string
  title: string
  checked: boolean
}

export interface Lane {
  id: string
  name: string
  cards: Card[]
}

export interface Board {
  frontmatter: string
  preamble: string[]
  lanes: Lane[]
  settings: Record<string, unknown> | null
  archivedCards: Card[]
}

export type BoardAction =
  | { type: 'SET_BOARD'; board: Board }
  | { type: 'SET_ACTIVE_LANE'; index: number }
  | { type: 'SET_ACTIVE_CARD'; index: number }
  | { type: 'ENTER_INSERT' }
  | { type: 'ENTER_NORMAL' }
  | { type: 'ADD_LANE' }
  | { type: 'RENAME_LANE'; laneId: string; name: string }
  | { type: 'DELETE_LANE'; laneId: string }
  | { type: 'MOVE_LANE'; laneId: string; direction: 'left' | 'right' }
  | { type: 'MOVE_LANE_LEFT' }
  | { type: 'MOVE_LANE_RIGHT' }
  | { type: 'ADD_CARD'; laneId: string; position: 'end' | 'below' | 'above' }
  | { type: 'DELETE_CARD'; laneId: string; cardId: string }
  | { type: 'MOVE_CARD'; direction: 'up' | 'down' | 'prev-lane' | 'next-lane' }
  | { type: 'MOVE_CARD_TO_TOP' }
  | { type: 'MOVE_CARD_TO_BOTTOM' }
  | { type: 'MOVE_CARD_TO_LANE'; targetLaneIndex: number }
  | { type: 'SORT_CARDS' }
  | { type: 'INCREMENT_NUMBER' }
  | { type: 'DECREMENT_NUMBER' }
  | { type: 'TOGGLE_LANE_FOLD' }
  | { type: 'FOLD_ALL_LANES' }
  | { type: 'MERGE_LANES'; targetLaneIndex: number }
  | { type: 'TOGGLE_CARD'; laneId: string; cardId: string }
  | { type: 'EDIT_CARD'; laneId: string; cardId: string; title: string }
  | { type: 'YANK_CARD'; card: Card }
  | { type: 'PASTE_CARD' }
  | { type: 'UNDO' }
  | { type: 'TOGGLE_SELECT_CARD' }
  | { type: 'START_VISUAL' }
  | { type: 'EXTEND_VISUAL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SET_MATCHES'; query: string; matches: { laneIndex: number; cardIndex: number }[] }
  | { type: 'SEARCH_NEXT' }
  | { type: 'SEARCH_PREV' }
  | { type: 'SEARCH_DISMISS' }
  | { type: 'MOVE_CARD_BY_ID'; cardId: string; sourceLaneId: string; targetLaneId: string }
  | { type: 'ARCHIVE_CARD'; laneId: string; cardId: string }
  | { type: 'ARCHIVE_ALL_DONE' }
  | { type: 'TOGGLE_ARCHIVE' }
  | { type: 'HIDE_ARCHIVE' }
  | { type: 'DELETE_FROM_ARCHIVE'; cardId: string }
  | { type: 'COPY_FROM_ARCHIVE'; cardId: string }
  | { type: 'MOVE_FROM_ARCHIVE_TO_LANE'; cardId: string; targetLane: number }

export interface SearchMatch {
  laneIndex: number
  cardIndex: number
}

export interface AppState {
  board: Board | null
  activeLane: number
  activeCard: number
  mode: 'normal' | 'insert'
  clipboard: Card[]
  history: { board: Board; activeLane: number; activeCard: number }[]
  historyIndex: number
  selectedIds: string[]
  selectionMode: 'none' | 'multi' | 'visual'
  visualAnchor: number | null
  preVisualIds: string[]
  searchQuery: string | null
  searchMatches: SearchMatch[]
  searchMatchIdx: number
  foldedLanes: string[]
  showArchive: boolean
}
