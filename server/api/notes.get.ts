import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineEventHandler } from 'h3'
import yaml from 'yaml'
import type { AppConfig } from '~/config/loader'
import type { Note } from '~/notes/types'
import { createFilesystemStorage } from '~/storage/filesystem'
import type { NoteStorage } from '~/storage/types'

type ServerNotesConfig = Pick<AppConfig, 'applicationType' | 'vault'>

async function loadServerNotesConfig(): Promise<ServerNotesConfig> {
  const rawConfig = await readFile(
    resolve(process.cwd(), 'app/config/default.yaml'),
    'utf-8',
  )
  const parsed = yaml.parse(rawConfig) as Partial<ServerNotesConfig> | null

  if (parsed?.applicationType !== 'desktop') {
    throw new Error('Filesystem notes API requires desktop applicationType')
  }

  if (typeof parsed.vault !== 'string' || parsed.vault.length === 0) {
    throw new Error('Filesystem notes API requires a non-empty vault path')
  }

  return {
    applicationType: 'desktop',
    vault: parsed.vault,
  }
}

async function getFilesystemStorage(): Promise<NoteStorage> {
  const config = await loadServerNotesConfig()

  return createFilesystemStorage(config.vault)
}

export async function loadNotesResponse(
  storage?: NoteStorage,
): Promise<Note[]> {
  const resolvedStorage = storage ?? (await getFilesystemStorage())

  return resolvedStorage.loadNotes()
}

export default defineEventHandler(async () => {
  return loadNotesResponse()
})
