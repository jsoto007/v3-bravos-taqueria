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

const JSON_HEADERS = { 'Content-Type':'application/json' }

const withSessionQuery = (url, session_id) => {
  const u = new URL(url, window.location.origin)
  if (session_id) {
    u.searchParams.set('session_id', session_id)
  }
  return u.toString().replace(window.location.origin, '')
}

export const api = {
  // Auth
  signup: (payload) => fetch(`${API_BASE}/api/signup`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  login:  (payload) => fetch(`${API_BASE}/api/login`,  { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  logout: () => fetch(`${API_BASE}/api/logout`, { method:'DELETE', credentials:'include' }).then(handle),
  me:     () => fetch(`${API_BASE}/api/check_session`, { credentials:'include' }).then(handle),

  // Public Menu
  categories: () => fetch(`${API_BASE}/api/categories`).then(handle),
  menu:       () => fetch(`${API_BASE}/api/menu`).then(handle),

  // Cart
  cartCreate: (session_id) => fetch(`${API_BASE}/api/carts`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify({ session_id }), credentials:'include' }).then(handle),
  cartGet:    (cart_id, session_id) => fetch(`${API_BASE}${withSessionQuery(`/api/carts/${cart_id}`, session_id)}`, { credentials:'include' }).then(handle),
  cartAddItem:(cart_id, session_id, payload) => fetch(`${API_BASE}/api/carts/${cart_id}/items`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify({ ...payload, session_id }), credentials:'include' }).then(handle),
  cartUpdateItem:(cart_id, item_id, session_id, patch) => fetch(`${API_BASE}/api/carts/${cart_id}/items/${item_id}`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify({ ...patch, session_id }), credentials:'include' }).then(handle),
  cartDeleteItem:(cart_id, item_id, session_id) => fetch(`${API_BASE}${withSessionQuery(`/api/carts/${cart_id}/items/${item_id}`, session_id)}`, { method:'DELETE', headers:JSON_HEADERS, body: JSON.stringify({ session_id }), credentials:'include' }).then(handle),
  checkout:   (...args) => {
    let cid
    let sid
    let payload = {}

    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      const { cart_id, cartId, session_id, sessionId, ...rest } = args[0]
      cid = cart_id ?? cartId
      sid = session_id ?? sessionId
      payload = rest
    } else {
      ;[cid, sid, payload = {}] = args
    }

    if (cid == null) {
      return Promise.reject(new Error('cart_id is required for checkout'))
    }
    const body = {
      cart_id: cid,
      session_id: sid,
      ...payload,
    }
    return fetch(`${API_BASE}/api/checkout/prepare`, {
      method:'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
      credentials:'include'
    }).then(handle)
  },

  // Orders (user)
  myOrders:   (session_id) => fetch(`${API_BASE}${withSessionQuery('/api/orders', session_id)}`, { credentials:'include' }).then(handle),
  orderById:  (id, session_id) => fetch(`${API_BASE}${withSessionQuery(`/api/orders/${id}`, session_id)}`, { credentials:'include' }).then(handle),

  // Admin
  adminCreateInventoryItem: (payload) => fetch(`${API_BASE}/api/admin/inventory/items`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminCreateBatch: (payload) => fetch(`${API_BASE}/api/admin/inventory/batches`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminFoodCost: (menu_item_id) => fetch(`${API_BASE}/api/admin/food_cost/${menu_item_id}`, { credentials:'include' }).then(handle),
  adminOrders: (params = {}) => {
    const url = new URL('/api/admin/orders', window.location.origin)
    if (params.status) url.searchParams.set('status', params.status)
    if (params.limit) url.searchParams.set('limit', params.limit)
    const relative = url.pathname + url.search
    return fetch(`${API_BASE}${relative}`, { credentials:'include' }).then(handle)
  },
  adminUpdateOrderStatus: (order_id, status) =>
    fetch(`${API_BASE}/api/admin/orders/${order_id}/status`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({ status }),
      credentials: 'include',
    }).then(handle),
}

export function fmtCurrency(n, currency='USD') {
  const num = typeof n === 'string' ? Number(n) : n
  return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(Number.isFinite(num) ? num : 0)
}

export const sleep = (ms)=> new Promise(r=>setTimeout(r, ms))
