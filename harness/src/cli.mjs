#!/usr/bin/env node
import { readFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluate, summarize } from './evaluate.mjs'
import { improveStyle, spendOf } from './improve.mjs'
import { loadStyle } from './style.mjs'
import { renderConsole, renderVerdict } from './report.mjs'
import { writeResults, writeAtomic, readManifest, describeManifest } from './results.mjs'
import { USAGE, wantsHelp } from './usage.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = p => JSON.parse(readFileSync(p, 'utf8'))

function parseArgs (argv) {
  const out = { _: [] }
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a)
    if (m) out[m[1]] = m[2] === undefined ? true : m[2]
    else out._.push(a)
  }
  return out
}

/** Newest results/<stamp>/rows.json, so `score` works with no arguments. */
function newestRows () {
  const base = join(ROOT, 'results')
  if (!existsSync(base)) return null
  return readdirSync(base).sort().reverse()
    .map(d => join(base, d, 'rows.json'))
    .find(p => existsSync(p)) ?? null
}

const args = parseArgs(process.argv.slice(2))
const cmd = args._[0] ?? 'help'

// Must run before anything reads config or spends a token — see usage.mjs for
// why this guard exists.
if (wantsHelp(args)) {
  console.log(USAGE)
  process.exit(0)
}

const matrix = readJson(join(ROOT, 'config/matrix.json'))
const contracts = readJson(join(ROOT, 'config/contracts.json'))
const allCases = readJson(join(ROOT, 'cases/cases.json'))

const pick = (val, fallback) => val === undefined ? fallback : String(val).split(',').map(s => s.trim()).filter(Boolean)

const styleIds = pick(args.styles, matrix.styles)

// `audit` runs before the eager style load below, and deliberately: a styleFile
// path that does not resolve is itself the drift this command exists to report,
// so it must not die inside loadStyle before printing anything.
if (cmd === 'audit') {
  const { auditAll, problemsOf, renderAudit } = await import('./contract-audit.mjs')
  const scoped = args.styles
    ? Object.fromEntries(Object.entries(contracts).filter(([id]) => styleIds.includes(id)))
    : contracts
  const missing = args.styles ? styleIds.filter(id => !contracts[id]) : []
  for (const id of missing) console.error(`no contract for style "${id}"`)
  const rows = auditAll(scoped, ROOT)
  console.log(renderAudit(rows))
  process.exitCode = problemsOf(rows).length || missing.length ? 1 : 0
  process.exit()
}

const models = pick(args.models, matrix.models)
const variantIds = pick(args.variants, matrix.variants.map(v => v.id))
const variants = matrix.variants.filter(v => variantIds.includes(v.id))
const cases = args.cases ? allCases.filter(c => pick(args.cases).includes(c.id)) : allCases

const styles = styleIds.map(id => {
  const c = contracts[id]
  if (!c) throw new Error(`no contract for style "${id}"`)
  const s = loadStyle(resolve(ROOT, c.styleFile))
  return { id, ...s }
})

const opts = {
  ...matrix.run,
  repeats: Number(args.repeats ?? matrix.run.repeats),
  concurrency: Number(args.concurrency ?? matrix.run.concurrency),
  judge: args['no-judge'] ? false : matrix.run.judge
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = join(ROOT, 'results', stamp)

const progress = (done, total, r) => {
  const tag = r.error ? 'ERR' : `${(r.total * 100).toFixed(0)}%`
  process.stderr.write(`\r[${String(done).padStart(3)}/${total}] ${tag.padEnd(4)} ${r.caseId ?? ''}          `)
}

if (cmd === 'run') {
  mkdirSync(outDir, { recursive: true })
  const expected = styles.length * variants.length * models.length * cases.length * opts.repeats
  console.error(`cells: ${styles.length} styles x ${variants.length} variants x ${models.length} models x ${cases.length} cases x ${opts.repeats} repeats = ${expected}`)
  // Persist after every completed cell. A run is routinely ended by Ctrl-C, an
  // OOM or a laptop lid, and the cells it has already bought are the most
  // expensive thing in this project — writing them once at the end throws away
  // everything a killed run paid for. `improve` has always done this; this is
  // the same flush on the path that spends the most.
  const flush = (rows, complete = false) => writeResults({ outDir, rows, stamp, kind: 'run', expected, complete })
  const { rows } = await evaluate({ styles, variants, models, cases, contracts, opts, onProgress: progress, onRows: rows => flush(rows) })
  process.stderr.write('\n')
  const { summary } = flush(rows, true)
  console.log(renderConsole(summary))
  console.log(`\nwrote ${outDir}`)

} else if (cmd === 'improve') {
  const cfg = { ...matrix.improve, maxIterations: Number(args.iterations ?? matrix.improve.maxIterations) }
  const variant = variants[0] ?? matrix.variants[0]
  mkdirSync(outDir, { recursive: true })
  const log = m => console.error(m)
  const results = []
  const allRows = []
  // The transcripts live in rows.json, in the same shape and at the same path
  // the `run` command uses — that is what lets `score` re-grade an improve run
  // offline with no arguments. improve.json stays a summary of the loop.
  // The cell count an improve loop will reach is not known up front (it depends
  // on how many iterations it buys), so the manifest carries no expected count.
  // improve.json before writeResults, for the reason results.mjs writes its
  // manifest last: a kill between the two must never leave a manifest saying
  // `complete` over an improve.json that is a flush stale and missing a style's
  // whole verdict.
  const flush = (complete = false) => {
    writeAtomic(join(outDir, 'improve.json'), JSON.stringify(results, null, 2))
    writeResults({ outDir, rows: allRows, stamp, kind: 'improve', expected: null, complete })
  }
  for (const style of styles) {
    const before = allRows.length
    try {
      // improveStyle returns its own rows; strip them so improve.json stays a
      // summary of the loop rather than a second copy of rows.json.
      // Wrapped, not passed bare: improveStyle calls onRows(rows), and flush's
      // first parameter is the completeness flag.
      const { rows, ...r } = await improveStyle({ style, variant, models, cases, contracts, opts, cfg, outDir: join(outDir, 'candidates'), log, rows: allRows, onRows: () => flush() })
      results.push(r)
    } catch (err) {
      log(`[${style.id}] FAILED: ${String(err.message ?? err).slice(0, 200)}`)
      // allRows already holds whatever this style measured before it threw, so
      // the spend it burned is still attributable to it.
      results.push({ styleId: style.id, error: String(err.message ?? err), best: null, history: [], reserve: null, spentUsd: spendOf(allRows.slice(before)) })
    }
    // Persist after every style too: flush() during the loop only ran if the
    // style got as far as its first measurement.
    flush()
  }
  // Reaching the end of the loop is not the same as the loop having worked. A
  // style that threw was caught and recorded, and its rows are the wreckage of
  // an aborted optimization; stamping `complete` over them would have `score`
  // announce a finished improve run. `run` already behaves this way — a throw
  // out of evaluate leaves the last flush's `complete: false` standing.
  flush(results.every(r => !r.error))
  for (const r of results.filter(r => r.best)) console.log(`\n${renderVerdict(r, cfg.reserveSplit)}`)
  console.log(`\ntotal spend $${spendOf(allRows)} across ${allRows.length} saved cells`)
  console.log(`candidates in ${join(outDir, 'candidates')}`)
  console.log(`re-score offline with: node src/cli.mjs score --rows=${join(outDir, 'rows.json')}`)

} else if (cmd === 'score') {
  // Re-score saved transcripts without spending tokens. Use after editing checks.
  const rowsPath = args.rows ? resolve(args.rows) : newestRows()
  if (!rowsPath) throw new Error('no saved runs found — pass --rows=results/<stamp>/rows.json')
  console.error(`re-scoring ${rowsPath}`)
  const manifest = readManifest(rowsPath)
  const rows = readJson(rowsPath)
  const { scoreDeterministic, viewsOf } = await import('./checks.mjs')
  const agenticCases = new Set(allCases.filter(c => c.agentic).map(c => c.id))
  let legacy = 0
  let legacyAgentic = 0
  const orphans = new Map()
  const rescored = rows.map(r => {
    const caseDef = allCases.find(c => c.id === r.caseId)
    const contract = contracts[r.styleId]
    const views = viewsOf(r)
    if (views.legacy) {
      legacy++
      if (agenticCases.has(r.caseId)) legacyAgentic++
    }
    // A saved run can name a style that no longer has a contract — every
    // optimizer candidate does, and so do the two arms of the sentence-cap
    // experiment. Re-scoring is this project's free way to re-derive a published
    // figure, and passing an undefined contract into the first check threw,
    // taking the whole file down over rows nobody asked about. Carry the row
    // with its saved scores instead, and name what was skipped.
    if (!contract) {
      orphans.set(r.styleId, (orphans.get(r.styleId) ?? 0) + 1)
      return r
    }
    const s = r.text ? scoreDeterministic(views, contract, caseDef) : { total: 0, checks: [] }
    const wJudge = contract.judgeWeight ?? 0.3
    return { ...r, rulesScore: s.total, checks: s.checks, total: Number((s.total * (1 - wJudge) + (r.judgeScore ?? 1) * wJudge).toFixed(3)) }
  })
  if (orphans.size) {
    const named = [...orphans].map(([id, n]) => `${id} (${n})`).join(', ')
    console.log(`${[...orphans.values()].reduce((a, b) => a + b, 0)} of ${rows.length} rows name a style with no contract and were NOT re-scored — they carry the scores saved with them: ${named}.`)
  }
  // Re-scoring is the project's cheap way to re-derive a published figure, and
  // the one thing it cannot re-derive is the text-block seam: a row saved before
  // COS-10 holds the turn already glued, so its agentic cells are re-scored on a
  // string the fix would never have produced. Conversational cells are unaffected
  // — they were always one block — so the qualification is per-row, not per-run.
  if (legacy) {
    console.log(`${legacy} of ${rows.length} rows predate the COS-10 text-block fix and carry the whole turn glued into one string. ` +
      (legacyAgentic
        ? `${legacyAgentic} of them are agentic cells: their figures below are measured on the old scorer and are not comparable with a post-fix run. Re-run those cells to replace them.`
        : 'None are agentic cells, so the seam does not affect these figures.'))
  }
  // On stdout, with the tables, not on stderr beside the progress chatter:
  // `npm run score > figures.txt` has to carry the completeness line with the
  // numbers it qualifies. A bare `score` now resolves to the newest run of any
  // kind, and since COS-12 a killed run leaves one behind, so the newest run is
  // more likely than before to be a partial one.
  console.log(describeManifest(manifest))
  console.log(renderConsole(summarize(rescored)))

} else {
  console.error(`unknown command "${cmd}"`)
  console.log(USAGE)
  process.exitCode = 2
}
