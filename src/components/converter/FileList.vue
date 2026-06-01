<template>
  <section class="file-list-section" aria-labelledby="files-heading">
    <h2 id="files-heading" class="section-heading">
      {{ $t('converter.fileList.heading') }}
    </h2>
    
    <div class="file-list" role="list" aria-live="polite">
      <div 
        v-for="(file, index) in files" 
        :key="`${file.name}-${index}`"
        class="file-item"
        role="listitem"
      >
        <div class="file-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <button
          type="button"
          class="remove-file-btn"
          @click="$emit('remove-file', index)"
          :aria-label="$t('converter.fileList.removeFile', { name: file.name })"
        >
          ✕
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  files: {
    type: Array,
    required: true
  }
})

defineEmits(['remove-file'])

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
