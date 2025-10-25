<template>
  <section class="action-section">
    <button 
      type="button"
      class="convert-btn action-btn"
      :disabled="disabled"
      @click="$emit('convert')"
    >
      <span class="btn-text">
        {{ isConverting ? $t('converter.actions.converting') : $t('converter.actions.convert') }}
      </span>
    </button>
    
    <button 
      v-if="showRetry"
      type="button"
      class="retry-btn action-btn"
      @click="$emit('retry')"
    >
      <span class="btn-text">{{ $t('converter.actions.retry') }}</span>
    </button>
  </section>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  isConverting: {
    type: Boolean,
    default: false
  },
  showRetry: {
    type: Boolean,
    default: false
  }
})

defineEmits(['convert', 'retry'])
</script>
