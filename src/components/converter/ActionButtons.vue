<template>
  <section class="action-section">
    <button
      type="button"
      class="convert-btn action-btn"
      :class="{ 'converting-pulse': isConverting }"
      :disabled="disabled"
      @click="$emit('convert')"
    >
      <svg v-if="!isConverting" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
      </svg>
      <svg v-else class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" stroke-dasharray="28 56" stroke-linecap="round"/>
      </svg>
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
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
