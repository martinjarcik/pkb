<script setup lang="ts">
import { ChevronDown, Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  'open-create': []
}>()

const { foldersExpanded, toggleFoldersExpanded } = useSidebarNavigation()

function handleOpenCreate(): void {
  emit('open-create')
}
</script>

<template>
  <div
    data-testid="sidebar-folders-controls"
    class="sidebar-section-controls-shell group"
  >
    <span class="sidebar-section-title">{{ $t('sidebarFolders.title') }}</span>

    <div class="flex shrink-0 items-center gap-0.5">
      <div class="sidebar-section-controls-actions">
        <button
          type="button"
          :aria-label="$t('sidebarFolders.createFolder')"
          :title="$t('sidebarFolders.createFolder')"
          class="sidebar-section-control-button"
          data-testid="sidebar-folders-create"
          @click="handleOpenCreate"
        >
          <Plus :size="14" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        :aria-label="$t('sidebarFolders.toggleFolders')"
        :title="$t('sidebarFolders.toggleFolders')"
        class="sidebar-section-control-button"
        data-testid="sidebar-folders-toggle"
        @click="toggleFoldersExpanded"
      >
        <ChevronDown
          :size="14"
          aria-hidden="true"
          class="transition-transform"
          :class="{ '-rotate-90': !foldersExpanded }"
        />
      </button>
    </div>
  </div>
</template>
