import { defineEventHandler } from 'h3'
import { readMetaFromDisk } from '../metaDisk'

export default defineEventHandler(async () => {
  return readMetaFromDisk()
})
