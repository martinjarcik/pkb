import { defineEventHandler } from 'h3'
import type { WorkspaceMeta } from '~/config/parseMeta'
import type { NoteCatalogRow } from '~/notes/types'
import { getNoteStorage } from '~/storage/router'
import type { AppConfig } from '~/config/loader'
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
  const storage = getNoteStorage(serverConfig)
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
