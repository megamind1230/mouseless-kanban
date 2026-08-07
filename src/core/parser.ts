import type { Board, Lane, Card } from './types'

let idCounter = 0
function genId(): string {
  return `k${Date.now().toString(36)}-${(idCounter++).toString(36)}`
}

export function parse(markdown: string): Board {
  const lines = markdown.split('\n')
  let frontmatter = ''
  let settings: Record<string, unknown> | null = null
  const lanes: Lane[] = []
  const archivedCards: Card[] = []
  const preamble: string[] = []
  let currentLane: Lane | null = null

  let inFrontmatter = false
  let frontmatterLines: string[] = []
  let inSettingsComment = false
  let settingsJson = ''
  let pastFrontmatter = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // YAML frontmatter detection
    if (line.trim() === '---' && !inFrontmatter && frontmatterLines.length === 0) {
      inFrontmatter = true
      frontmatterLines.push(line)
      continue
    }
    if (inFrontmatter) {
      frontmatterLines.push(line)
      if (line.trim() === '---' && frontmatterLines.length > 1) {
        inFrontmatter = false
        frontmatter = frontmatterLines.join('\n')
        pastFrontmatter = true
      }
      continue
    }

    // Settings comment: %% kanban:settings ... %%
    if (line.includes('%% kanban:settings')) {
      inSettingsComment = true
      settingsJson = line.replace(/.*%%\s*kanban:settings\s*/, '').replace(/\s*%%.*$/, '')
      if (line.includes('%%') && line.lastIndexOf('%%') > line.indexOf('%%')) {
        inSettingsComment = false
        try { settings = JSON.parse(settingsJson) } catch { /* skip */ }
      }
      continue
    }
    if (inSettingsComment) {
      settingsJson += line.replace(/\s*%%.*$/, '')
      if (line.includes('%%')) {
        inSettingsComment = false
        try { settings = JSON.parse(settingsJson) } catch { /* skip */ }
      }
      continue
    }

    // Lane heading: ## Name
    const laneMatch = line.match(/^## (.+)$/)
    if (laneMatch) {
      const name = laneMatch[1].trim()
      const isArchive = /^archive$/i.test(name)
      if (isArchive) {
        currentLane = { id: genId(), name, cards: [] }
      } else {
        currentLane = { id: genId(), name, cards: [] }
        lanes.push(currentLane)
      }
      continue
    }

    // Card: - [ ] / - [x] / - [~] / - [-]
    const cardMatch = line.match(/^(\s*)- \[([ xX~-])\] (.*)$/)
    if (cardMatch && currentLane) {
      const indent = cardMatch[1].length
      const titleParts: string[] = [cardMatch[3].trim()]
      // ponytail: collect indented continuation lines
      while (i + 1 < lines.length) {
        const next = lines[i + 1]
        const contMatch = next.match(/^(\s+)(.+)$/)
        if (contMatch && contMatch[1].length > indent && !next.match(/^\s*- \[[ xX~-]\]/) && !next.match(/^\s*## /)) {
          titleParts.push(contMatch[2].trim())
          i++
        } else {
          break
        }
      }
      const status = cardMatch[2] === 'x' || cardMatch[2] === 'X' ? 'done' :
        cardMatch[2] === '-' || cardMatch[2] === '~' ? 'doing' : 'todo'
      const card: Card = {
        id: genId(),
        title: titleParts.join('\n'),
        status
      }
      const isArchive = /^archive$/i.test(currentLane.name)
      if (isArchive) {
        archivedCards.push(card)
      } else {
        currentLane.cards.push(card)
      }
      continue
    }

    // Card without checkbox
    const plainCardMatch = line.match(/^- (.+)$/)
    if (plainCardMatch && currentLane) {
      const card: Card = {
        id: genId(),
        title: plainCardMatch[1].trim(),
        status: 'todo'
      }
      const isArchive = /^archive$/i.test(currentLane.name)
      if (isArchive) {
        archivedCards.push(card)
      } else {
        currentLane.cards.push(card)
      }
      continue
    }

    // ponytail: collect preamble lines (between frontmatter and first lane, or between lanes)
    if (pastFrontmatter && line.trim() !== '' && !currentLane) {
      preamble.push(line)
    }
  }

  return { frontmatter, preamble, lanes, settings, archivedCards }
}

export function serialize(board: Board): string {
  const parts: string[] = []

  // Frontmatter
  if (board.frontmatter) {
    parts.push(board.frontmatter)
  } else {
    parts.push('---\nkanban-plugin: board\n---')
  }

  // Preamble
  if (board.preamble.length > 0) {
    parts.push('')
    parts.push(...board.preamble)
  }

  // Lanes and cards
  for (const lane of board.lanes) {
    parts.push('')
    parts.push(`## ${lane.name}`)
    for (const card of lane.cards) {
      const checkbox = card.status === 'done' ? '[x]' : card.status === 'doing' ? '[-]' : '[ ]'
      if (card.title.includes('\n')) {
        parts.push(`- ${checkbox} ${card.title.split('\n')[0]}`)
        for (const line of card.title.split('\n').slice(1)) {
          parts.push(`  ${line}`)
        }
      } else {
        parts.push(`- ${checkbox} ${card.title}`)
      }
    }
  }

  // Settings
  if (board.settings) {
    parts.push('')
    parts.push(`%% kanban:settings ${JSON.stringify(board.settings)} %%`)
  }

  // Archive
  if (board.archivedCards && board.archivedCards.length > 0) {
    parts.push('')
    parts.push('## Archive')
    for (const card of board.archivedCards) {
      const checkbox = card.status === 'done' ? '[x]' : card.status === 'doing' ? '[-]' : '[ ]'
      if (card.title.includes('\n')) {
        parts.push(`- ${checkbox} ${card.title.split('\n')[0]}`)
        for (const line of card.title.split('\n').slice(1)) {
          parts.push(`  ${line}`)
        }
      } else {
        parts.push(`- ${checkbox} ${card.title}`)
      }
    }
  }

  parts.push('')
  return parts.join('\n')
}
