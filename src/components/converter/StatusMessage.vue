<template>
  <section class="status-section">
    <div 
      class="status"
      :class="`status--${type}`"
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
    >
      {{ message }}
    </div>
  </section>
</template>

<script setup>
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
