import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, fmtCurrency } from '../lib/api'

const CartCtx = createContext(null)
export const useCart = ()=> useContext(CartCtx)

function ensureSessionId() {
  let sid = localStorage.getItem('session_id')
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('session_id', sid) }
  return sid
}

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(()=> Number(localStorage.getItem('cart_id')||0) || null)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async ()=>{
      try {
        setLoading(true)
        if (!cartId) {
          const c = await api.cartCreate(ensureSessionId())
          setCartId(c.id); localStorage.setItem('cart_id', String(c.id))
          setCart({ ...c, items: [] })
        } else {
          const c = await api.cartGet(cartId)
          setCart(c)
        }
      } catch (e) {
        console.error('Cart init failed', e)
      } finally { setLoading(false) }
    })()
  }, [cartId])

  const addItem = async (menu_item_id, { qty=1, notes=null, modifier_option_ids=[] }={}) => {
    if (!cartId) return
    await api.cartAddItem(cartId, { menu_item_id, qty, notes, modifier_option_ids })
    const updated = await api.cartGet(cartId)
    setCart(updated)
  }

  const updateQty = async (item_id, qty) => {
    if (!cartId) return
    await api.cartUpdateItem(cartId, item_id, { qty })
    setCart(await api.cartGet(cartId))
  }

  const removeItem = async (item_id) => {
    if (!cartId) return
    await api.cartDeleteItem(cartId, item_id)
    setCart(await api.cartGet(cartId))
  }

  const totals = useMemo(()=>{
    const currency = cart?.currency || 'USD'
    const subtotal = (cart?.items||[]).reduce((sum, i)=> sum + Number(i.unit_price)*i.qty, 0)
    const tax = +(subtotal * 0.08).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { currency, subtotal, tax, total, fmt: (n)=> fmtCurrency(n, currency) }
  }, [cart])

  return (
    <CartCtx.Provider value={{ cartId, cart, loading, addItem, updateQty, removeItem, totals }}>
      {children}
    </CartCtx.Provider>
  )
}
