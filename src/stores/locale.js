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

  }, { immediate: true })

  // Listen for clicks on SSI nav language buttons (event delegation)
  // SSI nav buttons have class .global-nav-lang-btn with data-lang attribute
  function handleNavLangClick(event) {
    const btn = event.target.closest('.global-nav-lang-btn')
    if (!btn) return
    const newLocale = btn.getAttribute('data-lang')
    if (newLocale && ['de', 'en'].includes(newLocale) && newLocale !== locale.value) {
      locale.value = newLocale
    }
  }

  document.addEventListener('click', handleNavLangClick)

  // Actions
  function setLocale(newLocale) {
    if (['de', 'en'].includes(newLocale)) {
      locale.value = newLocale
    }
  }

  function cleanup() {
    document.removeEventListener('click', handleNavLangClick)
  }

  return {
    locale,
    setLocale,
    cleanup
  }
})
