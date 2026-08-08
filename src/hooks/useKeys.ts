import { useEffect, useRef } from 'react'
import { useBoardState } from '../store'
import type { BoardAction } from '../core/types'
import { extractUrl } from '../core/links'

interface UseKeysProps {
  showPicker: boolean
  setShowPicker: (v: boolean) => void
  dispatch: React.Dispatch<BoardAction>
  setShowSettings: (v: boolean) => void
  showShortcuts: boolean
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>
  showCmdPalette: boolean
  setShowCmdPalette: React.Dispatch<React.SetStateAction<boolean>>
}

export function useKeys({ showPicker, setShowPicker, dispatch, setShowSettings, showShortcuts, setShowShortcuts, showCmdPalette, setShowCmdPalette }: UseKeysProps) {
  const state = useBoardState()
  const ref = useRef(state)
  ref.current = state

  const lastKey = useRef<string | null>(null)
  const lastTime = useRef(0)
  const doubleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDoubleTap = (k: string): boolean => {
    const now = Date.now()
    if (lastKey.current === k && now - lastTime.current < 500) {
      lastKey.current = null
      lastTime.current = 0
      if (doubleTimer.current) clearTimeout(doubleTimer.current)
      return true
    }
    lastKey.current = k
    lastTime.current = now
    if (doubleTimer.current) clearTimeout(doubleTimer.current)
    doubleTimer.current = setTimeout(() => { lastKey.current = null; lastTime.current = 0 }, 500)
    return false
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = ref.current

      const target = e.target as HTMLElement | null
      const isEditable = !!target && (
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' || target.isContentEditable
      )
      if (isEditable && e.key !== 'Escape') return

      if (e.key === '?' || e.key === 'F1') { e.preventDefault(); setShowShortcuts(v => !v); return }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); setShowCmdPalette(v => !v); return }
      if (e.ctrlKey && e.key === ',') { e.preventDefault(); setShowSettings(true); return }
      if (e.altKey && e.key.toLowerCase() === 'q') { e.preventDefault(); setShowPicker(true); return }
      if (e.ctrlKey && e.key === 'q') { e.preventDefault(); window.api.quit(); return }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); dispatch({ type: 'ADD_LANE' }); return }
      if (e.ctrlKey && e.code === 'Backquote') { e.preventDefault(); dispatch({ type: 'TOGGLE_ARCHIVE' }); return }

      if (e.key === 'Escape') {
        if (showCmdPalette) { e.preventDefault(); setShowCmdPalette(false); return }
        if (showShortcuts) { e.preventDefault(); setShowShortcuts(false); return }
        if (showPicker) { e.preventDefault(); setShowPicker(false); return }
      }

      if (showPicker || showShortcuts || showCmdPalette || !s.board) return
      if (s.showArchive) {
        if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'HIDE_ARCHIVE' }); return }
        if (e.ctrlKey && e.code === 'Backquote') { e.preventDefault(); dispatch({ type: 'TOGGLE_ARCHIVE' }); return }
        return
      }

      const lane = s.board.lanes[s.activeLane]
      const card = lane?.cards[s.activeCard]

      if (s.mode === 'insert') {
        if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'ENTER_NORMAL' }); return }
        return
      }

      if (s.searchQuery !== null) {
        if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'SEARCH_DISMISS' }); return }
        if (e.key === 'n' && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'SEARCH_NEXT' }); return }
        if (e.key === 'N' && !e.ctrlKey && e.shiftKey) { e.preventDefault(); dispatch({ type: 'SEARCH_PREV' }); return }
        return
      }

      // Prefix checks: last key was 'g' or 'z' within 500ms
      if (!e.ctrlKey && lastKey.current === 'z' && lastTime.current > 0 && Date.now() - lastTime.current < 500) {
        if (e.key === 'a') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'TOGGLE_LANE_FOLD' }); return }
        if (e.key === 'A') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'FOLD_ALL_LANES' }); return }
      }

      if (!e.ctrlKey && lastKey.current === 'g' && lastTime.current > 0 && Date.now() - lastTime.current < 500) {
        if (e.key === 'g') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'SET_ACTIVE_CARD', index: 0 }); return }
        if (!e.shiftKey && e.key === 'i') {
          if (lane && card) { e.preventDefault(); lastKey.current = null; window.dispatchEvent(new CustomEvent('edit-card', { detail: { replace: true } })) }
          return
        }
        if (!e.shiftKey && e.key === 't') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'MOVE_CARD_TO_TOP' }); return }
        if (!e.shiftKey && e.key === 'b') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'MOVE_CARD_TO_BOTTOM' }); return }
        if (!e.shiftKey && e.key === 'a') { e.preventDefault(); lastKey.current = null; if (lane && card) dispatch({ type: 'ARCHIVE_CARD', laneId: lane.id, cardId: card.id }); return }
        if (e.key === 'A') { e.preventDefault(); lastKey.current = null; dispatch({ type: 'ARCHIVE_ALL_DONE' }); return }
        if (!e.shiftKey && e.key === 'x') {
          e.preventDefault(); lastKey.current = null
          if (card) {
            const url = extractUrl(card.title)
            if (url) window.api.openExternal(url)
          }
          return
        }
      }

      // Lowercase = navigate
      if (!e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case 'h': e.preventDefault(); dispatch({ type: 'SET_ACTIVE_LANE', index: Math.max(0, s.activeLane - 1) }); return
          case 'l': e.preventDefault(); dispatch({ type: 'SET_ACTIVE_LANE', index: Math.min(s.board.lanes.length - 1, s.activeLane + 1) }); return
          case 'j': {
            e.preventDefault()
            if (lane) {
              dispatch({ type: 'SET_ACTIVE_CARD', index: Math.min(lane.cards.length - 1, s.activeCard + 1) })
              if (s.selectionMode === 'visual') dispatch({ type: 'EXTEND_VISUAL' })
            }
            return
          }
          case 'k': {
            e.preventDefault()
            dispatch({ type: 'SET_ACTIVE_CARD', index: Math.max(0, s.activeCard - 1) })
            if (s.selectionMode === 'visual') dispatch({ type: 'EXTEND_VISUAL' })
            return
          }
          case ' ': e.preventDefault(); dispatch({ type: 'TOGGLE_SELECT_CARD' }); return
          case 'v': e.preventDefault(); dispatch({ type: 'START_VISUAL' }); return
          case '/': e.preventDefault(); dispatch({ type: 'SEARCH_START' }); return
        }
      }

      // Ctrl combos (no shift)
      if (e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case 'd': e.preventDefault(); dispatch({ type: 'SET_ACTIVE_CARD', index: Math.min((lane?.cards.length ?? 1) - 1, s.activeCard + 5) }); return
          case 'u': e.preventDefault(); dispatch({ type: 'SET_ACTIVE_CARD', index: Math.max(0, s.activeCard - 5) }); return
          case 'a': e.preventDefault(); dispatch({ type: 'INCREMENT_NUMBER' }); return
          case 'x': e.preventDefault(); dispatch({ type: 'DECREMENT_NUMBER' }); return
          case 'l': e.preventDefault(); dispatch({ type: 'MOVE_LANE_RIGHT' }); return
          case 'h': e.preventDefault(); dispatch({ type: 'MOVE_LANE_LEFT' }); return
          case '=': e.preventDefault(); window.api.zoomIn(); return
          case '-': e.preventDefault(); window.api.zoomOut(); return
          case '0': e.preventDefault(); window.api.zoomReset(); return
        }
      }

      // Esc clears selection
      if (!e.ctrlKey && e.key === 'Escape' && s.selectionMode !== 'none') {
        e.preventDefault(); dispatch({ type: 'CLEAR_SELECTION' }); return
      }

      // Uppercase = move cards
      if (!e.ctrlKey && e.shiftKey && card) {
        switch (e.key) {
          case 'H': e.preventDefault(); dispatch({ type: 'MOVE_CARD', direction: 'prev-lane' }); return
          case 'L': e.preventDefault(); dispatch({ type: 'MOVE_CARD', direction: 'next-lane' }); return
          case 'J': e.preventDefault(); dispatch({ type: 'MOVE_CARD', direction: 'down' }); return
          case 'K': e.preventDefault(); dispatch({ type: 'MOVE_CARD', direction: 'up' }); return
          case 'G': e.preventDefault(); dispatch({ type: 'SET_ACTIVE_CARD', index: (lane?.cards.length ?? 1) - 1 }); return
        }
      }

      // Uppercase editing (shift required)
      if (!e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'I': {
            e.preventDefault()
            if (lane && card) {
              window.dispatchEvent(new Event('edit-card'))
            } else if (lane) {
              dispatch({ type: 'ADD_CARD', laneId: lane.id, position: 'end' })
            }
            return
          }
          case 'O': e.preventDefault(); if (lane) dispatch({ type: 'ADD_CARD', laneId: lane.id, position: 'above' }); return
        }
      }

      // Editing (no modifier)
      if (!e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case 'g': {
            isDoubleTap('g')
            return
          }
          case 'z': {
            isDoubleTap('z')
            return
          }
          case '1': case '2': case '3': case '4': case '5':
          case '6': case '7': case '8': case '9': {
            const idx = parseInt(e.key, 10) - 1
            if (idx < s.board.lanes.length) { e.preventDefault(); dispatch({ type: 'SET_ACTIVE_LANE', index: idx }) }
            return
          }
          case 'a':
          case 'i': {
            e.preventDefault()
            if (lane && card) {
              window.dispatchEvent(new Event('edit-card'))
            } else if (lane) {
              dispatch({ type: 'ADD_CARD', laneId: lane.id, position: 'end' })
            }
            return
          }
          case 'o': e.preventDefault(); if (lane) dispatch({ type: 'ADD_CARD', laneId: lane.id, position: 'below' }); return
          case 'x': e.preventDefault(); if (lane && card) dispatch({ type: 'TOGGLE_CARD', laneId: lane.id, cardId: card.id }); return
          case '-': e.preventDefault(); if (lane && card) dispatch({ type: 'TOGGLE_IN_PROGRESS', laneId: lane.id, cardId: card.id }); return
          case 'd': {
            if (s.selectedIds.length > 0) {
              e.preventDefault(); if (lane && card) dispatch({ type: 'DELETE_CARD', laneId: lane.id, cardId: card.id })
            } else if (isDoubleTap('d')) {
              e.preventDefault(); if (lane && card) dispatch({ type: 'DELETE_CARD', laneId: lane.id, cardId: card.id })
            }
            return
          }
          case 'y': {
            if (s.selectionMode !== 'none') {
              e.preventDefault(); if (card) dispatch({ type: 'YANK_CARD', card: { ...card } })
            } else if (isDoubleTap('y')) {
              e.preventDefault(); if (card) dispatch({ type: 'YANK_CARD', card: { ...card } })
            }
            return
          }
          case 'p': e.preventDefault(); dispatch({ type: 'PASTE_CARD' }); return
          case 'u': e.preventDefault(); dispatch({ type: 'UNDO' }); return
          case '=': e.preventDefault(); dispatch({ type: 'SORT_CARDS' }); return
          case 'r': e.preventDefault(); if (lane) window.dispatchEvent(new CustomEvent('rename-lane', { detail: { laneId: lane.id } })); return
          case 'e': e.preventDefault(); if (lane) window.dispatchEvent(new CustomEvent('lane-menu', { detail: { laneId: lane.id } })); return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [showPicker, setShowPicker, dispatch, setShowSettings, showShortcuts, setShowShortcuts, showCmdPalette, setShowCmdPalette])
}
