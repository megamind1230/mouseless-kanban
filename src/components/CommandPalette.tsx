import { useState, useEffect, useRef, useMemo } from 'react'
import { useBoardState, useBoardDispatch } from '../store'
import { commands, type Command } from '../core/commands'
import { fuzzyMatch } from '../core/fuzzy'

interface CommandPaletteProps {
  onClose: () => void
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dispatch = useBoardDispatch()
  const { board, activeLane, activeCard } = useBoardState()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = useMemo(() => {
    if (!query) return commands
    return commands.filter(c =>
      fuzzyMatch(query, c.label) ||
      fuzzyMatch(query, c.category) ||
      (c.shortcut && fuzzyMatch(query, c.shortcut))
    )
  }, [query])

  // Reset selection when filter changes
  useEffect(() => { setSelected(0) }, [query])

  function run(cmd: Command) {
    const lane = board?.lanes[activeLane]
    const card = lane?.cards[activeCard]
    cmd.action(dispatch, lane ?? null, card ?? null, activeCard)
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelected(s => Math.min(s + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[selected]) run(filtered[selected])
        break
    }
  }

  // Group by category for display
  let lastCategory = ''

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal cmd-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="picker-input"
          placeholder="Type a command..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="picker-list">
          {filtered.length === 0 && (
            <div className="picker-empty">No matching commands</div>
          )}
          {filtered.map((cmd, i) => {
            const showCategory = cmd.category !== lastCategory
            if (showCategory) lastCategory = cmd.category
            return (
              <div key={cmd.id}>
                {showCategory && (
                  <div className="cmd-category">{cmd.category}</div>
                )}
                <div
                  className={`picker-item ${i === selected ? 'picker-item--selected' : ''}`}
                  onClick={() => run(cmd)}
                >
                  <span className="cmd-label">{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="cmd-shortcut">{cmd.shortcut}</kbd>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
