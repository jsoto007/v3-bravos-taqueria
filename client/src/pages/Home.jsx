import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import MenuCard from '../components/MenuCard'
import { useCart } from '../context/CartContext'

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
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold">Bravo's Taqueria</h1>
        <p className="mt-2 text-white/90">Fresh tacos, bowls, and more — order online for fast pickup or delivery.</p>
      </section>

      <h2 className="mt-8 mb-4 text-xl font-semibold">Featured</h2>
      {loading ? <div>Loading...</div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(it=> <MenuCard key={it.id} item={it} onAdd={(i)=> addItem(i.id)} />)}
        </div>
      )}
    </div>
  )
}
