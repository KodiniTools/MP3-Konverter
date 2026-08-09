<template>
  <section class="converted-list-section" aria-labelledby="converted-heading">
    <h2 id="converted-heading" class="section-heading">
      {{ $t('converter.results.heading') }}
    </h2>

    <p class="converted-hint">{{ $t('converter.results.hint') }}</p>

    <div class="file-list" role="list">
      <div
        v-for="(file, index) in files"
        :key="`${file.name}-${index}`"
        class="file-item converted-item"
        :class="{ 'is-saved': file.saved }"
        role="listitem"
      >
        <div class="file-info">
          <span class="file-name">
            {{ file.name }}
            <span v-if="file.saved" class="saved-badge">
              {{ $t('converter.results.saved') }}
            </span>
          </span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>

        <button
          type="button"
          class="save-file-btn"
          @click="$emit('save', index)"
          :aria-label="$t('converter.results.saveFile', { name: file.name })"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 3v12M12 15l-4-4M12 15l4-4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ file.saved ? $t('converter.results.saveAgain') : $t('converter.results.save') }}</span>
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

defineEmits(['save'])

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
