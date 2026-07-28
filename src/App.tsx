import { useState, useEffect, useCallback } from 'react'
import { useBoardDispatch, useBoardState, BoardProvider } from './store'
import { parse } from './core/parser'
import BoardView from './components/Board'
import StatusBar from './components/StatusBar'
import FuzzyPicker from './components/FuzzyPicker'
import Settings from './components/Settings'
import Prompt from './components/Prompt'
import Shortcuts from './components/Shortcuts'
import CommandPalette from './components/CommandPalette'
import LanePicker from './components/LanePicker'
import SearchBar from './components/SearchBar'
import ArchivePanel from './components/ArchivePanel'
import { useKeys } from './hooks/useKeys'
import { useFile } from './hooks/useFile'

export default function App() {
  return (
    <BoardProvider>
      <AppInner />
    </BoardProvider>
  )
}

function AppInner() {
  const [showPicker, setShowPicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNewPrompt, setShowNewPrompt] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [showLanePicker, setShowLanePicker] = useState(false)
  const [showMergePicker, setShowMergePicker] = useState(false)
  const { filePath, content, dirty, vaultPath, theme, cardCounter, sessionRestore, openFile, openByPath, saveSettings } = useFile()
  const dispatch = useBoardDispatch()
  const { board, activeLane, searchQuery, showArchive } = useBoardState()

  useEffect(() => {
    if (content) {
      dispatch({ type: 'SET_BOARD', board: parse(content) })
    }
  }, [content, dispatch])

  // Handle commands dispatched from command palette
  useEffect(() => {
    const handler = (e: Event) => {
      const cmd = (e as CustomEvent).detail
      switch (cmd) {
        case 'open': setShowPicker(true); break
        case 'new-file': handleNewInVault(); break
        case 'settings': setShowSettings(true); break
        case 'shortcuts': setShowShortcuts(v => !v); break
        case 'move-card-to-lane': setShowLanePicker(true); break
        case 'merge-lanes': setShowMergePicker(true); break
        case 'rename-lane': {
          const lane = board?.lanes[activeLane]
          if (lane) window.dispatchEvent(new CustomEvent('rename-lane', { detail: { laneId: lane.id } }))
          break
        }
        case 'lane-menu': {
          const lane = board?.lanes[activeLane]
          if (lane) window.dispatchEvent(new CustomEvent('lane-menu', { detail: { laneId: lane.id } }))
          break
        }
      }
    }
    document.addEventListener('cmd', handler)
    return () => document.removeEventListener('cmd', handler)
  }, [board, activeLane])

  const handleNewInVault = useCallback(() => {
    if (!vaultPath) { setShowSettings(true); return }
    setShowNewPrompt(true)
  }, [vaultPath])

  const handleCreateFile = useCallback(async (name: string) => {
    setShowNewPrompt(false)
    if (!vaultPath) return
    const r = await window.api.createInVault(vaultPath, name)
    if (r) {
      openByPath(r.filePath)
      setShowPicker(false)
    }
  }, [vaultPath, openByPath])

  // Sync theme to body so body-level CSS vars work
  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  useKeys({ showPicker, setShowPicker, dispatch, setShowSettings, handleNewInVault, showShortcuts, setShowShortcuts, showCmdPalette, setShowCmdPalette })

  return (
    <div className={`app theme-${theme}`}>
      <div className="drag-bar" />
      {showSettings && (
        <Settings
          vaultPath={vaultPath}
          theme={theme}
          cardCounter={cardCounter}
          sessionRestore={sessionRestore}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showNewPrompt && (
        <Prompt
          title="New Kanban Board"
          placeholder="Board name"
          onSubmit={handleCreateFile}
          onClose={() => setShowNewPrompt(false)}
        />
      )}
      {showShortcuts && (
        <Shortcuts onClose={() => setShowShortcuts(false)} />
      )}
      {showCmdPalette && (
        <CommandPalette onClose={() => setShowCmdPalette(false)} />
      )}
      {showPicker && (
        <FuzzyPicker
          vaultPath={vaultPath}
          onSelect={(relPath) => {
            if (vaultPath) openByPath(vaultPath + '/' + relPath)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showLanePicker && board && (
        <LanePicker
          lanes={board.lanes}
          activeLane={activeLane}
          onSelect={(laneIndex) => {
            dispatch({ type: 'MOVE_CARD_TO_LANE', targetLaneIndex: laneIndex })
            setShowLanePicker(false)
          }}
          onClose={() => setShowLanePicker(false)}
        />
      )}
      {showMergePicker && board && (
        <LanePicker
          lanes={board.lanes}
          activeLane={activeLane}
          onSelect={(laneIndex) => {
            dispatch({ type: 'MERGE_LANES', targetLaneIndex: laneIndex })
            setShowMergePicker(false)
          }}
          onClose={() => setShowMergePicker(false)}
        />
      )}
      {searchQuery !== null && <SearchBar />}
      {board ? (
        <BoardView counterStyle={cardCounter as 'pending' | 'pending-total' | 'total'} />
      ) : (
        <div className="empty-state">
          <p>No file open</p>
          <p className="hint">Ctrl+P for command palette</p>
          <p className="hint">Ctrl+O to open a kanban board</p>
          {!vaultPath && <p className="hint">Ctrl+, to set vault path</p>}
        </div>
      )}
      {showArchive && (
        <ArchivePanel onClose={() => dispatch({ type: 'HIDE_ARCHIVE' })} />
      )}
      <StatusBar filePath={filePath} dirty={dirty} />
    </div>
  )
}