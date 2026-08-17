import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDiscount, priceOrder } from '../src/pricing.js'

test('discount handles whole values', () => {
  // 1000 * 33% = 330
  assert.equal(applyDiscount(1000, 33), 670)
})

test('priceOrder applies discount then tax', () => {
  const lines = [{ unitPriceCents: 500, qty: 2 }]
  // 500 * 2 = 1000, less 10% = 900, plus 7.25% tax = 965.25
  assert.equal(priceOrder(lines, { percentOff: 10, country: 'US' }), 965)
})
