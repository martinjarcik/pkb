import yaml from 'yaml'
import type { NoteProperties, NotePropertyValue } from '~/notes/types'
import { NOTE_SYSTEM_PROPERTY_KEYS } from '~/notes/types'

const NOTE_SYSTEM_PROPERTY_KEY_SET = new Set<string>(NOTE_SYSTEM_PROPERTY_KEYS)
const MAX_PROPERTY_DEPTH = 10

function coercePropertyValue(
  value: unknown,
  depth: number = 0,
): NotePropertyValue {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value
  if (depth >= MAX_PROPERTY_DEPTH) return String(value)
  if (value instanceof Date) return value.toISOString()

  if (Array.isArray(value)) {
    return value.map((item) => coercePropertyValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        coercePropertyValue(val, depth + 1),
      ]),
    )
  }

  return String(value)
}

export function sanitizeProperties(value: unknown): NoteProperties {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !NOTE_SYSTEM_PROPERTY_KEY_SET.has(key))
      .map(([key, val]) => [key, coercePropertyValue(val)]),
  ) as NoteProperties
}

export function serializeDocument(
  properties: NoteProperties,
  content: string,
): string {
  const sanitizedProperties = sanitizeProperties(properties)

  if (Object.keys(sanitizedProperties).length === 0) {
    return content
  }

  const frontmatter = yaml.stringify(sanitizedProperties).trimEnd()

  return `---\n${frontmatter}\n---\n${content}`
}

export function parseDocument(raw: string): {
  properties: NoteProperties
  content: string
} {
  const document = raw.replace(/\r\n?/g, '\n')

  if (!document.startsWith('---\n')) {
    return { properties: {}, content: document }
  }

  const closingIndex = document.indexOf('\n---\n', 4)

  if (closingIndex === -1) {
    return { properties: {}, content: document }
  }

  const content = document.slice(closingIndex + 5)

  try {
    const rawFrontmatter = document.slice(4, closingIndex)
    const parsed = yaml.parse(rawFrontmatter)

    return {
      properties: sanitizeProperties(parsed),
      content,
    }
  } catch {
    return { properties: {}, content }
  }
}

export function truncateUtf8ByteLength(text: string, maxBytes: number): string {
  if (maxBytes <= 0 || text.length === 0) {
    return ''
  }

  const encoder = new TextEncoder()
  let result = ''
  let byteLength = 0

  for (const character of text) {
    const characterByteLength = encoder.encode(character).length

    if (byteLength + characterByteLength > maxBytes) {
      break
    }

    result += character
    byteLength += characterByteLength
  }

  return result
}
