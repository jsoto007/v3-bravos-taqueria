/**
 * Single source of truth for business info.
 *
 * ⚠️  TODO — replace every value marked `PLACEHOLDER` with the real details
 * before going live. These feed the footer, the "Visit us" section, AND the
 * structured data (JSON-LD) that Google uses for local search, Maps, and the
 * rich result that shows your hours and phone number. Wrong values here mean
 * wrong values in search results.
 */

export const SITE = {
  name: "Bravo's Taqueria",
  legalName: "Bravo's Taqueria Corp",
  tagline: 'Authentic Mexican, made fresh daily in the Bronx',
  description:
    "Authentic Mexican taqueria in the Bronx, NY. Tacos, tortas, quesadillas, burritos, sopes and gorditas made to order with house-marinated meats, fresh salsas and tortillas pressed to order.",

  // PLACEHOLDER — set this to the real Netlify/custom domain (no trailing slash).
  // Used for canonical URLs, sitemap.xml, and og:url. Must be correct or
  // social previews and canonicalisation break.
  url: 'https://bravostaqueria.netlify.app',

  // PLACEHOLDER — real phone number.
  // `tel` is what the click-to-call link dials; keep it E.164.
  phone: '(718) 555-0123',
  tel: '+17185550123',

  // PLACEHOLDER — real email, or set to null to hide it in the footer.
  email: null,

  // PLACEHOLDER — real street address.
  address: {
    street: '000 Example Ave',
    locality: 'Bronx',
    region: 'NY',
    postalCode: '10451',
    country: 'US',
  },

  // PLACEHOLDER — real coordinates (right-click the pin in Google Maps → copy).
  geo: { lat: 40.8448, lng: -73.8648 },

  // PLACEHOLDER — real opening hours.
  // `days` uses schema.org day names; keep them accurate for the rich result.
  hours: [
    { label: 'Monday – Thursday', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '10:00', closes: '21:00' },
    { label: 'Friday – Saturday', days: ['Friday', 'Saturday'], opens: '10:00', closes: '23:00' },
    { label: 'Sunday', days: ['Sunday'], opens: '10:00', closes: '20:00' },
  ],

  // PLACEHOLDER — real profile URLs, or leave the array empty.
  // These become schema.org `sameAs`, which helps Google link the site to your
  // existing Google Business / Yelp / Instagram presence.
  social: [
    // { name: 'Instagram', url: 'https://instagram.com/...' },
    // { name: 'Facebook', url: 'https://facebook.com/...' },
  ],

  priceRange: '$',
  cuisine: ['Mexican', 'Latin American', 'Taqueria'],

  // Absolute URL of the social share image. See public/og-image.svg note.
  ogImage: '/og-image.png',
}

/** "000 Example Ave, Bronx, NY 10451" */
export const formattedAddress = [
  SITE.address.street,
  `${SITE.address.locality}, ${SITE.address.region} ${SITE.address.postalCode}`,
].join(', ')

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SITE.name} ${formattedAddress}`
)}`
