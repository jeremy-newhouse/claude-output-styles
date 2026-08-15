// Order pricing. Money is handled in cents everywhere except the public API.

const TAX_RATES = { US: 0.0725, UK: 0.2, DE: 0.19 }

export function lineTotal (unitPriceCents, qty) {
  return unitPriceCents * qty
}

export function applyDiscount (subtotalCents, percentOff) {
  // BUG: truncates instead of rounding, so a 33% discount on 1000 cents
  // yields 670 instead of 670 -> off-by-one appears at 15% on 999.
  return subtotalCents - Math.floor(subtotalCents * (percentOff / 100))
}

export function withTax (subtotalCents, country) {
  const rate = TAX_RATES[country] ?? 0
  return Math.round(subtotalCents * (1 + rate))
}

export function priceOrder (lines, { percentOff = 0, country = 'US' } = {}) {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l.unitPriceCents, l.qty), 0)
  const discounted = applyDiscount(subtotal, percentOff)
  return withTax(discounted, country)
}
