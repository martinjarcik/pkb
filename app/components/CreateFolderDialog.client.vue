<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const folderName = defineModel<string>('folderName', { required: true })

const props = defineProps<{
  createError: string | null
  isCreating: boolean
}>()

const emit = defineEmits<{
  create: []
  cancel: []
  inputKeydown: [event: KeyboardEvent]
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ $t('sidebarFolders.createFolder') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ $t('sidebarFolders.folderNameLabel') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <Input
          v-model="folderName"
          :placeholder="$t('sidebarFolders.folderNamePlaceholder')"
          data-testid="create-folder-name-input"
          @keydown="emit('inputKeydown', $event)"
        />
        <p
          v-if="props.createError"
          class="text-sm text-destructive"
          data-testid="create-folder-error"
        >
          {{ props.createError }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          data-testid="create-folder-cancel"
          @click="emit('cancel')"
        >
          {{ $t('sidebarFolders.cancel') }}
        </Button>
        <Button
          :disabled="props.isCreating"
          data-testid="create-folder-confirm"
          @click="emit('create')"
        >
          {{ $t('sidebarFolders.create') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
