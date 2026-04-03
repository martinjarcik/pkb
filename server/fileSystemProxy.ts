import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { parseAppConfig, type AppConfig } from '~/config/parseAppConfig'
import yaml from 'yaml'

export type ProxyFileScope = 'app-config' | 'meta'

export type ProxyFileEntry = {
  path: string
  content: string
  birthtime: string
  mtime: string
}

export type ProxyTextFile = {
  content: string
  birthtime: string
  mtime: string
}

async function readTextFileWithStats(path: string): Promise<ProxyTextFile> {
  const [content, fileStats] = await Promise.all([
    readFile(path, 'utf-8'),
    stat(path),
  ])

  return {
    content,
    birthtime: fileStats.birthtime.toISOString(),
    mtime: fileStats.mtime.toISOString(),
  }
}

function getDefaultConfigPath(): string {
  return resolve(process.cwd(), 'app/config/default.yaml')
}

function getUserConfigPath(): string {
  const override = process.env.PKB_APP_CONFIG_PATH

  if (typeof override === 'string' && override.trim().length > 0) {
    return resolve(process.cwd(), override.trim())
  }

  return resolve(process.cwd(), 'data/app-config.yaml')
}

function getMetaPath(): string {
  const override = process.env.PKB_META_PATH

  if (typeof override === 'string' && override.trim().length > 0) {
    return resolve(process.cwd(), override.trim())
  }

  return resolve(process.cwd(), 'meta.yaml')
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export function assertSafeRelativePath(path: string, label: string): string {
  if (path.length === 0) {
    throw new Error(`${label} must be a non-empty string`)
  }

  const segments = path.split('/')

  if (
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\'),
    )
  ) {
    throw new Error(`Invalid ${label}`)
  }

  return segments.join('/')
}

export function resolvePathWithinRoot(root: string, path: string): string {
  const normalizedRoot = resolve(root)
  const safeRelativePath = assertSafeRelativePath(path, 'path')
  const targetPath = resolve(normalizedRoot, safeRelativePath)
  const relativePath = relative(normalizedRoot, targetPath)

  if (
    relativePath === '' ||
    relativePath === '.' ||
    relativePath.startsWith('..') ||
    relativePath.includes('\\')
  ) {
    throw new Error('Path resolves outside the root')
  }

  return targetPath
}

export async function listMarkdownFiles(
  root: string,
): Promise<ProxyFileEntry[]> {
  const normalizedRoot = resolve(root)
  const entries = await readdir(normalizedRoot, { recursive: true })
  const markdownPaths = entries
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => resolve(normalizedRoot, entry))

  const files = await Promise.all(
    markdownPaths.map(async (filePath) => {
      const [content, fileStats] = await Promise.all([
        readFile(filePath, 'utf-8'),
        stat(filePath),
      ])

      return {
        path: relative(normalizedRoot, filePath),
        content,
        birthtime: fileStats.birthtime.toISOString(),
        mtime: fileStats.mtime.toISOString(),
      }
    }),
  )

  return files.sort((left, right) => left.path.localeCompare(right.path))
}

export async function readTextFileFromRoot(
  root: string,
  path: string,
): Promise<ProxyTextFile> {
  const filePath = resolvePathWithinRoot(root, path)

  return readTextFileWithStats(filePath)
}

export async function writeTextFileToRoot(
  root: string,
  path: string,
  content: string,
): Promise<ProxyTextFile> {
  const filePath = resolvePathWithinRoot(root, path)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf-8')

  return readTextFileWithStats(filePath)
}

export async function deleteFileFromRoot(
  root: string,
  path: string,
): Promise<void> {
  const filePath = resolvePathWithinRoot(root, path)

  try {
    await unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
}

export async function renameFileWithinRoot(
  root: string,
  oldPath: string,
  newPath: string,
): Promise<void> {
  const sourcePath = resolvePathWithinRoot(root, oldPath)
  const targetPath = resolvePathWithinRoot(root, newPath)

  await mkdir(dirname(targetPath), { recursive: true })
  await rename(sourcePath, targetPath)
}

export async function listDirectories(root: string): Promise<string[]> {
  const normalizedRoot = resolve(root)
  const entries = await readdir(normalizedRoot, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

export async function createDirectoryInRoot(
  root: string,
  path: string,
): Promise<void> {
  const directoryPath = resolvePathWithinRoot(root, path)
  await mkdir(directoryPath, { recursive: true })
}

export async function renameDirectoryWithinRoot(
  root: string,
  oldPath: string,
  newPath: string,
): Promise<void> {
  const sourcePath = resolvePathWithinRoot(root, oldPath)
  const targetPath = resolvePathWithinRoot(root, newPath)

  await rename(sourcePath, targetPath)
}

function assertFileScope(value: unknown): ProxyFileScope {
  if (value === 'app-config' || value === 'meta') {
    return value
  }

  throw new Error('Invalid file scope')
}

async function resolveScopedReadPath(
  scope: ProxyFileScope,
): Promise<string | null> {
  if (scope === 'app-config') {
    const userPath = getUserConfigPath()

    return (await pathExists(userPath)) ? userPath : getDefaultConfigPath()
  }

  const metaPath = getMetaPath()

  return (await pathExists(metaPath)) ? metaPath : null
}

function resolveScopedWritePath(scope: ProxyFileScope): string {
  return scope === 'app-config' ? getUserConfigPath() : getMetaPath()
}

export async function readScopedTextFile(
  scopeValue: unknown,
): Promise<ProxyTextFile | null> {
  const scope = assertFileScope(scopeValue)
  const path = await resolveScopedReadPath(scope)

  if (path === null) {
    return null
  }

  return readTextFileWithStats(path)
}

export async function writeScopedTextFile(
  scopeValue: unknown,
  content: string,
): Promise<ProxyTextFile> {
  const scope = assertFileScope(scopeValue)
  const path = resolveScopedWritePath(scope)

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf-8')

  return readTextFileWithStats(path)
}

export async function readCurrentAppConfig(): Promise<AppConfig> {
  const configFile = await readScopedTextFile('app-config')

  return parseAppConfig(yaml.parse(configFile?.content ?? '') as unknown)
}
