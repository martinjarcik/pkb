<script setup lang="ts">
import { computed } from 'vue'
import { Pin, PinOff, Star, Trash2 } from 'lucide-vue-next'
import { loadConfig } from '~/config/loader'

const {
  selectedNote,
  deleteSelectedNote,
  toggleFavoriteSelectedNote,
  togglePinnedSelectedNote,
} = useNotes()
const { visibleCatalogRows, accentColor } = useSidebarNavigation()

const favoritesEnabled = loadConfig().features.favorites

const isFavorite = computed(() => selectedNote.value?.favorite === true)
const isPinned = computed(() => selectedNote.value?.pinned === true)

function handleDelete(): void {
  deleteSelectedNote(visibleCatalogRows.value.map((row) => row.id))
}

async function handleFavoriteClick(): Promise<void> {
  await toggleFavoriteSelectedNote()
}

async function handlePinClick(): Promise<void> {
  await togglePinnedSelectedNote()
}
</script>

<template>
  <div
    data-testid="note-controls"
    class="note-controls-shell flex shrink-0 items-center justify-center gap-5 px-4"
  >
    <button
      v-if="selectedNote && favoritesEnabled"
      type="button"
      data-testid="note-favorite"
      class="flex items-center justify-center hover:opacity-90"
      :class="isFavorite ? '' : 'text-muted-foreground hover:text-foreground'"
      :style="isFavorite ? { color: accentColor } : undefined"
      @click="handleFavoriteClick"
    >
      <Star :size="16" fill="none" />
    </button>
    <button
      v-if="selectedNote"
      type="button"
      data-testid="note-pin"
      class="flex items-center justify-center hover:opacity-90"
      :class="isPinned ? '' : 'text-muted-foreground hover:text-foreground'"
      :style="isPinned ? { color: accentColor } : undefined"
      @click="handlePinClick"
    >
      <Pin v-if="isPinned" :size="16" />
      <PinOff v-else :size="16" />
    </button>
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
