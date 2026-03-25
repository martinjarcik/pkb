<script setup lang="ts">
const { isLoading, loadError, selectedNoteId, selectNoteById } = useNotes()
const { accentColor, visibleListItems } = useSidebarNavigation()

async function handleSelectNote(id: string): Promise<void> {
  await selectNoteById(id)
}

function getItemStyle(
  isSelected: boolean,
): { [key: string]: string } | undefined {
  if (!isSelected) {
    return undefined
  }

  return {
    '--notes-list-item-selected-border-color': accentColor.value,
  }
}
</script>

<template>
  <div data-testid="notes-list" class="min-h-0 flex-1 overflow-y-auto">
    <div v-if="isLoading" class="notes-list-state notes-list-state-muted">
      {{ $t('notesList.loading') }}
    </div>

    <div v-else-if="loadError" class="notes-list-state notes-list-state-error">
      {{ loadError }}
    </div>

    <div
      v-else-if="visibleListItems.length === 0"
      data-testid="notes-list-empty"
      class="notes-list-state notes-list-state-muted"
    >
      {{ $t('notesList.empty') }}
    </div>

    <div v-else class="flex flex-col">
      <button
        v-for="item in visibleListItems"
        :key="item.id"
        type="button"
        :data-note-id="item.id"
        :data-selected="item.id === selectedNoteId ? 'true' : 'false'"
        data-testid="notes-list-item"
        class="notes-list-item"
        :class="{
          'notes-list-item-selected': item.id === selectedNoteId,
        }"
        :style="getItemStyle(item.id === selectedNoteId)"
        @click="handleSelectNote(item.id)"
      >
        <div class="notes-list-item-content">
          <p
            data-testid="notes-list-item-title"
            class="notes-list-item-title truncate"
          >
            {{ item.title }}
          </p>
          <p v-if="item.description" class="notes-list-item-description">
            {{ item.description }}
          </p>
          <p class="notes-list-item-meta">
            {{ item.meta }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
