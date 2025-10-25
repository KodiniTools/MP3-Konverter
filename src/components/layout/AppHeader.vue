<template>
  <header class="website-header">
    <div class="website-header-container">
      <div class="website-logo">
        <span>🎵</span>
        <span>{{ $t('common.appName') }}</span>
      </div>
      
      <div class="website-header-actions">
        <button 
          class="theme-toggle" 
          @click="$emit('toggle-theme')"
          :aria-label="$t('common.toggleTheme')"
        >
          <span class="theme-icon">{{ themeIcon }}</span>
        </button>
        
        <button 
          class="lang-toggle" 
          @click="$emit('toggle-language')"
          :aria-label="$t('common.toggleLanguage')"
        >
          <span>{{ currentLangCode }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'

defineEmits(['toggle-theme', 'toggle-language'])

const { locale } = useI18n()
const themeStore = useThemeStore()

const themeIcon = computed(() => themeStore.theme === 'light' ? '🌙' : '☀️')
const currentLangCode = computed(() => locale.value.toUpperCase())
</script>
