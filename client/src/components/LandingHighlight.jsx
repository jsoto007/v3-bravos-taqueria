import React from 'react'

export default function LandingHighlight() {
  return (
    <section className="mt-12 px-2 sm:px-6 lg:px-2">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 rounded-[46px] bg-gradient-to-br from-amber-50 to-stone-100 p-10 shadow-[0_50px_110px_rgba(15,23,42,0.15)] lg:flex-row lg:items-stretch">
        <div className="flex-1 overflow-hidden rounded-[36px] bg-white shadow-[0_25px_60px_rgba(15,23,42,0.1)]">
          <figure className="h-full border-[8px] border-white bg-stone-50 rounded-[36px] overflow-hidden">
            <img
              className="h-full w-full object-cover rounded-lg"
              src="https://as1.ftcdn.net/v2/jpg/15/84/82/78/1000_F_1584827852_LN1bNHs3gzLEUMws0vcLE86sofUOiiCF.jpg"
              alt="Bravo’s Taqueria tacos"
            />
          </figure>
        </div>

        <div className="flex-1 space-y-6">
          <p className="text-sm uppercase tracking-[0.6em] text-amber-600">Authentic Mexican Flavor</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Bravo’s Taqueria: Fresh Ingredients, True <span className="text-amber-500">Tradition</span>
          </h2>
          <p className="text-lg text-slate-700">
            At Bravo’s Taqueria, every dish begins with real, natural ingredients and the recipes that shaped generations. Our chefs craft bold, vibrant flavors using time-honored Mexican techniques, brought to life with a clean, modern touch.
          </p>
          <p className="text-lg text-slate-700">
            From meats marinated in-house to salsas built fresh each morning, we stay true to our roots. And with tortillas pressed to order, every bite captures the warmth, aroma, and authenticity of Mexico — served with pride, every single time.
          </p>
        </div>
      </div>
    </section>
  )
}
