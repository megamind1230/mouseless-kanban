import { describe, it, expect } from 'vitest'
import { reducer, initialState } from './store'
import type { Board, AppState } from './core/types'

function makeBoard(overrides?: Partial<Board>): Board {
  return {
    frontmatter: '---\nkanban-plugin: board\n---',
    preamble: [],
    lanes: [
      { id: 'l1', name: 'Todo', cards: [
        { id: 'c1', title: 'Card 1', status: 'todo' as const },
        { id: 'c2', title: 'Card 2', status: 'done' as const },
      ]},
      { id: 'l2', name: 'Done', cards: [
        { id: 'c3', title: 'Card 3', status: 'todo' as const },
      ]},
    ],
    settings: null,
    archivedCards: [],
    ...overrides,
  }
}

function stateWith(board: Board, overrides?: Partial<AppState>): AppState {
  return { ...initialState, board, ...overrides }
}

describe('reducer', () => {
  describe('SET_BOARD', () => {
    it('sets board and resets cursor', () => {
      const board = makeBoard()
      const result = reducer(initialState, { type: 'SET_BOARD', board })
      expect(result.board).toBe(board)
      expect(result.activeLane).toBe(0)
      expect(result.activeCard).toBe(0)
    })
  })

  describe('navigation', () => {
    it('SET_ACTIVE_LANE moves to lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'SET_ACTIVE_LANE', index: 1 })
      expect(result.activeLane).toBe(1)
      expect(result.activeCard).toBe(0) // resets card
    })

    it('SET_ACTIVE_CARD moves to card', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'SET_ACTIVE_CARD', index: 1 })
      expect(result.activeCard).toBe(1)
    })
  })

  describe('ADD_LANE', () => {
    it('adds a lane at the end', () => {
      const s = stateWith(makeBoard())
      const result = reducer(s, { type: 'ADD_LANE' })
      expect(result.board!.lanes).toHaveLength(3)
      expect(result.board!.lanes[2].name).toBe('New Lane')
      expect(result.activeLane).toBe(2)
    })
  })

  describe('RENAME_LANE', () => {
    it('renames a lane', () => {
      const s = stateWith(makeBoard())
      const result = reducer(s, { type: 'RENAME_LANE', laneId: 'l1', name: 'In Progress' })
      expect(result.board!.lanes[0].name).toBe('In Progress')
    })
  })

  describe('DELETE_LANE', () => {
    it('deletes a lane and adjusts cursor', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'DELETE_LANE', laneId: 'l1' })
      expect(result.board!.lanes).toHaveLength(1)
      expect(result.board!.lanes[0].name).toBe('Done')
      expect(result.activeLane).toBe(0)
    })

    it('clamps activeLane when deleting last lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 1 })
      const result = reducer(s, { type: 'DELETE_LANE', laneId: 'l2' })
      expect(result.board!.lanes).toHaveLength(1)
      expect(result.activeLane).toBe(0)
    })
  })

  describe('MOVE_LANE', () => {
    it('moves lane left', () => {
      const s = stateWith(makeBoard(), { activeLane: 1 })
      const result = reducer(s, { type: 'MOVE_LANE', laneId: 'l2', direction: 'left' })
      expect(result.board!.lanes[0].name).toBe('Done')
      expect(result.board!.lanes[1].name).toBe('Todo')
      expect(result.activeLane).toBe(0)
    })

    it('moves lane right', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'MOVE_LANE', laneId: 'l1', direction: 'right' })
      expect(result.board!.lanes[0].name).toBe('Done')
      expect(result.board!.lanes[1].name).toBe('Todo')
      expect(result.activeLane).toBe(1)
    })

    it('does nothing when moving left from first position', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'MOVE_LANE', laneId: 'l1', direction: 'left' })
      expect(result.board!.lanes[0].name).toBe('Todo')
    })

    it('does nothing when moving right from last position', () => {
      const s = stateWith(makeBoard(), { activeLane: 1 })
      const result = reducer(s, { type: 'MOVE_LANE', laneId: 'l2', direction: 'right' })
      expect(result.board!.lanes[1].name).toBe('Done')
    })
  })

  describe('ADD_CARD', () => {
    it('adds card at end of lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'ADD_CARD', laneId: 'l1', position: 'end' })
      expect(result.board!.lanes[0].cards).toHaveLength(3)
      expect(result.board!.lanes[0].cards[2].title).toBe('')
      expect(result.activeCard).toBe(2)
    })

    it('adds card below focused card', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'ADD_CARD', laneId: 'l1', position: 'below' })
      expect(result.board!.lanes[0].cards).toHaveLength(3)
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 1')
      expect(result.board!.lanes[0].cards[1].title).toBe('')
      expect(result.board!.lanes[0].cards[2].title).toBe('Card 2')
      expect(result.activeCard).toBe(1)
    })

    it('adds card above focused card', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1 })
      const result = reducer(s, { type: 'ADD_CARD', laneId: 'l1', position: 'above' })
      expect(result.board!.lanes[0].cards).toHaveLength(3)
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 1')
      expect(result.board!.lanes[0].cards[1].title).toBe('')
      expect(result.board!.lanes[0].cards[2].title).toBe('Card 2')
      expect(result.activeCard).toBe(1)
    })
  })

  describe('DELETE_CARD', () => {
    it('deletes a card and clamps cursor', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1 })
      const result = reducer(s, { type: 'DELETE_CARD', laneId: 'l1', cardId: 'c2' })
      expect(result.board!.lanes[0].cards).toHaveLength(1)
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 1')
      expect(result.activeCard).toBe(0)
    })
  })

  describe('EDIT_CARD', () => {
    it('updates card title', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'EDIT_CARD', laneId: 'l1', cardId: 'c1', title: 'Updated' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Updated')
    })
  })

  describe('TOGGLE_CARD', () => {
    it('toggles checkbox to done', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_CARD', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('done')
    })

    it('toggles a done card back to todo', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_CARD', laneId: 'l1', cardId: 'c2' })
      expect(result.board!.lanes[0].cards[1].status).toBe('todo')
    })

    it('marks an in-progress card done', () => {
      const board = makeBoard()
      board.lanes[0].cards[0].status = 'doing'
      const s = stateWith(board, { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_CARD', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('done')
    })
  })

  describe('TOGGLE_IN_PROGRESS', () => {
    it('marks a todo card in-progress', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_IN_PROGRESS', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('doing')
    })

    it('unmarks an in-progress card back to todo', () => {
      const board = makeBoard()
      board.lanes[0].cards[0].status = 'doing'
      const s = stateWith(board, { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_IN_PROGRESS', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('todo')
    })

    it('marks a done card in-progress', () => {
      const s = stateWith(makeBoard(), { activeLane: 0 })
      const result = reducer(s, { type: 'TOGGLE_IN_PROGRESS', laneId: 'l1', cardId: 'c2' })
      expect(result.board!.lanes[0].cards[1].status).toBe('doing')
    })

    it('toggles all selected cards', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'TOGGLE_IN_PROGRESS', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('doing')
      expect(result.board!.lanes[0].cards[1].status).toBe('doing')
    })
  })

  describe('YANK_CARD / PASTE_CARD', () => {
    it('copies and pastes a card', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const afterYank = reducer(s, { type: 'YANK_CARD', card: { ...s.board!.lanes[0].cards[0] } })
      expect(afterYank.clipboard[0].title).toBe('Card 1')

      const afterPaste = reducer(afterYank, { type: 'PASTE_CARD' })
      expect(afterPaste.board!.lanes[0].cards).toHaveLength(3)
      expect(afterPaste.board!.lanes[0].cards[1].title).toBe('Card 1')
      expect(afterPaste.activeCard).toBe(1)
    })
  })

  describe('MOVE_CARD', () => {
    it('moves card up', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1 })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'up' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 2')
      expect(result.board!.lanes[0].cards[1].title).toBe('Card 1')
      expect(result.activeCard).toBe(0)
    })

    it('moves card down', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'down' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 2')
      expect(result.board!.lanes[0].cards[1].title).toBe('Card 1')
    })

    it('moves card to previous lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 1, activeCard: 0 })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'prev-lane' })
      expect(result.board!.lanes[0].cards).toHaveLength(3)
      expect(result.board!.lanes[1].cards).toHaveLength(0)
      expect(result.activeLane).toBe(0)
    })

    it('moves card to next lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'next-lane' })
      expect(result.board!.lanes[0].cards).toHaveLength(1)
      expect(result.board!.lanes[1].cards).toHaveLength(2)
      expect(result.activeLane).toBe(1)
    })
  })

  describe('undo', () => {
    it('restores previous board and cursor', () => {
      const board = makeBoard()
      const s = stateWith(board, { activeLane: 0, activeCard: 0 })

      // Make a change
      const after = reducer(s, { type: 'ADD_CARD', laneId: 'l1', position: 'end' })
      expect(after.board!.lanes[0].cards).toHaveLength(3)
      expect(after.activeCard).toBe(2)
      expect(after.historyIndex).toBe(0)

      // Undo
      const undone = reducer(after, { type: 'UNDO' })
      expect(undone.board!.lanes[0].cards).toHaveLength(2)
      expect(undone.activeLane).toBe(0)
      expect(undone.activeCard).toBe(0)
      expect(undone.historyIndex).toBe(-1)
    })

    it('does nothing when history is empty', () => {
      const s = stateWith(makeBoard())
      const result = reducer(s, { type: 'UNDO' })
      expect(result).toBe(s) // same reference
    })
  })

  describe('mode', () => {
    it('ENTER_INSERT / ENTER_NORMAL toggle mode', () => {
      const s = stateWith(makeBoard())
      const insert = reducer(s, { type: 'ENTER_INSERT' })
      expect(insert.mode).toBe('insert')
      const normal = reducer(insert, { type: 'ENTER_NORMAL' })
      expect(normal.mode).toBe('normal')
    })
  })

  describe('ignores actions when no board', () => {
    it('returns state for non-SET_BOARD actions', () => {
      const result = reducer(initialState, { type: 'ADD_LANE' })
      expect(result).toBe(initialState)
    })
  })

  describe('TOGGLE_CARD with selection', () => {
    it('toggles all selected cards', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'TOGGLE_CARD', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards[0].status).toBe('done')
      expect(result.board!.lanes[0].cards[1].status).toBe('todo')
    })
  })

  describe('DELETE_CARD with selection', () => {
    it('deletes all selected cards and clears selection', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'DELETE_CARD', laneId: 'l1', cardId: 'c1' })
      expect(result.board!.lanes[0].cards).toHaveLength(0)
      expect(result.selectedIds).toEqual([])
      expect(result.selectionMode).toBe('none')
    })
  })

  describe('MOVE_CARD with selection', () => {
    it('moves selected cards up', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1, selectedIds: ['c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'up' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 2')
      expect(result.board!.lanes[0].cards[1].title).toBe('Card 1')
    })

    it('moves selected cards down', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'down' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Card 2')
      expect(result.board!.lanes[0].cards[1].title).toBe('Card 1')
    })

    it('moves selected cards to previous lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 1, activeCard: 0, selectedIds: ['c3'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'prev-lane' })
      expect(result.board!.lanes[0].cards).toHaveLength(3)
      expect(result.board!.lanes[1].cards).toHaveLength(0)
      expect(result.activeLane).toBe(0)
    })

    it('moves selected cards to next lane', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'MOVE_CARD', direction: 'next-lane' })
      expect(result.board!.lanes[0].cards).toHaveLength(1)
      expect(result.board!.lanes[1].cards).toHaveLength(2)
      expect(result.activeLane).toBe(1)
    })
  })

  describe('YANK_CARD with selection', () => {
    it('yanks all selected cards', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'YANK_CARD', card: { ...s.board!.lanes[0].cards[0] } })
      expect(result.clipboard).toHaveLength(2)
      expect(result.clipboard.map(c => c.title)).toEqual(['Card 1', 'Card 2'])
    })
  })

  describe('PASTE_CARD with multi-clipboard', () => {
    it('pastest multiple cards from clipboard', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, clipboard: [
        { id: 'p1', title: 'Paste 1', status: 'todo' as const },
        { id: 'p2', title: 'Paste 2', status: 'done' as const },
      ]})
      const result = reducer(s, { type: 'PASTE_CARD' })
      expect(result.board!.lanes[0].cards).toHaveLength(4)
      expect(result.board!.lanes[0].cards[1].title).toBe('Paste 1')
      expect(result.board!.lanes[0].cards[2].title).toBe('Paste 2')
      expect(result.activeCard).toBe(2)
    })
  })

  describe('TOGGLE_SELECT_CARD', () => {
    it('adds card to selection', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: [], selectionMode: 'none' })
      const result = reducer(s, { type: 'TOGGLE_SELECT_CARD' })
      expect(result.selectedIds).toContain('c1')
      expect(result.selectionMode).toBe('multi')
    })

    it('removes card from selection', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'TOGGLE_SELECT_CARD' })
      expect(result.selectedIds).not.toContain('c1')
      expect(result.selectedIds).toEqual(['c2'])
    })

    it('clears selection mode when last card deselected', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'TOGGLE_SELECT_CARD' })
      expect(result.selectedIds).toEqual([])
      expect(result.selectionMode).toBe('none')
    })
  })

  describe('START_VISUAL', () => {
    it('sets visual mode with anchor and initial selection', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1, selectedIds: [], selectionMode: 'none' })
      const result = reducer(s, { type: 'START_VISUAL' })
      expect(result.selectionMode).toBe('visual')
      expect(result.visualAnchor).toBe(1)
      expect(result.selectedIds).toContain('c2')
    })

    it('preserves previous multi-select IDs', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectedIds: ['c1'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'START_VISUAL' })
      expect(result.preVisualIds).toEqual(['c1'])
      expect(result.selectedIds).toContain('c1')
    })
  })

  describe('EXTEND_VISUAL', () => {
    it('selects range between anchor and active card', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectionMode: 'visual', visualAnchor: 0, selectedIds: ['c1'], preVisualIds: [] })
      const result = reducer({ ...s, activeCard: 1 }, { type: 'EXTEND_VISUAL' })
      expect(result.selectedIds).toContain('c1')
      expect(result.selectedIds).toContain('c2')
    })

    it('merges range with pre-visual selections', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 0, selectionMode: 'visual', visualAnchor: 1, selectedIds: ['c2'], preVisualIds: ['c1'] })
      const result = reducer(s, { type: 'EXTEND_VISUAL' })
      expect(result.selectedIds).toContain('c1')
      expect(result.selectedIds).toContain('c2')
    })

    it('selects reverse range (active before anchor)', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, activeCard: 1, selectionMode: 'visual', visualAnchor: 1, selectedIds: ['c2'], preVisualIds: [] })
      const result = reducer({ ...s, activeCard: 0 }, { type: 'EXTEND_VISUAL' })
      expect(result.selectedIds).toContain('c1')
      expect(result.selectedIds).toContain('c2')
    })
  })

  describe('CLEAR_SELECTION', () => {
    it('clears all selection state', () => {
      const s = stateWith(makeBoard(), { activeLane: 0, selectedIds: ['c1', 'c2'], selectionMode: 'visual', visualAnchor: 0, preVisualIds: ['c1'] })
      const result = reducer(s, { type: 'CLEAR_SELECTION' })
      expect(result.selectedIds).toEqual([])
      expect(result.selectionMode).toBe('none')
      expect(result.visualAnchor).toBeNull()
      expect(result.preVisualIds).toEqual([])
    })
  })

  describe('SORT_CARDS', () => {
    it('sorts all cards alphabetically when no selection', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Banana', status: 'todo' as const },
          { id: 'c2', title: 'Apple', status: 'todo' as const },
          { id: 'c3', title: 'Cherry', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'SORT_CARDS' })
      expect(result.board!.lanes[0].cards.map(c => c.title)).toEqual(['Apple', 'Banana', 'Cherry'])
    })

    it('sorts only selected cards in place', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Banana', status: 'todo' as const },
          { id: 'c2', title: 'Apple', status: 'todo' as const },
          { id: 'c3', title: 'Cherry', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c3'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'SORT_CARDS' })
      // c1 and c3 are selected: Banana, Cherry → sorted: Banana, Cherry (same order)
      // c2 is not selected and stays in position 1
      expect(result.board!.lanes[0].cards[0].title).toBe('Banana')
      expect(result.board!.lanes[0].cards[1].title).toBe('Apple')
      expect(result.board!.lanes[0].cards[2].title).toBe('Cherry')
    })

    it('sorts selected cards that need reordering', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Cherry', status: 'todo' as const },
          { id: 'c2', title: 'Middle', status: 'todo' as const },
          { id: 'c3', title: 'Apple', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c3'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'SORT_CARDS' })
      // selected: Cherry, Apple → sorted: Apple, Cherry
      expect(result.board!.lanes[0].cards[0].title).toBe('Apple')
      expect(result.board!.lanes[0].cards[1].title).toBe('Middle')
      expect(result.board!.lanes[0].cards[2].title).toBe('Cherry')
    })
  })

  describe('INCREMENT_NUMBER / DECREMENT_NUMBER', () => {
    it('increments last number in card title', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Task 3 of 10', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'INCREMENT_NUMBER' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Task 3 of 11')
    })

    it('decrements last number in card title', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Task 3 of 10', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'DECREMENT_NUMBER' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Task 3 of 9')
    })

    it('increments on all selected cards', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Item 1', status: 'todo' as const },
          { id: 'c2', title: 'Item 2', status: 'todo' as const },
          { id: 'c3', title: 'No number', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0, selectedIds: ['c1', 'c2'], selectionMode: 'multi' })
      const result = reducer(s, { type: 'INCREMENT_NUMBER' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Item 2')
      expect(result.board!.lanes[0].cards[1].title).toBe('Item 3')
      expect(result.board!.lanes[0].cards[2].title).toBe('No number')
    })

    it('does nothing when no numbers in title', () => {
      const board = {
        ...makeBoard(),
        lanes: [{ id: 'l1', name: 'Todo', cards: [
          { id: 'c1', title: 'Plain text', status: 'todo' as const },
        ]}],
      }
      const s = stateWith(board, { activeLane: 0, activeCard: 0 })
      const result = reducer(s, { type: 'INCREMENT_NUMBER' })
      expect(result.board!.lanes[0].cards[0].title).toBe('Plain text')
    })
  })
})
