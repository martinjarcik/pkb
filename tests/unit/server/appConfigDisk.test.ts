import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import yaml from 'yaml'

describe('mergeAndWriteAppConfigPatch', () => {
  let dir: string
  let cfgFile: string
  let templateYaml: string

  beforeEach(async () => {
    templateYaml = await readFile(
      resolve(process.cwd(), 'app/config/default.yaml'),
      'utf-8',
    )
    dir = await mkdtemp(join(tmpdir(), 'pkb-appcfg-'))
    cfgFile = join(dir, 'cfg.yaml')
    await writeFile(cfgFile, templateYaml, 'utf-8')
    process.env.PKB_APP_CONFIG_PATH = cfgFile
  })

  afterEach(async () => {
    delete process.env.PKB_APP_CONFIG_PATH
    await rm(dir, { recursive: true, force: true })
  })

  it('writes merged layout.showSidebarPanel to the config file', async () => {
    const { mergeAndWriteAppConfigPatch } =
      await import('../../../server/appConfigDisk')

    await mergeAndWriteAppConfigPatch({ layout: { showSidebarPanel: false } })

    const raw = await readFile(cfgFile, 'utf-8')
    const parsed = yaml.parse(raw) as {
      layout: {
        showSidebarPanel: boolean
        showInspectorPanel: boolean
      }
    }

    expect(parsed.layout.showSidebarPanel).toBe(false)
    expect(parsed.layout.showInspectorPanel).toBe(true)
  })
})
