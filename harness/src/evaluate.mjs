import { scoreDeterministic } from './checks.mjs'
import { judge } from './judge.mjs'
import { runCell, pool } from './run.mjs'

// Deterministic checks carry most of the weight by default: they are the style's
// own stated rules, they cost nothing, and they never drift between iterations.
// A style whose rules already pass but whose prose is weak needs the judge
// weighted up, or the optimizer will trade real quality for rule points — set
// `judgeWeight` on that style's contract.
const DEFAULT_JUDGE_WEIGHT = 0.3

/**
 * Execute a matrix and score every cell.
 * @returns {{ rows: object[], summary: object }}
 */
export async function evaluate ({ styles, variants, models, cases, contracts, opts, onProgress }) {
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
  const rows = await pool(cells, opts.concurrency, async cell => {
    const contract = contracts[cell.style.id]
    const run = await runCell({
      styleId: cell.style.id,
      styleText: cell.style.text,
      variant: cell.variant,
      model: cell.model,
      caseDef: cell.caseDef,
      repeat: cell.repeat,
      opts
    })

    const rules = run.error && !run.text
      ? { total: 0, checks: [] }
      : scoreDeterministic(run.text, contract, cell.caseDef)

    const j = opts.judge && !run.error
      ? await judge({ text: run.text, caseDef: cell.caseDef, contract, model: opts.judgeModel, styleBody: cell.style.body ?? cell.style.text })
      : { score: 1, violations: [] }

    const wJudge = contract.judgeWeight ?? DEFAULT_JUDGE_WEIGHT
    const total = Number((rules.total * (1 - wJudge) + j.score * wJudge).toFixed(3))
    onProgress?.(++done, cells.length, { ...run, total })
    return { ...run, rulesScore: rules.total, checks: rules.checks, judgeScore: j.score, judgeViolations: j.violations, total }
  })

  return { rows, summary: summarize(rows) }
}

const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0

export function summarize (rows) {
  const byScore = (a, b) => b.score - a.score
  const by = (keyFn, sort = byScore) => {
    const g = new Map()
    for (const r of rows) {
      const k = keyFn(r)
      if (!g.has(k)) g.set(k, [])
      g.get(k).push(r)
    }
    return [...g.entries()]
      .map(([k, rs]) => ({
        key: k,
        n: rs.length,
        score: Number(mean(rs.map(r => r.total)).toFixed(3)),
        rules: Number(mean(rs.map(r => r.rulesScore)).toFixed(3)),
        judge: Number(mean(rs.map(r => r.judgeScore)).toFixed(3)),
        costUsd: Number(rs.reduce((a, r) => a + r.costUsd, 0).toFixed(4)),
        errors: rs.filter(r => r.error).length
      }))
      .sort(sort)
  }

  // Improve-loop rows carry an iteration; plain-run rows do not. When they do,
  // the useful reading is the optimizer's trace in order, not a leaderboard.
  const hasIterations = rows.some(r => r.iteration !== undefined)

  // Which specific rules fail, and where. This is what drives the optimizer.
  const failures = new Map()
  for (const r of rows) {
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
    overall: Number(mean(rows.map(r => r.total)).toFixed(3)),
    totalCostUsd: Number(rows.reduce((a, r) => a + r.costUsd, 0).toFixed(4)),
    byModel: by(r => r.model),
    byVariant: by(r => r.variantId),
    byStyle: by(r => r.styleId),
    byStyleModel: by(r => `${r.styleId} @ ${r.model}`),
    byCase: by(r => r.caseId),
    bySplit: by(r => r.split),
    byIteration: hasIterations
      ? by(r => `v${r.iteration} ${r.split}`, (a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }))
      : [],
    failures: [...failures.values()]
      .map(f => ({ ...f, avgScore: Number((f.scoreSum / f.n).toFixed(3)) }))
      .sort((a, b) => a.avgScore - b.avgScore)
  }
}
