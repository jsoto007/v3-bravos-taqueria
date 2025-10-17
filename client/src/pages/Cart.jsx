import React from 'react'
import { useCart } from '../context/CartContext'

export default function Cart(){
  const { cart, totals, updateQty, removeItem } = useCart()
  const items = cart?.items || []
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-white rounded-2xl shadow">
        <div className="p-4 border-b font-semibold">Your Cart</div>
        <ul className="divide-y">
          {items.length===0 && <li className="p-4 text-slate-500">Your cart is empty.</li>}
          {items.map(i=> (
            <li key={i.id} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-slate-600">{i.notes || ''}</div>
              </div>
              <input type="number" min={1} value={i.qty} onChange={e=> updateQty(i.id, Number(e.target.value||1))} className="w-20 border rounded px-2 py-1" />
              <div className="w-24 text-right">${(Number(i.unit_price)*i.qty).toFixed(2)}</div>
              <button onClick={()=> removeItem(i.id)} className="text-rose-600 text-sm">Remove</button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="bg-white rounded-2xl shadow p-4 h-fit sticky top-24">
        <div className="font-semibold mb-2">Summary</div>
        <div className="text-sm flex justify-between"><span>Subtotal</span><span>{totals.fmt(totals.subtotal)}</span></div>
        <div className="text-sm flex justify-between"><span>Tax</span><span>{totals.fmt(totals.tax)}</span></div>
        <div className="border-t mt-2 pt-2 flex justify-between font-semibold"><span>Total</span><span>{totals.fmt(totals.total)}</span></div>
        <a href="/checkout" className="mt-4 block text-center px-3 py-2 rounded bg-indigo-600 text-white">Proceed to Checkout</a>
      </aside>
    </div>
  )
}
