import type { Dispatch } from 'react'
import type { BoardAction, Lane, Card } from '../core/types'

export interface Command {
  id: string
  label: string
  shortcut?: string
  category: string
  action: (dispatch: Dispatch<BoardAction>, lane: Lane | null, card: Card | null, activeCard?: number) => void
}

export const commands: Command[] = [
  // File
  {
    id: 'open',
    label: 'Open Board',
    shortcut: 'Ctrl+O',
    category: 'File',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'open' })),
  },

  {
    id: 'new-file',
    label: 'New Board in Vault',
    shortcut: 'Ctrl+Shift+N',
    category: 'File',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'new-file' })),
  },
  {
    id: 'settings',
    label: 'Settings',
    shortcut: 'Ctrl+,',
    category: 'File',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'settings' })),
  },
  {
    id: 'quit',
    label: 'Quit',
    shortcut: 'Ctrl+Q',
    category: 'File',
    action: () => window.api.quit(),
  },

  // Lane
  {
    id: 'add-lane',
    label: 'New Lane',
    shortcut: 'Ctrl+N',
    category: 'Lane',
    action: (d) => d({ type: 'ADD_LANE' }),
  },
  {
    id: 'rename-lane',
    label: 'Rename Lane',
    shortcut: 'r',
    category: 'Lane',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'rename-lane' })),
  },
  {
    id: 'lane-menu',
    label: 'Lane Menu',
    shortcut: 'e',
    category: 'Lane',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'lane-menu' })),
  },
  {
    id: 'move-lane-left',
    label: 'Move Lane Left',
    shortcut: 'Ctrl+H',
    category: 'Lane',
    action: (d) => d({ type: 'MOVE_LANE_LEFT' }),
  },
  {
    id: 'move-lane-right',
    label: 'Move Lane Right',
    shortcut: 'Ctrl+L',
    category: 'Lane',
    action: (d) => d({ type: 'MOVE_LANE_RIGHT' }),
  },
  {
    id: 'merge-lanes',
    label: 'Merge Lane Into...',
    category: 'Lane',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'merge-lanes' })),
  },
  {
    id: 'fold-lane',
    label: 'Toggle Fold Lane',
    shortcut: 'za',
    category: 'Lane',
    action: (d) => d({ type: 'TOGGLE_LANE_FOLD' }),
  },
  {
    id: 'fold-all',
    label: 'Fold / Unfold All Lanes',
    shortcut: 'zA',
    category: 'Lane',
    action: (d) => d({ type: 'FOLD_ALL_LANES' }),
  },

  {
    id: 'delete-lane',
    label: 'Delete Lane',
    category: 'Lane',
    action: (d, lane) => { if (lane) d({ type: 'DELETE_LANE', laneId: lane.id }) },
  },

  // Card
  {
    id: 'move-card-up',
    label: 'Move Card Up',
    shortcut: 'K',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD', direction: 'up' }),
  },
  {
    id: 'move-card-down',
    label: 'Move Card Down',
    shortcut: 'J',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD', direction: 'down' }),
  },
  {
    id: 'move-card-prev-lane',
    label: 'Move Card to Previous Lane',
    shortcut: 'H',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD', direction: 'prev-lane' }),
  },
  {
    id: 'move-card-next-lane',
    label: 'Move Card to Next Lane',
    shortcut: 'L',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD', direction: 'next-lane' }),
  },
  {
    id: 'sort-cards',
    label: 'Sort Cards Alphabetically',
    shortcut: '=',
    category: 'Card',
    action: (d) => d({ type: 'SORT_CARDS' }),
  },
  {
    id: 'increment-number',
    label: 'Increment Number in Title',
    shortcut: 'Ctrl+A',
    category: 'Card',
    action: (d) => d({ type: 'INCREMENT_NUMBER' }),
  },
  {
    id: 'decrement-number',
    label: 'Decrement Number in Title',
    shortcut: 'Ctrl+X',
    category: 'Card',
    action: (d) => d({ type: 'DECREMENT_NUMBER' }),
  },
  {
    id: 'jump-first-card',
    label: 'Jump to First Card',
    shortcut: 'gg',
    category: 'Card',
    action: (d, lane) => { if (lane) d({ type: 'SET_ACTIVE_CARD', index: 0 }) },
  },
  {
    id: 'jump-last-card',
    label: 'Jump to Last Card',
    shortcut: 'G',
    category: 'Card',
    action: (d, lane) => { if (lane) d({ type: 'SET_ACTIVE_CARD', index: lane.cards.length - 1 }) },
  },
  {
    id: 'half-page-down',
    label: 'Half-Page Down',
    shortcut: 'Ctrl+D',
    category: 'Card',
    action: (d, lane, _, activeCard) => { if (lane) d({ type: 'SET_ACTIVE_CARD', index: Math.min(lane.cards.length - 1, (activeCard ?? 0) + 5) }) },
  },
  {
    id: 'half-page-up',
    label: 'Half-Page Up',
    shortcut: 'Ctrl+U',
    category: 'Card',
    action: (d, _, __, activeCard) => d({ type: 'SET_ACTIVE_CARD', index: Math.max(0, (activeCard ?? 0) - 5) }),
  },
  {
    id: 'toggle-select-card',
    label: 'Toggle Card Selection',
    shortcut: 'Space',
    category: 'Card',
    action: (d) => d({ type: 'TOGGLE_SELECT_CARD' }),
  },
  {
    id: 'visual-mode',
    label: 'Visual Mode (range select)',
    shortcut: 'v',
    category: 'Card',
    action: (d) => d({ type: 'START_VISUAL' }),
  },
  {
    id: 'clear-selection',
    label: 'Clear Selection',
    shortcut: 'Esc',
    category: 'Card',
    action: (d) => d({ type: 'CLEAR_SELECTION' }),
  },
  {
    id: 'search-cards',
    label: 'Search Cards',
    shortcut: '/',
    category: 'Card',
    action: (d) => d({ type: 'SEARCH_START' }),
  },
  {
    id: 'edit-card',
    label: 'Edit Card',
    shortcut: 'i',
    category: 'Card',
    action: (_, lane, card) => { if (lane && card) document.dispatchEvent(new Event('edit-card')) },
  },
  {
    id: 'edit-card-replace',
    label: 'Edit Card (Replace)',
    shortcut: 'gi',
    category: 'Card',
    action: (_, lane, card) => { if (lane && card) document.dispatchEvent(new CustomEvent('edit-card', { detail: { replace: true } })) },
  },
  {
    id: 'add-card-below',
    label: 'New Card Below',
    shortcut: 'o',
    category: 'Card',
    action: (d, lane) => { if (lane) d({ type: 'ADD_CARD', laneId: lane.id, position: 'below' }) },
  },
  {
    id: 'add-card-above',
    label: 'New Card Above',
    shortcut: 'O',
    category: 'Card',
    action: (d, lane) => { if (lane) d({ type: 'ADD_CARD', laneId: lane.id, position: 'above' }) },
  },
  {
    id: 'toggle-card',
    label: 'Toggle Checkbox',
    shortcut: 'x',
    category: 'Card',
    action: (d, lane, card) => { if (lane && card) d({ type: 'TOGGLE_CARD', laneId: lane.id, cardId: card.id }) },
  },
  {
    id: 'delete-card',
    label: 'Delete Card',
    shortcut: 'dd',
    category: 'Card',
    action: (d, lane, card) => { if (lane && card) d({ type: 'DELETE_CARD', laneId: lane.id, cardId: card.id }) },
  },
  {
    id: 'paste-card',
    label: 'Paste Card',
    shortcut: 'p',
    category: 'Card',
    action: (d) => d({ type: 'PASTE_CARD' }),
  },
  {
    id: 'undo',
    label: 'Undo',
    shortcut: 'u',
    category: 'Card',
    action: (d) => d({ type: 'UNDO' }),
  },
  {
    id: 'move-card-to-top',
    label: 'Move Card to Top',
    shortcut: 'gt',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD_TO_TOP' }),
  },
  {
    id: 'move-card-to-bottom',
    label: 'Move Card to Bottom',
    shortcut: 'gb',
    category: 'Card',
    action: (d) => d({ type: 'MOVE_CARD_TO_BOTTOM' }),
  },
  {
    id: 'move-card-to-lane',
    label: 'Move Card to Lane...',
    category: 'Card',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'move-card-to-lane' })),
  },

  // View
  {
    id: 'shortcuts',
    label: 'Keyboard Shortcuts',
    shortcut: '?',
    category: 'View',
    action: () => document.dispatchEvent(new CustomEvent('cmd', { detail: 'shortcuts' })),
  },
  {
    id: 'archive-card',
    label: 'Archive Card',
    shortcut: 'ga',
    category: 'Card',
    action: (d, lane, card) => { if (lane && card) d({ type: 'ARCHIVE_CARD', laneId: lane.id, cardId: card.id }) },
  },
  {
    id: 'archive-all-done',
    label: 'Archive All Done',
    shortcut: 'gA',
    category: 'Card',
    action: (d) => d({ type: 'ARCHIVE_ALL_DONE' }),
  },
  {
    id: 'toggle-archive',
    label: 'Toggle Archive Panel',
    shortcut: 'Ctrl+`',
    category: 'View',
    action: (d) => d({ type: 'TOGGLE_ARCHIVE' }),
  },
]
