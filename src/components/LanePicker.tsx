import { useState, useEffect, useRef } from 'react'
import type { Lane } from '../core/types'
import { fuzzyMatch } from '../core/fuzzy'

interface LanePickerProps {
  lanes: Lane[]
  activeLane: number
  onSelect: (laneIndex: number) => void
  onClose: () => void
}

export default function LanePicker({ lanes, activeLane, onSelect, onClose }: LanePickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = lanes
    .map((l, i) => ({ lane: l, index: i }))
    .filter(({ lane, index }) => index !== activeLane && (
      !query || fuzzyMatch(query, lane.name)
    ))

  useEffect(() => { setSelected(0) }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape': e.preventDefault(); onClose(); break
      case 'ArrowDown': e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); break
      case 'ArrowUp': e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); break
      case 'Enter':
        e.preventDefault()
        if (filtered[selected]) onSelect(filtered[selected].index)
        break
    }
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="picker-input"
          placeholder="Move card to lane..."
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(0) }}
          onKeyDown={handleKeyDown}
        />
        <div className="picker-list">
          {filtered.length === 0 && (
            <div className="picker-empty">{lanes.length <= 1 ? 'No other lanes' : 'No matches'}</div>
          )}
          {filtered.map(({ lane, index }, i) => (
            <div
              key={lane.id}
              className={`picker-item ${i === selected ? 'picker-item--selected' : ''}`}
              onClick={() => onSelect(index)}
            >
              <span className="picker-item-name">{lane.name}</span>
              <span className="picker-item-path">{lane.cards.length} cards</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
