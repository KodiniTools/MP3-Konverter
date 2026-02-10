import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import i18n from '../i18n'

export const useLocaleStore = defineStore('locale', () => {
  // State - use 'locale' key to match global navigation SSI include
  const locale = ref(localStorage.getItem('locale') || 'de')

  // Sync i18n instance and DOM when locale changes
  watch(locale, (newLocale) => {
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    i18n.global.locale.value = newLocale

    // Update SSI nav button active states
    document.querySelectorAll('.global-nav-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === newLocale)
    })

    // Translate all SSI elements using data-lang-de/data-lang-en pattern
    document.querySelectorAll('[data-lang-' + newLocale + ']').forEach(el => {
      el.textContent = el.getAttribute('data-lang-' + newLocale)
    })

    // Dispatch language-changed event so SSI partials can react
    window.dispatchEvent(new CustomEvent('language-changed', {
      detail: { lang: newLocale }
    }))
  }, { immediate: true })

  // Listen for language-changed custom events from SSI nav
  // SSI nav handles click → translateNav() → dispatches this event
  function handleLanguageChanged(event) {
    const newLocale = event.detail?.lang
    if (newLocale && ['de', 'en'].includes(newLocale) && newLocale !== locale.value) {
      locale.value = newLocale
    }
  }

  window.addEventListener('language-changed', handleLanguageChanged)

  // Actions
  function setLocale(newLocale) {
    if (['de', 'en'].includes(newLocale)) {
      locale.value = newLocale
    }
  }

  function cleanup() {
    window.removeEventListener('language-changed', handleLanguageChanged)
  }

  return {
    locale,
    setLocale,
    cleanup
  }
})
