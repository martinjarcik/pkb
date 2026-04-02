import { readFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'
import { createError, defineEventHandler, setResponseHeader } from 'h3'
import { mimeForExtension } from '../../imageTypes'
import { loadServerConfig } from '../../loadServerConfig'

function parsePathParam(pathParam: string | undefined): string[] {
  if (!pathParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing asset path',
    })
  }

  try {
    return pathParam.split('/').map((segment) => decodeURIComponent(segment))
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid asset path',
    })
  }
}

export default defineEventHandler(async (event) => {
  const config = await loadServerConfig()

  if (config.applicationType !== 'desktop') {
    throw createError({
      statusCode: 501,
      statusMessage: 'Asset serving is only supported in desktop mode',
    })
  }

  const segments = parsePathParam(
    event.context.params?.path as string | undefined,
  )

  if (
    segments.length < 2 ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\'),
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid asset path',
    })
  }

  if (segments[0] !== config.assetsFolder) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Asset path not allowed',
    })
  }

  const normalizedVault = resolve(config.vault)
  const assetsRoot = resolve(normalizedVault, config.assetsFolder)
  const filePath = resolve(normalizedVault, ...segments)

  const relToAssets = relative(assetsRoot, filePath)
  if (relToAssets.startsWith('..') || relToAssets === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid asset path',
    })
  }

  let buffer: Buffer
  try {
    buffer = await readFile(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset not found',
      })
    }
    throw error
  }

  const ext = extname(filePath).toLowerCase()
  const mime = mimeForExtension(ext)

  setResponseHeader(event, 'Content-Type', mime)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000')

  return buffer
})
