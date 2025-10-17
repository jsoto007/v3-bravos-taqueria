export const API_BASE = import.meta.env.VITE_API_BASE || '' // same origin by default

async function handle(res) {
  if (!res.ok) {
    let msg = 'Request failed'
    try { const data = await res.json(); msg = data.error || JSON.stringify(data) } catch {}
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  // Auth
  signup: (payload) => fetch(`${API_BASE}/api/signup`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  login:  (payload) => fetch(`${API_BASE}/api/login`,  { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  logout: () => fetch(`${API_BASE}/api/logout`, { method:'DELETE', credentials:'include' }).then(handle),
  me:     () => fetch(`${API_BASE}/api/check_session`, { credentials:'include' }).then(handle),

  // Public Menu
  categories: () => fetch(`${API_BASE}/api/categories`).then(handle),
  menu:       () => fetch(`${API_BASE}/api/menu`).then(handle),

  // Cart
  cartCreate: (session_id) => fetch(`${API_BASE}/api/carts`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ session_id }), credentials:'include' }).then(handle),
  cartGet:    (cart_id) => fetch(`${API_BASE}/api/carts/${cart_id}`, { credentials:'include' }).then(handle),
  cartAddItem:(cart_id, payload) => fetch(`${API_BASE}/api/carts/${cart_id}/items`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  cartUpdateItem:(cart_id, item_id, patch) => fetch(`${API_BASE}/api/carts/${cart_id}/items/${item_id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(patch), credentials:'include' }).then(handle),
  cartDeleteItem:(cart_id, item_id) => fetch(`${API_BASE}/api/carts/${cart_id}/items/${item_id}`, { method:'DELETE', credentials:'include' }).then(r=>r.ok),
  checkout:   (cart_id, payload) => fetch(`${API_BASE}/api/carts/${cart_id}/checkout`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),

  // Orders (user)
  myOrders:   () => fetch(`${API_BASE}/api/orders`, { credentials:'include' }).then(handle),
  orderById:  (id) => fetch(`${API_BASE}/api/orders/${id}`, { credentials:'include' }).then(handle),

  // Admin
  adminCreateInventoryItem: (payload) => fetch(`${API_BASE}/api/admin/inventory/items`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminCreateBatch: (payload) => fetch(`${API_BASE}/api/admin/inventory/batches`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminFoodCost: (menu_item_id) => fetch(`${API_BASE}/api/admin/food_cost/${menu_item_id}`, { credentials:'include' }).then(handle),
}

export function fmtCurrency(n, currency='USD') {
  const num = typeof n === 'string' ? Number(n) : n
  return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(Number.isFinite(num) ? num : 0)
}

export const sleep = (ms)=> new Promise(r=>setTimeout(r, ms))
