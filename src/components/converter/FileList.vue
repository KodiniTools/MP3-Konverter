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
