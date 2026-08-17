import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDiscount, priceOrder } from '../src/pricing.js'

// Every case here is chosen so the discount lands on a whole number of cents,
// which is the only reason these assertions hold under applyDiscount as written.
// Nothing below pins the fractional-cent behaviour: no assertion covers it.

test('discount handles whole values', () => {
  // 1000 * 0.33 = 330 exactly.
  assert.equal(applyDiscount(1000, 33), 670)
})

test('priceOrder applies discount then tax', () => {
  const lines = [{ unitPriceCents: 500, qty: 2 }]
  // 500 * 2 = 1000; 1000 * 0.10 = 100 exactly, so 900; 900 * 1.0725 = 965.25 -> 965.
  // Taxing first and discounting after gives 966, so this number is what makes
  // the test name discriminating. Do not "correct" it to 966.
  assert.equal(priceOrder(lines, { percentOff: 10, country: 'US' }), 965)
})
