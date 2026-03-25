function noteFileBaseName(id: string): string {
  const normalized = id.replace(/\\/g, '/')
  const slash = normalized.lastIndexOf('/')
  return slash === -1 ? normalized : normalized.slice(slash + 1)
}

/** Display title: last path segment of the note id without a `.md` suffix. */
export function noteTitleFromId(id: string): string {
  const base = noteFileBaseName(id)
  return base.endsWith('.md') ? base.slice(0, -3) : base
}
