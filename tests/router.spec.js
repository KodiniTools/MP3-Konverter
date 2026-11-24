import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import AppHeader from '../src/components/layout/AppHeader.vue'
import i18n from '../src/i18n'
import { createAppRouter, scrollBehavior } from '../src/router'

const SRC = join(__dirname, '..', 'src')
const read = (path) => readFileSync(join(SRC, path), 'utf8')

describe('Router: Landingpage und Anwendung', () => {
  it('ordnet / der Landingpage und /app bzw. /app/ der Anwendung zu', async () => {
    const router = createAppRouter(createMemoryHistory('/mp3konverter/'))
    expect(router.resolve('/').name).toBe('landing')
    expect(router.resolve('/app/').name).toBe('app')
    expect(router.resolve('/app').name).toBe('app')
    expect(router.resolve('/app/').meta.page).toBe('app')
    expect(router.resolve('/').meta.page).toBe('landing')
    expect(router.resolve({ name: 'app' }).href).toBe('/mp3konverter/app/')
  })

  it('leitet unbekannte Pfade auf die Landingpage um', async () => {
    const router = createAppRouter(createMemoryHistory('/mp3konverter/'))
    await router.push('/gibt-es-nicht')
    expect(router.currentRoute.value.name).toBe('landing')
  })

  it('scrollt zu Ankern, sonst nach oben, und stellt beim Zurück die Position wieder her', () => {
    expect(scrollBehavior({ hash: '#features' }, {}, null)).toEqual({ el: '#features', top: 16 })
    expect(scrollBehavior({ hash: '' }, {}, null)).toEqual({ top: 0 })
    expect(scrollBehavior({ hash: '' }, {}, { left: 0, top: 300 })).toEqual({ left: 0, top: 300 })
  })
})

describe('Seiteninhalt', () => {
  it('die Anwendung (/app/) enthält keine Landing-Abschnitte mehr', () => {
    const view = read('views/ConverterView.vue')
    for (const section of ['HeroSection', 'FeaturesSection', 'HowItWorksSection', 'OtherToolsSection', 'FAQSection', 'CtaSection']) {
      expect(view).not.toContain(section)
    }
    expect(view).toContain('<FileUpload')
    expect(view).toContain('<h1>')
  })

  it('die Landingpage zeigt das Bild und verlinkt die Anwendung', () => {
    const view = read('views/LandingView.vue')
    expect(view).toMatch(/<HeroSection \/>[\s\S]*<FeaturesSection \/>[\s\S]*<HowItWorksSection \/>[\s\S]*<FAQSection \/>/)
    expect(view).not.toContain('<FileUpload')
    const hero = read('components/layout/HeroSection.vue')
    expect(hero).toContain("assets/images/landing-hero-1536.webp")
    expect(hero).toContain(":to=\"{ name: 'app' }\"")
    expect(hero).toContain(":alt=\"$t('hero.imageAlt')\"")
  })

  it('App.vue rendert Skip-Link, Unternavigation und RouterView', () => {
    const app = read('App.vue')
    expect(app).toMatch(/<AppHeader \/>[\s\S]*<RouterView \/>/)
    expect(app).not.toContain('Section')
  })

  it('beide Sprachen haben die neuen Texte der Landingpage', async () => {
    const de = JSON.parse(read('locales/de.json'))
    const en = JSON.parse(read('locales/en.json'))
    for (const messages of [de, en]) {
      expect(messages.hero.imageAlt).toBeTruthy()
      expect(messages.hero.lead).toBeTruthy()
      expect(Object.keys(messages.howItWorks).sort()).toEqual(['configure', 'download', 'eyebrow', 'select', 'subtitle', 'title'])
      expect(Object.keys(messages.cta).sort()).toEqual(['button', 'text', 'title'])
    }
  })
})

describe('Unternavigation (AppHeader)', () => {
  async function mountAt(path) {
    const router = createAppRouter(createMemoryHistory('/mp3konverter/'))
    await router.push(path)
    await router.isReady()
    return mount(AppHeader, { global: { plugins: [router, i18n] } })
  }

  it('verlinkt Startseite und App und markiert die aktive Seite', async () => {
    const onApp = await mountAt('/app/')
    const links = onApp.findAll('a.app-header__link')
    expect(links.map((a) => a.attributes('href'))).toEqual(['/mp3konverter/', '/mp3konverter/app/'])
    expect(links.map((a) => a.text())).toEqual(['Startseite', 'App'])
    expect(links[1].classes()).toContain('app-header__link--active')
    expect(links[0].classes()).not.toContain('app-header__link--active')
    expect(links[1].attributes('aria-current')).toBe('page')

    const onLanding = await mountAt('/')
    expect(onLanding.findAll('a.app-header__link')[0].classes()).toContain('app-header__link--active')
  })
})
