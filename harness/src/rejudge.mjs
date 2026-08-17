// Re-judge saved replies, and describe the judge as an instrument.
//
// Nothing here runs a cell. Every reply this module grades was produced by an
// earlier `run` and lives in that run's rows.json, which is what makes asking
// "how much of a score is the judge?" affordable: the expensive half of a cell
// is the generation, and re-judging reuses it.
//
// The question the module answers is a variance decomposition. Score the same
// saved reply K times with the same judge and the spread you see is the judge
// alone. Score many replies and the spread across their means carries the reply
// variance plus a shrunken share of the judge's. One-way random-effects ANOVA
// separates the two, and everything downstream — how many cells an arm needs,
// whether repeat-judging is cheaper than adding cells — falls out of the split.

import { viewsOf, producedReply } from './checks.mjs'
import { judge as judgeCall, JUDGE_VIEW_DEFAULT } from './judge.mjs'
import { pool } from './run.mjs'

/** The sibling manifest for a judge run, beside its judgements.json. */
export const JUDGE_MANIFEST = 'judge.json'

const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1)

/**
 * Throw unless this really is a judgements array.
 *
 * The offline re-derive path rewrites `report.md` beside whatever file it is
 * handed, and `--rows` and `--judgements` take paths of the same shape out of
 * the same directory. Handed a run's `rows.json` it wrote an empty judge report
 * over that run's adherence report and said only that every call had failed —
 * rows carry no `ok`, so every record filtered out. Cells cost real money to
 * replace; a wrong path must fail before the first write, not after it.
 */
export function assertJudgements (records, path) {
  const shape = r => r && typeof r === 'object' && typeof r.judgeModel === 'string' && Number.isInteger(r.rowIndex) && typeof r.score === 'number'
  if (!Array.isArray(records) || !records.length || !records.every(shape)) {
    throw new Error(`${path} is not a judgements file — expected an array of records carrying judgeModel, rowIndex and score. A run's rows.json is not one, and this command would overwrite the report beside it.`)
  }
}

/**
 * Which (reply, judge model, repeat) triples this run will grade.
 *
 * Ordered by sweep — every judge over every eligible reply once, then again —
 * rather than by reply. A judge run is long enough to be killed, and a killed
 * sweep-ordered run leaves whole balanced passes behind; a reply-ordered one
 * leaves the first few replies judged K times and the rest not at all, which is
 * the shape no decomposition can use.
 *
 * The eligibility rules are the live path's, not a second set that agrees most
 * of the time: `producedReply` is what `evaluate` gates the judge on, and a row
 * whose style has no contract or whose case has no rubric is exactly what
 * `score` refuses to re-derive.
 */
export function planJudgements ({ rows, cases, contracts, judges, repeats, styleIds = null, caseIds = null }) {
  const eligible = []
  const skipped = { filtered: 0, noReply: 0, noRubric: 0, noContract: new Map(), noCase: new Map() }
  rows.forEach((row, rowIndex) => {
    if ((styleIds && !styleIds.includes(row.styleId)) || (caseIds && !caseIds.includes(row.caseId))) { skipped.filtered++; return }
    if (!producedReply(row)) { skipped.noReply++; return }
    if (!contracts[row.styleId]) { bump(skipped.noContract, row.styleId); return }
    const caseDef = cases.find(c => c.id === row.caseId)
    if (!caseDef) { bump(skipped.noCase, row.caseId); return }
    if (!caseDef.judge) { skipped.noRubric++; return }
    eligible.push(rowIndex)
  })
  const tasks = []
  for (let k = 0; k < repeats; k++) {
    for (const judgeModel of judges) {
      for (const rowIndex of eligible) tasks.push({ rowIndex, judgeModel, judgeRepeat: k })
    }
  }
  return { tasks, eligible, skipped }
}

/**
 * Grade every planned triple.
 *
 * @param {(rows: object[]) => void} [onRecords]  called after every completed
 *   call with the records finished so far, in plan order — the same incremental
 *   flush `run` uses, for the same reason.
 * @param {object} [deps]  judge, injectable so the plan, the persistence and the
 *   statistics can be tested without spending a model call.
 */
export async function rejudge ({ rows, tasks, cases, contracts, styleBodies, concurrency = 4, onProgress, onRecords, deps = {} }) {
  const { judge: judgeFn = judgeCall, now = Date.now } = deps
  const landed = new Array(tasks.length)
  let done = 0
  await pool(tasks, concurrency, async (t, idx) => {
    const row = rows[t.rowIndex]
    const caseDef = cases.find(c => c.id === row.caseId)
    const contract = contracts[row.styleId]
    const views = viewsOf(row)
    const startedAt = now()
    const j = await judgeFn({ views, caseDef, contract, model: t.judgeModel, styleBody: styleBodies[row.styleId] })
    landed[idx] = {
      rowIndex: t.rowIndex,
      judgeModel: t.judgeModel,
      judgeRepeat: t.judgeRepeat,
      styleId: row.styleId,
      model: row.model,
      caseId: row.caseId,
      variantId: row.variantId,
      split: row.split,
      repeat: row.repeat,
      judgeReads: caseDef.judgeOn ?? JUDGE_VIEW_DEFAULT,
      // Carried per record, not per run: a legacy row's `trace` view is the
      // whole turn glued, so an agentic reply graded here is graded on a string
      // the current scorer would never produce. Conversational replies are
      // unaffected, which is why the flag is on the record.
      legacy: views.legacy,
      // False when no model call produced this number — a failed, unparseable or
      // skipped call. The substituted 0.5 is not a judgement and pooling it into
      // a variance estimate would measure the API, not the judge.
      ok: j.ok !== false,
      score: j.score,
      violations: j.violations,
      elapsedMs: now() - startedAt
    }
    onProgress?.(++done, tasks.length, landed[idx])
    onRecords?.(landed.filter(Boolean))
  })
  return landed.filter(Boolean)
}

// ---------- statistics ----------

const sum = xs => xs.reduce((a, b) => a + b, 0)
const mean = xs => xs.length ? sum(xs) / xs.length : 0

/**
 * Split repeated judgements of the same replies into judge-call variance and
 * reply variance, by one-way random-effects ANOVA.
 *
 * @param {number[][]} groups  one array per reply, holding that reply's repeated
 *   scores from one judge. Groups of one carry no within-reply information and
 *   are dropped rather than counted as zero-variance replies, which is how a
 *   single-pass run would otherwise report a judge that never disagrees.
 *
 * `k0` is the harmonic-style effective group size the unbalanced estimator
 * needs; on a balanced plan it is exactly the repeat count. `varReply` is
 * clamped at zero: (MSB - MSW) is an unbiased estimator that goes negative when
 * the judge's own spread exceeds the spread between replies, and a negative
 * variance is a measurement, not a quantity — the honest reading is "no reply
 * variance is detectable above the judge's".
 */
export function varianceComponents (groups) {
  const gs = groups.filter(g => g.length >= 2)
  const replies = gs.length
  const n = sum(gs.map(g => g.length))
  if (replies < 2 || n <= replies) return null
  const groupMeans = gs.map(mean)
  const grand = sum(gs.map(g => sum(g))) / n
  const ssWithin = sum(gs.map(g => { const m = mean(g); return sum(g.map(x => (x - m) ** 2)) }))
  const ssBetween = sum(gs.map((g, i) => g.length * (groupMeans[i] - grand) ** 2))
  const msWithin = ssWithin / (n - replies)
  const msBetween = ssBetween / (replies - 1)
  const k0 = (n - sum(gs.map(g => g.length ** 2)) / n) / (replies - 1)
  const varJudge = msWithin
  const varReply = Math.max(0, (msBetween - msWithin) / k0)
  const varTotal = varJudge + varReply
  return {
    replies,
    calls: n,
    k0: Number(k0.toFixed(3)),
    mean: Number(grand.toFixed(2)),
    sdJudge: Number(Math.sqrt(varJudge).toFixed(2)),
    sdReply: Number(Math.sqrt(varReply).toFixed(2)),
    sdTotal: Number(Math.sqrt(varTotal).toFixed(2)),
    // The share of a single call's variance that the judge contributes. Its
    // complement is the intraclass correlation — how much of what a one-call
    // score says is about the reply.
    judgeShare: varTotal ? Number((varJudge / varTotal).toFixed(3)) : null,
    icc: varTotal ? Number((varReply / varTotal).toFixed(3)) : null
  }
}

/** Group a set of records into one array of scores per reply. */
export function replyGroups (records) {
  const g = new Map()
  for (const r of records) {
    if (!g.has(r.rowIndex)) g.set(r.rowIndex, [])
    g.get(r.rowIndex).push(r.score)
  }
  return [...g.values()]
}

/** Each reply's mean score under one judge, keyed by row index. */
export function meansByReply (records) {
  const g = new Map()
  for (const r of records) {
    if (!g.has(r.rowIndex)) g.set(r.rowIndex, [])
    g.get(r.rowIndex).push(r.score)
  }
  return new Map([...g].map(([k, xs]) => [k, mean(xs)]))
}

const rankOf = xs => {
  const order = xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])
  const ranks = new Array(xs.length)
  let i = 0
  while (i < order.length) {
    let j = i
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++
    const r = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) ranks[order[k][1]] = r
    i = j + 1
  }
  return ranks
}

const correlation = (a, b) => {
  const ma = mean(a)
  const mb = mean(b)
  const num = sum(a.map((x, i) => (x - ma) * (b[i] - mb)))
  const den = Math.sqrt(sum(a.map(x => (x - ma) ** 2)) * sum(b.map(x => (x - mb) ** 2)))
  return den ? num / den : null
}

/**
 * Compare two judges on the replies both of them graded.
 *
 * Paired by reply, never arm mean against arm mean: two judges can agree on
 * every arm mean while disagreeing on every reply inside it, and it is the
 * per-reply disagreement that decides whether a ranking survives a change of
 * judge. `meanDiff` is other minus reference, so a positive figure means the
 * other judge marks higher.
 */
export function agreementBetween (refMeans, otherMeans) {
  const keys = [...refMeans.keys()].filter(k => otherMeans.has(k)).sort((a, b) => a - b)
  if (!keys.length) return null
  const a = keys.map(k => refMeans.get(k))
  const b = keys.map(k => otherMeans.get(k))
  const diffs = keys.map((k, i) => b[i] - a[i])
  const md = mean(diffs)
  const sd = keys.length > 1 ? Math.sqrt(sum(diffs.map(d => (d - md) ** 2)) / (keys.length - 1)) : 0
  const half = 1.96 * sd / Math.sqrt(keys.length)
  const r = keys.length > 1 ? correlation(a, b) : null
  const rho = keys.length > 1 ? correlation(rankOf(a), rankOf(b)) : null
  return {
    n: keys.length,
    refMean: Number(mean(a).toFixed(2)),
    otherMean: Number(mean(b).toFixed(2)),
    meanDiff: Number(md.toFixed(2)),
    ci95: [Number((md - half).toFixed(2)), Number((md + half).toFixed(2))],
    mad: Number(mean(diffs.map(Math.abs)).toFixed(2)),
    maxAbsDiff: Number(Math.max(...diffs.map(Math.abs)).toFixed(2)),
    pearson: r === null ? null : Number(r.toFixed(3)),
    spearman: rho === null ? null : Number(rho.toFixed(3))
  }
}

/**
 * Cells per arm for a given 95% half-width, once judge variance is separable.
 *
 * SE² = (varReply + varJudge / k) / n, so judging each cell k times shrinks only
 * the judge's share. `arms: 2` sizes a difference between two independent arms,
 * whose standard error is √2 times one arm's.
 */
export function cellsForHalfWidth ({ sdReply, sdJudge, halfWidth, judgeCalls = 1, arms = 1 }) {
  const perCell = sdReply ** 2 + (sdJudge ** 2) / judgeCalls
  return Math.ceil(arms * (1.96 ** 2) * perCell / halfWidth ** 2)
}

/**
 * The 95% half-width an arm of n cells reaches at k judge calls per cell.
 * The inverse of `cellsForHalfWidth`, and the form the crossover is read from.
 */
export function halfWidthAt ({ sdReply, sdJudge, cells, judgeCalls = 1, arms = 1 }) {
  const perCell = sdReply ** 2 + (sdJudge ** 2) / judgeCalls
  return Number((1.96 * Math.sqrt(arms * perCell / cells)).toFixed(2))
}

// ---------- analysis ----------

/** Scores are stored 0-1 like `judgeScore`; every figure the project quotes is points. */
const POINTS = 100

const scaled = (records, scale) => records.map(r => ({ ...r, score: r.score * scale }))

/**
 * The whole reading of a judge run.
 *
 * Only records with `ok` are used. A failed or unparseable call substitutes 0.5,
 * and 0.5 is inside the range real scores occupy, so pooling one would be read
 * as a judgement the judge never made — and in a variance study it would be read
 * as the judge disagreeing with itself.
 *
 * Agreement is reported at four scopes because a judge can agree everywhere but
 * one: overall, per style (whose contracts weight the judge differently), per
 * case (whose rubrics ask different questions), and per generation model (which
 * is how the four-tier baseline is published).
 */
export function analyzeJudgements (records, { reference = 'sonnet', halfWidths = [10, 7, 5, 4], scale = POINTS } = {}) {
  const ok = scaled(records.filter(r => r.ok), scale)
  const judges = [...new Set(ok.map(r => r.judgeModel))]
  const styles = [...new Set(ok.map(r => r.styleId))].sort()
  const cases = [...new Set(ok.map(r => r.caseId))].sort()
  const models = [...new Set(ok.map(r => r.model))].sort()

  const describe = rs => {
    const v = varianceComponents(replyGroups(rs))
    if (v) return v
    // One pass over a set of replies still says what the judge scored; it just
    // cannot say how much of that is the judge. Reporting the mean with nulls
    // beside it is the honest shape — a zero SD would read as perfect agreement.
    // No records at all is a different case and gets a null mean: perJudgeStyle
    // is a full judge x style cross product and the report is re-rendered after
    // every call, so a pair the sweep has not reached yet would otherwise render
    // as a real score of 0.00 on every partial report.
    return {
      replies: new Set(rs.map(r => r.rowIndex)).size,
      calls: rs.length,
      k0: null,
      mean: rs.length ? Number(mean(rs.map(r => r.score)).toFixed(2)) : null,
      sdJudge: null,
      sdReply: null,
      sdTotal: null,
      judgeShare: null,
      icc: null
    }
  }

  const perJudge = judges.map(m => ({ judgeModel: m, ...describe(ok.filter(r => r.judgeModel === m)) }))
  const perJudgeStyle = judges.flatMap(m => styles.map(s => ({
    judgeModel: m,
    styleId: s,
    ...describe(ok.filter(r => r.judgeModel === m && r.styleId === s))
  })))

  const refRecords = ok.filter(r => r.judgeModel === reference)
  const scopes = [
    ['overall', () => true],
    ...styles.map(s => [`style:${s}`, r => r.styleId === s]),
    ...cases.map(c => [`case:${c}`, r => r.caseId === c]),
    ...models.map(m => [`model:${m}`, r => r.model === m])
  ]
  const agreement = []
  for (const m of judges.filter(j => j !== reference)) {
    for (const [scope, pred] of scopes) {
      const a = agreementBetween(meansByReply(refRecords.filter(pred)), meansByReply(ok.filter(r => r.judgeModel === m).filter(pred)))
      if (a) agreement.push({ judgeModel: m, scope, ...a })
    }
  }

  // Sized per style, not from the pooled decomposition, and the difference is
  // not cosmetic. An arm is one style on one model; pooling styles pushes the
  // spread *between* styles into the reply component — 27.56 points against
  // beginner's 22.58 on the measured run — and a sizing table built on that
  // asks for 208 cells where the arm needs 148. Pooling is only the basis when
  // no single style has enough repeats to decompose.
  // Only the reference judge, with no fall-back to whichever judge happens to be
  // first. The table is titled "<reference> as judge", so a fall-back would put
  // that title over numbers the reference did not produce — and the agreement
  // table beside it would be empty at the same time, saying the opposite.
  const ref = perJudge.find(j => j.judgeModel === reference) ?? null
  const perStyle = perJudgeStyle.filter(j => j.judgeModel === reference && j.sdReply !== null)
  const bases = perStyle.length
    ? perStyle.map(b => ({ basis: b.styleId, ...b }))
    : (ref && ref.sdReply !== null ? [{ basis: 'all styles pooled', ...ref }] : [])
  const sizing = bases.flatMap(b => halfWidths.map(halfWidth => {
    const at = k => cellsForHalfWidth({ sdReply: b.sdReply, sdJudge: b.sdJudge, halfWidth, judgeCalls: k })
    return {
      basis: b.basis,
      halfWidth,
      k1: at(1),
      k2: at(2),
      k3: at(3),
      k5: at(5),
      floor: cellsForHalfWidth({ sdReply: b.sdReply, sdJudge: 0, halfWidth })
    }
  }))

  return {
    reference,
    // False while a sweep has not reached the reference yet, and permanently if
    // nothing judged with it. Every agreement figure and the whole sizing table
    // are measured against it, so its absence has to be stated rather than
    // shown as two empty tables.
    referencePresent: judges.includes(reference),
    scale,
    calls: records.length,
    dropped: records.length - records.filter(r => r.ok).length,
    legacyRecords: records.filter(r => r.legacy).length,
    perJudge,
    perJudgeStyle,
    agreement,
    sizing
  }
}

// ---------- rendering ----------

const pad = (s, w) => String(s).padEnd(w)
const num = (v, d = 2) => v === null || v === undefined ? '—' : Number(v).toFixed(d)

function table (title, header, rows) {
  if (!rows.length) return `${title}\n  (none)\n`
  const widths = header.map((h, i) => Math.max(String(h).length, ...rows.map(r => String(r[i]).length)))
  const line = cells => '  ' + cells.map((c, i) => pad(c, widths[i])).join('  ').trimEnd()
  return [title, line(header), line(widths.map(w => '-'.repeat(w))), ...rows.map(line)].join('\n') + '\n'
}

/**
 * What qualifies every figure below it. Printed above the tables and carried
 * into the written report, because both are read on their own.
 */
export function judgeCaveats (analysis) {
  const lines = []
  const { dropped, legacyRecords, calls, reference, referencePresent, perJudge } = analysis
  if (!referencePresent) {
    lines.push(`NO RECORDS for reference judge "${reference}"${perJudge.length ? ` (present: ${perJudge.map(j => j.judgeModel).join(', ')})` : ''}. Agreement and arm sizing are both measured against it, so both tables below are empty.`)
  }
  if (dropped) lines.push(`${dropped} of ${calls} judge calls returned no parseable score and are excluded from every figure below.`)
  if (legacyRecords) lines.push(`${legacyRecords} of ${calls} judgements grade a row saved before the COS-10 text-block fix; on an agentic case that string is the whole turn glued.`)
  return lines
}

/** The written report, so the run directory carries what the console printed. */
export function judgeReportDoc (analysis, source) {
  return `# Judge validation\n\nsource: \`${source}\`\n\n\`\`\`\n${renderJudgeReport(analysis)}\`\`\`\n`
}

/**
 * Everything the judge run establishes, in the order the questions were asked:
 * how noisy one judge is, how the tiers compare with the reference judge, and
 * what the split does to the sample sizes the project quotes.
 */
export function renderJudgeReport (analysis) {
  const { reference, perJudge, perJudgeStyle, agreement, sizing } = analysis
  const caveats = judgeCaveats(analysis)
  const out = caveats.length ? [caveats.join('\n') + '\n'] : []

  out.push(table(
    'Judge-call variance vs reply variance (points, 0-100)',
    ['judge', 'replies', 'calls', 'k', 'mean', 'SD total', 'SD judge', 'SD reply', 'judge share'],
    perJudge.map(j => [j.judgeModel, j.replies, j.calls, num(j.k0, 1), num(j.mean), num(j.sdTotal), num(j.sdJudge), num(j.sdReply), num(j.judgeShare, 3)])
  ))

  out.push(table(
    'Same split, per style',
    ['judge', 'style', 'replies', 'mean', 'SD total', 'SD judge', 'SD reply', 'judge share'],
    perJudgeStyle.map(j => [j.judgeModel, j.styleId, j.replies, num(j.mean), num(j.sdTotal), num(j.sdJudge), num(j.sdReply), num(j.judgeShare, 3)])
  ))

  out.push(table(
    `Agreement with ${reference}, paired per reply (points)`,
    ['judge', 'scope', 'n', `${reference}`, 'other', 'diff', '95% CI', 'MAD', 'max |d|', 'r', 'rho'],
    agreement.map(a => [a.judgeModel, a.scope, a.n, num(a.refMean), num(a.otherMean), num(a.meanDiff), `[${num(a.ci95[0])}, ${num(a.ci95[1])}]`, num(a.mad), num(a.maxAbsDiff), num(a.pearson, 3), num(a.spearman, 3)])
  ))

  out.push(table(
    `Cells per arm for a 95% half-width, by judge calls per cell (${reference} as judge)`,
    ['basis', 'half-width', 'k=1', 'k=2', 'k=3', 'k=5', 'k=inf (reply only)'],
    sizing.map(s => [s.basis, `+/-${s.halfWidth}`, s.k1, s.k2, s.k3, s.k5, s.floor])
  ))

  return out.join('\n')
}
