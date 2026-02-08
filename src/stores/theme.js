import { defineStore } from 'pinia'
import { ref, watch, onUnmounted } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // State - use 'theme' key to match global navigation SSI include
  const theme = ref(localStorage.getItem('theme') || 'light')

  // Watch for theme changes and persist
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, { immediate: true })

  // Listen for theme-changed events from the global navigation (SSI include)
  function handleThemeChanged(event) {
    const newTheme = event.detail?.theme
    if (newTheme && ['light', 'dark'].includes(newTheme) && newTheme !== theme.value) {
      theme.value = newTheme
    }
  }

  window.addEventListener('theme-changed', handleThemeChanged)

  // Actions
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(newTheme) {
    if (['light', 'dark'].includes(newTheme)) {
      theme.value = newTheme
    }
  }

  function cleanup() {
    window.removeEventListener('theme-changed', handleThemeChanged)
  }

  return {
    theme,
    toggleTheme,
    setTheme,
    cleanup
  }
})
