import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
  type Ref,
} from 'vue'

export type VirtualListRow<T> = {
  item: T
  offset: number
  height: number
}

type UseVirtualListArgs<T extends { id: string }> = {
  items: Ref<readonly T[]>
  defaultItemHeight?: number
  overscanPx?: number
}

/** Manages viewport measurement and row virtualization for a scrollable list. */
export function useVirtualList<T extends { id: string }>({
  items,
  defaultItemHeight = 96,
  overscanPx = 320,
}: UseVirtualListArgs<T>) {
  const listViewport = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(0)
  const rowHeights = ref<Record<string, number>>({})
  const measuredRowElements = new Map<string, HTMLElement>()
  let viewportResizeObserver: ResizeObserver | null = null
  let pendingMeasureFrame = 0

  const virtualRows = ref<VirtualListRow<T>[]>([])
  const visibleRows = ref<VirtualListRow<T>[]>([])
  const totalHeight = ref(0)

  function rebuildVirtualRows(): void {
    let offset = 0

    virtualRows.value = items.value.map((item) => {
      const height = rowHeights.value[item.id] ?? defaultItemHeight
      const row = { item, offset, height }

      offset += height

      return row
    })
    totalHeight.value =
      virtualRows.value[virtualRows.value.length - 1]?.offset +
        virtualRows.value[virtualRows.value.length - 1]?.height || 0
    updateVisibleRows()
  }

  function updateVisibleRows(): void {
    const start = Math.max(0, scrollTop.value - overscanPx)
    const end = scrollTop.value + viewportHeight.value + overscanPx

    visibleRows.value = virtualRows.value.filter(
      (row) => row.offset + row.height >= start && row.offset <= end,
    )
  }

  function updateViewportHeight(): void {
    viewportHeight.value = listViewport.value?.clientHeight ?? 0
    updateVisibleRows()
  }

  function handleScroll(event: Event): void {
    if (!(event.currentTarget instanceof HTMLElement)) {
      return
    }

    scrollTop.value = event.currentTarget.scrollTop
    updateVisibleRows()
  }

  function measureVisibleRows(): void {
    const nextHeights = { ...rowHeights.value }
    let didChange = false

    for (const [id, element] of measuredRowElements) {
      const height = element.offsetHeight

      if (height > 0 && nextHeights[id] !== height) {
        nextHeights[id] = height
        didChange = true
      }
    }

    if (didChange) {
      rowHeights.value = nextHeights
      rebuildVirtualRows()
    }
  }

  function scheduleMeasureVisibleRows(): void {
    if (typeof window === 'undefined') {
      return
    }

    if (pendingMeasureFrame !== 0) {
      cancelAnimationFrame(pendingMeasureFrame)
    }

    pendingMeasureFrame = window.requestAnimationFrame(() => {
      pendingMeasureFrame = 0
      measureVisibleRows()
    })
  }

  function registerRowElement(
    id: string,
    element: Element | ComponentPublicInstance | null,
  ): void {
    const resolvedElement =
      element instanceof HTMLElement
        ? element
        : element && '$el' in element && element.$el instanceof HTMLElement
          ? element.$el
          : null

    if (resolvedElement) {
      measuredRowElements.set(id, resolvedElement)
      scheduleMeasureVisibleRows()
      return
    }

    measuredRowElements.delete(id)
  }

  watch(
    items,
    async (nextItems) => {
      const nextIds = new Set(nextItems.map((item) => item.id))

      rowHeights.value = Object.fromEntries(
        Object.entries(rowHeights.value).filter(([id]) => nextIds.has(id)),
      )

      rebuildVirtualRows()
      await nextTick()
      updateViewportHeight()
      scheduleMeasureVisibleRows()
    },
    { immediate: true },
  )

  onMounted(() => {
    updateViewportHeight()

    if (!listViewport.value || typeof ResizeObserver === 'undefined') {
      return
    }

    viewportResizeObserver = new ResizeObserver(() => {
      updateViewportHeight()
      scheduleMeasureVisibleRows()
    })
    viewportResizeObserver.observe(listViewport.value)
  })

  onBeforeUnmount(() => {
    if (pendingMeasureFrame !== 0) {
      cancelAnimationFrame(pendingMeasureFrame)
    }

    viewportResizeObserver?.disconnect()
    viewportResizeObserver = null
  })

  return {
    listViewport,
    totalHeight,
    visibleRows,
    handleScroll,
    registerRowElement,
  }
}
