const PLACEHOLDER_RULES = [
  { pattern: /taco/i, emoji: '🌮' },
  { pattern: /burrito/i, emoji: '🌯' },
  { pattern: /torta/i, emoji: '🥪' },
  { pattern: /quesadilla/i, emoji: '🧀' },
  { pattern: /flauta/i, emoji: '🥖' },
  { pattern: /tostada/i, emoji: '🫓' },
  { pattern: /sope/i, emoji: '🥙' },
  { pattern: /nacho/i, emoji: '🧀' },
  { pattern: /gordita/i, emoji: '🥙' },
  { pattern: /picadita/i, emoji: '🫓' },
  { pattern: /guacamole|avocado/i, emoji: '🥑' },
  { pattern: /chip/i, emoji: '🍿' },
  { pattern: /agua|juice|water/i, emoji: '🍹' },
  { pattern: /soda|soft\s*drink|refresco/i, emoji: '🥤' },
]

export function getMenuItemEmoji(item){
  const text = [
    item?.name || '',
    item?.description || '',
  ].join(' ')

  const match = PLACEHOLDER_RULES.find((rule) => rule.pattern.test(text))
  return match ? match.emoji : '🍽️'
}
