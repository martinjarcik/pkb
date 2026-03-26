import { expect, test, type Page, type Route } from '@playwright/test'
import type { Note } from '~/notes/types'

const FIXED_TIMESTAMP = '2026-03-26T12:00:00.000Z'

function createMockNote(id: string, content: string): Note {
  return {
    id,
    content,
    createdAt: FIXED_TIMESTAMP,
    modifiedAt: FIXED_TIMESTAMP,
  }
}

function buildAppLayoutNotes(): Note[] {
  return [
    createMockNote('first-note.md', 'First paragraph.\n\nSecond paragraph.'),
    createMockNote('second-note.md', 'Second note body.'),
    createMockNote('heading-note.md', '## Heading two\n\nBody paragraph.'),
  ]
}

async function mockNotesApi(page: Page, initialNotes: Note[]): Promise<void> {
  let notes = [...initialNotes]

  await page.route('**/api/notes', async (route: Route) => {
    const method = route.request().method()

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
      }
      const noteIndex = notes.findIndex((note) => note.id === body.id)

      if (noteIndex >= 0) {
        notes = notes.map((note, index) =>
          index === noteIndex
            ? { ...note, content: body.content, modifiedAt: FIXED_TIMESTAMP }
            : note,
        )

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes[noteIndex]),
        })
        return
      }
    }

    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as {
        id: string
        title: string
      }
      const noteIndex = notes.findIndex((note) => note.id === body.id)

      if (noteIndex >= 0) {
        const renamedNote = {
          ...notes[noteIndex]!,
          id: `${body.title}.md`,
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
  })
}

async function waitForEditorReady(page: Page): Promise<void> {
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

function visiblePopoverItems(page: Page) {
  return page.locator('.ce-popover-item:visible')
}

async function openHeadingSettings(page: Page): Promise<void> {
  await page.locator('.ce-header').first().click()
  await page.locator('.ce-toolbar__settings-btn').first().click()
}

async function openHeadingNote(page: Page): Promise<void> {
  await page.goto('/')
  await page.locator('[data-note-id="heading-note.md"]').click()
  await waitForEditorReady(page)
}

test.beforeEach(async ({ page }) => {
  await mockNotesApi(page, buildAppLayoutNotes())
})

test('renders the default application layout', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('sidebar-panel')).toBeVisible()
  await expect(page.getByTestId('notes-list-panel')).toBeVisible()
  await expect(page.getByTestId('note-panel')).toBeVisible()
  await expect(page.getByTestId('inspector-panel')).toBeVisible()
})

test('renders loaded notes in the notes list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item').first()).toBeVisible()
})

test('selects the first loaded note in the list', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('notes-list-item').first()).toHaveAttribute(
    'data-selected',
    'true',
  )
})

test('renders the first loaded note in the Editor.js surface', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)
})

test('shows the selected note title block in the template', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  const noteTitle = page.getByTestId('note-title')
  const secondNote = page.getByTestId('notes-list-item').nth(1)

  await expect(noteTitle).toBeVisible()
  await expect(
    page.getByTestId('note-controls').getByTestId('note-title'),
  ).toHaveCount(0)

  await secondNote.click()

  await expect(noteTitle).toBeVisible()
})

test('hides editor chrome when the custom note title block is hovered and focused', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').hover()

  await expect(page.locator('.ce-toolbar:visible')).toHaveCount(0)
  await expect(page.locator('.ce-toolbox:visible')).toHaveCount(0)

  await page.getByTestId('note-title').click()

  await expect(page.locator('.ce-toolbar__settings-btn:visible')).toHaveCount(0)
  await expect(page.locator('.ce-inline-toolbar:visible')).toHaveCount(0)
})

test('does not keep title toolbar visible when another block gains focus', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.getByTestId('note-title').hover()
  await page
    .locator('.ce-paragraph')
    .first()
    .evaluate((element) => {
      ;(element as HTMLElement).focus()
    })

  await expect(page.locator('.ce-toolbar:visible')).toHaveCount(0)
  await expect(page.locator('.ce-toolbox:visible')).toHaveCount(0)
})

test('keeps the custom note title block first when moving the next block up', async ({
  page,
}) => {
  await page.goto('/')
  await waitForEditorReady(page)

  await page.locator('.ce-paragraph').first().click()
  await page.locator('.ce-toolbar__settings-btn').first().click()
  await visiblePopoverItems(page).filter({ hasText: 'Move up' }).click()

  await expect(
    page.locator('.ce-block').first().locator('[data-testid="note-title"]'),
  ).toHaveCount(1)
})

test('updates the active note when a different list row is clicked', async ({
  page,
}) => {
  await page.goto('/')

  await waitForEditorReady(page)

  const firstNote = page.getByTestId('notes-list-item').first()
  const secondNote = page.getByTestId('notes-list-item').nth(1)

  await secondNote.click()

  await expect(secondNote).toHaveAttribute('data-selected', 'true')
  await expect(firstNote).toHaveAttribute('data-selected', 'false')
  await expect(page.locator('.ce-block')).not.toHaveCount(0)
})

test('shows block conversion options for a heading block', async ({ page }) => {
  await openHeadingNote(page)

  await openHeadingSettings(page)

  await expect(visiblePopoverItems(page).first()).toBeVisible()
})

test('renders heading blocks with larger typography than paragraphs', async ({
  page,
}) => {
  await openHeadingNote(page)

  const heading = page.locator('.ce-header').first()
  const paragraph = page.locator('.ce-paragraph').first()

  const fontSizes = await page.evaluate(() => {
    const heading = document.querySelector(
      'h1.ce-header, h2.ce-header, h3.ce-header, h4.ce-header, h5.ce-header, h6.ce-header',
    )
    const paragraph = document.querySelector('.ce-paragraph')

    return {
      heading: heading
        ? Number.parseFloat(getComputedStyle(heading).fontSize)
        : 0,
      paragraph: paragraph
        ? Number.parseFloat(getComputedStyle(paragraph).fontSize)
        : 0,
    }
  })

  expect(fontSizes.heading).toBeGreaterThan(fontSizes.paragraph)
  await expect(heading).toBeVisible()
  await expect(paragraph).toBeVisible()
})

test('allows changing a heading block between levels', async ({ page }) => {
  await openHeadingNote(page)

  await openHeadingSettings(page)
  await page
    .locator('.ce-popover-item:visible')
    .filter({ hasText: 'Heading 2' })
    .nth(1)
    .click({ force: true })

  await expect(page.locator('h2.ce-header').first()).toBeVisible()
})

test('shows checklist only once in the block conversion menu', async ({
  page,
}) => {
  await openHeadingNote(page)

  await openHeadingSettings(page)

  await expect(
    page.locator('.ce-popover-item:visible').filter({ hasText: 'Checklist' }),
  ).toHaveCount(1)
})
