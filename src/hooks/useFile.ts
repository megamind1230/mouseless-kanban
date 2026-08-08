import { useState, useCallback, useEffect, useRef } from 'react'
import { useBoardState } from '../store'
import { serialize, formatFromPath } from '../core/parser'

export interface VaultFile {
  name: string
  relativePath: string
}

interface AppSettings {
  vaultPath: string
  lastBoardPath: string
  theme: string
  cardCounter: string
  sessionRestore: boolean
  zoomLevel: number
  foldedByPath: Record<string, string[]>
}

declare global {
  interface Window {
    api: {
      getSettings: () => Promise<AppSettings>
      saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>
      pickVault: () => Promise<string | null>
      openFile: () => Promise<{ filePath: string; content: string } | null>
      readFile: (filePath: string) => Promise<{ filePath: string; content: string } | null>
      saveFile: (filePath: string, content: string) => Promise<boolean>
      listVault: (vaultPath: string) => Promise<VaultFile[]>
      createInVault: (vaultPath: string, name: string) => Promise<{ filePath: string; content: string } | null>
      quit: () => Promise<void>
      zoomIn: () => Promise<void>
      zoomOut: () => Promise<void>
      zoomReset: () => Promise<void>
    }
  }
}

const AUTOSAVE_MS = 500

export function useFile() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [vaultPath, setVaultPath] = useState('')
  const [theme, setTheme] = useState('tokyo-night')
  const [cardCounter, setCardCounter] = useState('pending')
  const [sessionRestore, setSessionRestore] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [foldedByPath, setFoldedByPath] = useState<Record<string, string[]>>({})
  const { board, foldedLanes } = useBoardState()
  const savedRef = useRef<string>('')
  const filePathRef = useRef<string | null>(null)
  const boardRef = useRef(board)
  boardRef.current = board
  filePathRef.current = filePath

  useEffect(() => {
    window.api.getSettings().then(s => {
      setVaultPath(s.vaultPath)
      setTheme(s.theme)
      setCardCounter(s.cardCounter)
      setSessionRestore(s.sessionRestore)
      setFoldedByPath(s.foldedByPath || {})
      setSettingsLoaded(true)
      if (s.sessionRestore && s.lastBoardPath) {
        window.api.readFile(s.lastBoardPath).then(r => {
          if (r) {
            setFilePath(r.filePath)
            setContent(r.content)
            savedRef.current = r.content
            setDirty(false)
          }
        })
      }
    })
  }, [])

  const saveSettings = useCallback(async (s: Partial<AppSettings>) => {
    const current = await window.api.getSettings()
    const merged = { ...current, ...s }
    await window.api.saveSettings(merged)
    if (s.vaultPath !== undefined) setVaultPath(s.vaultPath)
    if (s.theme !== undefined) setTheme(s.theme)
    if (s.cardCounter !== undefined) setCardCounter(s.cardCounter)
    if (s.sessionRestore !== undefined) setSessionRestore(s.sessionRestore)
  }, [])

  // ponytail: stable save function — refs avoid stale closures
  const saveNow = useCallback(() => {
    const p = filePathRef.current
    const b = boardRef.current
    if (!p || !b) return
    const snap = serialize(b, formatFromPath(p))
    window.api.saveFile(p, snap)
    savedRef.current = snap
    setDirty(false)
  }, [])

  // Auto-save via setInterval (not useEffect cleanup — can't cancel a write already in flight)
  useEffect(() => {
    if (!board || !filePath) return
    const snap = serialize(board, formatFromPath(filePath))
    if (snap === savedRef.current) return
    setDirty(true)
    const t = setTimeout(() => {
      window.api.saveFile(filePath, snap)
      savedRef.current = snap
      setDirty(false)
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [board, filePath])

  // Persist folded lanes (by lane name) for the current board
  useEffect(() => {
    if (!filePath || !board || !settingsLoaded) return
    const foldedNames = board.lanes.filter(l => foldedLanes.includes(l.id)).map(l => l.name)
    if (JSON.stringify(foldedByPath[filePath] || []) === JSON.stringify(foldedNames)) return
    const next = { ...foldedByPath, [filePath]: foldedNames }
    setFoldedByPath(next)
    window.api.getSettings().then(current => {
      window.api.saveSettings({ ...current, foldedByPath: next })
    })
  }, [board, filePath, foldedLanes, foldedByPath, settingsLoaded])

  const persistLastBoard = useCallback(async (p: string) => {
    const current = await window.api.getSettings()
    if (current.lastBoardPath !== p) {
      await window.api.saveSettings({ ...current, lastBoardPath: p })
    }
  }, [])

  const openFile = useCallback(async () => {
    const r = await window.api.openFile()
    if (r) {
      setFilePath(r.filePath)
      setContent(r.content)
      savedRef.current = r.content
      setDirty(false)
      persistLastBoard(r.filePath)
    }
  }, [persistLastBoard])

  const openByPath = useCallback(async (fullPath: string) => {
    const r = await window.api.readFile(fullPath)
    if (r) {
      setFilePath(r.filePath)
      setContent(r.content)
      savedRef.current = r.content
      setDirty(false)
      persistLastBoard(r.filePath)
    }
  }, [persistLastBoard])

  return { filePath, content, dirty, vaultPath, theme, cardCounter, sessionRestore, foldedByPath, settingsLoaded, openFile, openByPath, saveNow, saveSettings }
}