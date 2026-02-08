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
  }, { immediate: true })

  // Handle SSI nav language button clicks in capture phase
  // Updates vue-i18n immediately; SSI nav's own handler translates data-nav-i18n elements
  function handleLangClick(event) {
    const btn = event.target.closest('.global-nav-lang-btn')
    if (!btn) return

    const targetLang = btn.getAttribute('data-lang')
    if (targetLang && ['de', 'en'].includes(targetLang) && targetLang !== locale.value) {
      locale.value = targetLang
    }
  }

  document.addEventListener('click', handleLangClick, true)

  // Listen for language-changed custom events from SSI nav
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
    document.removeEventListener('click', handleLangClick, true)
    window.removeEventListener('language-changed', handleLanguageChanged)
  }

  return {
    locale,
    setLocale,
    cleanup
  }
})
