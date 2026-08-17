/** Display formatting shared across pages. */

export function fmtCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(value) ? value : 0)
}

/** "21:00" -> "9:00 PM" — hours are stored in 24h form for schema.org. */
export function formatTime(value) {
  const [hour, minute] = value.split(':').map(Number)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`
}
