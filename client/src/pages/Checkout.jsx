import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api } from '../lib/api'

export default function Checkout(){
  const { cartId, totals } = useCart()
  const [fulfillment, setFulfillment] = useState('pickup')
  const [tip, setTip] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const placeOrder = async ()=>{
    try {
      setLoading(true); setError('')
      const res = await api.checkout(cartId, { fulfillment, tip: Number(tip||0) })
      navigate(`/orders`)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-xl font-semibold">Checkout</h2>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm">Fulfillment</span>
          <select value={fulfillment} onChange={e=> setFulfillment(e.target.value)} className="mt-1 w-full border rounded px-2 py-1">
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Tip</span>
          <input type="number" min={0} value={tip} onChange={e=> setTip(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" />
        </label>
      </div>
      {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{totals.fmt(totals.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Tax</span><span>{totals.fmt(totals.tax)}</span></div>
        <div className="flex justify-between text-sm"><span>Tip</span><span>{totals.fmt(tip)}</span></div>
        <div className="flex justify-between font-semibold mt-2"><span>Grand Total</span><span>{totals.fmt(totals.tax + totals.subtotal + Number(tip||0))}</span></div>
        <button disabled={loading} onClick={placeOrder} className="mt-4 w-full px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">{loading? 'Placing…':'Place Order'}</button>
      </div>
    </div>
  )
}
