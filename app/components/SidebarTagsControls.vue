<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const { t } = useTranslations()
const { tagsExpanded, toggleTagsExpanded } = useSidebarNavigation()
</script>

<template>
  <div
    data-testid="sidebar-tags-controls"
    class="sidebar-section-controls-shell group"
  >
    <span class="sidebar-section-title">{{ t('sidebarTags.title') }}</span>

    <button
      type="button"
      :aria-label="t('sidebarTags.toggleTags')"
      :title="t('sidebarTags.toggleTags')"
      class="sidebar-section-control-button shrink-0"
      data-testid="sidebar-tags-toggle"
      @click="toggleTagsExpanded"
    >
      <ChevronDown
        :size="14"
        aria-hidden="true"
        class="transition-transform"
        :class="{ '-rotate-90': !tagsExpanded }"
      />
    </button>
  </div>
</template>
