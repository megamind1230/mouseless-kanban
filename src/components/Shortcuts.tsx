import { useEffect } from 'react'

interface ShortcutsProps {
  onClose: () => void
}

const sections = [
  {
    title: 'Navigation',
    shortcuts: [
      ['h', 'Move to previous lane'],
      ['l', 'Move to next lane'],
      ['k', 'Move to previous card'],
      ['j', 'Move to next card'],
      ['1-9', 'Jump to Nth lane'],
      ['gg', 'Jump to first card in lane'],
      ['G', 'Jump to last card in lane'],
      ['Ctrl+d', 'Half-page down'],
      ['Ctrl+u', 'Half-page up'],
    ]
  },
  {
    title: 'Move Cards',
    shortcuts: [
      ['H', 'Move card to previous lane'],
      ['L', 'Move card to next lane'],
      ['K', 'Move card up'],
      ['J', 'Move card down'],
    ]
  },
  {
    title: 'Lanes',
    shortcuts: [
      ['r', 'Rename lane'],
      ['e', 'Lane menu (rename, move, delete)'],
      ['Ctrl+N', 'New lane'],
      ['Ctrl+L', 'Move lane right'],
      ['Ctrl+H', 'Move lane left'],
      ['za', 'Toggle fold lane'],
      ['zA', 'Fold / unfold all lanes'],
    ]
  },
  {
    title: 'Editing',
    shortcuts: [
      ['i', 'Edit focused card (or create new card at end)'],
      ['a', 'Edit focused card (same as i)'],
      ['gi', 'Edit card (replace all text)'],
      ['o', 'New card below focused card'],
      ['O', 'New card above focused card'],
      ['Shift+Enter', 'New line while editing'],
      ['Enter', 'Finish editing'],
      ['Escape', 'Finish editing / deselect / close menu'],
      ['x', 'Toggle checkbox [ ] / [x]'],
      ['gx', 'Open link in card (default browser)'],
      ['-', 'Toggle in-progress [ ] / [-]'],
      ['dd', 'Delete card (double-tap d, or single d if selected)'],
      ['yy', 'Copy card (double-tap y)'],
      ['p', 'Paste card'],
      ['=', 'Sort selected cards alphabetically'],
      ['u', 'Undo'],
    ]
  },
  {
    title: 'Selection',
    shortcuts: [
      ['Space', 'Toggle card selection (multi-select)'],
      ['v', 'Enter visual mode (range select with j/k)'],
      ['Escape', 'Clear selection'],
      ['d / x / yy / p / H/J/K/L', 'Operate on all selected cards'],
      ['=', 'Sort selected cards alphabetically'],
      ['Ctrl+a / Ctrl+x', 'Increment / decrement number in card title'],
    ]
  },
  {
    title: 'File',
    shortcuts: [
      ['Alt+Q', 'Quick switcher: open or create board'],
      ['Ctrl+,', 'Settings'],
      ['Ctrl+Q', 'Quit'],
    ]
  },
  {
    title: 'Search',
    shortcuts: [
      ['/', 'Search cards'],
      ['n', 'Next search match'],
      ['N', 'Previous search match'],
      ['Esc', 'Close search'],
    ]
  },
  {
    title: 'General',
    shortcuts: [
      ['Ctrl+P', 'Command palette'],
      ['Ctrl+=', 'Zoom in'],
      ['Ctrl+-', 'Zoom out'],
      ['Ctrl+0', 'Reset zoom'],
      ['?', 'Show this help'],
      ['F1', 'Show this help'],
    ]
  }
]

export default function Shortcuts({ onClose }: ShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal shortcuts-modal" onClick={e => e.stopPropagation()}>
        <h2 className="settings-title">Keyboard Shortcuts</h2>
        <div className="shortcuts-body">
          {sections.map(section => (
            <div key={section.title} className="shortcuts-section">
              <h3 className="shortcuts-section-title">{section.title}</h3>
              {section.shortcuts.map(([key, desc]) => (
                <div key={key} className="shortcuts-row">
                  <kbd className="shortcuts-key">{key}</kbd>
                  <span className="shortcuts-desc">{desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="settings-actions">
          <button className="settings-btn settings-btn--primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
