import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'
import { createError, defineEventHandler, readMultipartFormData } from 'h3'
import { loadServerConfig } from '../../loadServerConfig'

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
])

function extensionFromMime(mime: string): string | null {
  switch (mime) {
    case 'image/png':
      return '.png'
    case 'image/jpeg':
      return '.jpg'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    case 'image/svg+xml':
      return '.svg'
    default:
      return null
  }
}

function pickSafeExtension(
  filename: string | undefined,
  mimeType: string,
): string {
  if (filename) {
    const ext = extname(filename).toLowerCase()
    if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
      return ext
    }
  }

  const fromMime = extensionFromMime(mimeType)
  if (fromMime) {
    return fromMime
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Unsupported image type',
  })
}

export default defineEventHandler(async (event) => {
  const config = await loadServerConfig()

  if (config.applicationType !== 'desktop') {
    throw createError({
      statusCode: 501,
      statusMessage: 'Image upload is only supported in desktop mode',
    })
  }

  const parts = await readMultipartFormData(event)

  if (!parts) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Expected multipart form data',
    })
  }

  const imagePart = parts.find((part) => part.name === 'image' && part.data)

  if (!imagePart?.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing image field',
    })
  }

  const mimeType = imagePart.type ?? 'application/octet-stream'
  if (!mimeType.startsWith('image/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File must be an image',
    })
  }

  const ext = pickSafeExtension(imagePart.filename, mimeType)
  const baseName = `${Date.now()}-${randomUUID()}${ext}`
  const normalizedVault = resolve(config.vault)
  const assetsDir = resolve(normalizedVault, config.assetsFolder)
  const filePath = resolve(assetsDir, baseName)
  const relToAssets = relative(assetsDir, filePath)

  if (relToAssets.startsWith('..') || relToAssets === '') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid asset path',
    })
  }

  await mkdir(assetsDir, { recursive: true })
  await writeFile(filePath, imagePart.data)

  const relativePath = `${config.assetsFolder}/${baseName}`

  return {
    success: 1,
    file: {
      url: `/api/vault-assets/${relativePath}`,
    },
  }
})
