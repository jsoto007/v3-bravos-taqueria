import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import MenuCard from '../components/MenuCard'
import { useCart } from '../context/CartContext'
import Hero from '../components/Hero'
import LandingHighlight from '../components/LandingHighlight'
import FadeIn from '../utils/FadeIn'
import { Link } from 'react-router-dom'

export default function Home(){
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(()=>{
    (async()=>{
      try {
        const items = await api.menu()
        setFeatured(items.slice(0,6))
      } finally { setLoading(false) }
    })()
  }, [])

  return (
    
    <div>
      <FadeIn>
          <Hero />
          <LandingHighlight />
          <section className="mt-12 mb-4 w-full">
            <div className="flex flex-col items-start gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.6em] text-amber-500">Our menu</p>
                <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                  Best Sellers
                </h2>
              </div>
              <p className="text-sm text-slate-500 sm:text-right">
                Handcrafted favorites that keep people coming back.
              </p>
            </div>
          </section>
          {loading ? <div>Loading...</div> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map(it => (
                  <MenuCard key={it.id} item={it} onAdd={(i) => addItem(i.id)} />
                ))}
              </div>
          )}
          {/* Explore full menu button */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/menu"
              aria-label="Explore the full menu"
              className="inline-flex items-center justify-center rounded-md bg-amber-400 text-black px-5 py-3 font-medium shadow hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              Explore our full menu →
            </Link>
          </div>
      </FadeIn>
    </div>
  )
}
