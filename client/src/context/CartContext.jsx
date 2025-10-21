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

async function createFreshCart(sessionId, setCartId, setCart) {
  const c = await api.cartCreate(sessionId)
  setCartId(c.id)
  localStorage.setItem('cart_id', String(c.id))
  setCart({ ...c, items: [] })
  return c.id
}

const patchCartItem = (cartState, itemId, updater) => {
  if (!cartState || !Array.isArray(cartState.items)) return cartState
  let changed = false
  const items = cartState.items.map(item => {
    if (item.id !== itemId) return item
    changed = true
    const next = typeof updater === 'function' ? updater(item) : { ...item, ...updater }
    return next
  })
  return changed ? { ...cartState, items } : cartState
}

const mergeCartItems = (prevCart, nextCart) => {
  if (!prevCart) return nextCart
  const prevOrder = Array.isArray(prevCart.items) ? prevCart.items.map(i => i.id) : []
  const nextItems = Array.isArray(nextCart?.items) ? nextCart.items : []
  if (!prevOrder.length) return nextCart
  const nextMap = new Map(nextItems.map(item => [item.id, item]))
  const merged = []
  for (const id of prevOrder) {
    if (nextMap.has(id)) {
      merged.push(nextMap.get(id))
      nextMap.delete(id)
    }
  }
  for (const item of nextItems) {
    if (nextMap.has(item.id)) {
      merged.push(item)
      nextMap.delete(item.id)
    }
  }
  return { ...nextCart, items: merged }
}

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(()=> Number(localStorage.getItem('cart_id')||0) || null)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cartError, setCartError] = useState(null)
  const [sessionId] = useState(()=> ensureSessionId())
  const snapshotCart = () => JSON.parse(JSON.stringify(cart))
  const restoreCart = (snap) => setCart(snap)
  const clearCartError = () => setCartError(null)

  useEffect(()=>{
    (async ()=>{
      try {
        setLoading(true)
        if (!cartId) {
          await createFreshCart(sessionId, setCartId, setCart)
        } else {
          try {
            const c = await api.cartGet(cartId, sessionId)
            setCart(prev => mergeCartItems(prev, c))
          } catch (e) {
            if (isNotFound(e)) {
              // local cart id is stale (DB reset/expired). Make a new cart transparently.
              localStorage.removeItem('cart_id')
              await createFreshCart(sessionId, setCartId, setCart)
            } else {
              throw e
            }
          }
        }
      } catch (e) {
        console.error('Cart init failed', e)
      } finally { setLoading(false) }
    })()
  }, [cartId, sessionId])

  const ensureCart = async () => {
    if (!cartId) {
      return await createFreshCart(sessionId, setCartId, setCart)
    }
    try {
      // quick ping to verify the cart still exists
      await api.cartGet(cartId, sessionId)
      return cartId
    } catch (e) {
      if (isNotFound(e)) {
        localStorage.removeItem('cart_id')
        return await createFreshCart(sessionId, setCartId, setCart)
      }
      throw e
    }
  }

  const addItem = async (menuItemOrId, { qty=1, notes=null, modifier_option_ids=[] }={}) => {
    clearCartError()
    const id = await ensureCart()

    const asObj = (typeof menuItemOrId === 'object' && menuItemOrId !== null) ? menuItemOrId : null
    const menu_item_id = asObj ? asObj.id : menuItemOrId
    const canOptimistic = !!(asObj && (asObj.price != null))

    const prev = snapshotCart()

    const optIds = Array.isArray(modifier_option_ids) ? [...modifier_option_ids].sort() : []
    const variantKey = `${menu_item_id}::${optIds.join(',') || 'base'}`

    const computeClientUnitPrice = () => {
      if (!asObj?.price) return null
      // Build a price lookup for modifier options from the provided menu item object
      const optionPriceMap = new Map()
      for (const g of asObj.modifier_groups || []) {
        for (const o of g.options || []) optionPriceMap.set(Number(o.id), Number(o.price_delta || 0))
      }
      const deltas = optIds.reduce((sum, oid) => sum + (optionPriceMap.get(Number(oid)) || 0), 0)
      return Number(asObj.price) + deltas
    }

    // --- optimistic update (only if we know unit price to avoid NaNs in totals) ---
    if (canOptimistic) {
      setCart((c)=>{
        const base = c ? { ...c } : { id, items: [], currency: 'USD' }
        const items = Array.isArray(base.items) ? [...base.items] : []
        const idx = items.findIndex(it => Number(it.menu_item_id) === Number(menu_item_id) && it.variant_key === variantKey)
        if (idx >= 0) {
          items[idx] = { ...items[idx], qty: (items[idx].qty || 0) + qty }
        } else {
          items.push({
            id: `temp-${crypto.randomUUID()}`,
            menu_item_id,
            name: asObj.name,
            unit_price: computeClientUnitPrice() ?? asObj.price,
            qty,
            notes,
            modifier_option_ids: optIds,
            variant_key: variantKey,
            _optimistic: true
          })
        }
        base.items = items
        return base
      })
    }

    try {
      await api.cartAddItem(id, sessionId, { menu_item_id, qty, notes, modifier_option_ids })
      // reconcile with server (source of truth)
      const updated = await api.cartGet(localStorage.getItem('cart_id'), sessionId)
      setCart(prev => mergeCartItems(prev, updated))
    } catch (e) {
      // rollback & surface error
      restoreCart(prev)
      setCartError(e?.message || 'Failed to add item to cart')
    }
  }

  const updateQty = async (item_id, qty) => {
    clearCartError()
    const id = await ensureCart()
    const safeQty = Math.max(1, Number.isFinite(qty) ? qty : 1)
    const previous = snapshotCart()
    setCart(curr => patchCartItem(curr, item_id, item => ({
      ...item,
      qty: safeQty,
      _pending: true
    })))
    try {
      await api.cartUpdateItem(id, item_id, sessionId, { qty: safeQty })
    } catch (e) {
      if (isNotFound(e)) {
        const newId = await createFreshCart(sessionId, setCartId, setCart)
        await api.cartUpdateItem(newId, item_id, sessionId, { qty: safeQty })
      } else {
        restoreCart(previous)
        throw e
      }
    }
    try {
      const fresh = await api.cartGet(localStorage.getItem('cart_id'), sessionId)
      setCart(prev => {
        const merged = mergeCartItems(prev, fresh)
        return patchCartItem(merged, item_id, item => {
          const { _pending, _optimistic, ...rest } = item
          return rest
        })
      })
    } catch (err) {
      restoreCart(previous)
      setCartError(err?.message || 'Failed to update quantity')
    }
  }

  const removeItem = async (item_id) => {
    const id = await ensureCart()
    const previous = snapshotCart()
    try {
      await api.cartDeleteItem(id, item_id, sessionId)
    } catch (e) {
      if (isNotFound(e)) {
        const newId = await createFreshCart(sessionId, setCartId, setCart)
        await api.cartDeleteItem(newId, item_id, sessionId)
      } else {
        restoreCart(previous)
        throw e
      }
    }
    try {
      const fresh = await api.cartGet(localStorage.getItem('cart_id'), sessionId)
      setCart(prev => mergeCartItems(prev, fresh))
    } catch (err) {
      restoreCart(previous)
      setCartError(err?.message || 'Failed to remove item')
    }
  }

  const totals = useMemo(()=>{
    const currency = cart?.currency || 'USD'
    const subtotal = (cart?.items||[]).reduce((sum, i)=> sum + Number(i.unit_price)*i.qty, 0)
    const tax = +(subtotal * 0.08).toFixed(2)
    const total = +(subtotal + tax).toFixed(2)
    return { currency, subtotal, tax, total, fmt: (n)=> fmtCurrency(n, currency) }
  }, [cart])

  return (
    <CartCtx.Provider value={{
      cartId,
      sessionId,
      cart,
      loading,
      addItem,
      updateQty,
      removeItem,
      cartError,
      clearCartError,
      totals
    }}>
      {children}
    </CartCtx.Provider>
  )
}
