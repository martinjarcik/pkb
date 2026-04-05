export type FolderTreeNode = {
  name: string
  path: string
  children: FolderTreeNode[]
}

export function buildFolderTree(folderPaths: string[]): FolderTreeNode[] {
  const roots: FolderTreeNode[] = []
  const nodesByPath = new Map<string, FolderTreeNode>()

  for (const folderPath of folderPaths) {
    const segments = folderPath.split('/')
    let parentChildren = roots

    for (let depth = 0; depth < segments.length; depth++) {
      const currentPath = segments.slice(0, depth + 1).join('/')
      let node = nodesByPath.get(currentPath)

      if (!node) {
        node = {
          name: segments[depth]!,
          path: currentPath,
          children: [],
        }
        nodesByPath.set(currentPath, node)
        parentChildren.push(node)
      }

      parentChildren = node.children
    }
  }

  return roots
}

export function folderDisplayName(folderPath: string): string {
  const lastSlash = folderPath.lastIndexOf('/')

  return lastSlash === -1 ? folderPath : folderPath.slice(lastSlash + 1)
}

export function folderDepth(folderPath: string): number {
  if (folderPath.length === 0) {
    return 0
  }

  let count = 0

  for (const ch of folderPath) {
    if (ch === '/') {
      count++
    }
  }

  return count
}

export function parentFolderPath(folderPath: string): string {
  const lastSlash = folderPath.lastIndexOf('/')

  return lastSlash === -1 ? '' : folderPath.slice(0, lastSlash)
}
