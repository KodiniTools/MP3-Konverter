<template>
  <section class="faq-section">
    <div class="faq-container">
      <h2 class="section-title">{{ $t('faq.title') }}</h2>

      <details
        v-for="(faq, index) in faqs"
        :key="faq.key"
        class="faq-item"
        :open="activeIndex === index"
        @toggle="onToggle(index, $event)"
      >
        <summary class="faq-question">
          <span>{{ $t(`faq.${faq.key}.question`) }}</span>
          <span class="faq-toggle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </summary>

        <div class="faq-answer">
          <p>{{ $t(`faq.${faq.key}.answer`) }}</p>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

// Natives Akkordeon: <details>/<summary> bringt Tastatur und aria-expanded mit; höchstens ein Eintrag ist offen
const activeIndex = ref(null)

const faqs = [
  { key: 'q1' },
  { key: 'q2' },
  { key: 'q3' },
  { key: 'q4' },
  { key: 'q5' }
]

function onToggle(index, event) {
  if (event.target.open) {
    activeIndex.value = index
  } else if (activeIndex.value === index) {
    activeIndex.value = null
  }
}
</script>
