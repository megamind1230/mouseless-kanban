import { useState, useEffect, useRef } from 'react'
import type { VaultFile } from '../hooks/useFile'
import { fuzzyMatch } from '../core/fuzzy'

interface FuzzyPickerProps {
  vaultPath: string
  onSelect: (fullPath: string) => void
  onClose: () => void
}

export default function FuzzyPicker({ vaultPath, onSelect, onClose }: FuzzyPickerProps) {
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<VaultFile[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (vaultPath) {
      window.api.listVault(vaultPath).then(setFiles)
    }
  }, [vaultPath])

  const filtered = files.filter(f =>
    fuzzyMatch(query, f.name) || fuzzyMatch(query, f.relativePath)
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
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
        if (filtered[selected]) {
          onSelect(filtered[selected].relativePath)
        }
        break
    }
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="picker-input"
          placeholder={vaultPath ? 'Search kanban boards...' : 'No vault configured — press Esc'}
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(0) }}
          onKeyDown={handleKeyDown}
        />
        <div className="picker-list">
          {!vaultPath && (
            <div className="picker-empty">Set vault path in settings (Ctrl+,)</div>
          )}
          {vaultPath && filtered.length === 0 && (
            <div className="picker-empty">
              {files.length === 0 ? 'No .md files in vault' : 'No matches'}
            </div>
          )}
          {filtered.map((f, i) => (
            <div
              key={f.relativePath}
              className={`picker-item ${i === selected ? 'picker-item--selected' : ''}`}
              onClick={() => onSelect(f.relativePath)}
            >
              <span className="picker-item-name">{f.name}</span>
              <span className="picker-item-path">{f.relativePath}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
