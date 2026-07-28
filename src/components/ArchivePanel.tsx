import { useState, useEffect, useRef } from 'react'
import { useBoardState, useBoardDispatch } from '../store'
import LanePicker from './LanePicker'

export default function ArchivePanel({ onClose }: { onClose: () => void }) {
  const { board, showArchive } = useBoardState()
  const dispatch = useBoardDispatch()
  const [selected, setSelected] = useState(0)
  const [showLanePicker, setShowLanePicker] = useState(false)
  const [moveCardId, setMoveCardId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cards = board?.archivedCards ?? []

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  useEffect(() => { setSelected(0) }, [cards.length])

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault(); dispatch({ type: 'HIDE_ARCHIVE' }); onClose(); break
      case 'ArrowDown':
      case 'j':
        e.preventDefault(); setSelected(s => Math.min(s + 1, cards.length - 1)); break
      case 'ArrowUp':
      case 'k':
        e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); break
      case 'd':
        e.preventDefault(); if (cards[selected]) dispatch({ type: 'DELETE_FROM_ARCHIVE', cardId: cards[selected].id }); break
      case 'y':
        e.preventDefault(); if (cards[selected]) dispatch({ type: 'COPY_FROM_ARCHIVE', cardId: cards[selected].id }); break
      case 'm':
        e.preventDefault(); if (cards[selected]) { setMoveCardId(cards[selected].id); setShowLanePicker(true) }; break
    }
  }

  if (showLanePicker && moveCardId && board) {
    return (
      <LanePicker
        lanes={board.lanes}
        activeLane={-1}
        onSelect={(laneIndex) => {
          dispatch({ type: 'MOVE_FROM_ARCHIVE_TO_LANE', cardId: moveCardId, targetLane: laneIndex })
          setShowLanePicker(false)
          setMoveCardId(null)
        }}
        onClose={() => { setShowLanePicker(false); setMoveCardId(null) }}
      />
    )
  }

  return (
    <div className="picker-overlay" onClick={() => { dispatch({ type: 'HIDE_ARCHIVE' }); onClose() }}>
      <div
        ref={panelRef}
        className="picker-modal archive-modal"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className="archive-header">
          <span className="archive-title">Archive ({cards.length})</span>
          <span className="archive-hint">j/k navigate &middot; d delete &middot; y copy &middot; m move to lane</span>
        </div>
        <div className="picker-list">
          {cards.length === 0 && (
            <div className="picker-empty">No archived cards</div>
          )}
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`picker-item ${i === selected ? 'picker-item--selected' : ''}`}
              onClick={() => setSelected(i)}
              onDoubleClick={() => { dispatch({ type: 'COPY_FROM_ARCHIVE', cardId: card.id }); setShowLanePicker(true); setMoveCardId(card.id) }}
            >
              <span className="archive-card-title">{card.checked ? '[x]' : '[ ]'} {card.title}</span>
              <span className="archive-card-actions">
                <button
                  className="archive-action-btn"
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_FROM_ARCHIVE', cardId: card.id }) }}
                  title="Delete permanently"
                >d</button>
                <button
                  className="archive-action-btn"
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'COPY_FROM_ARCHIVE', cardId: card.id }) }}
                  title="Copy to clipboard"
                >y</button>
                <button
                  className="archive-action-btn"
                  onClick={e => { e.stopPropagation(); setMoveCardId(card.id); setShowLanePicker(true) }}
                  title="Move to lane"
                >m</button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}