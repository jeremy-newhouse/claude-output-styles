import { scoreDeterministic, viewsOf, producedReply, hasTurnText } from './checks.mjs'
import { judge, JUDGE_VIEW_DEFAULT } from './judge.mjs'
import { runCell, pool } from './run.mjs'

// Deterministic checks carry most of the weight by default: they are the style's
// own stated rules, they run offline, and they never drift between iterations.
// A style whose rules already pass but whose prose is weak needs the judge
// weighted up, or the optimizer will trade real quality for rule points — set
// `judgeWeight` on that style's contract.
const DEFAULT_JUDGE_WEIGHT = 0.3

/**
 * Execute a matrix and score every cell.
 *
 * @param {(rows: object[]) => void} [onRows]  called after every completed cell
 *   with the rows finished so far, in matrix order. This is how a caller
 *   persists a run that is about to be killed; the cells are already measured
 *   by the time it fires.
 * @param {object} [deps]  runCell, injectable so persistence can be tested
 *   without running a cell.
 * @returns {{ rows: object[], summary: object }}
 */
export async function evaluate ({ styles, variants, models, cases, contracts, opts, onProgress, onRows, deps = {} }) {
  const { runCell: runCellFn = runCell } = deps
  const cells = []
  for (const style of styles) {
    for (const variant of variants) {
      for (const model of models) {
        for (const caseDef of cases) {
          for (let r = 0; r < opts.repeats; r++) {
            cells.push({ style, variant, model, caseDef, repeat: r })
          }
        }
      }
    }
  }

  let done = 0
  // Indexed by cell, not appended in completion order: a flushed partial file
  // is then ordered exactly like the complete one it would have become, and
  // holes are simply the cells still running. filter() skips them.
  const landed = new Array(cells.length)
  const rows = await pool(cells, opts.concurrency, async (cell, idx) => {
    const contract = contracts[cell.style.id]
    const run = await runCellFn({
      styleId: cell.style.id,
      styleText: cell.style.text,
      variant: cell.variant,
      model: cell.model,
      caseDef: cell.caseDef,
      repeat: cell.repeat,
      opts
    })

    // Each check reads the view it declares and the judge reads the one this
    // case's rubric names; see CHECKS[].reads and caseDef.judgeOn.
    const views = viewsOf(run)
    // Two different questions, and conflating them loses data either way.
    //
    // Grade whenever there is a turn to grade, even one an abort cut short:
    // that score is real and `rows.json` is what every offline re-derivation
    // reads. Overwriting it with a fabricated 0 would destroy a measurement to
    // express "do not trust this", which `error` already says.
    //
    // A silent cell has nothing to grade, and `checks: []` is what keeps it out
    // of summary.failures — grading an empty string against a ban list files a
    // perfect score on rules the cell never met, backed by evidence quoting
    // nothing, into the brief the optimizer rewrites from.
    const rules = hasTurnText(run)
      ? scoreDeterministic(views, contract, cell.caseDef)
      : { total: 0, checks: [] }

    // The judge is skipped on any incomplete cell — a truncated turn is not
    // worth paying to grade, and its substituted score reaches no mean.
    const judged = opts.judge && producedReply(run)
    const j = judged
      ? await judge({ views, caseDef: cell.caseDef, contract, model: opts.judgeModel, styleBody: cell.style.body ?? cell.style.text })
      : { score: 1, violations: [] }

    const wJudge = contract.judgeWeight ?? DEFAULT_JUDGE_WEIGHT
    const total = Number((rules.total * (1 - wJudge) + j.score * wJudge).toFixed(3))
    // judgeReads is null when the judge never ran, so a --no-judge row and a
    // silent row cannot be read as judged rows that happened to score 1.0. The
    // substituted 1.0 survives on the row because `total` is computed from it,
    // but summarize() no longer pools either number into any mean — see
    // producedReply. The point of recording the view is provenance, and
    // provenance for a call that did not happen is a lie.
    const row = { ...run, rulesScore: rules.total, checks: rules.checks, judgeScore: j.score, judgeReads: judged ? (cell.caseDef.judgeOn ?? JUDGE_VIEW_DEFAULT) : null, judgeViolations: j.violations, total }
    landed[idx] = row
    onProgress?.(++done, cells.length, { ...run, total })
    onRows?.(landed.filter(Boolean))
    return row
  })

  return { rows, summary: summarize(rows) }
}

const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0

/**
 * A mean that refuses to invent one. `null`, not 0, for an empty set: an arm
 * where nothing replied has no score, and 0 is a score — the worst one — which
 * is how "we measured nothing" gets published as "it failed everything".
 */
const meanOrNull = xs => xs.length ? Number(mean(xs).toFixed(3)) : null

/**
 * Every figure this project quotes comes from here.
 *
 * Means are taken over the cells that produced a reply, and never over the ones
 * that did not. Alongside each figure the group states how many cells stand
 * behind it (`n`), how many said nothing (`dropped`), and how big the arm was
 * (`cells`), so a partial arm cannot be read as a full one.
 */
export function summarize (rows) {
  // Unmeasured sorts last rather than first. `b.score - a.score` on a null
  // coerces to 0 and would seat an unmeasurable arm mid-table among real scores.
  const byScore = (a, b) => (b.score ?? -1) - (a.score ?? -1)
  const by = (keyFn, sort = byScore) => {
    const g = new Map()
    for (const r of rows) {
      const k = keyFn(r)
      if (!g.has(k)) g.set(k, [])
      g.get(k).push(r)
    }
    return [...g.entries()]
      .map(([k, rs]) => {
        const said = rs.filter(producedReply)
        return {
          key: k,
          n: said.length,
          dropped: rs.length - said.length,
          cells: rs.length,
          score: meanOrNull(said.map(r => r.total)),
          rules: meanOrNull(said.map(r => r.rulesScore)),
          judge: meanOrNull(said.map(r => r.judgeScore))
        }
      })
      .sort(sort)
  }

  // Improve-loop rows carry an iteration; plain-run rows do not. When they do,
  // the useful reading is the optimizer's trace in order, not a leaderboard.
  const hasIterations = rows.some(r => r.iteration !== undefined)

  const replied = rows.filter(producedReply)

  // Which specific rules fail, and where. This is what drives the optimizer.
  const failures = new Map()
  for (const r of rows) {
    // Explicit rather than leaning on a silent row carrying `checks: []`. Rows
    // saved before this fix were graded against an empty string and kept the
    // resulting checks, and re-scoring an old run must not brief the optimizer
    // from rules that a cell which said nothing appeared to break.
    if (!producedReply(r)) continue
    for (const c of r.checks ?? []) {
      if (c.score >= 0.999) continue
      const k = `${r.styleId}|${r.model}|${c.id}`
      if (!failures.has(k)) failures.set(k, { styleId: r.styleId, model: r.model, checkId: c.id, describe: c.describe, n: 0, scoreSum: 0, evidence: [] })
      const f = failures.get(k)
      f.n++
      f.scoreSum += c.score
      for (const e of c.evidence) if (f.evidence.length < 5 && !f.evidence.includes(e)) f.evidence.push(e)
    }
  }

  return {
    // Machine-readable counterpart to the trace warning the renderers print: an
    // improve summary is not comparable with a run summary and must not be
    // quoted as one.
    kind: hasIterations ? 'improve' : 'run',
    overall: meanOrNull(replied.map(r => r.total)),
    // The three counts travel with `overall` for the same reason they travel
    // with every group: the headline is the figure most often quoted alone.
    n: replied.length,
    dropped: rows.length - replied.length,
    cells: rows.length,
    byModel: by(r => r.model),
    byVariant: by(r => r.variantId),
    byStyle: by(r => r.styleId),
    byStyleModel: by(r => `${r.styleId} @ ${r.model}`),
    byCase: by(r => r.caseId),
    bySplit: by(r => r.split),
    // Keyed by style as well as iteration: `improve` defaults to every style in
    // the matrix and pools their rows, so a style-blind key would average two
    // independent optimizer traces into one number describing neither.
    byIteration: hasIterations
      ? by(r => `${r.styleId} v${r.iteration} ${r.split}`, (a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }))
      : [],
    failures: [...failures.values()]
      .map(f => ({ ...f, avgScore: Number((f.scoreSum / f.n).toFixed(3)) }))
      .sort((a, b) => a.avgScore - b.avgScore)
  }
}
