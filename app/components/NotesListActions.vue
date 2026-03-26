<script setup lang="ts">
const { createNote } = useNotes()
const { selectedView } = useSidebarNavigation()

async function handleCreateNote(): Promise<void> {
  await createNote(
    selectedView.value.kind === 'folder' ? selectedView.value.folderName : '',
  )
}
</script>

<template>
  <div
    data-testid="notes-list-actions"
    class="notes-list-actions-shell flex items-center"
  >
    <button
      :aria-label="$t('notesListActions.createNote')"
      :title="$t('notesListActions.createNote')"
      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-testid="notes-list-create-note"
      type="button"
      @click="handleCreateNote"
    >
      <svg
        aria-hidden="true"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 21 22"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 9.80237V18.8024C20 20.4592 18.6569 21.8024 17 21.8024H3C1.34315 21.8024 0 20.4592 0 18.8024V4.80237C0 3.14552 1.34315 1.80237 3 1.80237H10C10.5523 1.80237 11 2.25008 11 2.80237C11 3.35465 10.5523 3.80237 10 3.80237H3C2.44771 3.80237 2 4.25008 2 4.80237V18.8024C2 19.3547 2.44771 19.8024 3 19.8024H17C17.5523 19.8024 18 19.3547 18 18.8024V9.80237C18 9.25008 18.4477 8.80237 19 8.80237C19.5523 8.80237 20 9.25008 20 9.80237ZM20.42 0.88237C21.5898 2.05364 21.5898 3.9511 20.42 5.12237L10.52 15.0224C10.3802 15.1605 10.2028 15.2544 10.01 15.2924L6.47 16.0024H6.27C5.96619 16.0085 5.67607 15.8762 5.48153 15.6428C5.28699 15.4093 5.20916 15.1001 5.27 14.8024L6 11.2924C6.03793 11.0995 6.13184 10.9221 6.27 10.7824L16.17 0.88237C16.7329 0.31751 17.4975 0 18.295 0C19.0925 0 19.8571 0.31751 20.42 0.88237ZM19.3 3.00237C19.2989 2.73512 19.1909 2.47944 19 2.29237C18.8122 2.10306 18.5566 1.99657 18.29 1.99657C18.0234 1.99657 17.7678 2.10306 17.58 2.29237L7.89 11.9824L7.54 13.7524L9.31 13.4024L19 3.70237C19.1884 3.51774 19.2962 3.26614 19.3 3.00237Z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
</template>
