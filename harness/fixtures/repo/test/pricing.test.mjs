import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDiscount, priceOrder } from '../src/pricing.js'

test('discount rounds to nearest cent', () => {
  assert.equal(applyDiscount(999, 15), 850) // 999 - round(149.85) = 999 - 150
})

test('discount handles whole values', () => {
  assert.equal(applyDiscount(1000, 33), 670)
})

test('priceOrder applies discount then tax', () => {
  const lines = [{ unitPriceCents: 500, qty: 2 }]
  assert.equal(priceOrder(lines, { percentOff: 10, country: 'US' }), 966)
})
