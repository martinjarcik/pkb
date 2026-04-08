import yaml from 'yaml'
import type { NoteProperties, NotePropertyValue } from '~/notes/types'
import {
  APPLICATION_PROPERTY_KEYS,
  NOTE_OBSOLETE_PROPERTY_KEYS,
  NOTE_SYSTEM_PROPERTY_KEYS,
} from '~/notes/types'

const NOTE_SYSTEM_PROPERTY_KEY_SET = new Set<string>(NOTE_SYSTEM_PROPERTY_KEYS)
const APPLICATION_PROPERTY_KEY_SET = new Set<string>(APPLICATION_PROPERTY_KEYS)
const NOTE_OBSOLETE_PROPERTY_KEY_SET = new Set<string>(
  NOTE_OBSOLETE_PROPERTY_KEYS,
)
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
      .filter(
        ([key]) =>
          !NOTE_SYSTEM_PROPERTY_KEY_SET.has(key) &&
          !NOTE_OBSOLETE_PROPERTY_KEY_SET.has(key),
      )
      .map(([key, val]) => [key, coercePropertyValue(val)]),
  ) as NoteProperties
}

function splitApplicationProperties(properties: NoteProperties): {
  userProperties: NoteProperties
  applicationProperties: NoteProperties
} {
  const userEntries: [string, NotePropertyValue][] = []
  const applicationEntries: [string, NotePropertyValue][] = []

  for (const [key, value] of Object.entries(properties)) {
    if (APPLICATION_PROPERTY_KEY_SET.has(key)) {
      applicationEntries.push([key, value as NotePropertyValue])
      continue
    }

    userEntries.push([key, value as NotePropertyValue])
  }

  return {
    userProperties: Object.fromEntries(userEntries),
    applicationProperties: Object.fromEntries(applicationEntries),
  }
}

function mergeApplicationProperties(value: unknown): NoteProperties {
  const sanitizedProperties = Object.fromEntries(
    Object.entries(sanitizeProperties(value)).filter(([key]) => key !== 'app'),
  ) as NoteProperties
  const appValue =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>).app
      : undefined

  if (
    typeof appValue !== 'object' ||
    appValue === null ||
    Array.isArray(appValue)
  ) {
    return sanitizedProperties
  }

  const applicationProperties = Object.fromEntries(
    Object.entries(sanitizeProperties(appValue)).filter(([key]) =>
      APPLICATION_PROPERTY_KEY_SET.has(key),
    ),
  ) as NoteProperties

  return {
    ...sanitizedProperties,
    ...applicationProperties,
  }
}

export function serializeDocument(
  properties: NoteProperties,
  content: string,
): string {
  const sanitizedProperties = sanitizeProperties(properties)
  const { userProperties, applicationProperties } =
    splitApplicationProperties(sanitizedProperties)
  const serializedProperties =
    Object.keys(applicationProperties).length === 0
      ? userProperties
      : {
          ...userProperties,
          app: applicationProperties,
        }

  if (Object.keys(serializedProperties).length === 0) {
    return content
  }

  const frontmatter = yaml.stringify(serializedProperties).trimEnd()

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
      properties: mergeApplicationProperties(parsed),
      content,
    }
  } catch {
    return { properties: {}, content }
  }
}
