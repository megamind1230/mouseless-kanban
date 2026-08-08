import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: { vaultPath: string }) => ipcRenderer.invoke('settings:save', settings),
  pickVault: () => ipcRenderer.invoke('settings:pick-vault'),

  // Files
  openFile: () => ipcRenderer.invoke('file:open'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('file:save', filePath, content),
  listVault: (vaultPath: string) => ipcRenderer.invoke('files:list-vault', vaultPath),
  createInVault: (vaultPath: string, name: string) => ipcRenderer.invoke('file:create-in-vault', vaultPath, name),

  // App
  quit: () => ipcRenderer.invoke('app:quit'),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // Zoom
  zoomIn: () => ipcRenderer.invoke('zoom:in'),
  zoomOut: () => ipcRenderer.invoke('zoom:out'),
  zoomReset: () => ipcRenderer.invoke('zoom:reset'),
})
