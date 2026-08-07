import { useState, useRef, useEffect } from 'react'
import { useBoardState, useBoardDispatch } from '../store'
import Card from './Card'
import CounterBadge from './CounterBadge'
import LaneMenu from './LaneMenu'
import type { Lane as LaneType } from '../core/types'

interface LaneProps {
  lane: LaneType
  isActive: boolean
  counterStyle?: 'pending' | 'pending-total' | 'done-total' | 'total'
}

export default function Lane({ lane, isActive, counterStyle = 'pending' }: LaneProps) {
  const { activeCard, selectedIds, foldedLanes } = useBoardState()
  const dispatch = useBoardDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(lane.name)
  const [showMenu, setShowMenu] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const laneCardsRef = useRef<HTMLDivElement>(null)
  const folded = foldedLanes.includes(lane.id)

  const pendingCount = lane.cards.filter(c => c.status !== 'done').length
  const totalCount = lane.cards.length

  // Scroll active card into view (vertical) when navigating with j/k etc.
  useEffect(() => {
    if (!isActive) return
    const container = laneCardsRef.current
    const activeEl = container?.querySelector('.card--active')
    if (!container || !activeEl) return
    const pad = 8
    const cr = container.getBoundingClientRect()
    const ar = (activeEl as HTMLElement).getBoundingClientRect()
    if (ar.top < cr.top + pad) {
      container.scrollTop -= cr.top + pad - ar.top
    } else if (ar.bottom > cr.bottom - pad) {
      container.scrollTop += ar.bottom - (cr.bottom - pad)
    }
  }, [activeCard, isActive])

  // Rename handling
  useEffect(() => {
    if (!isActive) { setEditing(false); return }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.laneId === lane.id) {
        setDraft(lane.name)
        setEditing(true)
      }
    }
    window.addEventListener('rename-lane', handler)
    return () => window.removeEventListener('rename-lane', handler)
  }, [isActive, lane.id, lane.name])

  // Lane menu handling
  useEffect(() => {
    if (!isActive) { setShowMenu(false); return }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.laneId === lane.id) setShowMenu(true)
    }
    window.addEventListener('lane-menu', handler)
    return () => window.removeEventListener('lane-menu', handler)
  }, [isActive, lane.id])

  // Esc closes menu
  useEffect(() => {
    if (!showMenu) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setShowMenu(false) }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [showMenu])

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  function commit() {
    setEditing(false)
    const name = draft.trim()
    if (name && name !== lane.name) {
      dispatch({ type: 'RENAME_LANE', laneId: lane.id, name })
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.cardId && data.laneId && data.laneId !== lane.id) {
        dispatch({ type: 'MOVE_CARD_BY_ID', cardId: data.cardId, sourceLaneId: data.laneId, targetLaneId: lane.id })
      }
    } catch { /* ignore malformed data */ }
  }

  return (
    <div
      className={`lane ${isActive ? 'lane--active' : ''} ${folded ? 'lane--folded' : ''} ${dragOver ? 'lane--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="lane-header-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit() }
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEditing(false) }
            e.stopPropagation()
          }}
        />
      ) : (
        <div className="lane-header" onClick={() => folded && dispatch({ type: 'TOGGLE_LANE_FOLD' })}>
          <span className="lane-title">{lane.name}</span>
          <span className="lane-card-count"><CounterBadge style={counterStyle} pending={pendingCount} total={totalCount} /></span>
        </div>
      )}
      {showMenu && (
        <LaneMenu
          laneId={lane.id}
          onClose={() => setShowMenu(false)}
          onRename={() => { setShowMenu(false); setDraft(lane.name); setEditing(true) }}
        />
      )}
      {!folded && (
        <div className="lane-cards" ref={laneCardsRef}>
          {lane.cards.map((card, i) => (
            <Card
              key={card.id}
              card={card}
              isActive={isActive && i === activeCard}
              isSelected={selectedIds.includes(card.id)}
              laneId={lane.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
