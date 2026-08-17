// Order pricing. Money is handled in cents throughout, including the exported
// functions — percentages and country codes are the only non-cent arguments.

const TAX_RATES = { US: 0.0725, UK: 0.2, DE: 0.19 }

export function lineTotal (unitPriceCents, qty) {
  return unitPriceCents * qty
}

export function applyDiscount (subtotalCents, percentOff) {
  // BUG: truncates instead of rounding, so a 15% discount on 999 cents
  // keeps 850 where rounding to the nearest cent keeps 849.
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
