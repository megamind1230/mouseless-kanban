import { describe, it, expect } from 'vitest'
import { parse, serialize, formatFromPath } from './parser'

const SAMPLE_MD = `---
kanban-plugin: board
---

## Todo

- [ ] Buy groceries
- [x] Write tests
- [ ] Multi-line card
  continued here

## Done

- [x] Setup project
- [x] Implement parser
`

describe('parse', () => {
  it('parses frontmatter', () => {
    const board = parse(SAMPLE_MD)
    expect(board.frontmatter).toContain('kanban-plugin: board')
  })

  it('parses lanes', () => {
    const board = parse(SAMPLE_MD)
    expect(board.lanes).toHaveLength(2)
    expect(board.lanes[0].name).toBe('Todo')
    expect(board.lanes[1].name).toBe('Done')
  })

  it('parses cards with checkboxes', () => {
    const board = parse(SAMPLE_MD)
    const todo = board.lanes[0]
    expect(todo.cards).toHaveLength(3)
    expect(todo.cards[0].title).toBe('Buy groceries')
    expect(todo.cards[0].status).toBe('todo')
    expect(todo.cards[1].title).toBe('Write tests')
    expect(todo.cards[1].status).toBe('done')
  })

  it('parses multi-line card content', () => {
    const board = parse(SAMPLE_MD)
    const card = board.lanes[0].cards[2]
    expect(card.title).toBe('Multi-line card\ncontinued here')
  })

  it('parses settings comment', () => {
    const md = `---
kanban-plugin: board
---

%% kanban:settings {"newNoteFolder":"inbox"} %%

## Lane

- [ ] card
`
    const board = parse(md)
    expect(board.settings).toEqual({ newNoteFolder: 'inbox' })
  })

  it('parses preamble lines', () => {
    const md = `---
kanban-plugin: board
---

Some preamble text here

## Lane

- [ ] card
`
    const board = parse(md)
    expect(board.preamble).toContain('Some preamble text here')
  })

  it('handles empty input', () => {
    const board = parse('')
    expect(board.lanes).toHaveLength(0)
    expect(board.frontmatter).toBe('')
  })

  it('handles cards without checkboxes', () => {
    const md = `---
kanban-plugin: board
---

## Lane

- plain card
`
    const board = parse(md)
    expect(board.lanes[0].cards[0].title).toBe('plain card')
    expect(board.lanes[0].cards[0].status).toBe('todo')
  })

  it('parses in-progress cards as - [-] and - [~]', () => {
    const md = `---
kanban-plugin: board
---

## Lane

- [-] working on it
- [~] also in progress
`
    const board = parse(md)
    expect(board.lanes[0].cards[0].status).toBe('doing')
    expect(board.lanes[0].cards[1].status).toBe('doing')
  })

  it('serializes in-progress cards as - [-]', () => {
    const md = `---
kanban-plugin: board
---

## Lane

- [~] task
`
    const board = parse(md)
    const out = serialize(board)
    expect(out).toContain('- [-] task')
  })
})

describe('serialize', () => {
  it('produces valid frontmatter', () => {
    const board = parse(SAMPLE_MD)
    const md = serialize(board)
    expect(md).toContain('---\nkanban-plugin: board\n---')
  })

  it('preserves lane names', () => {
    const board = parse(SAMPLE_MD)
    const md = serialize(board)
    expect(md).toContain('## Todo')
    expect(md).toContain('## Done')
  })

  it('preserves card titles', () => {
    const board = parse(SAMPLE_MD)
    const md = serialize(board)
    expect(md).toContain('- [ ] Buy groceries')
    expect(md).toContain('- [x] Write tests')
  })

  it('serializes multi-line cards with indentation', () => {
    const board = parse(SAMPLE_MD)
    const md = serialize(board)
    expect(md).toContain('- [ ] Multi-line card')
    expect(md).toContain('  continued here')
  })

  it('serializes settings', () => {
    const md = `---
kanban-plugin: board
---

%% kanban:settings {"newNoteFolder":"inbox"} %%

## Lane

- [ ] card
`
    const board = parse(md)
    const out = serialize(board)
    expect(out).toContain('%% kanban:settings')
    expect(out).toContain('newNoteFolder')
  })
})

describe('round-trip', () => {
  it('parse → serialize → parse preserves lanes', () => {
    const board1 = parse(SAMPLE_MD)
    const md = serialize(board1)
    const board2 = parse(md)

    expect(board2.lanes).toHaveLength(board1.lanes.length)
    expect(board2.lanes[0].name).toBe(board1.lanes[0].name)
    expect(board2.lanes[1].name).toBe(board1.lanes[1].name)
  })

  it('parse → serialize → parse preserves card count', () => {
    const board1 = parse(SAMPLE_MD)
    const md = serialize(board1)
    const board2 = parse(md)

    for (let i = 0; i < board1.lanes.length; i++) {
      expect(board2.lanes[i].cards).toHaveLength(board1.lanes[i].cards.length)
    }
  })

  it('parse → serialize → parse preserves card titles', () => {
    const board1 = parse(SAMPLE_MD)
    const md = serialize(board1)
    const board2 = parse(md)

    for (let i = 0; i < board1.lanes.length; i++) {
      for (let j = 0; j < board1.lanes[i].cards.length; j++) {
        expect(board2.lanes[i].cards[j].title).toBe(board1.lanes[i].cards[j].title)
        expect(board2.lanes[i].cards[j].status).toBe(board1.lanes[i].cards[j].status)
      }
    }
  })

  it('parse → serialize → parse preserves multi-line cards', () => {
    const board1 = parse(SAMPLE_MD)
    const md = serialize(board1)
    const board2 = parse(md)

    const card1 = board1.lanes[0].cards[2]
    const card2 = board2.lanes[0].cards[2]
    expect(card2.title).toBe(card1.title)
  })

  it('parse → serialize → parse preserves settings', () => {
    const board1 = parse(SAMPLE_MD)
    const md = serialize(board1)
    const board2 = parse(md)

    expect(board2.settings).toEqual(board1.settings)
  })

  it('serialize default board when no frontmatter', () => {
    const board = { frontmatter: '', preamble: [], lanes: [], settings: null, archivedCards: [] }
    const md = serialize(board)
    expect(md).toContain('kanban-plugin: board')
  })
})

describe('org format', () => {
  const SAMPLE_ORG = `** Todo

- [ ] Buy groceries
- [x] Write tests
- [~] In progress

** Done

- [x] Setup project
`

  it('parses ** lane headings', () => {
    const board = parse(SAMPLE_ORG)
    expect(board.lanes).toHaveLength(2)
    expect(board.lanes[0].name).toBe('Todo')
    expect(board.lanes[1].name).toBe('Done')
  })

  it('parses cards with statuses', () => {
    const board = parse(SAMPLE_ORG)
    expect(board.lanes[0].cards[0].status).toBe('todo')
    expect(board.lanes[0].cards[1].status).toBe('done')
    expect(board.lanes[0].cards[2].status).toBe('doing')
  })

  it('parses org settings comment', () => {
    const org = `** Lane

# kanban:settings {"newNoteFolder":"inbox"}

- [ ] card
`
    const board = parse(org)
    expect(board.settings).toEqual({ newNoteFolder: 'inbox' })
  })

  it('serializes org lanes with ** and no frontmatter', () => {
    const board = parse(SAMPLE_ORG)
    const out = serialize(board, 'org')
    expect(out).not.toContain('---')
    expect(out).not.toContain('kanban-plugin')
    expect(out).toContain('** Todo')
    expect(out).toContain('** Done')
    expect(out).toContain('- [x] Write tests')
  })

  it('serializes org settings as # comment', () => {
    const board = parse(SAMPLE_ORG)
    const withSettings = { ...board, settings: { newNoteFolder: 'inbox' } }
    const out = serialize(withSettings, 'org')
    expect(out).toContain('# kanban:settings {"newNoteFolder":"inbox"}')
    expect(out).not.toContain('%%')
  })

  it('round-trips org boards', () => {
    const board1 = parse(SAMPLE_ORG)
    const out = serialize(board1, 'org')
    const board2 = parse(out)
    expect(board2.lanes).toHaveLength(board1.lanes.length)
    for (let i = 0; i < board1.lanes.length; i++) {
      expect(board2.lanes[i].name).toBe(board1.lanes[i].name)
      expect(board2.lanes[i].cards).toHaveLength(board1.lanes[i].cards.length)
    }
  })

  it('formatFromPath detects org', () => {
    expect(formatFromPath('/vault/new.org')).toBe('org')
    expect(formatFromPath('/vault/new.md')).toBe('md')
    expect(formatFromPath('/vault/readme')).toBe('md')
    expect(formatFromPath(null)).toBe('md')
  })
})
