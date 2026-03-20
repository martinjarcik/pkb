import { readFile, mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFilesystemStorage } from '~/storage/filesystem'
import type { NoteStorage } from '~/storage/types'

describe('filesystemStorage', () => {
  let vaultPath: string
  let storage: NoteStorage

  beforeEach(async () => {
    vaultPath = await mkdtemp(join(tmpdir(), 'pkb-test-'))
    storage = createFilesystemStorage(vaultPath)
  })

  afterEach(async () => {
    await rm(vaultPath, { recursive: true, force: true })
  })

  it('saves a note as a markdown file with yaml frontmatter', async () => {
    await storage.saveNote({
      id: 'welcome.md',
      properties: { title: 'Welcome', published: true },
      content: '# Hello',
    })

    const written = await readFile(join(vaultPath, 'welcome.md'), 'utf-8')

    expect(written).toBe('---\ntitle: Welcome\npublished: true\n---\n# Hello')
  })
})
