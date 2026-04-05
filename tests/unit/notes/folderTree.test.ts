import { describe, expect, it } from 'vitest'
import {
  buildFolderTree,
  folderDepth,
  folderDisplayName,
  parentFolderPath,
} from '~/notes/folderTree'

describe('buildFolderTree', () => {
  it('builds a flat list of top-level folders', () => {
    const tree = buildFolderTree(['Keep', 'Projects'])

    expect(tree).toEqual([
      { name: 'Keep', path: 'Keep', children: [] },
      { name: 'Projects', path: 'Projects', children: [] },
    ])
  })

  it('nests subfolders under their parent', () => {
    const tree = buildFolderTree(['Work', 'Work/Archive', 'Work/Active'])

    expect(tree).toEqual([
      {
        name: 'Work',
        path: 'Work',
        children: [
          { name: 'Archive', path: 'Work/Archive', children: [] },
          { name: 'Active', path: 'Work/Active', children: [] },
        ],
      },
    ])
  })

  it('handles deeply nested paths', () => {
    const tree = buildFolderTree(['A', 'A/B', 'A/B/C'])

    expect(tree).toHaveLength(1)
    expect(tree[0]!.children).toHaveLength(1)
    expect(tree[0]!.children[0]!.children).toHaveLength(1)
    expect(tree[0]!.children[0]!.children[0]!.path).toBe('A/B/C')
  })

  it('returns empty array for empty input', () => {
    expect(buildFolderTree([])).toEqual([])
  })

  it('creates intermediate nodes when parent path is missing from input', () => {
    const tree = buildFolderTree(['A/B/C'])

    expect(tree).toHaveLength(1)
    expect(tree[0]!.name).toBe('A')
    expect(tree[0]!.children[0]!.name).toBe('B')
    expect(tree[0]!.children[0]!.children[0]!.name).toBe('C')
  })
})

describe('folderDisplayName', () => {
  it('returns the last segment of a nested path', () => {
    expect(folderDisplayName('Work/Archive')).toBe('Archive')
  })

  it('returns the full string for a top-level folder', () => {
    expect(folderDisplayName('Work')).toBe('Work')
  })
})

describe('folderDepth', () => {
  it('returns 0 for a top-level folder', () => {
    expect(folderDepth('Work')).toBe(0)
  })

  it('returns 1 for a one-level nested folder', () => {
    expect(folderDepth('Work/Archive')).toBe(1)
  })

  it('returns 2 for a two-level nested folder', () => {
    expect(folderDepth('Work/Archive/2024')).toBe(2)
  })

  it('returns 0 for an empty string', () => {
    expect(folderDepth('')).toBe(0)
  })
})

describe('parentFolderPath', () => {
  it('returns empty string for a top-level folder', () => {
    expect(parentFolderPath('Work')).toBe('')
  })

  it('returns the parent for a nested folder', () => {
    expect(parentFolderPath('Work/Archive')).toBe('Work')
  })

  it('returns the grandparent segment for a deeply nested folder', () => {
    expect(parentFolderPath('Work/Archive/2024')).toBe('Work/Archive')
  })
})
