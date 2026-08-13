/**
 * Static menu data.
 *
 * Ported verbatim from the old Flask seed (server/seed.py) so prices and
 * bilingual descriptions match what was in the database. This is now the only
 * source of menu content — edit this file to change the menu, then redeploy.
 *
 * `slug` is used for anchor links (#tacos) and must stay stable: changing one
 * breaks any inbound link or bookmark pointing at that section.
 */

export const CATEGORIES = [
  {
    slug: 'tacos',
    name: 'Tacos',
    blurb: 'Pressed-to-order tortillas, your choice of meat.',
    items: [
      {
        name: 'Tacos',
        nameEs: 'Regulares',
        description: 'Cilantro and onions.',
        descriptionEs: 'Cilantro y cebolla.',
        price: 4.0,
      },
      {
        name: 'Tacos with Everything',
        nameEs: 'Con Todo',
        description: 'Cilantro, onions, cheese and sour cream.',
        descriptionEs: 'Cilantro, cebolla, queso y crema.',
        price: 4.5,
      },
    ],
  },
  {
    slug: 'tortas',
    name: 'Tortas',
    items: [
      {
        name: 'Tortas',
        description: 'Mexican sandwich with your choice of meat.',
        price: 9.0,
      },
    ],
  },
  {
    slug: 'quesadillas',
    name: 'Quesadillas',
    items: [
      {
        name: 'Quesadillas',
        description: 'Corn tortilla with melted cheese and your choice of meat.',
        price: 10.0,
      },
    ],
  },
  {
    slug: 'burritos',
    name: 'Burritos',
    items: [
      {
        name: 'Burritos',
        description: 'Flour tortilla with rice, beans, cheese and meat.',
        price: 10.0,
      },
    ],
  },
  {
    slug: 'flautas',
    name: 'Flautas',
    items: [
      {
        name: 'Flautas',
        portion: '4 per order / 4 por orden',
        description: 'Crispy rolled tacos filled with meat.',
        price: 8.0,
      },
    ],
  },
  {
    slug: 'tostadas',
    name: 'Tostadas',
    items: [
      {
        name: 'Tostadas',
        description: 'Crispy flat tortilla topped with beans, lettuce, cheese and meat.',
        price: 4.0,
      },
    ],
  },
  {
    slug: 'sopes',
    name: 'Sopes',
    items: [
      {
        name: 'Sopes',
        description: 'Thick corn base topped with beans, lettuce, cheese and meat.',
        price: 5.0,
      },
    ],
  },
  {
    slug: 'nachos',
    name: 'Nachos',
    items: [
      {
        name: 'Nachos',
        description:
          'Corn chips with cheese, avocado, beans, jalapeños, sour cream and your choice of meat.',
        price: 13.0,
      },
    ],
  },
  {
    slug: 'gorditas',
    name: 'Gorditas',
    items: [
      {
        name: 'Gorditas',
        description: 'Stuffed corn pockets with meat, cheese and lettuce.',
        price: 5.0,
      },
    ],
  },
  {
    slug: 'picaditas',
    name: 'Picaditas',
    items: [
      {
        name: 'Picaditas',
        portion: '3 per order / 3 por orden',
        description: 'Corn bases with salsa, cheese and meat.',
        price: 10.0,
      },
    ],
  },
  {
    slug: 'sides',
    name: 'Sides',
    items: [
      {
        name: 'Guacamole with Chips',
        description: 'Fresh guacamole served with chips.',
        price: 10.0,
      },
    ],
  },
  {
    slug: 'drinks',
    name: 'Drinks',
    items: [
      { name: 'Canned Sodas', description: 'Assorted canned sodas.', price: 1.5 },
      { name: 'Bottle Sodas', description: 'Assorted bottled sodas.', price: 3.0 },
      {
        name: 'Aguas Frescas',
        nameEs: 'Flavored Waters',
        description: 'House-made aguas frescas, rotating flavors.',
        price: 5.0,
      },
    ],
  },
]

/**
 * Meat and add-on pricing. On the old site these were checkboxes in the
 * add-to-cart modal; with ordering removed they become printed menu
 * information, which is what a customer reading the menu actually needs.
 */
export const CHOICES = [
  {
    name: 'Choice of Meat',
    nameEs: 'Elección de Carne',
    note: 'Available on tacos, tortas, quesadillas, burritos, flautas, tostadas, sopes, nachos, gorditas and picaditas.',
    options: [
      { name: 'Chicken', nameEs: 'Pollo', price: 1.5 },
      { name: 'Steak', nameEs: 'Bistec', price: 2.0 },
      { name: 'Pork', nameEs: 'Puerco', detail: 'Enchilada · Al Pastor · Carnitas', price: 1.75 },
      { name: 'Chorizo', price: 1.75 },
    ],
  },
  {
    name: 'Add-ons',
    nameEs: 'Extras',
    options: [
      { name: 'Cheese', nameEs: 'Queso', price: 1.0 },
      { name: 'Sour Cream', nameEs: 'Crema', price: 0.75 },
      { name: 'Guacamole', price: 1.5 },
      { name: 'Extra Meat', nameEs: 'Doble Carne', price: 2.0 },
    ],
  },
]

/** Shown in the "Best Sellers" strip on the home page. */
export const FEATURED_SLUGS = ['tacos', 'tortas', 'quesadillas', 'burritos', 'nachos', 'sides']

export const FEATURED = FEATURED_SLUGS.map((slug) => {
  const category = CATEGORIES.find((c) => c.slug === slug)
  return { ...category.items[0], slug, category: category.name }
})

/** Flat list of every item — used to build the JSON-LD menu graph. */
export const ALL_ITEMS = CATEGORIES.flatMap((c) =>
  c.items.map((item) => ({ ...item, category: c.name }))
)
