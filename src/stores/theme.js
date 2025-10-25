import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State
  const theme = ref(localStorage.getItem('preferred-theme') || 'light')

  // Watch for theme changes and persist
  watch(theme, (newTheme) => {
    localStorage.setItem('preferred-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, { immediate: true })

  // Actions
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(newTheme) {
    if (['light', 'dark'].includes(newTheme)) {
      theme.value = newTheme
    }
  }

  return {
    theme,
    toggleTheme,
    setTheme
  }
})
