import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import MenuCard from '../components/MenuCard'
import { useCart } from '../context/CartContext'
import Hero from '../components/Hero'
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
          <h2 className="mt-8 mb-4 text-xl font-semibold">Featured</h2>
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
