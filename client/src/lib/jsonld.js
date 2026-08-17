import { SITE } from '../data/site.js'
import { CATEGORIES } from '../data/menu.js'

/**
 * Builds the schema.org graph injected into every page at build time.
 *
 * The `Restaurant` node is what powers the local rich result (hours, phone,
 * price range, map pin). The `Menu` node lets Google surface individual dishes.
 * Both are generated from site.js / menu.js so they can never drift from what
 * the page actually displays — which is the usual way structured data goes
 * stale and starts getting ignored.
 */
export function buildJsonLd() {
  const restaurantId = `${SITE.url}/#restaurant`

  const restaurant = {
    '@type': 'Restaurant',
    '@id': restaurantId,
    name: SITE.name,
    legalName: SITE.legalName,
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.tel,
    priceRange: SITE.priceRange,
    servesCuisine: SITE.cuisine,
    image: `${SITE.url}${SITE.ogImage}`,
    logo: `${SITE.url}/bravos-logo.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    openingHoursSpecification: SITE.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    hasMenu: { '@id': `${SITE.url}/menu#menu` },
    acceptsReservations: false,
  }

  if (SITE.email) restaurant.email = SITE.email
  if (SITE.social.length) restaurant.sameAs = SITE.social.map((s) => s.url)

  const menu = {
    '@type': 'Menu',
    '@id': `${SITE.url}/menu#menu`,
    name: `${SITE.name} Menu`,
    inLanguage: 'en',
    hasMenuSection: CATEGORIES.map((category) => ({
      '@type': 'MenuSection',
      name: category.name,
      hasMenuItem: category.items.map((item) => ({
        '@type': 'MenuItem',
        name: item.name,
        description: item.description,
        offers: {
          '@type': 'Offer',
          price: item.price.toFixed(2),
          priceCurrency: 'USD',
        },
      })),
    })),
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    publisher: { '@id': restaurantId },
  }

  return { '@context': 'https://schema.org', '@graph': [restaurant, menu, website] }
}
