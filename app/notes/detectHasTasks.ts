const UNCHECKED_TASK_ITEM = /^\s*[-*+]\s+\[ \]\s+/mu

export function detectHasTasks(content: string): boolean {
  return UNCHECKED_TASK_ITEM.test(content)
}
