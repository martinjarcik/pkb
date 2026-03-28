import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import yaml from 'yaml'
import { deepMergeMeta } from '~/config/mergeMetaPatch'
import { parseMeta, type WorkspaceMeta } from '~/config/parseMeta'
import { getMetaPath } from './metaPath'

export async function readMetaFromDisk(): Promise<WorkspaceMeta> {
  try {
    const raw = await readFile(getMetaPath(), 'utf-8')
    const parsed = yaml.parse(raw) as unknown

    if (parsed === null || parsed === undefined) {
      return parseMeta(undefined)
    }

    return parseMeta(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return parseMeta(undefined)
    }

    throw error
  }
}

export async function mergeAndWriteMetaPatch(
  patch: Record<string, unknown>,
): Promise<WorkspaceMeta> {
  let current: Record<string, unknown>

  try {
    const raw = await readFile(getMetaPath(), 'utf-8')
    const parsed = yaml.parse(raw) as unknown

    if (parsed === null || parsed === undefined) {
      current = {}
    } else if (
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      parsed === null
    ) {
      throw new Error('Meta must be an object')
    } else {
      current = parsed as Record<string, unknown>
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      current = {}
    } else {
      throw error
    }
  }

  if (
    typeof current !== 'object' ||
    current === null ||
    Array.isArray(current)
  ) {
    throw new Error('Meta must be an object')
  }

  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    throw new Error('Patch must be an object')
  }

  const merged = deepMergeMeta(current, patch)
  const validated = parseMeta(merged)
  const nextYaml = yaml.stringify(merged)
  const path = getMetaPath()

  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, nextYaml, 'utf-8')

  return validated
}
