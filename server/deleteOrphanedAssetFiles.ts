import { stat, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'

const GRACE_PERIOD_MS = 10_000

async function isOlderThanGracePeriod(filePath: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath)
    return Date.now() - fileStats.mtimeMs > GRACE_PERIOD_MS
  } catch {
    return false
  }
}

export async function deleteOrphanedAssetFiles(
  vaultPath: string,
  orphanedRefs: string[],
): Promise<void> {
  for (const ref of orphanedRefs) {
    const filePath = resolve(vaultPath, ref)

    if (!(await isOlderThanGracePeriod(filePath))) {
      continue
    }

    try {
      await unlink(filePath)
    } catch {
      // File may already be gone or inaccessible; ignore.
    }
  }
}
