import { useEffect } from 'react'
import { SITE } from '../data/site.js'
import { PAGES } from '../data/pages.js'

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, name, key] = selector.match(/\[(.+?)="(.+?)"\]/) || []
    if (name && key) el.setAttribute(name, key)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/**
 * Keeps the document head in sync on client-side navigation.
 *
 * The build already writes correct static meta into each route's HTML file, so
 * this exists for the SPA transitions after first paint — it's what makes the
 * browser tab title and any in-page share action correct when a visitor clicks
 * from Home to Menu without a full reload.
 */
export function useSeo(pageKey) {
  useEffect(() => {
    const page = PAGES[pageKey]
    if (!page) return

    const url = `${SITE.url}${page.path === '/' ? '' : page.path}`

    document.title = page.title
    setMeta('meta[name="description"]', 'content', page.description)
    setMeta('meta[property="og:title"]', 'content', page.title)
    setMeta('meta[property="og:description"]', 'content', page.description)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[name="twitter:title"]', 'content', page.title)
    setMeta('meta[name="twitter:description"]', 'content', page.description)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [pageKey])
}
