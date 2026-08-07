import { useState } from 'react'
import CounterBadge from './CounterBadge'

const THEMES = [
  { id: 'tokyo-night', label: 'Tokyo Night' },
  { id: 'tokyo-storm', label: 'Tokyo Storm' },
  { id: 'light', label: 'Light' },
]

const COUNTER_STYLES = [
  { id: 'pending', label: 'Pending only (3)' },
  { id: 'pending-total', label: 'Pending / Total (3/5)' },
  { id: 'done-total', label: 'Done / Total (2/5)' },
  { id: 'total', label: 'Total only (5)' },
]

interface SettingsProps {
  vaultPath: string
  theme: string
  cardCounter: string
  sessionRestore: boolean
  onSave: (settings: { vaultPath: string; theme: string; cardCounter: string; sessionRestore: boolean }) => void
  onClose: () => void
}

export default function Settings({ vaultPath, theme, cardCounter, sessionRestore, onSave, onClose }: SettingsProps) {
  const [path, setPath] = useState(vaultPath)
  const [selTheme, setSelTheme] = useState(theme)
  const [selCounter, setSelCounter] = useState(cardCounter)
  const [selSession, setSelSession] = useState(sessionRestore)

  async function pickFolder() {
    const picked = await window.api.pickVault()
    if (picked) setPath(picked)
  }

  function handleSave() {
    onSave({ vaultPath: path, theme: selTheme, cardCounter: selCounter, sessionRestore: selSession })
    onClose()
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
        <h2 className="settings-title">Settings</h2>

        <div className="settings-section">
          <h3 className="settings-section-title">General</h3>
          <label className="settings-label">Obsidian Vault Path</label>
          <div className="settings-row">
            <input
              className="settings-input"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="/path/to/obsidian/vault"
            />
            <button className="settings-btn" onClick={pickFolder}>Browse</button>
          </div>
          <div className="settings-row" style={{ paddingTop: '0.5rem' }}>
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={selSession}
                onChange={e => setSelSession(e.target.checked)}
              />
              {' '}Restore last board on startup
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Appearance</h3>
          <label className="settings-label">Theme</label>
          <div className="settings-options">
            {THEMES.map(t => (
              <label key={t.id} className={`settings-option ${selTheme === t.id ? 'settings-option--selected' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={selTheme === t.id}
                  onChange={() => setSelTheme(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Cards</h3>
          <label className="settings-label">Card counter style</label>
          <div className="settings-options">
            {COUNTER_STYLES.map(s => (
              <label key={s.id} className={`settings-option ${selCounter === s.id ? 'settings-option--selected' : ''}`}>
                <input
                  type="radio"
                  name="counter"
                  value={s.id}
                  checked={selCounter === s.id}
                  onChange={() => setSelCounter(s.id)}
                />
                {s.label}
              </label>
            ))}
          </div>

          <label className="settings-label">Counter preview</label>
          <div className="settings-preview">
            <div className="settings-preview-lane">
              <span className="settings-preview-title">Doing</span>
              <span className="lane-card-count"><CounterBadge style={selCounter as 'pending' | 'pending-total' | 'done-total' | 'total'} pending={3} total={5} /></span>
            </div>
            <div className="settings-legend">
              <span className="settings-legend-item"><span className="settings-legend-dot settings-legend-dot--red" /> not done (3)</span>
              <span className="settings-legend-item"><span className="settings-legend-dot settings-legend-dot--green" /> done (2)</span>
              <span className="settings-legend-item"><span className="settings-legend-dot settings-legend-dot--amber" /> total (5)</span>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="settings-btn settings-btn--secondary" onClick={onClose}>Cancel</button>
          <button className="settings-btn settings-btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}