import { useState, useEffect, useRef, useMemo } from 'react'
import { useBoardState, useBoardDispatch } from '../store'
import type { SearchMatch } from '../core/types'

export default function SearchBar() {
  const { board, searchQuery, searchMatches, searchMatchIdx } = useBoardState()
  const dispatch = useBoardDispatch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => { inputRef.current?.focus() }, [])

  const matches = useMemo(() => {
    if (!draft || !board) return []
    const q = draft.toLowerCase()
    const result: SearchMatch[] = []
    for (let li = 0; li < board.lanes.length; li++) {
      const lane = board.lanes[li]
      for (let ci = 0; ci < lane.cards.length; ci++) {
        if (lane.cards[ci].title.toLowerCase().includes(q)) {
          result.push({ laneIndex: li, cardIndex: ci })
        }
      }
    }
    return result
  }, [draft, board])

  useEffect(() => {
    if (draft) {
      dispatch({ type: 'SEARCH_SET_MATCHES', query: draft, matches })
    }
  }, [draft, matches, dispatch])

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        dispatch({ type: 'SEARCH_DISMISS' })
        break
      case 'Enter':
        e.preventDefault()
        if (e.shiftKey) {
          dispatch({ type: 'SEARCH_PREV' })
        } else {
          dispatch({ type: 'SEARCH_NEXT' })
        }
        break
    }
  }

  if (searchQuery === null) return null

  return (
    <div className="search-bar">
      <span className="search-icon">/</span>
      <input
        ref={inputRef}
        className="search-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search cards..."
      />
      {searchMatches.length > 0 && (
        <span className="search-count">
          {searchMatchIdx + 1}/{searchMatches.length}
        </span>
      )}
      {draft && searchMatches.length === 0 && (
        <span className="search-count">No matches</span>
      )}
    </div>
  )
}
