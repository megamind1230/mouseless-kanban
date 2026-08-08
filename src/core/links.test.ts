import { describe, it, expect } from 'vitest'
import { extractUrl } from './links'

describe('extractUrl', () => {
  it('extracts a bare http URL', () => {
    expect(extractUrl('check https://example.com please')).toBe('https://example.com')
  })

  it('extracts a bare https URL at start of text', () => {
    expect(extractUrl('https://obsidian.md works')).toBe('https://obsidian.md')
  })

  it('extracts a markdown link', () => {
    expect(extractUrl('[Docs](https://docs.example.com/path)')).toBe('https://docs.example.com/path')
  })

  it('extracts an org link', () => {
    expect(extractUrl('[[https://org.example.com][title]]')).toBe('https://org.example.com')
  })

  it('returns the first URL when multiple exist', () => {
    expect(extractUrl('a https://first.com b https://second.com')).toBe('https://first.com')
  })

  it('returns null when no URL exists', () => {
    expect(extractUrl('no links here')).toBeNull()
  })

  it('returns null for empty text', () => {
    expect(extractUrl('')).toBeNull()
    expect(extractUrl(null as unknown as string)).toBeNull()
  })
})
