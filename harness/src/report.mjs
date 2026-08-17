const bar = s => '█'.repeat(Math.round(s * 20)).padEnd(20, '░')
const pct = s => `${(s * 100).toFixed(1)}%`

function table (title, rows) {
  if (!rows.length) return ''
  const w = Math.max(...rows.map(r => String(r.key).length), 4)
  const lines = rows.map(r =>
    `  ${String(r.key).padEnd(w)}  ${bar(r.score)} ${pct(r.score).padStart(6)}  ` +
    `rules ${pct(r.rules).padStart(6)}  judge ${pct(r.judge).padStart(6)}  n=${String(r.n).padStart(3)}` +
    (r.errors ? `  errors=${r.errors}` : '')
  )
  return `\n${title}\n${lines.join('\n')}\n`
}

// An improve run pools the baseline with every candidate it tried, most of which
// were rejected. Its headline is the mean of all of them and is nobody's score —
// say so, in both renderers, because these files look exactly like a `run`'s.
const TRACE_WARNING =
  'Optimizer trace: every row from every iteration, rejected candidates included. ' +
  'The overall figure is their mean, not any style\'s score — read the by-iteration ' +
  'table, where v0 is the measured baseline.'

const isTrace = summary => (summary.byIteration ?? []).length > 0

/**
 * One line saying what a reader is holding, rendered from a run's `run.json`.
 *
 * Lives here rather than beside the writer because it is the same job as
 * TRACE_WARNING above: a set of figures that is easy to quote as something it is
 * not, labelled at the point of reading. `score` prints it above its tables and
 * `report.md` carries it as a banner.
 */
export function describeManifest (manifest) {
  if (!manifest) {
    return 'no run manifest beside these rows — completeness unknown. ' +
      'Runs saved before manifests existed look like this; so does a rows.json copied out of its directory.'
  }
  const label = manifest.kind === 'run' ? 'run' : `${manifest.kind} run`
  const cells = `${manifest.completed} cell${manifest.completed === 1 ? '' : 's'}`
  if (manifest.complete) return `complete ${label} — ${cells}`
  const missing = manifest.expected == null ? '' : ` of ${manifest.expected} expected (${manifest.expected - manifest.completed} never ran)`
  return `PARTIAL ${label} — ${cells}${missing}. ` +
    'This run did not finish. Every figure below describes the cells that survived, not the matrix that was requested.'
}

export function renderConsole (summary) {
  let out = isTrace(summary) ? `\n! ${TRACE_WARNING}\n` : ''
  out += `\nOVERALL ${pct(summary.overall)}   cost $${summary.totalCostUsd}\n`
  out += table('BY MODEL', summary.byModel)
  out += table('BY VARIANT', summary.byVariant)
  out += table('BY STYLE x MODEL', summary.byStyleModel)
  out += table('BY CASE', summary.byCase)
  out += table('BY SPLIT', summary.bySplit)
  out += table('BY ITERATION', summary.byIteration ?? [])

  const f = summary.failures.slice(0, 12)
  if (f.length) {
    out += '\nWORST RULES\n'
    for (const x of f) {
      out += `  ${x.checkId} @ ${x.model} (${x.styleId})  avg ${pct(x.avgScore)}  n=${x.n}\n`
      for (const e of x.evidence.slice(0, 2)) out += `      ${e}\n`
    }
  }
  return out
}

/**
 * One style's verdict after an improve run.
 *
 * The loop's winner is not automatically the run's winner. A candidate the
 * reserve split rejected has already been rolled back to v0, so the headline
 * has to say REJECTED — printing train and holdout alone would read as an
 * adoption, and those are the two splits the rejected candidate won.
 *
 * @param {object} r  one entry of improve.json (best, history, reserve)
 * @param {string} [reserveSplit]  split name, for the "not measured" case
 */
export function renderVerdict (r, reserveSplit = 'reserve') {
  const rejected = r.reserve && !r.reserve.accepted
  const headline = rejected
    ? `v${r.reserve.iteration} REJECTED on ${r.reserve.split} — keeping v0`
    : `adopted v${r.best.iteration}`
  const lines = [`${r.styleId}: ${headline}  (train ${r.best.train} holdout ${r.best.holdout})`]

  if (r.reserve) {
    const d = r.reserve.delta
    lines.push(`  ${r.reserve.split}: v${r.reserve.iteration} ${r.reserve.candidate} vs v0 ${r.reserve.baseline} ` +
               `(${d >= 0 ? '+' : ''}${d}) over ${r.reserve.cases} cases`)
    // A verdict computed over fewer cases than the split holds is a weaker
    // verdict, and silently printing the full case count would hide that.
    const dropped = r.reserve.droppedCases ?? []
    if (dropped.length) {
      lines.push(`    ${dropped.length} case(s) errored and were excluded: ${dropped.join(', ')}` +
                 (r.reserve.comparedCells !== undefined ? ` (${r.reserve.comparedCells} cells compared)` : ''))
    }
  } else if (r.best.iteration === 0) {
    lines.push('  reserve: not measured — no rewrite was kept')
  } else {
    // Unmeasured is not the same as passed, and the line must not let a reader
    // treat it as one — usually this is --cases= having filtered the split out.
    lines.push(`  reserve: NOT MEASURED — no ${reserveSplit} cases in this run; this candidate is unvalidated`)
  }

  for (const h of r.history) lines.push(`  v${h.iteration}: train ${h.train} holdout ${h.holdout} ${h.kept ? 'KEEP' : 'revert'}`)
  return lines.join('\n')
}

export function renderMarkdown (summary, meta = {}) {
  const md = (title, rows) => rows.length
    ? `\n### ${title}\n\n| | score | rules | judge | n | errors |\n|---|---|---|---|---|---|\n` +
      rows.map(r => `| ${r.key} | ${pct(r.score)} | ${pct(r.rules)} | ${pct(r.judge)} | ${r.n} | ${r.errors} |`).join('\n') + '\n'
    : ''

  // A partial report.md is a new thing in this project — before rows were
  // flushed per cell a killed run left no report at all — and it is the file the
  // runbook tells readers to open first. Unlabelled, its Overall figure looks
  // exactly like a finished arm's.
  const partial = meta.manifest && meta.manifest.complete === false

  return [
    isTrace(summary) ? '# Optimizer trace' : '# Output style adherence report', '',
    ...(partial ? [`> **${describeManifest(meta.manifest)}**`, ''] : []),
    ...(isTrace(summary) ? [`> **${TRACE_WARNING}**`, ''] : []),
    `**Overall:** ${pct(summary.overall)}  |  **Cost:** $${summary.totalCostUsd}` +
      (meta.when ? `  |  **Run:** ${meta.when}` : ''), '',
    md('By iteration', summary.byIteration ?? []),
    md('By model', summary.byModel),
    md('By variant', summary.byVariant),
    md('By style x model', summary.byStyleModel),
    md('By case', summary.byCase),
    md('By split (overfit check)', summary.bySplit),
    '\n### Worst rules\n',
    '| rule | model | style | avg | n | evidence |',
    '|---|---|---|---|---|---|',
    ...summary.failures.slice(0, 20).map(f =>
      `| ${f.checkId} | ${f.model} | ${f.styleId} | ${pct(f.avgScore)} | ${f.n} | ${(f.evidence[0] ?? '').replace(/\|/g, '\\|').slice(0, 90)} |`)
  ].join('\n')
}
