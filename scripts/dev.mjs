import { spawn } from 'child_process'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: 'electron.vite.config.ts',
  root: '.'
})
await vite.listen()

const port = vite.config.server?.port || 5173
const url = `http://localhost:${port}`

const electronArgs = [
  'out/main/main.js',
  ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--in-process-gpu'] : []),
  `--app-url=${url}`
]

// ponytail: npx electron resolves the binary from node_modules
const electron = spawn('npx', ['electron', ...electronArgs], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RENDERER_URL: url }
})

electron.on('close', () => { vite.close(); process.exit() })
process.on('SIGINT', () => { electron.kill(); vite.close(); process.exit() })
