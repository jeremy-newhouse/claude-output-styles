#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluate, summarize } from './evaluate.mjs'
import { improveStyle, spendOf } from './improve.mjs'
import { loadStyle } from './style.mjs'
import { renderConsole, renderMarkdown, renderVerdict } from './report.mjs'

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

const matrix = readJson(join(ROOT, 'config/matrix.json'))
const contracts = readJson(join(ROOT, 'config/contracts.json'))
const allCases = readJson(join(ROOT, 'cases/cases.json'))

const pick = (val, fallback) => val === undefined ? fallback : String(val).split(',').map(s => s.trim()).filter(Boolean)

const styleIds = pick(args.styles, matrix.styles)
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
  console.error(`cells: ${styles.length} styles x ${variants.length} variants x ${models.length} models x ${cases.length} cases x ${opts.repeats} repeats = ${styles.length * variants.length * models.length * cases.length * opts.repeats}`)
  const { rows, summary } = await evaluate({ styles, variants, models, cases, contracts, opts, onProgress: progress })
  process.stderr.write('\n')
  writeFileSync(join(outDir, 'rows.json'), JSON.stringify(rows, null, 2))
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
  writeFileSync(join(outDir, 'report.md'), renderMarkdown(summary, { when: stamp }))
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
  const flush = () => {
    const summary = summarize(allRows)
    writeFileSync(join(outDir, 'rows.json'), JSON.stringify(allRows, null, 2))
    writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
    writeFileSync(join(outDir, 'report.md'), renderMarkdown(summary, { when: stamp }))
    writeFileSync(join(outDir, 'improve.json'), JSON.stringify(results, null, 2))
  }
  for (const style of styles) {
    const before = allRows.length
    try {
      // improveStyle returns its own rows; strip them so improve.json stays a
      // summary of the loop rather than a second copy of rows.json.
      const { rows, ...r } = await improveStyle({ style, variant, models, cases, contracts, opts, cfg, outDir: join(outDir, 'candidates'), log, rows: allRows, onRows: flush })
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
  for (const r of results.filter(r => r.best)) console.log(`\n${renderVerdict(r, cfg.reserveSplit)}`)
  console.log(`\ntotal spend $${spendOf(allRows)} across ${allRows.length} saved cells`)
  console.log(`candidates in ${join(outDir, 'candidates')}`)
  console.log(`re-score offline with: node src/cli.mjs score --rows=${join(outDir, 'rows.json')}`)

} else if (cmd === 'score') {
  // Re-score saved transcripts without spending tokens. Use after editing checks.
  const rowsPath = args.rows ? resolve(args.rows) : newestRows()
  if (!rowsPath) throw new Error('no saved runs found — pass --rows=results/<stamp>/rows.json')
  console.error(`re-scoring ${rowsPath}`)
  const rows = readJson(rowsPath)
  const { scoreDeterministic } = await import('./checks.mjs')
  const rescored = rows.map(r => {
    const caseDef = allCases.find(c => c.id === r.caseId)
    const s = r.text ? scoreDeterministic(r.text, contracts[r.styleId], caseDef) : { total: 0, checks: [] }
    const wJudge = contracts[r.styleId]?.judgeWeight ?? 0.3
    return { ...r, rulesScore: s.total, checks: s.checks, total: Number((s.total * (1 - wJudge) + (r.judgeScore ?? 1) * wJudge).toFixed(3)) }
  })
  console.log(renderConsole(summarize(rescored)))

} else {
  console.log(`
output-style harness

  node src/cli.mjs run       [--styles=a,b] [--models=opus,sonnet] [--variants=baseline]
                             [--cases=id,id] [--repeats=2] [--concurrency=4] [--no-judge]
  node src/cli.mjs improve   [--styles=a] [--iterations=6] [--variants=baseline]
  node src/cli.mjs score     --rows=results/<stamp>/rows.json

  run      evaluate the matrix and write results/<stamp>/{rows,summary,report.md}
  improve  loop: measure -> rewrite the style -> re-measure -> keep if train up and holdout flat,
           then validate the winner on the reserve split and roll back to v0 if it regresses
  score    re-score saved transcripts offline after changing checks.mjs
`)
}
