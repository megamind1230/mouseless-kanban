import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

if (process.platform === 'linux') {
  app.disableHardwareAcceleration()
}

let mainWindow: BrowserWindow | null = null

const LOG_DIR = path.join(process.env.HOME || '', 'magnus', 'mouseless-mindmap', 'logs')
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

interface AppSettings {
  vaultPath: string
  lastBoardPath: string
  theme: string
  cardCounter: string
  sessionRestore: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  vaultPath: '',
  lastBoardPath: '',
  theme: 'tokyo-night',
  cardCounter: 'pending',
  sessionRestore: true,
}

function loadSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function saveSettings(s: AppSettings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf-8')
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

function appendLog(msg: string) {
  ensureLogDir()
  const file = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`)
  fs.appendFileSync(file, `[${new Date().toISOString()}] ${msg}\n`)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Mouseless Mindmap',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    const appUrlArg = process.argv.find(a => a.startsWith('--app-url='))
    if (appUrlArg) {
      mainWindow.loadURL(appUrlArg.split('=')[1])
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }

  appendLog('Window created')
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  appendLog('All windows closed')
  if (process.platform !== 'darwin') app.quit()
})

// --- IPC Handlers ---

function registerIpcHandlers() {
  // Settings
  ipcMain.handle('settings:get', () => loadSettings())

  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    saveSettings(settings)
    appendLog('Settings saved')
    return true
  })

  ipcMain.handle('settings:pick-vault', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Obsidian Vault'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // File open (system dialog fallback)
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    appendLog(`Opened: ${filePath}`)
    return { filePath, content }
  })

  // File save
  ipcMain.handle('file:save', async (_event, filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8')
    appendLog(`Saved: ${filePath}`)
    return true
  })

  // Read file by path (for vault picker)
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    return { filePath, content }
  })

  // List .md files in vault (recursive)
  ipcMain.handle('files:list-vault', async (_event, vaultPath: string) => {
    if (!vaultPath || !fs.existsSync(vaultPath)) return []
    const results: { name: string; relativePath: string }[] = []

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          // skip hidden dirs and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
          walk(full)
        } else if (entry.name.endsWith('.md')) {
          results.push({
            name: entry.name,
            relativePath: path.relative(vaultPath, full),
          })
        }
      }
    }

    walk(vaultPath)
    appendLog(`Listed ${results.length} files in vault`)
    return results
  })

  // Create new kanban board in vault
  ipcMain.handle('file:create-in-vault', async (_event, vaultPath: string, name: string) => {
    if (!vaultPath) return null
    const safeName = name.replace(/[/\\]/g, '_').replace(/\.md$/, '') || 'Untitled Board'
    const filePath = path.join(vaultPath, `${safeName}.md`)

    if (fs.existsSync(filePath)) return { filePath, content: fs.readFileSync(filePath, 'utf-8') }

    const content = [
      '---',
      'kanban-plugin: board',
      '---',
      '',
      '## Todo',
      '',
    ].join('\n')

    fs.writeFileSync(filePath, content, 'utf-8')
    appendLog(`Created in vault: ${filePath}`)
    return { filePath, content }
  })

  ipcMain.handle('app:quit', () => {
    appendLog('Quit requested')
    app.quit()
  })

  // Zoom
  ipcMain.handle('zoom:in', () => {
    if (mainWindow) {
      const current = mainWindow.webContents.getZoomLevel()
      mainWindow.webContents.setZoomLevel(current + 0.5)
    }
  })

  ipcMain.handle('zoom:out', () => {
    if (mainWindow) {
      const current = mainWindow.webContents.getZoomLevel()
      mainWindow.webContents.setZoomLevel(current - 0.5)
    }
  })

  ipcMain.handle('zoom:reset', () => {
    if (mainWindow) mainWindow.webContents.setZoomLevel(0)
  })
}
