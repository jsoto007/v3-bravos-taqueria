/**
 * Photography slots from the redesign handoff.
 *
 * Every photo placement on the site reads from here. `src: null` renders a
 * styled placeholder (warm mat, caption) instead of a broken image — so the
 * site ships looking intentional, and dropping in real photography is a
 * one-line change: put the file in client/public/photos/ and set `src`.
 *
 * Current state: the truck shot is the client's real photo. The About gallery
 * uses brand-styled illustrations (drawn to match the logo) as stand-ins
 * until the client sends real photography — swap each `src` when it arrives.
 *
 * `position` (optional) is passed to CSS object-position to choose which part
 * of a photo survives the crop; useful when one image feeds slots with
 * different aspect ratios.
 */

/** Home — kitchen teaser, portrait (1093:1600 in the handoff). */
export const KITCHEN_PHOTO = {
  src: '/photos/taco-truck-night.jpg',
  alt: "The Bravo's Taqueria truck at night, serving window lit",
  position: 'center 45%',
}

/** About — six-photo gallery, 4:5 portrait crops. */
export const GALLERY_PHOTOS = [
  {
    src: '/photos/illustration-pastor.svg',
    alt: 'Al pastor trompo illustration',
    label: 'Tacos al pastor',
  },
  {
    src: '/photos/illustration-press.svg',
    alt: 'Tortilla press illustration',
    label: 'The tortilla press',
  },
  {
    src: '/photos/illustration-salsas.svg',
    alt: 'Molcajete with fresh salsas illustration',
    label: 'Salsas, morning batch',
  },
  {
    src: '/photos/illustration-torta.svg',
    alt: 'Torta on a telera roll illustration',
    label: 'A torta, cut',
  },
  {
    src: '/photos/illustration-counter.svg',
    alt: 'The order counter illustration',
    label: 'The counter',
  },
  {
    src: '/photos/illustration-aguas.svg',
    alt: 'Aguas frescas jars illustration',
    label: 'Aguas frescas',
  },
]

/** Visit — storefront band, 21:9. The truck is the storefront. */
export const STOREFRONT_PHOTO = {
  src: '/photos/taco-truck-night.jpg',
  alt: "The Bravo's Taqueria truck parked curbside at night",
  position: 'center 47%',
  label: 'The storefront',
}
