const URL_RE = /https?:\/\/[^\s)\]]+/g

export function extractUrl(text: string): string | null {
  if (!text) return null

  const markdown = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/)
  if (markdown) return markdown[1]

  const org = text.match(/\[\[(https?:\/\/[^\]\s]+)/)
  if (org) return org[1]

  const bare = text.match(URL_RE)
  return bare ? bare[0] : null
}
