import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'

/**
 * Seiten des MP3 Konverters (Basis /mp3konverter/ aus vite.config.js):
 * - `/`     Landingpage mit Bild, Funktionen, Ablauf, weiteren Tools und FAQ
 * - `/app/` reine Konvertierungsanwendung (lazy geladen, eigener Chunk)
 *
 * `meta.page` wählt Titel, Beschreibung und Canonical der Seite (config/pageMeta.js).
 * Der Build legt zusätzlich dist/app/index.html an, damit nginx /mp3konverter/app/
 * ohne eigene Fallback-Regel ausliefert.
 */
export const routes = [
  { path: '/', name: 'landing', component: LandingView, meta: { page: 'landing' } },
  {
    path: '/app/',
    name: 'app',
    component: () => import('../views/ConverterView.vue'),
    meta: { page: 'app' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

/** Anker (#features) weich ansteuern, sonst nach oben; Zurück stellt die Position wieder her. */
export function scrollBehavior(to, _from, savedPosition) {
  if (savedPosition) return savedPosition
  if (to.hash) return { el: to.hash, top: 16 }
  return { top: 0 }
}

/** @param {import('vue-router').RouterHistory} [history] */
export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  return createRouter({ history, routes, scrollBehavior })
}
