import { expect, type Page } from '@playwright/test'
import yaml from 'yaml'
import type { AppConfig } from '../../app/config/loader'
import type { WorkspaceMeta } from '../../app/config/parseMeta'
import { noteDescriptionFromContent } from '../../app/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '../../app/notes/noteTitleFromId'
import type { Note, NoteProperties } from '../../app/notes/types'
import {
  parseDocument,
  sanitizeProperties,
  serializeDocument,
} from '../../app/storage/document'

const FIXED_TIMESTAMP = '2026-03-26T12:00:00.000Z'
const DEFAULT_APP_CONFIG: AppConfig = {
  applicationType: 'desktop',
  locale: 'en',
  vault: './vault',
  notes: {
    trashRetentionDays: 30,
  },
  editor: {
    autosaveDelay: 2000,
    assetsFolder: 'assets',
  },
  layout: {
    showInspectorPanel: true,
    showSidebarPanel: true,
    showNotesListPanel: true,
  },
  theme: {
    accentColor: '#3f57dfff',
    defaultEditorColor: 'yellow',
  },
  editorColors: {
    red: {
      emoji: '🔴',
      background: '#F9EAE7',
      text: '#C0594E',
      label: 'Red',
    },
    pink: {
      emoji: '🩷',
      background: '#FCE3E6',
      text: '#EB445A',
      label: 'Pink',
    },
    mint: {
      emoji: '🟢',
      background: '#E6F6F4',
      text: '#5AC5B3',
      label: 'Mint',
    },
    yellow: {
      emoji: '🟡',
      background: '#F8F3DE',
      text: '#C39647',
      label: 'Yellow',
    },
    blue: {
      emoji: '🔵',
      background: '#E2EDFE',
      text: '#3B86F7',
      label: 'Blue',
    },
    orange: {
      emoji: '🟠',
      background: '#FDEFE3',
      text: '#F09343',
      label: 'Orange',
    },
    purple: {
      emoji: '🟣',
      background: '#F5E2F9',
      text: '#BB3ED9',
      label: 'Purple',
    },
    grey: {
      emoji: '⚪️',
      background: '#F0EFED',
      text: '#7C7A76',
      label: 'Grey',
    },
    brown: {
      emoji: '🟤',
      background: '#F4EDE9',
      text: '#99785E',
      label: 'Brown',
    },
  },
  features: {
    favorites: true,
    tasks: true,
    pinned: true,
    nonDistractionMode: true,
    noteWebhook: true,
  },
}

type MockNotesApiOptions = {
  appConfig?: AppConfig
  meta?: WorkspaceMeta
  readAllNotesDelayMs?: number
}

type ScopedTextFile = {
  content: string
  birthtime: string
  mtime: string
}

type MockNoteWriteBody = {
  dir: string
  path: string
  content: string
}

type MockNotesApiState = {
  getExplicitFolders: () => string[]
  getLastWriteBody: () => MockNoteWriteBody | null
  getNote: (id: string) => Note | undefined
  getNotes: () => Note[]
}

function cloneAppConfig(appConfig?: AppConfig): AppConfig {
  return structuredClone(appConfig ?? DEFAULT_APP_CONFIG)
}

function serializeScopedFile(content: string): ScopedTextFile {
  return {
    content,
    birthtime: FIXED_TIMESTAMP,
    mtime: FIXED_TIMESTAMP,
  }
}

function createPlatformNoteFile(note: Note) {
  return {
    path: note.id,
    content: serializeDocument(sanitizeProperties(note), note.content),
    birthtime: note.createdAt,
    mtime: note.modifiedAt,
  }
}

function createUpdatedNoteFromRaw(
  id: string,
  rawContent: string,
  createdAt: string,
): Note {
  const { properties, content } = parseDocument(rawContent)

  return {
    ...createMockNote(id, content, FIXED_TIMESTAMP, properties),
    createdAt,
  }
}

function renameFolderPath(
  id: string,
  oldPath: string,
  newPath: string,
): string {
  if (id === oldPath) {
    return newPath
  }

  if (!id.startsWith(`${oldPath}/`)) {
    return id
  }

  return `${newPath}/${id.slice(oldPath.length + 1)}`
}

async function installScopedFileRoutes(
  page: Page,
  state: {
    appConfigRaw: string
    metaRaw: string | null
    setAppConfigRaw: (content: string) => void
    setMetaRaw: (content: string) => void
  },
): Promise<void> {
  await page.route('**/api/fs/file?**', async (route) => {
    const url = new URL(route.request().url())

    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    const scope = url.searchParams.get('scope')

    if (scope === 'app-config') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(serializeScopedFile(state.appConfigRaw)),
      })
      return
    }

    if (scope === 'meta') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          state.metaRaw === null ? null : serializeScopedFile(state.metaRaw),
        ),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/fs/file', async (route) => {
    const method = route.request().method()

    if (method !== 'PUT') {
      await route.fallback()
      return
    }

    const body = route.request().postDataJSON() as {
      scope?: string
      content?: string
    }

    if (body.scope === 'app-config' && typeof body.content === 'string') {
      state.setAppConfigRaw(body.content)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(serializeScopedFile(body.content)),
      })
      return
    }

    if (body.scope === 'meta' && typeof body.content === 'string') {
      state.setMetaRaw(body.content)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(serializeScopedFile(body.content)),
      })
      return
    }

    await route.fallback()
  })
}

export function createMockNote(
  id: string,
  content: string = '',
  modifiedAt: string = FIXED_TIMESTAMP,
  properties: NoteProperties = {},
): Note {
  return {
    id,
    content,
    createdAt: modifiedAt,
    modifiedAt,
    ...properties,
    title: noteTitleFromId(id),
    description: noteDescriptionFromContent(content),
  }
}

export async function waitForEditorReady(page: Page): Promise<void> {
  await expect(page.getByTestId('note-editor-error')).toHaveCount(0, {
    timeout: 15000,
  })
  await expect(page.getByTestId('note-editor-loading')).toHaveCount(0, {
    timeout: 15000,
  })
  await expect(page.locator('.ce-block').first()).toBeVisible({
    timeout: 15000,
  })
}

export async function mockNotesApi(
  page: Page,
  initialNotes: Note[],
  options: MockNotesApiOptions = {},
): Promise<MockNotesApiState> {
  let notes = [...initialNotes]
  let explicitFolders: string[] = []
  let appConfigRaw = yaml.stringify(cloneAppConfig(options.appConfig))
  let metaRaw = options.meta ? yaml.stringify(options.meta) : null
  let lastWriteBody: MockNoteWriteBody | null = null

  await installScopedFileRoutes(page, {
    appConfigRaw,
    metaRaw,
    setAppConfigRaw(content: string) {
      appConfigRaw = content
    },
    setMetaRaw(content: string) {
      metaRaw = content
    },
  })

  await page.route('**/api/fs/files?**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }

    if (options.readAllNotesDelayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, options.readAllNotesDelayMs),
      )
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(notes.map(createPlatformNoteFile)),
    })
  })

  await page.route('**/api/fs/file?**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const scope = url.searchParams.get('scope')

    if (scope === 'app-config' || scope === 'meta') {
      await route.fallback()
      return
    }

    const path = url.searchParams.get('path')

    if (typeof path !== 'string' || path.length === 0) {
      await route.fallback()
      return
    }

    if (method === 'GET') {
      const note = notes.find((entry) => entry.id === path)

      await route.fulfill({
        status: note ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(
          note
            ? serializeScopedFile(
                serializeDocument(sanitizeProperties(note), note.content),
              )
            : { statusMessage: 'Note not found' },
        ),
      })
      return
    }

    if (method === 'DELETE') {
      notes = notes.filter((note) => note.id !== path)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
      return
    }

    await route.fallback()
  })

  await page.route('**/api/fs/file', async (route) => {
    const method = route.request().method()

    if (method !== 'PUT') {
      await route.fallback()
      return
    }

    const body = route.request().postDataJSON() as {
      scope?: string
      dir?: string
      path?: string
      content?: string
    }

    if (body.scope === 'app-config' || body.scope === 'meta') {
      await route.fallback()
      return
    }

    if (
      typeof body.dir !== 'string' ||
      typeof body.path !== 'string' ||
      typeof body.content !== 'string'
    ) {
      await route.fallback()
      return
    }

    const existing = notes.find((note) => note.id === body.path)
    const nextNote = createUpdatedNoteFromRaw(
      body.path,
      body.content,
      existing?.createdAt ?? FIXED_TIMESTAMP,
    )

    lastWriteBody = {
      dir: body.dir,
      path: body.path,
      content: body.content,
    }

    notes =
      existing === undefined
        ? [nextNote, ...notes]
        : notes.map((note) => (note.id === body.path ? nextNote : note))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(serializeScopedFile(body.content)),
    })
  })

  await page.route('**/api/fs/rename', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const body = route.request().postDataJSON() as {
      oldPath?: string
      newPath?: string
    }

    if (typeof body.oldPath !== 'string' || typeof body.newPath !== 'string') {
      await route.fallback()
      return
    }

    notes = notes.map((note) =>
      note.id === body.oldPath
        ? {
            ...note,
            id: body.newPath!,
            title: noteTitleFromId(body.newPath!),
            modifiedAt: FIXED_TIMESTAMP,
          }
        : note,
    )

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })

  await page.route('**/api/fs/dir', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const body = route.request().postDataJSON() as { path?: string }

    if (typeof body.path !== 'string') {
      await route.fallback()
      return
    }

    explicitFolders = Array.from(new Set([...explicitFolders, body.path]))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })

  await page.route('**/api/fs/rename-dir', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    const body = route.request().postDataJSON() as {
      oldPath?: string
      newPath?: string
    }

    if (typeof body.oldPath !== 'string' || typeof body.newPath !== 'string') {
      await route.fallback()
      return
    }

    explicitFolders = explicitFolders.map((folder) =>
      folder === body.oldPath ? body.newPath! : folder,
    )
    notes = notes.map((note) => {
      const nextId = renameFolderPath(note.id, body.oldPath!, body.newPath!)

      return nextId === note.id
        ? note
        : {
            ...note,
            id: nextId,
            title: noteTitleFromId(nextId),
            modifiedAt: FIXED_TIMESTAMP,
          }
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })

  await page.route('**/api/vault-assets/upload', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: 1,
        file: {
          url: '/api/vault-assets/assets/mock-upload.png',
        },
      }),
    })
  })

  await page.route('**/api/vault-assets/**', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ statusMessage: 'Asset not found' }),
    })
  })

  return {
    getExplicitFolders: () => [...explicitFolders],
    getLastWriteBody: () => lastWriteBody,
    getNote: (id: string) => notes.find((note) => note.id === id),
    getNotes: () => [...notes],
  }
}

export async function mockAppConfigApi(
  page: Page,
  appConfig: AppConfig = DEFAULT_APP_CONFIG,
): Promise<void> {
  let appConfigRaw = yaml.stringify(cloneAppConfig(appConfig))
  let metaRaw: string | null = null

  await installScopedFileRoutes(page, {
    appConfigRaw,
    metaRaw,
    setAppConfigRaw(content: string) {
      appConfigRaw = content
    },
    setMetaRaw(content: string) {
      metaRaw = content
    },
  })
}
