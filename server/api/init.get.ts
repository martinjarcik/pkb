import { defineEventHandler } from 'h3'
import type { WorkspaceMeta } from '~/config/parseMeta'
import type { NoteCatalogRow } from '~/notes/types'
import type { AppConfig } from '~/config/loader'
import { getServerNoteStorage } from '../getServerNoteStorage'
import { loadNotesResponse } from './notes.get'
import { readAppConfigFromDisk } from '../appConfigDisk'
import { loadServerConfig } from '../loadServerConfig'
import { readMetaFromDisk } from '../metaDisk'

type InitResponse = {
  config: AppConfig
  catalog: NoteCatalogRow[]
  folders: string[]
  meta: WorkspaceMeta
}

export default defineEventHandler(async (): Promise<InitResponse> => {
  const [config, serverConfig, meta] = await Promise.all([
    readAppConfigFromDisk(),
    loadServerConfig(),
    readMetaFromDisk(),
  ])
  const storage = getServerNoteStorage(serverConfig)
  const [catalog, folders] = await Promise.all([
    loadNotesResponse(storage, serverConfig),
    storage.loadFolders(),
  ])

  return {
    config,
    catalog,
    folders: folders.filter((name) => name !== serverConfig.assetsFolder),
    meta,
  }
})
