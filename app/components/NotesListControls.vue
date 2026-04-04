<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { useSidebarNavigation } from '~/composables/useSidebarNavigation'
import { useTranslations } from '~/composables/useTranslations'

const { t } = useTranslations()
const { searchInput, updateSearchInput } = useSidebarNavigation()
</script>

<template>
  <div
    data-testid="notes-list-controls"
    data-tauri-drag-region
    class="notes-list-controls-shell flex shrink-0 items-center gap-5 border-b border-border px-5"
  >
    <label
      class="relative flex-1"
      for="notes-list-search-input"
    >
      <Search
        class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        id="notes-list-search-input"
        :value="searchInput"
        :placeholder="t('notesListControls.searchPlaceholder')"
        data-testid="notes-list-search-input"
        class="flex h-8 w-full rounded-[20px] border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
        type="text"
        @input="updateSearchInput(($event.target as HTMLInputElement).value)"
      >
    </label>
    <NotesListActions />
  </div>
</template>
