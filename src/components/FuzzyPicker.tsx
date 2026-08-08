import { useState, useEffect, useRef } from 'react'
import type { VaultFile } from '../hooks/useFile'
import { fuzzyMatch } from '../core/fuzzy'

interface FuzzyPickerProps {
  vaultPath: string
  onSelect: (fullPath: string) => void
  onCreate?: (name: string) => void
  onClose: () => void
}

export default function FuzzyPicker({ vaultPath, onSelect, onCreate, onClose }: FuzzyPickerProps) {
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

  const candidate = (query.replace(/[/\\]/g, '_').trim() || '') + (query && /\.(md|org)$/i.test(query) ? '' : '.md')
  const candidateExists = files.some(f => f.relativePath.toLowerCase() === candidate.toLowerCase())
  const showCreate = Boolean(onCreate && vaultPath && query.trim() && !candidateExists)

  const itemCount = filtered.length + (showCreate ? 1 : 0)
  const sel = Math.min(selected, itemCount - 1)

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelected(s => Math.min(s + 1, itemCount - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
        break
      case 'Enter':
        if (sel < filtered.length) {
          onSelect(filtered[sel].relativePath)
        } else if (showCreate) {
          onCreate?.(candidate)
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
          {vaultPath && filtered.length === 0 && !showCreate && (
            <div className="picker-empty">
              {files.length === 0 ? 'No .md files in vault' : 'No matches'}
            </div>
          )}
          {filtered.map((f, i) => (
            <div
              key={f.relativePath}
              className={`picker-item ${i === sel ? 'picker-item--selected' : ''}`}
              onClick={() => onSelect(f.relativePath)}
            >
              <span className="picker-item-name">{f.name}</span>
              <span className="picker-item-path">{f.relativePath}</span>
            </div>
          ))}
          {showCreate && (
            <div
              className={`picker-item picker-item--create ${filtered.length === sel ? 'picker-item--selected' : ''}`}
              onClick={() => onCreate?.(candidate)}
            >
              <span className="picker-item-name">+ New Board: {candidate}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
