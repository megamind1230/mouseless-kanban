import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

const BOARD_PATH = '/vault/board.md'
const BOARD_MD = `---
kanban-plugin: board
---

## Todo

- [ ] Card 1

## In Progress

- [ ] Card 2

## Done

- [ ] Card 3
`

let saveSettings: ReturnType<typeof vi.fn>

function mockApi() {
  saveSettings = vi.fn().mockResolvedValue(true)
  window.api = {
    getSettings: vi.fn().mockResolvedValue({
      vaultPath: '/vault',
      lastBoardPath: BOARD_PATH,
      theme: 'tokyo-night',
      cardCounter: 'pending',
      sessionRestore: true,
      zoomLevel: 0,
      foldedByPath: { [BOARD_PATH]: ['Todo', 'Done'] },
    }),
    saveSettings,
    pickVault: vi.fn().mockResolvedValue(null),
    openFile: vi.fn().mockResolvedValue(null),
    readFile: vi.fn().mockResolvedValue({ filePath: BOARD_PATH, content: BOARD_MD }),
    saveFile: vi.fn().mockResolvedValue(true),
    listVault: vi.fn().mockResolvedValue([]),
    createInVault: vi.fn().mockResolvedValue(null),
    quit: vi.fn().mockResolvedValue(undefined),
    openExternal: vi.fn().mockResolvedValue(true),
    zoomIn: vi.fn().mockResolvedValue(undefined),
    zoomOut: vi.fn().mockResolvedValue(undefined),
    zoomReset: vi.fn().mockResolvedValue(undefined),
  } as unknown as typeof window.api
}

describe('folded lanes', () => {
  beforeEach(() => {
    mockApi()
  })

  it('restores saved folds and does not wipe the saved state on launch', async () => {
    render(<App />)

    await waitFor(() => {
      expect(document.querySelectorAll('.lane--folded')).toHaveLength(2)
    })

    const foldedTitles = Array.from(document.querySelectorAll('.lane--folded .lane-title')).map(el => el.textContent)
    expect(foldedTitles.sort()).toEqual(['Done', 'Todo'])

    // give any (buggy) settings writes a chance to fire, then assert none wiped the state
    await new Promise(r => setTimeout(r, 0))
    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('preserves per-lane scroll across fold and unfold', async () => {
    render(<App />)

    await waitFor(() => {
      expect(document.querySelector('.lane-cards')).toBeTruthy()
    })

    // unfold all (z then A) — mocked settings launch with two lanes folded;
    // z,A folds all first, then a second z,A unfolds everything
    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'A' })
    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'A' })
    await waitFor(() => {
      expect(document.querySelector('.lane--folded')).toBeFalsy()
    })

    const cards = document.querySelector('.lane-cards') as HTMLElement
    cards.scrollTop = 150
    fireEvent.scroll(cards)

    // fold active lane (z then a), then unfold (z then a again)
    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'a' })
    await waitFor(() => {
      expect(document.querySelector('.lane--folded')).toBeTruthy()
    })

    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'a' })
    await waitFor(() => {
      expect(document.querySelector('.lane-cards')).toBeTruthy()
    })

    const restored = document.querySelector('.lane-cards') as HTMLElement
    // jsdom zero rects make the scroll-into-view effect nudge by pad(8), so
    // assert the position was restored, not snapped back to the top
    expect(restored.scrollTop).not.toBe(0)
  })
})
