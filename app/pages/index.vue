<script setup lang="ts">
import type { Note } from '~/notes/types'

async function logLoadedNotes(): Promise<void> {
  const notes = await $fetch<Note[]>('/api/notes')
  const log = globalThis.console['log'].bind(globalThis.console)

  log('Loaded notes from storage', notes)
}

onMounted(() => {
  void logLoadedNotes()
})
</script>

<template>
  <NotePanel />
</template>
