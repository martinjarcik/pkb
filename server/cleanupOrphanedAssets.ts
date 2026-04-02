import { orphanedImageRefs } from '~/storage/imageRefs'
import { deleteOrphanedAssetFiles } from './deleteOrphanedAssetFiles'

export function cleanupOrphanedAssets(
  vaultPath: string,
  oldContent: string,
  newContent: string,
): void {
  const orphaned = orphanedImageRefs(oldContent, newContent)

  if (orphaned.length > 0) {
    void deleteOrphanedAssetFiles(vaultPath, orphaned)
  }
}
