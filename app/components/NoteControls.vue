<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

const { selectedNote, deleteSelectedNote } = useNotes()
const { visibleCatalogRows } = useSidebarNavigation()

function handleDelete(): void {
  deleteSelectedNote(visibleCatalogRows.value.map((row) => row.id))
}
</script>

<template>
  <div
    data-testid="note-controls"
    class="note-controls-shell flex shrink-0 items-center justify-center gap-5 px-4"
  >
    <button
      v-if="selectedNote"
      data-testid="note-delete"
      class="flex items-center justify-center text-muted-foreground hover:text-destructive"
      @click="handleDelete"
    >
      <Trash2 :size="16" />
    </button>
  </div>
</template>
