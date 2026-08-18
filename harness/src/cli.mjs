#!/usr/bin/env node
import { readFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluate, summarize } from './evaluate.mjs'
import { improveStyle, resolveImproveModels } from './improve.mjs'
import { cellLimitMs, secondsToMs } from './run.mjs'
import { loadStyle } from './style.mjs'
import { renderConsole, renderVerdict } from './report.mjs'
import { writeResults, writeAtomic, readManifest, describeManifest } from './results.mjs'
import { USAGE, wantsHelp } from './usage.mjs'
import { FLAGS, validateFlags, pick, num, matchList } from './args.mjs'

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

// Must run before anything reads config or runs a cell — see usage.mjs for
// why this guard exists.
if (wantsHelp(args)) {
  console.log(USAGE)
  process.exit(0)
}

// Checked before validateFlags, and by the same table it uses, so a typo'd
// subcommand is reported as itself instead of surfacing as a confusing flag
// complaint from code that assumed a subcommand it recognises.
if (!(cmd in FLAGS)) {
  console.error(`unknown command "${cmd}"`)
  console.log(USAGE)
  process.exitCode = 2
  process.exit()
}

validateFlags(cmd, args)

const matrix = readJson(join(ROOT, 'config/matrix.json'))
const contracts = readJson(join(ROOT, 'config/contracts.json'))
const allCases = readJson(join(ROOT, 'cases/cases.json'))

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
const knownVariantIds = matrix.variants.map(v => v.id)
const variantIds = matchList('variants', args.variants, knownVariantIds) ?? knownVariantIds
const variants = matrix.variants.filter(v => variantIds.includes(v.id))
const requestedCaseIds = matchList('cases', args.cases, allCases.map(c => c.id))
const cases = requestedCaseIds ? allCases.filter(c => requestedCaseIds.includes(c.id)) : allCases

const styles = styleIds.map(id => {
  const c = contracts[id]
  if (!c) throw new Error(`no contract for style "${id}"`)
  const s = loadStyle(resolve(ROOT, c.styleFile))
  return { id, ...s }
})

const opts = {
  ...matrix.run,
  repeats: num('repeats', args.repeats, matrix.run.repeats),
  concurrency: num('concurrency', args.concurrency, matrix.run.concurrency),
  judge: args['no-judge'] ? false : matrix.run.judge
}

// Once, here, rather than per cell. runCell also checks, but by then the damage
// to the reading is done: under `improve` the throw is caught by the per-style
// handler and filed as a style failure, so a typo in matrix.json reads like an
// optimizer crash; under `run` it surfaces after an empty results/<stamp>/ has
// already been created. Fail before either directory exists. `score` re-grades
// saved rows and never runs a cell, so it is not held to this.
if (cmd === 'run' || cmd === 'improve') cellLimitMs(opts.maxCellSeconds)
// Same discipline for the judge and rewrite calls, neither of which the guard
// above covers — COS-26. `judge` (this file's re-judge command) spends judge
// calls with no cell around them at all, so it is checked here too, not just
// `run`/`improve` — except its own `--judgements` form, which re-derives a
// finished judge run's figures offline and spends no judge call either, the
// same reason `score` is excluded above.
if (cmd === 'run' || cmd === 'improve' || (cmd === 'judge' && !args.judgements)) secondsToMs('run.judgeTimeoutSeconds', opts.judgeTimeoutSeconds)
if (cmd === 'improve') secondsToMs('improve.rewriteTimeoutSeconds', matrix.improve.rewriteTimeoutSeconds)

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
  // OOM or a laptop lid, and the cells it has already measured are the slowest
  // thing in this project to produce — writing them once at the end throws away
  // everything a killed run measured. `improve` has always done this; this is
  // the same flush on the path that measures the most.
  const flush = (rows, complete = false) => writeResults({ outDir, rows, stamp, kind: 'run', expected, complete })
  const { rows } = await evaluate({ styles, variants, models, cases, contracts, opts, onProgress: progress, onRows: rows => flush(rows) })
  process.stderr.write('\n')
  const { summary } = flush(rows, true)
  console.log(renderConsole(summary))
  console.log(`\nwrote ${outDir}`)

} else if (cmd === 'improve') {
  const cfg = { ...matrix.improve, maxIterations: num('iterations', args.iterations, matrix.improve.maxIterations) }
  // Exactly one variant. `variants` defaults to every configured variant (the
  // same default `run` iterates over) when --variants is omitted, and improve
  // deliberately keeps that case's long-standing meaning — the first
  // configured variant, undisturbed, the way README's bare `improve` and
  // `npm run improve` already rely on. An explicit --variants naming more
  // than one is different: that used to fall through to
  // `variants[0] ?? matrix.variants[0]` and quietly run only the first the
  // operator listed, which is the silent narrowing this task is about.
  if (args.variants !== undefined && variants.length > 1) throw new Error(`improve takes exactly one variant; matched ${variants.length} (${variantIds.join(',')}) — pass --variants=<one-id>`)
  const variant = variants[0]
  mkdirSync(outDir, { recursive: true })
  const log = m => console.error(m)
  // `models` above is run's list, and improve must not draw on it: every arm
  // the loop measures runs across its whole list, so one extra model in
  // matrix.models used to multiply through all sixteen. Resolved here rather
  // than at the shared `pick` above, because `run` must keep seeing matrix.models.
  // validateFlags already rejects a bare `--models` (no `=`) before this line
  // runs, so `models` is never the ["true"] pick() would have produced for it.
  const improveModels = resolveImproveModels({
    cliModels: args.models === undefined ? undefined : models,
    cfg,
    log
  })
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
      const { rows, ...r } = await improveStyle({ style, variant, models: improveModels, cases, contracts, opts, cfg, outDir: join(outDir, 'candidates'), log, rows: allRows, onRows: () => flush() })
      results.push(r)
    } catch (err) {
      log(`[${style.id}] FAILED: ${String(err.message ?? err).slice(0, 200)}`)
      // allRows already holds whatever this style measured before it threw, so
      // the cells it burned are still attributable to it.
      results.push({ styleId: style.id, error: String(err.message ?? err), best: null, history: [], reserve: null, cells: allRows.slice(before).length })
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
  console.log(`\n${allRows.length} saved cells`)
  console.log(`candidates in ${join(outDir, 'candidates')}`)
  console.log(`re-score offline with: node src/cli.mjs score --rows=${join(outDir, 'rows.json')}`)

} else if (cmd === 'score') {
  // Re-score saved transcripts without re-running a cell. Use after editing checks.
  const rowsPath = args.rows ? resolve(args.rows) : newestRows()
  if (!rowsPath) throw new Error('no saved runs found — pass --rows=results/<stamp>/rows.json')
  console.error(`re-scoring ${rowsPath}`)
  const manifest = readManifest(rowsPath)
  const rows = readJson(rowsPath)
  const { scoreDeterministic, viewsOf, hasTurnText } = await import('./checks.mjs')
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
    // The same predicate the live path applies, not a second rule that happens
    // to agree most of the time. Re-scoring is this project's free way to
    // re-derive a published figure, and a re-derivation that grades a different
    // set of cells from the run it re-derives is not one. This branched on
    // `r.text`, which reads the final message and so disagreed with the live
    // guard on a turn whose text came before its last tool call.
    // Whether the row then lands in a mean is summarize()'s question, not this
    // one — see producedReply.
    const s = hasTurnText(r) ? scoreDeterministic(views, contract, caseDef) : { total: 0, checks: [] }
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

} else if (cmd === 'judge' && args.judgements) {
  // Re-derive a finished judge run's figures with the current code, spending
  // nothing. This project's rule is that a published figure must be
  // re-derivable offline — `score` is that path for the checks, and without
  // this one a judge run's numbers could only be recomputed by paying for every
  // call again. Rewrites `analysis.json` and `report.md` beside the records so
  // the directory keeps describing itself; `judgements.json` is the measurement
  // and is never touched. Its own branch rather than an early return inside the
  // one below, so nothing here needs a process.exit() that could truncate a
  // piped report.
  const { analyzeJudgements, renderJudgeReport, judgeReportDoc, assertJudgements, JUDGE_MANIFEST } = await import('./rejudge.mjs')
  const path = resolve(args.judgements)
  const records = readJson(path)
  // Refuse anything that is not a judgements file, before writing a byte.
  // `--rows` and `--judgements` sit next to each other in the usage text and
  // both take a results/<stamp>/*.json path, and this command REWRITES
  // report.md beside whatever it is given: pointing it at a run's rows.json
  // replaced that run's adherence report with an empty judge report, and the
  // only symptom was a line saying every call failed. A run's cells cannot be
  // recovered without paying for them again.
  assertJudgements(records, path)
  const dir = dirname(path)
  // The reference the run was measured against, not this machine's default
  // judgeModel. Re-deriving a run judged with reference `opus` under a silent
  // `sonnet` produces a different analysis, labels it with a judge that
  // produced none of its numbers, and then overwrites the correct one.
  const manifest = existsSync(join(dir, JUDGE_MANIFEST)) ? readJson(join(dir, JUDGE_MANIFEST)) : null
  const reference = args.reference ?? manifest?.reference ?? records[0].judgeModel
  const analysis = analyzeJudgements(records, { reference })
  console.error(`re-deriving ${path} against reference ${reference}${args.reference ? '' : manifest ? ' (from judge.json)' : ' (first record)'}`)
  writeAtomic(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2))
  writeAtomic(join(dir, 'report.md'), judgeReportDoc(analysis, path))
  console.log(renderJudgeReport(analysis))

} else if (cmd === 'judge') {
  // Re-judge saved replies with one or more judge models, several times each.
  // This runs no cell: it reads a finished run's rows.json and spends judge
  // calls only, which is what makes characterising the judge affordable.
  const { createHash } = await import('node:crypto')
  const { planJudgements, rejudge, analyzeJudgements, renderJudgeReport, judgeReportDoc, JUDGE_MANIFEST } = await import('./rejudge.mjs')
  const rowsPath = args.rows ? resolve(args.rows) : newestRows()
  if (!rowsPath) throw new Error('no saved runs found — pass --rows=results/<stamp>/rows.json')
  const rows = readJson(rowsPath)
  const judges = pick(args.judges, [opts.judgeModel])
  const judgeRepeats = num('judge-repeats', args['judge-repeats'], 3)
  const reference = args.reference ?? judges[0]
  // Up front, before a single call is paid for. Every agreement figure is
  // measured against the reference, and a reference nobody judges leaves an
  // empty agreement table and a sizing table labelled with a judge that
  // produced none of its numbers.
  if (!judges.includes(reference)) throw new Error(`--reference=${reference} is not among --judges=${judges.join(',')}; nothing would be compared against it`)
  const { tasks, eligible, skipped } = planJudgements({
    rows,
    cases: allCases,
    contracts,
    judges,
    repeats: judgeRepeats,
    styleIds: args.styles ? styleIds : null,
    caseIds: requestedCaseIds
  })
  console.error(`re-judging ${rowsPath}`)
  console.error(`${eligible.length} of ${rows.length} rows eligible x ${judges.length} judges (${judges.join(', ')}) x ${judgeRepeats} repeats = ${tasks.length} judge calls`)
  for (const [id, n] of skipped.noContract) console.error(`  skipped ${n} rows: style "${id}" has no contract`)
  for (const [id, n] of skipped.noCase) console.error(`  skipped ${n} rows: case "${id}" is not in the pool`)
  if (skipped.noReply) console.error(`  skipped ${skipped.noReply} rows that produced no reply`)
  if (skipped.noRubric) console.error(`  skipped ${skipped.noRubric} rows whose case has no judge rubric`)
  if (skipped.filtered) console.error(`  skipped ${skipped.filtered} rows excluded by --styles/--cases`)
  // Style text for the styles the eligible rows actually name, loaded after the
  // plan rather than for every contract. `audit` exists because a styleFile path
  // drifts, and eagerly loading all of them made `judge` die with a bare ENOENT
  // over a style these rows never mention. Today's text, exactly as `score`
  // re-scores against today's checks; the sha is recorded because a style file
  // that has moved since the run makes this a different question from the one
  // the run answered.
  const styleBodies = {}
  const styleShas = {}
  for (const id of new Set(eligible.map(i => rows[i].styleId))) {
    const s = loadStyle(resolve(ROOT, contracts[id].styleFile))
    styleBodies[id] = s.body ?? s.text
    styleShas[id] = createHash('sha256').update(s.text).digest('hex').slice(0, 12)
  }
  mkdirSync(outDir, { recursive: true })
  const flush = (records, complete = false) => {
    const analysis = analyzeJudgements(records, { reference })
    const manifest = {
      kind: 'judge',
      stamp,
      complete,
      completed: records.length,
      expected: tasks.length,
      source: rowsPath,
      sourceManifest: readManifest(rowsPath),
      judges,
      reference,
      repeats: judgeRepeats,
      rowsEligible: eligible.length,
      rowsInSource: rows.length,
      styleShas
    }
    writeAtomic(join(outDir, 'judgements.json'), JSON.stringify(records, null, 2))
    writeAtomic(join(outDir, 'analysis.json'), JSON.stringify(analysis, null, 2))
    writeAtomic(join(outDir, 'report.md'), judgeReportDoc(analysis, rowsPath))
    // Manifest last, for the reason results.mjs writes its own last.
    writeAtomic(join(outDir, JUDGE_MANIFEST), JSON.stringify(manifest, null, 2))
    return analysis
  }
  const judgeProgress = (done, total, r) => process.stderr.write(`\r[${String(done).padStart(4)}/${total}] ${r.judgeModel.padEnd(20)} ${r.ok ? (r.score * 100).toFixed(0).padStart(3) : 'ERR'}  ${r.caseId ?? ''}          `)
  const records = await rejudge({
    rows,
    tasks,
    cases: allCases,
    contracts,
    styleBodies,
    judgeTimeoutSeconds: opts.judgeTimeoutSeconds,
    concurrency: opts.concurrency,
    onProgress: judgeProgress,
    onRecords: rs => flush(rs)
  })
  process.stderr.write('\n')
  const analysis = flush(records, true)
  console.log(renderJudgeReport(analysis))
  console.log(`wrote ${outDir}`)

} else if (cmd === 'interval') {
  // A paired 95% Student-t interval between two saved runs, reproducing
  // FINDINGS.md's published method (COS-27). Runs no cell.
  const { pairedInterval, METRICS } = await import('./interval.mjs')
  if (!args.before || !args.after) throw new Error('interval needs --before=results/<stamp>/rows.json and --after=...')
  const metric = args.metric ?? 'rules'
  const getValue = METRICS[metric]
  if (!getValue) throw new Error(`--metric=${metric} is not one of: ${Object.keys(METRICS).join(', ')}`)
  const loadRows = paths => pick(paths, []).flatMap(p => readJson(resolve(p)))
  const beforeRows = loadRows(args.before)
  const afterRows = loadRows(args.after)
  const r = pairedInterval(beforeRows, afterRows, { getValue })
  const sign = r.mean >= 0 ? '+' : ''
  console.log(`${metric}: ${sign}${r.mean.toFixed(1)} [${r.lo >= 0 ? '+' : ''}${r.lo.toFixed(1)}, ${r.hi >= 0 ? '+' : ''}${r.hi.toFixed(1)}], t=${r.t.toFixed(2)}, df=${r.df}, n=${r.n} pairs`)
}
