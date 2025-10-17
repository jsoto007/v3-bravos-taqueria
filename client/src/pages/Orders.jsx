import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import OrderCard from '../components/OrderCard'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    (async()=>{
      try { setOrders(await api.myOrders()) }
      catch(e){ setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div>Loading orders…</div>
  if (error) return <div className="text-rose-600">{error}</div>

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map(o=> <OrderCard key={o.id} order={o} />)}
      {orders.length===0 && <div className="text-slate-500">No orders yet.</div>}
    </div>
  )
}
