<template>
  <section class="options-section" aria-labelledby="options-heading">
    <h2 id="options-heading" class="section-heading">
      {{ $t('converter.options.heading') }}
    </h2>
    
    <form class="conversion-form" @submit.prevent>
      <div class="options-grid">
        <div class="option-group">
          <label for="codecSelect" class="option-label">
            {{ $t('converter.options.codecLabel') }}
          </label>
          <select 
            id="codecSelect" 
            class="option-select"
            :value="codec"
            @change="$emit('update:codec', $event.target.value)"
            required
          >
            <option value="libmp3lame">MP3 (LAME)</option>
            <option value="aac">AAC</option>
          </select>
        </div>
        
        <div class="option-group">
          <label for="bitrateSelect" class="option-label">
            {{ $t('converter.options.bitrateLabel') }}
          </label>
          <select 
            id="bitrateSelect" 
            class="option-select"
            :value="bitrate"
            @change="$emit('update:bitrate', $event.target.value)"
            required
          >
            <option value="128k">128 kbps</option>
            <option value="192k">192 kbps</option>
            <option value="256k">256 kbps</option>
            <option value="320k">320 kbps</option>
          </select>
        </div>
      </div>
    </form>
    
    <div class="options-footer">
      <span class="format-chip" role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
        {{ $t('converter.options.outputChip', { format: outputFormat.format, bitrate: formatBitrate(bitrate) }) }}
      </span>
      <span class="keyboard-hint">{{ $t('converter.options.keyboardHint') }}</span>
    </div>
  </section>
</template>

<script setup>
import { formatBitrate } from '../../utils/format'

defineProps({
  codec: {
    type: String,
    required: true
  },
  bitrate: {
    type: String,
    required: true
  },
  outputFormat: {
    type: Object,
    required: true
  }
})

defineEmits(['update:codec', 'update:bitrate'])
</script>
