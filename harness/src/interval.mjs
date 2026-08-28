// Paired-comparison confidence intervals, reproducing FINDINGS.md's published
// method (COS-27): pair rows by case + model, average repeats within a pair,
// take a two-tailed 95% interval from the Student-t distribution on the
// resulting differences.

import { words, stripCode } from './checks.mjs'

// Standard two-tailed 95% critical values, t(0.025, df). Anchors match any
// printed Student-t table; a df between two anchors is linearly interpolated,
// and df above the largest anchor uses the normal-approximation limit.
const T_TABLE = {
  1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
  8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145,
  15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
  21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056,
  27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042, 40: 2.021, 60: 2.000,
  120: 1.980
}
const T_ANCHORS = Object.keys(T_TABLE).map(Number).sort((a, b) => a - b)
const T_NORMAL_LIMIT = 1.960

export function tCritical95 (df) {
  if (df < 1) throw new Error(`tCritical95: df must be >= 1, got ${df}`)
  if (T_TABLE[df] !== undefined) return T_TABLE[df]
  const largest = T_ANCHORS[T_ANCHORS.length - 1]
  if (df > largest) return T_NORMAL_LIMIT
  const hi = T_ANCHORS.find(a => a > df)
  const lo = T_ANCHORS[T_ANCHORS.indexOf(hi) - 1]
  const frac = (df - lo) / (hi - lo)
  return T_TABLE[lo] + frac * (T_TABLE[hi] - T_TABLE[lo])
}

const defaultKey = r => `${r.caseId}|${r.model}`
const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length

function groupByKey (rows, keyOf, getValue) {
  const m = new Map()
  for (const r of rows) {
    const k = keyOf(r)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(getValue(r))
  }
  return m
}

/**
 * The shared arithmetic behind both interval functions below: a two-tailed
 * 95% Student-t interval on a list of independent values (paired diffs for
 * `pairedInterval`, per-case means for `singleSampleInterval`). Not exported
 * — callers differ in what a "value" is and what extra fields are worth
 * returning alongside it (a paired comparison's `t` tests against zero; a
 * single sample's `sd` describes its own spread), so each keeps its own
 * public shape rather than share one.
 */
function studentTInterval (values, fnName, unit) {
  const n = values.length
  if (n < 2) throw new Error(`${fnName}: need at least 2 ${unit}, got ${n}`)
  const m = mean(values)
  const df = n - 1
  const variance = values.reduce((s, x) => s + (x - m) ** 2, 0) / df
  const sd = Math.sqrt(variance)
  const se = sd / Math.sqrt(n)
  const tCrit = tCritical95(df)
  return { n, df, mean: m, sd, se, lo: m - tCrit * se, hi: m + tCrit * se }
}

/**
 * Pair `beforeRows` against `afterRows` by `keyOf` (default: case + model),
 * averaging repeats within each side of a pair, then return a paired 95%
 * Student-t interval on the per-pair differences (after - before).
 *
 * `beforeRows`/`afterRows` may each span more than one saved run (pass the
 * concatenated rows) — FINDINGS.md's shared-five judge figure pools two runs
 * on the after side, and rules/words/composite for that same arm pool the
 * same two.
 */
export function pairedInterval (beforeRows, afterRows, { getValue, keyOf = defaultKey } = {}) {
  if (typeof getValue !== 'function') throw new Error('pairedInterval: getValue is required')
  const beforeGroups = groupByKey(beforeRows, keyOf, getValue)
  const afterGroups = groupByKey(afterRows, keyOf, getValue)
  const missing = [...beforeGroups.keys()].filter(k => !afterGroups.has(k))
  if (missing.length) throw new Error(`pairedInterval: no after-side rows for: ${missing.join(', ')}`)
  const extra = [...afterGroups.keys()].filter(k => !beforeGroups.has(k))
  if (extra.length) throw new Error(`pairedInterval: no before-side rows for: ${extra.join(', ')}`)

  const diffs = [...beforeGroups.keys()].map(k => mean(afterGroups.get(k)) - mean(beforeGroups.get(k)))
  const r = studentTInterval(diffs, 'pairedInterval', 'pairs')
  const t = r.se === 0 ? Infinity : r.mean / r.se
  return { ...r, t }
}

/**
 * A single-sample 95% Student-t confidence interval on one saved run's own
 * mean — not a before/after comparison (COS-19 AC #2: every judge figure
 * needs an interval, and an arm that was never compared against a "before"
 * run still needs one).
 *
 * Groups rows by `keyOf` (default: case id) and averages repeats within each
 * group first, the same de-clustering `pairedInterval` does before
 * differencing — repeats of the same case are not independent draws, they
 * are the same prompt answered several times, so the interval is taken over
 * per-case means (n = case count), not over every row (n = cases x repeats).
 * Treating repeats as independent observations understates the interval by
 * roughly sqrt(repeats): a 5-case, 30-repeat arm has n=5, not n=150.
 */
export function singleSampleInterval (rows, { getValue, keyOf = r => r.caseId } = {}) {
  if (typeof getValue !== 'function') throw new Error('singleSampleInterval: getValue is required')
  const groups = groupByKey(rows, keyOf, getValue)
  const means = [...groups.values()].map(mean)
  return studentTInterval(means, 'singleSampleInterval', 'groups')
}

/** The four metrics FINDINGS.md publishes as paired percentage-point/word deltas. */
export const METRICS = {
  rules: r => r.rulesScore * 100,
  judge: r => r.judgeScore * 100,
  composite: r => r.total * 100,
  words: r => words(stripCode(r.text)).length
}
