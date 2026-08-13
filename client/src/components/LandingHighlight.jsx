export default function LandingHighlight() {
  return (
    <section className="container-page py-20 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <figure className="overflow-hidden rounded-[2rem] bg-masa-200 shadow-[0_30px_70px_rgba(20,18,15,0.12)]">
          <img
            src="https://as1.ftcdn.net/v2/jpg/15/84/82/78/1000_F_1584827852_LN1bNHs3gzLEUMws0vcLE86sofUOiiCF.jpg"
            alt="Freshly made tacos with cilantro, onions and salsa"
            width="1000"
            height="667"
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </figure>

        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-chile-600">
            Authentic Mexican Flavor
          </p>
          <h2 className="text-3xl font-bold leading-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
            Fresh ingredients, true <span className="text-amber-brand">tradition</span>
          </h2>
          <p className="text-lg leading-relaxed text-charcoal-700">
            Every dish begins with real, natural ingredients and the recipes that shaped
            generations. Our cooks build bold, vibrant flavors using time-honored Mexican
            techniques.
          </p>
          <p className="text-lg leading-relaxed text-charcoal-700">
            From meats marinated in house to salsas made fresh each morning, we stay true
            to our roots &mdash; and with tortillas pressed to order, every bite captures the
            warmth and aroma of Mexico.
          </p>
        </div>
      </div>
    </section>
  )
}
