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
        <span class="drop-icon" aria-hidden="true">📁</span>
        <p>{{ $t('converter.upload.instruction') }}</p>
        
        <input 
          ref="fileInput"
          type="file" 
          class="file-input"
          multiple 
          accept="audio/*"
          @change="handleFileSelect"
          :aria-label="$t('converter.upload.ariaLabel')"
        >
        
        <button 
          type="button" 
          class="select-btn"
          @click.stop="openFileDialog"
        >
          <span class="btn-icon" aria-hidden="true">📂</span>
          <span class="btn-text">{{ $t('converter.upload.button') }}</span>
        </button>
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
