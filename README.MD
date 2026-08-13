# Bravo's Taqueria

Static marketing site for Bravo's Taqueria — Bronx, NY. React + Vite + Tailwind v4,
deployed on Netlify. **No backend, no database, no online ordering.**

## Before you go live

Open [`client/src/data/site.js`](client/src/data/site.js) and replace every value
marked `PLACEHOLDER`:

| Field | Why it matters |
| --- | --- |
| `url` | Canonical URLs, `sitemap.xml`, `og:url`. Must be the real domain. |
| `phone` / `tel` | Every call-to-action on the site dials this. |
| `address` | Shown on the page **and** in the Google local rich result. |
| `geo` | Map pin position in structured data. |
| `hours` | Shown on the page and in the "Hours" rich result. |
| `social` | Links your site to existing Google Business / Instagram profiles. |

Nothing else needs editing for the business details to be correct everywhere —
the footer, the Visit section, and all structured data read from that one file.

## Local development

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to client/dist
npm run preview  # serve the production build
```

## Editing the menu

All menu content lives in [`client/src/data/menu.js`](client/src/data/menu.js).
Edit it and redeploy — prices, descriptions, categories and the meat/add-on
pricing all come from there, and the structured data regenerates from it
automatically at build time.

Category `slug` values are used as URL anchors (`/menu#tacos`). Changing one
breaks any existing inbound link to that section.

## How SEO is wired up

- `client/index.html` holds only the tags that never change. Title, description,
  canonical, Open Graph, Twitter and JSON-LD are injected at build time by the
  `seoRoutes` plugin in `client/vite.config.js`.
- That plugin also writes a **separate static HTML file per route** (e.g.
  `dist/menu/index.html`) with that route's own metadata. Crawlers that don't
  execute JavaScript — Facebook, Slack, iMessage, LinkedIn — get correct
  previews without the SPA having to boot.
- `sitemap.xml` and `robots.txt` are generated from the route list and `SITE.url`,
  so they can't drift.
- Routes are declared once in `client/src/data/pages.js`. Add a route there and
  the static file, the sitemap and the client-side title updates all follow.
- `client/public/og-image.png` (1200×630) is the social share image. To change it,
  replace the file — keep the dimensions.

## Deployment (Netlify)

`netlify.toml` at the repo root is already configured: base `client`, publish
`dist`, SPA fallback, cache headers and security headers. Point Netlify at this
repo and it builds with no further setup.

The SPA fallback is a catch-all, so it must remain the **last** redirect rule.
Static files that exist on disk are served before redirects are consulted, which
is what lets the pre-baked `/menu` HTML win over the fallback.
