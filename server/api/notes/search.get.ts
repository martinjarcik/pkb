import { defineEventHandler, getQuery } from 'h3'
import { getServerNoteStorage } from '../../getServerNoteStorage'
import { loadServerConfig } from '../../loadServerConfig'
import { searchNoteIds } from '../../noteSearch'

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const query = typeof q === 'string' ? q : ''
  const config = await loadServerConfig()
  const storage = getServerNoteStorage(config)

  return searchNoteIds(storage, query)
})
