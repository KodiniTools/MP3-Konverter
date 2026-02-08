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

  // Intercept SSI nav language button clicks in capture phase
  // This runs before the SSI nav's bubbling handler, preventing window.location.reload()
  function handleLangClick(event) {
    const btn = event.target.closest('.global-nav-lang-btn')
    if (!btn) return

    event.stopPropagation()
    event.preventDefault()

    const targetLang = btn.getAttribute('data-lang')
    if (targetLang && ['de', 'en'].includes(targetLang) && targetLang !== locale.value) {
      locale.value = targetLang
    }
  }

  document.addEventListener('click', handleLangClick, true)

  // Listen for locale-changed custom events (mirrors theme-changed pattern)
  function handleLocaleChanged(event) {
    const newLocale = event.detail?.locale
    if (newLocale && ['de', 'en'].includes(newLocale) && newLocale !== locale.value) {
      locale.value = newLocale
    }
  }

  window.addEventListener('locale-changed', handleLocaleChanged)

  // Actions
  function setLocale(newLocale) {
    if (['de', 'en'].includes(newLocale)) {
      locale.value = newLocale
    }
  }

  function cleanup() {
    document.removeEventListener('click', handleLangClick, true)
    window.removeEventListener('locale-changed', handleLocaleChanged)
  }

  return {
    locale,
    setLocale,
    cleanup
  }
})
