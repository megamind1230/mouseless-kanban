import { useState, useRef, useEffect } from 'react'
import { useBoardDispatch } from '../store'
import type { Card as CardType } from '../core/types'

interface CardProps {
  card: CardType
  isActive: boolean
  isSelected: boolean
  laneId: string
}

export default function Card({ card, isActive, isSelected, laneId }: CardProps) {
  const dispatch = useBoardDispatch()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(card.title)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Enter edit mode when 'i' is pressed on this card
  useEffect(() => {
    if (!isActive) { setEditing(false); return }
    const handler = (e: Event) => { setDraft((e as CustomEvent).detail?.replace ? '' : card.title); setEditing(true) }
    window.addEventListener('edit-card', handler)
    return () => window.removeEventListener('edit-card', handler)
  }, [isActive, card.title])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  function commitEdit() {
    setEditing(false)
    dispatch({ type: 'EDIT_CARD', laneId, cardId: card.id, title: draft })
  }

  if (editing) {
    return (
      <div className="card card--active card--editing">
        <textarea
          ref={inputRef}
          className="card-textarea"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.stopPropagation()
              commitEdit()
              return
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              commitEdit()
              return
            }
            // ponytail: stop all other keys from reaching global handler
            e.stopPropagation()
          }}
        />
      </div>
    )
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, laneId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`card ${isActive ? 'card--active' : ''} ${card.checked ? 'card--checked' : ''} ${isSelected ? 'card--selected' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => window.dispatchEvent(new Event('edit-card'))}
    >
      <span className={`card-checkbox ${card.checked ? 'card-checkbox--checked' : ''}`}></span>
      <span className="card-title">{card.title}</span>
    </div>
  )
}
