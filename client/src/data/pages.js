import { SITE } from './site.js'

/**
 * Per-route metadata, shared by two consumers:
 *  1. `useSeo()` in the browser, which updates the head on client-side nav.
 *  2. The `seoRoutes` Vite plugin, which bakes a static HTML file per route at
 *     build time so crawlers that don't run JS (Facebook, Slack, iMessage,
 *     LinkedIn) still get the right title, description and preview image.
 *
 * Adding a route? Add it here and it is picked up by both, plus sitemap.xml.
 */
export const PAGES = {
  home: {
    path: '/',
    title: `${SITE.name} | Authentic Mexican Tacos & Tortas in the Bronx, NY`,
    description: SITE.description,
  },
  menu: {
    path: '/menu',
    title: `Menu | ${SITE.name} — Tacos, Tortas, Burritos & More`,
    description:
      "See the full Bravo's Taqueria menu: tacos from $4, tortas, quesadillas, burritos, flautas, tostadas, sopes, gorditas, nachos and house-made aguas frescas. Choice of chicken, steak, pork or chorizo.",
  },
  about: {
    path: '/about',
    title: `About | ${SITE.name} — Our Story`,
    description:
      "The story behind Bravo's Taqueria in the Bronx: real ingredients, meats marinated in house, salsas made fresh each morning, and tortillas pressed the moment you order.",
  },
  visit: {
    path: '/visit',
    title: `Visit | ${SITE.name} — Hours, Location & Phone`,
    description:
      "Find Bravo's Taqueria in the Bronx, NY — street address, opening hours seven days a week, and the phone number to call ahead so your pickup order is ready when you arrive.",
  },
}

export const PAGE_LIST = Object.values(PAGES)
