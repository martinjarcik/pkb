<script setup lang="ts">
import { ref } from 'vue'
import { Smile } from 'lucide-vue-next'
import 'emoji-picker-element'

const { t } = useTranslations()
const open = defineModel<boolean>('open', { required: true })
const folderName = defineModel<string>('folderName', { required: true })
const iconEmoji = defineModel<string>('iconEmoji', { required: true })

const props = defineProps<{
  mode: 'create' | 'edit'
  createError: string | null
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
  inputKeydown: [event: KeyboardEvent]
}>()

const pickerOpen = ref(false)

function handleEmojiClick(event: Event): void {
  const detail = (event as CustomEvent<{ unicode: string }>).detail

  iconEmoji.value = detail.unicode
  pickerOpen.value = false
}

function bindPicker(el: HTMLElement | null): void {
  const picker = el?.querySelector('emoji-picker')

  picker?.addEventListener('emoji-click', handleEmojiClick)
}

function clearIcon(): void {
  iconEmoji.value = ''
}

function handleConfirm(): void {
  emit('confirm')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>
          {{
            props.mode === 'create'
              ? t('sidebarFolders.createFolder')
              : t('sidebarFolders.editFolder')
          }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('sidebarFolders.folderNameLabel') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-2">
        <div class="flex items-center gap-2">
          <Popover v-model:open="pickerOpen">
            <PopoverTrigger as-child>
              <Button
                type="button"
                variant="outline"
                size="icon"
                class="h-9 w-9 shrink-0 text-lg"
                :aria-label="t('sidebarFolders.pickIcon')"
                data-testid="folder-dialog-icon-trigger"
              >
                <span v-if="iconEmoji.length > 0">{{ iconEmoji }}</span>
                <Smile v-else :size="18" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto max-w-[min(100vw-2rem,22rem)] p-0">
              <div :ref="(el: any) => bindPicker(el as HTMLElement)">
                <emoji-picker class="folder-emoji-picker" />
              </div>
            </PopoverContent>
          </Popover>

          <Input
            v-model="folderName"
            class="min-w-0 flex-1"
            :placeholder="t('sidebarFolders.folderNamePlaceholder')"
            data-testid="folder-dialog-name-input"
            @keydown="emit('inputKeydown', $event)"
          />
        </div>

        <div v-if="iconEmoji.length > 0" class="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="folder-dialog-clear-icon"
            @click="clearIcon"
          >
            {{ t('sidebarFolders.clearIcon') }}
          </Button>
        </div>

        <p
          v-if="props.createError"
          class="text-sm text-destructive"
          data-testid="folder-dialog-error"
        >
          {{ props.createError }}
        </p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          data-testid="folder-dialog-cancel"
          @click="emit('cancel')"
        >
          {{ t('sidebarFolders.cancel') }}
        </Button>
        <Button
          :disabled="props.isSubmitting"
          data-testid="folder-dialog-confirm"
          @click="handleConfirm"
        >
          {{
            props.mode === 'create'
              ? t('sidebarFolders.create')
              : t('sidebarFolders.saveFolder')
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
