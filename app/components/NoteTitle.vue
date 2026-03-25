<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isSaving?: boolean
    title: string
  }>(),
  {
    isSaving: false,
  },
)

const emit = defineEmits<{
  commit: [title: string]
}>()

const isEditing = ref(false)
const titleElement = ref<HTMLDivElement | null>(null)

function readText(): string {
  return titleElement.value?.textContent ?? ''
}

function writeText(text: string): void {
  if (titleElement.value) {
    titleElement.value.textContent = text
  }
}

watch(
  () => props.title,
  (nextTitle) => {
    if (!isEditing.value) {
      writeText(nextTitle)
    }
  },
)

watch(
  () => props.isSaving,
  (isSaving) => {
    if (!isSaving && !isEditing.value) {
      writeText(props.title)
    }
  },
)

function handleFocus(): void {
  isEditing.value = true
}

function commitTitle(): void {
  const nextTitle = readText().trim()

  isEditing.value = false

  if (nextTitle.length === 0 || nextTitle === props.title) {
    writeText(props.title)
    return
  }

  emit('commit', nextTitle)
}

function handleBlur(): void {
  commitTitle()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    titleElement.value?.blur()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    writeText(props.title)
    isEditing.value = false
    titleElement.value?.blur()
  }
}

function handlePaste(event: ClipboardEvent): void {
  event.preventDefault()

  const text = event.clipboardData?.getData('text/plain') ?? ''

  document.execCommand('insertText', false, text.replace(/[\r\n]+/g, ' '))
}

onMounted(() => {
  writeText(props.title)
})
</script>

<template>
  <div
    ref="titleElement"
    aria-label="Note title"
    class="note-title-shell"
    contenteditable="true"
    data-testid="note-title"
    role="textbox"
    spellcheck="false"
    @blur="handleBlur"
    @focus="handleFocus"
    @keydown="handleKeydown"
    @paste="handlePaste"
  />
</template>
