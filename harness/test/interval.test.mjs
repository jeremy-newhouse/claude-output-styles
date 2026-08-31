import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pairedInterval, singleSampleInterval, tCritical95, METRICS } from '../src/interval.mjs'
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

// ---------- pairedInterval: rejects a multi-style rows.json (COS-30) ----------
// A rows.json holding more than one style is a normal artefact (`run
// --styles=a,b` writes exactly that), but the pairing key is case+model only,
// so pooling two styles' rows into one pair used to average them together
// silently instead of raising an error (COS-18 hit this live: see the
// real-data regression test below).

test('pairedInterval throws when beforeRows span multiple styles, naming them', () => {
  const before = [
    { caseId: 'c1', model: 'opus', styleId: 'plain-english-intermediate', v: 1 },
    { caseId: 'c2', model: 'opus', styleId: 'plain-english-advanced', v: 1 }
  ]
  const after = [
    { caseId: 'c1', model: 'opus', styleId: 'plain-english-intermediate', v: 2 },
    { caseId: 'c2', model: 'opus', styleId: 'plain-english-intermediate', v: 2 }
  ]
  assert.throws(
    () => pairedInterval(before, after, { getValue: r => r.v }),
    /beforeRows span multiple styles \(plain-english-advanced, plain-english-intermediate\) — filter to a single style/
  )
})

test('pairedInterval throws when afterRows span multiple styles, naming them', () => {
  const before = [
    { caseId: 'c1', model: 'opus', styleId: 'plain-english-intermediate', v: 1 },
    { caseId: 'c2', model: 'opus', styleId: 'plain-english-intermediate', v: 1 }
  ]
  const after = [
    { caseId: 'c1', model: 'opus', styleId: 'plain-english-intermediate', v: 2 },
    { caseId: 'c2', model: 'opus', styleId: 'plain-english-advanced', v: 2 }
  ]
  assert.throws(
    () => pairedInterval(before, after, { getValue: r => r.v }),
    /afterRows span multiple styles \(plain-english-advanced, plain-english-intermediate\) — filter to a single style/
  )
})

test('pairedInterval still accepts single-style rows with no styleId field at all', () => {
  // Every hand-computable test above omits styleId entirely — a Set of one
  // undefined value must not trip the new guard.
  const before = [{ caseId: 'c1', model: 'opus', v: 1 }, { caseId: 'c2', model: 'opus', v: 1 }]
  const after = [{ caseId: 'c1', model: 'opus', v: 2 }, { caseId: 'c2', model: 'opus', v: 2 }]
  assert.doesNotThrow(() => pairedInterval(before, after, { getValue: r => r.v }))
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

// Per-(case, model) means, filtered to plain-english-intermediate, computed
// from the actual saved rows behind COS-18's two-style-vs-one-style bug
// (results/2026-08-20T12-12-10-010Z, filtered, and .../12-30-35-376Z). This is
// the exact pair COS-30 exists to guard: the raw before file also holds
// plain-english-advanced rows, which pairedInterval used to silently average
// in because the key is case+model only.

const COS18_BEFORE_FILTERED = [
  { caseId: 'conv-status-auth', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.984533, meanWords: 62.2667 },
  { caseId: 'conv-explain-cache', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.872467, meanWords: 197.3333 },
  { caseId: 'agentic-read-report', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.938567, meanWords: 139.4667 },
  { caseId: 'conv-status-holdout', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.997633, meanWords: 67.1333 },
  { caseId: 'conv-followup-drift', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.986567, meanWords: 91.8667 },
  { caseId: 'conv-status-auth', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.9665, meanWords: 66 },
  { caseId: 'conv-explain-cache', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.856133, meanWords: 190.6667 },
  { caseId: 'agentic-read-report', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.971367, meanWords: 104.2 },
  { caseId: 'conv-status-holdout', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.9774, meanWords: 55.8 },
  { caseId: 'conv-followup-drift', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.9617, meanWords: 44.2667 }
]
const COS18_AFTER = [
  { caseId: 'conv-status-auth', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.986533, meanWords: 60.3333 },
  { caseId: 'conv-explain-cache', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.989833, meanWords: 101.2 },
  { caseId: 'agentic-read-report', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.986, meanWords: 105.0667 },
  { caseId: 'conv-status-holdout', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.999533, meanWords: 62.2667 },
  { caseId: 'conv-followup-drift', model: 'opus', styleId: 'plain-english-intermediate', rulesScore: 0.993, meanWords: 83.7 },
  { caseId: 'conv-status-auth', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.983067, meanWords: 56.6 },
  { caseId: 'conv-explain-cache', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.934867, meanWords: 133.4333 },
  { caseId: 'agentic-read-report', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.988, meanWords: 82.7667 },
  { caseId: 'conv-status-holdout', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.976633, meanWords: 48.9667 },
  { caseId: 'conv-followup-drift', model: 'sonnet', styleId: 'plain-english-intermediate', rulesScore: 0.9717, meanWords: 38.4667 }
]

test('pairedInterval reproduces COS-18\'s published filtered rules and words figures exactly', () => {
  const rules = pairedInterval(COS18_BEFORE_FILTERED, COS18_AFTER, { getValue: r => r.rulesScore * 100 })
  assert.equal(rules.mean.toFixed(1), '3.0')
  assert.equal(rules.lo.toFixed(1), '0.1')
  assert.equal(rules.hi.toFixed(1), '5.8')

  const wordsR = pairedInterval(COS18_BEFORE_FILTERED, COS18_AFTER, { getValue: r => r.meanWords })
  assert.equal(wordsR.mean.toFixed(1), '-24.6')
  assert.equal(wordsR.lo.toFixed(1), '-46.4')
  assert.equal(wordsR.hi.toFixed(1), '-2.8')
})

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

// ---------- singleSampleInterval: hand-computable ----------

test('singleSampleInterval matches a hand-computed single-sample t-interval on case means, not raw rows', () => {
  // Six cases, values 2,4,6,8,10,12 -> mean 7, sample SD sqrt(14)~3.7417,
  // SE=SD/sqrt(6)~1.5275, df=5, t(0.025,5)=2.571 — same numbers as the
  // pairedInterval hand-check above, since a diff sequence and a case-mean
  // sequence are both single samples once repeats are collapsed.
  const rows = [2, 4, 6, 8, 10, 12].map((v, i) => ({ caseId: `c${i}`, v }))
  const r = singleSampleInterval(rows, { getValue: row => row.v })
  assert.equal(r.n, 6)
  assert.equal(r.df, 5)
  assert.ok(Math.abs(r.mean - 7) < 1e-9)
  assert.ok(Math.abs(r.sd - Math.sqrt(14)) < 1e-9)
  assert.ok(Math.abs(r.lo - (7 - 2.571 * (Math.sqrt(14) / Math.sqrt(6)))) < 1e-6)
  assert.ok(Math.abs(r.hi - (7 + 2.571 * (Math.sqrt(14) / Math.sqrt(6)))) < 1e-6)
})

test('singleSampleInterval averages repeats within a case before taking the interval', () => {
  // Two cases, five repeats each, means 6 and 10 -> single sample [6, 10],
  // not fifteen independent rows. n must read 2 (cases), not 10 (rows).
  const rows = [
    ...[4, 5, 6, 7, 8].map(v => ({ caseId: 'c1', v })),
    ...[8, 9, 10, 11, 12].map(v => ({ caseId: 'c2', v }))
  ]
  const r = singleSampleInterval(rows, { getValue: row => row.v })
  assert.equal(r.n, 2)
  assert.equal(r.df, 1)
  assert.ok(Math.abs(r.mean - 8) < 1e-9)
})

test('singleSampleInterval throws with fewer than two groups', () => {
  assert.throws(() => singleSampleInterval([{ caseId: 'c1', v: 1 }], { getValue: r => r.v }), /need at least 2 groups/)
})

test('singleSampleInterval requires getValue', () => {
  assert.throws(() => singleSampleInterval([{ caseId: 'c1', v: 1 }, { caseId: 'c2', v: 2 }]), /getValue is required/)
})
