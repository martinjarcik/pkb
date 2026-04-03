import { expect, type Page, type Route } from '@playwright/test'
import { moveNoteId } from '../../app/notes/noteId'
import { noteDescriptionFromContent } from '../../app/notes/noteDescriptionFromContent'
import { noteTitleFromId } from '../../app/notes/noteTitleFromId'
import type { Note, NoteProperties } from '../../app/notes/types'

const FIXED_TIMESTAMP = '2026-03-26T12:00:00.000Z'

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
): Promise<void> {
  let notes = [...initialNotes]

  await page.route('**/api/folders', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
      return
    }

    await route.fallback()
  })

  await page.route(
    (url) => {
      const pathname = new URL(url).pathname

      return pathname === '/api/notes' || pathname.startsWith('/api/notes/')
    },
    async (route: Route) => {
      const pathname = new URL(route.request().url()).pathname
      const method = route.request().method()

      if (pathname === '/api/notes/search') {
        const query = new URL(route.request().url()).searchParams.get('q') ?? ''
        const normalizedQuery = query.trim().toLocaleLowerCase()

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            normalizedQuery.length === 0
              ? []
              : notes
                  .filter((note) => {
                    const title = note.title.toLocaleLowerCase()
                    const content = note.content.toLocaleLowerCase()

                    return (
                      title.includes(normalizedQuery) ||
                      content.includes(normalizedQuery)
                    )
                  })
                  .map((note) => note.id),
          ),
        })
        return
      }

      if (pathname === '/api/notes' || pathname === '/api/notes/') {
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(notes),
          })
          return
        }

        if (method === 'PUT') {
          const body = route.request().postDataJSON() as {
            id: string
            content: string
            properties?: NoteProperties
          }
          const existingIndex = notes.findIndex((note) => note.id === body.id)

          if (existingIndex >= 0) {
            const previous = notes[existingIndex]!
            const properties = body.properties ?? {}
            const updated = {
              ...createMockNote(
                previous.id,
                body.content,
                FIXED_TIMESTAMP,
                properties,
              ),
              createdAt: previous.createdAt,
            }
            notes = notes.map((note, index) =>
              index === existingIndex ? updated : note,
            )
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(updated),
            })
          } else {
            const createdNote = createMockNote(
              body.id,
              body.content,
              FIXED_TIMESTAMP,
              body.properties,
            )
            notes = [createdNote, ...notes]
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(createdNote),
            })
          }
          return
        }

        if (method === 'PATCH') {
          const body = route.request().postDataJSON() as {
            id: string
            title: string
          }
          const noteIndex = notes.findIndex((note) => note.id === body.id)

          if (noteIndex >= 0) {
            const newId = `${body.title}.md`
            const renamedNote = {
              ...notes[noteIndex]!,
              id: newId,
              title: noteTitleFromId(newId),
              modifiedAt: FIXED_TIMESTAMP,
            }
            notes = notes.map((note, index) =>
              index === noteIndex ? renamedNote : note,
            )
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(renamedNote),
            })
            return
          }
        }

        await route.fallback()
        return
      }

      if (method === 'POST' && pathname === '/api/notes/trash') {
        const body = route.request().postDataJSON() as { id: string }
        const noteIndex = notes.findIndex((note) => note.id === body.id)

        if (noteIndex === -1) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ statusMessage: 'Note not found' }),
          })
          return
        }

        const trashedNote = {
          ...notes[noteIndex]!,
          trashedAt: FIXED_TIMESTAMP,
          modifiedAt: FIXED_TIMESTAMP,
        }

        notes = notes.map((note, index) =>
          index === noteIndex ? trashedNote : note,
        )
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(trashedNote),
        })
        return
      }

      if (method === 'POST' && pathname === '/api/notes/move') {
        const body = route.request().postDataJSON() as {
          id: string
          targetParentPath: string
        }
        const noteIndex = notes.findIndex((note) => note.id === body.id)

        if (noteIndex === -1) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ statusMessage: 'Note not found' }),
          })
          return
        }

        const nextId = moveNoteId(
          body.id,
          body.targetParentPath,
          notes.map((note) => note.id),
        )
        const source = notes[noteIndex]!
        const { trashedAt: _removedTrashed, ...rest } = source
        const movedNote = {
          ...rest,
          id: nextId,
          title: noteTitleFromId(nextId),
          modifiedAt: FIXED_TIMESTAMP,
        }

        notes = notes.map((note, index) =>
          index === noteIndex ? movedNote : note,
        )
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(movedNote),
        })
        return
      }

      if (method === 'GET') {
        const noteId = pathname
          .replace(/^\/api\/notes\//, '')
          .split('/')
          .map((segment) => decodeURIComponent(segment))
          .join('/')
        const note = notes.find((entry) => entry.id === noteId)

        if (!note) {
          await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ statusMessage: 'Note not found' }),
          })
          return
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(note),
        })
        return
      }

      await route.fallback()
    },
  )
}

export async function mockAppConfigApi(page: Page): Promise<void> {
  await page.route('**/api/app-config', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
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
      }),
    })
  })
}
