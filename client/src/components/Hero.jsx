

export default function Hero() {

  return (
    <section className="relative grid place-items-center overflow-hidden w-screen -mx-[calc(50vw-50%)] bg-gradient-to-br from-black to-neutral-900 ">
      {/* Soft radial glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-1/3 size-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute right-[10%] bottom-[10%] size-[45vmax] translate-x-1/2 translate-y-1/2 rounded-full bg-rose-800/10 blur-3xl" />
      </div>

      <div className="mt-20 relative z-10 mx-auto max-w-5xl px-4 pt-6 text-center">
        <span className="inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold tracking-[0.15em] text-amber-400 uppercase">
          Est. 2025 • Bronx, NY
        </span>

        <h1 className="mt-6 text-5xl md:text-7xl font-extrabold leading-tight text-white tracking-tight">
          Elevated <span className="bg-gradient-to-br from-amber-400 to-amber-200 bg-clip-text text-transparent">Mexican</span>
          <br />
          Culinary Experience
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base md:text-lg leading-relaxed text-white/70">
          Where authentic tradition meets contemporary sophistication. Crafted with passion, served with pride.
        </p>

        <div className="mb-30 mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#order"
            className="inline-block rounded-full bg-amber-400 px-8 py-3 font-semibold text-black shadow-[0_10px_35px_rgba(251,191,36,0.4)] transition hover:-translate-y-0.5"
          >
            Start Your Order
          </a>
          <a
            href="#menu"
            className="inline-block rounded-full border border-white/20 px-8 py-3 font-semibold text-white/90 transition hover:border-amber-400 hover:bg-amber-400/10 hover:-translate-y-0.5"
          >
            Explore Menu
          </a>
        </div>
      </div>
    </section>
  );

}