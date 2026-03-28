import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import yaml from 'yaml'

describe('mergeAndWriteMetaPatch', () => {
  let dir: string
  let metaFile: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pkb-meta-'))
    metaFile = join(dir, 'meta.yaml')
    process.env.PKB_META_PATH = metaFile
  })

  afterEach(async () => {
    delete process.env.PKB_META_PATH
    await rm(dir, { recursive: true, force: true })
  })

  it('writes merged folder icon to the meta file', async () => {
    await writeFile(metaFile, '{}\n', 'utf-8')

    const { mergeAndWriteMetaPatch } = await import('../../../server/metaDisk')

    await mergeAndWriteMetaPatch({
      folders: { Work: { icon: '🎉' } },
    })

    const raw = await readFile(metaFile, 'utf-8')
    const parsed = yaml.parse(raw) as {
      folders: { Work: { icon: string } }
    }

    expect(parsed.folders.Work.icon).toBe('🎉')
  })

  it('removes a folder entry when patch sets null', async () => {
    await writeFile(
      metaFile,
      yaml.stringify({ folders: { Work: { icon: '🎉' } } }),
      'utf-8',
    )

    const { mergeAndWriteMetaPatch } = await import('../../../server/metaDisk')

    await mergeAndWriteMetaPatch({
      folders: { Work: null },
    })

    const raw = await readFile(metaFile, 'utf-8')
    const parsed = yaml.parse(raw) as { folders: Record<string, unknown> }

    expect(parsed.folders.Work).toBeUndefined()
  })
})

describe('readMetaFromDisk', () => {
  let dir: string
  let metaFile: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pkb-meta-read-'))
    metaFile = join(dir, 'meta.yaml')
    process.env.PKB_META_PATH = metaFile
  })

  afterEach(async () => {
    delete process.env.PKB_META_PATH
    await rm(dir, { recursive: true, force: true })
  })

  it('returns empty folders when the file is missing', async () => {
    const { readMetaFromDisk } = await import('../../../server/metaDisk')

    await expect(readMetaFromDisk()).resolves.toEqual({ folders: {} })
  })
})
