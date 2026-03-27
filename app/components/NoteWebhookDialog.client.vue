<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const webhookUrl = defineModel<string>('webhookUrl', { required: true })

const props = defineProps<{
  saveError: string | null
}>()

const emit = defineEmits<{
  save: []
  cancel: []
}>()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ $t('notes.webhookDialogTitle') }}</DialogTitle>
        <DialogDescription class="sr-only">
          {{ $t('notes.webhookUrlLabel') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <Input
          v-model="webhookUrl"
          type="url"
          autocomplete="off"
          :placeholder="$t('notes.webhookUrlPlaceholder')"
          data-testid="note-webhook-url-input"
          @keydown.enter.prevent="emit('save')"
        />
        <p
          v-if="props.saveError"
          class="text-sm text-destructive"
          data-testid="note-webhook-error"
        >
          {{ props.saveError }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          data-testid="note-webhook-cancel"
          @click="emit('cancel')"
        >
          {{ $t('notes.webhookCancel') }}
        </Button>
        <Button data-testid="note-webhook-save" @click="emit('save')">
          {{ $t('notes.webhookSave') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
