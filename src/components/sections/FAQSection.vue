<template>
  <section class="faq-section">
    <div class="faq-container">
      <h2 class="section-title">{{ $t('faq.title') }}</h2>
      
      <div 
        v-for="(faq, index) in faqs" 
        :key="faq.key"
        class="faq-item"
        :class="{ active: activeIndex === index }"
      >
        <button 
          class="faq-question"
          @click="toggleFAQ(index)"
          :aria-expanded="activeIndex === index"
        >
          <span>{{ $t(`faq.${faq.key}.question`) }}</span>
          <span class="faq-toggle">▼</span>
        </button>
        
        <div class="faq-answer">
          <p>{{ $t(`faq.${faq.key}.answer`) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const activeIndex = ref(null)

const faqs = [
  { key: 'q1' },
  { key: 'q2' },
  { key: 'q3' },
  { key: 'q4' },
  { key: 'q5' }
]

function toggleFAQ(index) {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>
