import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

import { SITE } from './src/data/site.js'
import { PAGES, PAGE_LIST } from './src/data/pages.js'
import { buildJsonLd } from './src/lib/jsonld.js'

const absoluteUrl = (path) => `${SITE.url}${path === '/' ? '' : path}`

function headTags(page) {
  const url = absoluteUrl(page.path)
  return `
    <title>${page.title}</title>
    <meta name="description" content="${page.description}" />
    <link rel="canonical" href="${url}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE.url}${SITE.ogImage}" />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${SITE.url}${SITE.ogImage}" />

    <script type="application/ld+json">${JSON.stringify(buildJsonLd())}</script>`
}

/**
 * Bakes SEO into the built HTML.
 *
 * `transformIndexHtml` replaces the `<!--seo-->` placeholder with the home
 * page's tags and the generated structured data, so index.html never has to
 * repeat anything already declared in site.js or menu.js.
 *
 * `closeBundle` then copies that HTML into dist/<route>/index.html for every
 * other route, swapping in that route's tags. Netlify serves those files
 * directly, so a crawler requesting /menu gets menu-specific metadata without
 * executing any JavaScript. The SPA fallback in netlify.toml only kicks in for
 * paths that have no baked file.
 *
 * sitemap.xml and robots.txt are written here too, so they can't drift from
 * the route list or the domain in site.js.
 */
function seoRoutes() {
  // Resolved from Vite's own config rather than process.cwd(), so the plugin
  // is correct regardless of where the build is invoked from.
  let outRoot = 'dist'

  return {
    name: 'seo-routes',
    apply: 'build',

    configResolved(config) {
      outRoot = resolve(config.root, config.build.outDir)
    },

    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!--seo-->', headTags(PAGES.home)),
    },

    async closeBundle() {
      const root = outRoot
      const base = await readFile(resolve(root, 'index.html'), 'utf8')
      const homeTags = headTags(PAGES.home)

      for (const page of PAGE_LIST) {
        if (page.path === '/') continue
        const file = resolve(root, `.${page.path}/index.html`)
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, base.replace(homeTags, headTags(page)), 'utf8')
      }

      const urls = PAGE_LIST.map(
        (page) => `  <url>
    <loc>${absoluteUrl(page.path)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`
      ).join('\n')

      await writeFile(
        resolve(root, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
        'utf8'
      )

      await writeFile(
        resolve(root, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
        'utf8'
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoRoutes()],
})
