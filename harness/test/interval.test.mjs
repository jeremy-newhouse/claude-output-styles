import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pairedInterval, tCritical95, METRICS } from '../src/interval.mjs'
import { words, stripCode } from '../src/checks.mjs'

// ---------- tCritical95 ----------

test('tCritical95 returns exact table values', () => {
  assert.equal(tCritical95(1), 12.706)
  assert.equal(tCritical95(9), 2.262)
  assert.equal(tCritical95(11), 2.201)
  assert.equal(tCritical95(30), 2.042)
})

test('tCritical95 interpolates between table anchors', () => {
  // df=50 sits midway between the 40 (2.021) and 60 (2.000) anchors.
  assert.ok(Math.abs(tCritical95(50) - 2.0105) < 1e-9)
})

test('tCritical95 falls back to the normal limit above the largest anchor', () => {
  assert.equal(tCritical95(500), 1.960)
})

test('tCritical95 rejects a df below 1', () => {
  assert.throws(() => tCritical95(0), /df must be >= 1/)
})

// ---------- pairedInterval: hand-computable, sabotage-verified ----------

test('pairedInterval matches a hand-computed paired t-interval', () => {
  // Six pairs, diffs = 2, 4, 6, 8, 10, 12 -> mean 7, sample SD sqrt(14)~3.7417,
  // SE = SD/sqrt(6) ~1.5275, df=5, t(0.025,5)=2.571.
  const before = [1, 2, 3, 4, 5, 6].map(i => ({ caseId: `c${i}`, model: 'opus', v: 0 }))
  const after = [1, 2, 3, 4, 5, 6].map(i => ({ caseId: `c${i}`, model: 'opus', v: i * 2 }))
  const r = pairedInterval(before, after, { getValue: row => row.v })
  assert.equal(r.n, 6)
  assert.equal(r.df, 5)
  assert.ok(Math.abs(r.mean - 7) < 1e-9)
  assert.ok(Math.abs(r.t - 7 / (Math.sqrt(14) / Math.sqrt(6))) < 1e-9)
  assert.ok(Math.abs(r.lo - (7 - 2.571 * (Math.sqrt(14) / Math.sqrt(6)))) < 1e-6)
})

test('pairedInterval averages repeats within a (case, model) pair before differencing', () => {
  // Two repeats each side, same key: before averages to 10, after to 16, diff 6 on every pair.
  const key = (caseId, model, repeat, v) => ({ caseId, model, repeat, v })
  const before = [key('c1', 'opus', 0, 8), key('c1', 'opus', 1, 12), key('c2', 'opus', 0, 8), key('c2', 'opus', 1, 12)]
  const after = [key('c1', 'opus', 0, 14), key('c1', 'opus', 1, 18), key('c2', 'opus', 0, 14), key('c2', 'opus', 1, 18)]
  const r = pairedInterval(before, after, { getValue: row => row.v })
  assert.equal(r.n, 2)
  assert.ok(Math.abs(r.mean - 6) < 1e-9)
})

test('pairedInterval throws on a key present only on one side', () => {
  const before = [{ caseId: 'c1', model: 'opus', v: 1 }, { caseId: 'c2', model: 'opus', v: 1 }]
  const after = [{ caseId: 'c1', model: 'opus', v: 2 }]
  assert.throws(() => pairedInterval(before, after, { getValue: r => r.v }), /no after-side rows for: c2\|opus/)
})

test('pairedInterval throws with fewer than two pairs', () => {
  const before = [{ caseId: 'c1', model: 'opus', v: 1 }]
  const after = [{ caseId: 'c1', model: 'opus', v: 2 }]
  assert.throws(() => pairedInterval(before, after, { getValue: r => r.v }), /need at least 2 pairs/)
})

// ---------- pairedInterval: real data, regression-anchored ----------
// rulesScore from the actual saved rows behind FINDINGS.md's COS-4 reserve-arm
// figure (results/2026-08-17T02-12-24-499Z and .../02-16-47-367Z). This is the
// exact data COS-27 traced the published "+7.7 [+5.3, +10.1], t=7.06" to.

const RESERVE_BEFORE = [
  { caseId: 'reserve-scope-estimate', model: 'opus', rulesScore: 0.873 },
  { caseId: 'reserve-three-options', model: 'opus', rulesScore: 0.816 },
  { caseId: 'reserve-pushback', model: 'opus', rulesScore: 0.914 },
  { caseId: 'reserve-agentic-write', model: 'opus', rulesScore: 0.889 },
  { caseId: 'reserve-agentic-session', model: 'opus', rulesScore: 0.865 },
  { caseId: 'reserve-decision-tie', model: 'opus', rulesScore: 0.874 },
  { caseId: 'reserve-scope-estimate', model: 'sonnet', rulesScore: 0.846 },
  { caseId: 'reserve-three-options', model: 'sonnet', rulesScore: 0.853 },
  { caseId: 'reserve-pushback', model: 'sonnet', rulesScore: 1 },
  { caseId: 'reserve-agentic-write', model: 'sonnet', rulesScore: 0.87 },
  { caseId: 'reserve-agentic-session', model: 'sonnet', rulesScore: 0.731 },
  { caseId: 'reserve-decision-tie', model: 'sonnet', rulesScore: 0.887 }
]
const RESERVE_AFTER = [
  { caseId: 'reserve-scope-estimate', model: 'opus', rulesScore: 0.988 },
  { caseId: 'reserve-three-options', model: 'opus', rulesScore: 0.932 },
  { caseId: 'reserve-pushback', model: 'opus', rulesScore: 1 },
  { caseId: 'reserve-agentic-write', model: 'opus', rulesScore: 0.925 },
  { caseId: 'reserve-agentic-session', model: 'opus', rulesScore: 0.911 },
  { caseId: 'reserve-decision-tie', model: 'opus', rulesScore: 0.981 },
  { caseId: 'reserve-scope-estimate', model: 'sonnet', rulesScore: 0.965 },
  { caseId: 'reserve-three-options', model: 'sonnet', rulesScore: 0.921 },
  { caseId: 'reserve-pushback', model: 'sonnet', rulesScore: 1 },
  { caseId: 'reserve-agentic-write', model: 'sonnet', rulesScore: 0.966 },
  { caseId: 'reserve-agentic-session', model: 'sonnet', rulesScore: 0.822 },
  { caseId: 'reserve-decision-tie', model: 'sonnet', rulesScore: 0.934 }
]

test('pairedInterval reproduces the published reserve-arm rules figure exactly', () => {
  const r = pairedInterval(RESERVE_BEFORE, RESERVE_AFTER, { getValue: METRICS.rules })
  assert.equal(r.n, 12)
  assert.equal(r.df, 11)
  assert.equal(r.mean.toFixed(1), '7.7')
  assert.equal(r.lo.toFixed(1), '5.3')
  assert.equal(r.hi.toFixed(1), '10.1')
  assert.equal(r.t.toFixed(2), '7.06')
})

test('METRICS.words delegates to checks.mjs words()', () => {
  const row = { text: 'Two words here—plus an em dash *and* markdown.' }
  assert.equal(METRICS.words(row), words(row.text).length)
})

test('METRICS.words strips code blocks first, matching total_length\'s convention', () => {
  const row = { text: 'One two three.\n\n```js\nconst four = 5; const six = 7;\n```' }
  assert.equal(METRICS.words(row), words(stripCode(row.text)).length)
  assert.equal(METRICS.words(row), 3)
})
