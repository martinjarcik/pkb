import { expect, test } from '@playwright/test'
import { createMockNote, mockNotesApi, waitForEditorReady } from './helpers'

test('webhook dialog saves URL and accent state follows application property', async ({
  page,
}) => {
  await mockNotesApi(page, [
    createMockNote('Hooked.md', '# H', '2026-03-26T12:00:00.000Z', {
      hasTasks: false,
    }),
  ])

  await page.goto('/')
  await expect(page.getByTestId('notes-list')).toBeVisible()
  await page.locator('[data-note-id="Hooked.md"]').click()
  await waitForEditorReady(page)

  const webhookBtn = page.getByTestId('note-webhook')

  await expect(webhookBtn).not.toHaveAttribute('data-has-webhook', 'true')

  await webhookBtn.click()
  await page
    .getByTestId('note-webhook-url-input')
    .fill('https://example.com/webhook')
  await page.getByTestId('note-webhook-save').click()

  await expect(webhookBtn).toHaveAttribute('data-has-webhook', 'true')

  await webhookBtn.click()
  await expect(page.getByTestId('note-webhook-url-input')).toHaveValue(
    'https://example.com/webhook',
  )
  await page.getByTestId('note-webhook-url-input').fill('')
  await page.getByTestId('note-webhook-save').click()

  await expect(webhookBtn).not.toHaveAttribute('data-has-webhook', 'true')
})
