import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, fmtCurrency } from '../lib/api'

const CartCtx = createContext(null)
export const useCart = ()=> useContext(CartCtx)

function ensureSessionId() {
  let sid = localStorage.getItem('session_id')
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('session_id', sid) }
  return sid
}

function isNotFound(err) {
  return (err && (err.status === 404 || /not found/i.test(err.message || "")))
}

async function createFreshCart(setCartId, setCart) {
  const c = await api.cartCreate(ensureSessionId())
  setCartId(c.id)
  localStorage.setItem('cart_id', String(c.id))
  setCart({ ...c, items: [] })
  return c.id
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
          await createFreshCart(setCartId, setCart)
        } else {
          try {
            const c = await api.cartGet(cartId)
            setCart(c)
          } catch (e) {
            if (isNotFound(e)) {
              // local cart id is stale (DB reset/expired). Make a new cart transparently.
              localStorage.removeItem('cart_id')
              await createFreshCart(setCartId, setCart)
            } else {
              throw e
            }
          }
        }
      } catch (e) {
        console.error('Cart init failed', e)
      } finally { setLoading(false) }
    })()
  }, [cartId])

  const ensureCart = async () => {
    if (!cartId) {
      return await createFreshCart(setCartId, setCart)
    }
    try {
      // quick ping to verify the cart still exists
      await api.cartGet(cartId)
      return cartId
    } catch (e) {
      if (isNotFound(e)) {
        localStorage.removeItem('cart_id')
        return await createFreshCart(setCartId, setCart)
      }
      throw e
    }
  }

  const addItem = async (menu_item_id, { qty=1, notes=null, modifier_option_ids=[] }={}) => {
    const id = await ensureCart()
    try {
      await api.cartAddItem(id, { menu_item_id, qty, notes, modifier_option_ids })
    } catch (e) {
      if (isNotFound(e)) {
        const newId = await createFreshCart(setCartId, setCart)
        await api.cartAddItem(newId, { menu_item_id, qty, notes, modifier_option_ids })
      } else {
        throw e
      }
    }
    const updated = await api.cartGet(localStorage.getItem('cart_id'))
    setCart(updated)
  }

  const updateQty = async (item_id, qty) => {
    const id = await ensureCart()
    try {
      await api.cartUpdateItem(id, item_id, { qty })
    } catch (e) {
      if (isNotFound(e)) {
        const newId = await createFreshCart(setCartId, setCart)
        await api.cartUpdateItem(newId, item_id, { qty })
      } else {
        throw e
      }
    }
    setCart(await api.cartGet(localStorage.getItem('cart_id')))
  }

  const removeItem = async (item_id) => {
    const id = await ensureCart()
    try {
      await api.cartDeleteItem(id, item_id)
    } catch (e) {
      if (isNotFound(e)) {
        const newId = await createFreshCart(setCartId, setCart)
        await api.cartDeleteItem(newId, item_id)
      } else {
        throw e
      }
    }
    setCart(await api.cartGet(localStorage.getItem('cart_id')))
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
