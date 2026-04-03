<script setup lang="ts">
import { computed, ref } from 'vue'
import { Maximize2, Pin, PinOff, PlugZap, Star, Trash2 } from 'lucide-vue-next'

const { t } = useTranslations()
const {
  selectedNote,
  deleteSelectedNote,
  toggleFavoriteSelectedNote,
  togglePinnedSelectedNote,
  saveWebhookForSelectedNote,
  saveError,
} = useNotes()
const { visibleCatalogRows, accentColor } = useSidebarNavigation()
const { nonDistractionMode, toggleNonDistractionMode } = useLayout()
const {
  favorites: favoritesEnabled,
  pinned: pinnedEnabled,
  nonDistractionMode: nonDistractionModeEnabled,
  noteWebhook: noteWebhookEnabled,
} = useAppFeatures()

const webhookDialogOpen = ref(false)
const webhookDraft = ref('')

const isFavorite = computed(() => selectedNote.value?.favorite === true)
const isPinned = computed(() => selectedNote.value?.pinned === true)
const hasWebhook = computed(
  () =>
    typeof selectedNote.value?.webhook === 'string' &&
    selectedNote.value.webhook.length > 0,
)

function handleDelete(): void {
  deleteSelectedNote(visibleCatalogRows.value.map((row) => row.id))
}

async function handleFavoriteClick(): Promise<void> {
  await toggleFavoriteSelectedNote()
}

async function handlePinClick(): Promise<void> {
  await togglePinnedSelectedNote()
}

function handleNonDistractionClick(): void {
  toggleNonDistractionMode()
}

function openWebhookDialog(): void {
  saveError.value = null
  webhookDraft.value =
    typeof selectedNote.value?.webhook === 'string'
      ? selectedNote.value.webhook
      : ''
  webhookDialogOpen.value = true
}

async function handleWebhookSave(): Promise<void> {
  await saveWebhookForSelectedNote(webhookDraft.value)

  if (!saveError.value) {
    webhookDialogOpen.value = false
  }
}

function handleWebhookCancel(): void {
  saveError.value = null
  webhookDialogOpen.value = false
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
      v-if="selectedNote && pinnedEnabled"
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
      v-if="selectedNote && nonDistractionModeEnabled"
      type="button"
      data-testid="note-non-distraction"
      class="flex items-center justify-center hover:opacity-90"
      :class="
        nonDistractionMode ? '' : 'text-muted-foreground hover:text-foreground'
      "
      :style="nonDistractionMode ? { color: accentColor } : undefined"
      :aria-label="t('noteControls.nonDistraction')"
      :title="t('noteControls.nonDistraction')"
      @click="handleNonDistractionClick"
    >
      <Maximize2 :size="16" />
    </button>
    <button
      v-if="selectedNote && noteWebhookEnabled"
      type="button"
      data-testid="note-webhook"
      :data-has-webhook="hasWebhook ? 'true' : undefined"
      class="flex items-center justify-center hover:opacity-90"
      :class="hasWebhook ? '' : 'text-muted-foreground hover:text-foreground'"
      :style="hasWebhook ? { color: accentColor } : undefined"
      @click="openWebhookDialog"
    >
      <PlugZap :size="16" />
    </button>
    <button
      v-if="selectedNote"
      data-testid="note-delete"
      class="flex items-center justify-center text-muted-foreground hover:text-destructive"
      @click="handleDelete"
    >
      <Trash2 :size="16" />
    </button>
    <NoteWebhookDialog
      v-if="selectedNote && noteWebhookEnabled"
      v-model:open="webhookDialogOpen"
      v-model:webhook-url="webhookDraft"
      :save-error="saveError"
      @save="handleWebhookSave"
      @cancel="handleWebhookCancel"
    />
  </div>
</template>
