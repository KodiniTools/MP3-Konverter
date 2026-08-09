<template>
  <section class="file-upload-section" aria-labelledby="upload-heading">
    <h2 id="upload-heading" class="visually-hidden">
      {{ $t('converter.upload.heading') }}
    </h2>
    
    <div
      ref="dropArea"
      class="drop-area"
      :class="{ 'drag-over': isDragging }"
      role="button"
      tabindex="0"
      @click="openFileDialog"
      @keydown.enter.space.prevent="openFileDialog"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <div class="drop-content">
        <div class="upload-icon-wrap" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V4M12 4L8.5 7.5M12 4L15.5 7.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 15V17.5C3 18.8807 4.11929 20 5.5 20H18.5C19.8807 20 21 18.8807 21 17.5V15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="drop-title">{{ $t('converter.upload.instruction') }}</p>
        <span class="drop-hint">{{ $t('converter.upload.button') }}</span>
        <span class="drop-paste-hint">{{ $t('converter.upload.pasteHint') }}</span>

        <input
          ref="fileInput"
          type="file"
          class="file-input"
          multiple
          accept="audio/*"
          @change="handleFileSelect"
          :aria-label="$t('converter.upload.ariaLabel')"
        >
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['files-selected'])

const dropArea = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)

function openFileDialog() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    emit('files-selected', files)
  }
  // Reset input
  event.target.value = ''
}

function handleDragEnter(event) {
  isDragging.value = true
}

function handleDragLeave(event) {
  // Check if we're actually leaving the drop area
  if (!dropArea.value?.contains(event.relatedTarget)) {
    isDragging.value = false
  }
}

function handleDragOver(event) {
  event.dataTransfer.dropEffect = 'copy'
}

function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    emit('files-selected', files)
  }
}
</script>
