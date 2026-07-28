import { useState, useEffect, useRef } from 'react'

interface PromptProps {
  title: string
  placeholder?: string
  onSubmit: (value: string) => void
  onClose: () => void
}

export default function Prompt({ title, placeholder, onSubmit, onClose }: PromptProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      onSubmit(value.trim())
    }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()}>
        <h2 className="settings-title">{title}</h2>
        <div className="settings-row" style={{ padding: '1rem' }}>
          <input
            ref={inputRef}
            className="settings-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        </div>
        <div className="settings-actions">
          <button className="settings-btn" onClick={onClose}>Cancel</button>
          <button className="settings-btn settings-btn--primary" onClick={() => value.trim() && onSubmit(value.trim())}>Create</button>
        </div>
      </div>
    </div>
  )
}
