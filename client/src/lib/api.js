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

const buildQuery = (params = {}) => {
  const qp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qp.set(key, value)
    }
  })
  const queryString = qp.toString()
  return queryString ? `?${queryString}` : ''
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
  checkout:   (payload) => fetch(`${API_BASE}/api/checkout/prepare`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),

  // Orders (user)
  myOrders:   () => fetch(`${API_BASE}/api/orders`, { credentials:'include' }).then(handle),
  orderById:  (id) => fetch(`${API_BASE}/api/orders/${id}`, { credentials:'include' }).then(handle),

  adminOrders: (params = {}) => fetch(`${API_BASE}/api/admin/orders${buildQuery(params)}`, { credentials:'include' }).then(handle),
  adminOrderDetail: (id) => fetch(`${API_BASE}/api/admin/orders/${id}`, { credentials:'include' }).then(handle),
  adminCreateOrder: (payload) => fetch(`${API_BASE}/api/admin/orders`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminUpdateOrder: (id, payload) => fetch(`${API_BASE}/api/admin/orders/${id}`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminDeleteOrder: (id) => fetch(`${API_BASE}/api/admin/orders/${id}`, { method:'DELETE', credentials:'include' }).then(handle),

  adminInventoryList: (params = {}) => fetch(`${API_BASE}/api/inventory${buildQuery(params)}`, { credentials:'include' }).then(handle),
  adminInventoryCreate: (payload) => fetch(`${API_BASE}/api/inventory`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryDetail: (id) => fetch(`${API_BASE}/api/inventory/${id}`, { credentials:'include' }).then(handle),
  adminInventoryUpdate: (id, payload) => fetch(`${API_BASE}/api/inventory/${id}`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryDelete: (id) => fetch(`${API_BASE}/api/inventory/${id}`, { method:'DELETE', credentials:'include' }).then(handle),
  adminInventoryAddBatch: (itemId, payload) => fetch(`${API_BASE}/api/inventory/${itemId}/batches`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryUpdateBatch: (batchId, payload) => fetch(`${API_BASE}/api/inventory/batches/${batchId}`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryDeleteBatch: (batchId) => fetch(`${API_BASE}/api/inventory/batches/${batchId}`, { method:'DELETE', credentials:'include' }).then(handle),

  adminInventoryAuditSessions: () => fetch(`${API_BASE}/api/inventory/audits`, { credentials:'include' }).then(handle),
  adminInventoryAuditCreate: (payload) => fetch(`${API_BASE}/api/inventory/audits`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryAuditDetail: (id) => fetch(`${API_BASE}/api/inventory/audits/${id}`, { credentials:'include' }).then(handle),
  adminInventoryAuditUpdate: (id, payload) => fetch(`${API_BASE}/api/inventory/audits/${id}`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),
  adminInventoryAuditAddItem: (sessionId, payload) => fetch(`${API_BASE}/api/inventory/audits/${sessionId}/items`, { method:'POST', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),

  adminFoodCostSummary: (params = {}) => fetch(`${API_BASE}/api/admin/food_cost${buildQuery(params)}`, { credentials:'include' }).then(handle),
  adminSettings: () => fetch(`${API_BASE}/api/admin/settings`, { credentials:'include' }).then(handle),
  adminUpdateSettings: (payload) => fetch(`${API_BASE}/api/admin/settings`, { method:'PATCH', headers:JSON_HEADERS, body: JSON.stringify(payload), credentials:'include' }).then(handle),

  // Admin helpers
  adminFoodCost: (menu_item_id) => fetch(`${API_BASE}/api/admin/food_cost/${menu_item_id}`, { credentials:'include' }).then(handle),
}

export function fmtCurrency(n, currency='USD') {
  const num = typeof n === 'string' ? Number(n) : n
  return new Intl.NumberFormat(undefined, { style:'currency', currency }).format(Number.isFinite(num) ? num : 0)
}

export const sleep = (ms)=> new Promise(r=>setTimeout(r, ms))
