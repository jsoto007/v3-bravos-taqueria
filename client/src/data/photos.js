/**
 * Photography slots from the redesign handoff.
 *
 * Every photo placement on the site reads from here. `src: null` renders a
 * styled placeholder (warm mat, caption) instead of a broken image — so the
 * site ships looking intentional, and dropping in real photography is a
 * one-line change: put the file in client/public/photos/ and set `src`.
 */

/** Home — kitchen teaser, portrait (1093:1600 in the handoff). */
export const KITCHEN_PHOTO = {
  src: null,
  alt: 'Freshly made tacos with cilantro, onions and salsa',
  label: 'The kitchen — tacos, the press, or the plancha',
}

/** About — six-photo gallery, 4:5 portrait crops. */
export const GALLERY_PHOTOS = [
  { src: null, alt: 'Tacos al pastor', label: 'Tacos al pastor' },
  { src: null, alt: 'The tortilla press', label: 'The tortilla press' },
  { src: null, alt: 'Salsas, morning batch', label: 'Salsas, morning batch' },
  { src: null, alt: 'A torta, cut', label: 'A torta, cut' },
  { src: null, alt: 'The counter', label: 'The counter' },
  { src: null, alt: 'Aguas frescas', label: 'Aguas frescas' },
]

/** Visit — storefront band, 21:9. */
export const STOREFRONT_PHOTO = {
  src: null,
  alt: 'The storefront',
  label: 'The storefront',
}
