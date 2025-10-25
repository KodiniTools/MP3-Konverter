<template>
  <section class="progress-section" aria-labelledby="progress-heading">
    <h2 id="progress-heading" class="visually-hidden">
      {{ $t('converter.progress.heading') }}
    </h2>
    
    <div class="progress-container">
      <div class="progress-bar-container">
        <div 
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="$t('converter.progress.ariaLabel')"
          :style="{ width: progress + '%' }"
        >
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100
  }
})
</script>
