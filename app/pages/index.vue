<script setup lang="ts">
import { filterCatalogForSidebarView } from '~/composables/useSidebarNavigation'

const { loadNotes, notes, selectNoteById } = useNotes()
const { loadFolders } = useSidebarNavigation()

onMounted(() => {
  void (async () => {
    const loadFoldersPromise = loadFolders()

    await loadNotes()
    await selectNoteById(
      filterCatalogForSidebarView(notes.value, { kind: 'inbox' })[0]?.id ??
        null,
    )
    await loadFoldersPromise
  })()
})
</script>

<template>
  <NotePanel />
</template>
