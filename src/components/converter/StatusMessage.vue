<template>
  <section class="status-section">
    <div
      class="status"
      :class="`status--${type}`"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-for="(d, index) in STATUS_ICONS[type]" :key="index" :d="d" />
      </svg>
      <span>{{ message }}</span>
    </div>
  </section>
</template>

<script setup>
// Icon je Ton: Info (i im Kreis), Erfolg (Haken im Kreis), Fehler (Kreuz im Kreis), Warnung (Dreieck)
const STATUS_ICONS = {
  info: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 16v-4M12 8h.01'],
  success: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'm8.5 12 2.5 2.5 5-5'],
  error: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'm15 9-6 6M9 9l6 6'],
  warning: ['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 9v4M12 17h.01']
}

defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'error', 'warning'].includes(value)
  }
})
</script>
