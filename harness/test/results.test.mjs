import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeResults, writeAtomic, readManifest, describeManifest, MANIFEST } from '../src/results.mjs'
import { renderMarkdown, renderConsole } from '../src/report.mjs'
import { evaluate, summarize } from '../src/evaluate.mjs'

const dir = () => mkdtempSync(join(tmpdir(), 'harness-results-'))
const readJson = p => JSON.parse(readFileSync(p, 'utf8'))

const row = (over = {}) => ({
  styleId: 'plain-english-beginner',
  variantId: 'baseline',
  model: 'haiku',
  caseId: 'conv-status-auth',
  split: 'train',
  repeat: 0,
  text: 'I fixed the sign-in check. It works.',
  allTurns: ['I fixed the sign-in check. It works.'],
  toolCalls: [],
  costUsd: 0.01,
  error: null,
  rulesScore: 0.9,
  checks: [],
  judgeScore: 0.8,
  judgeViolations: [],
  total: 0.87,
  ...over
})

test('writeResults writes the rows, the summary, the report and the manifest', () => {
  const out = dir()
  try {
    const { manifest } = writeResults({ outDir: out, rows: [row(), row({ caseId: 'conv-badnews' })], stamp: '2026-08-17T00-00-00-000Z', expected: 8 })
    for (const f of ['rows.json', 'summary.json', 'report.md', MANIFEST]) {
      assert.ok(existsSync(join(out, f)), `${f} must be written`)
    }
    assert.equal(readJson(join(out, 'rows.json')).length, 2)
    assert.deepEqual(manifest, readJson(join(out, MANIFEST)))
    assert.equal(manifest.kind, 'run')
    assert.equal(manifest.complete, false)
    assert.equal(manifest.completed, 2)
    assert.equal(manifest.expected, 8)
    assert.equal(manifest.costUsd, 0.02)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('a flush leaves no temp files behind, so the directory is never ambiguous', () => {
  const out = dir()
  try {
    writeResults({ outDir: out, rows: [row()], stamp: 's', expected: 4 })
    assert.deepEqual(readdirSync(out).filter(f => f.endsWith('.tmp')), [])
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('a later flush fully replaces an earlier, longer one', () => {
  // rename(2), not truncate-and-write: a reader must never see a rows.json that
  // is half of one flush and half of the next.
  const out = dir()
  try {
    writeResults({ outDir: out, rows: [row(), row(), row()], stamp: 's', expected: 3 })
    writeResults({ outDir: out, rows: [row()], stamp: 's', expected: 3 })
    assert.equal(readJson(join(out, 'rows.json')).length, 1)
    assert.equal(readManifest(join(out, 'rows.json')).completed, 1)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('writeAtomic replaces a file whole', () => {
  const out = dir()
  try {
    const p = join(out, 'x.txt')
    writeAtomic(p, 'a'.repeat(100))
    writeAtomic(p, 'b')
    assert.equal(readFileSync(p, 'utf8'), 'b')
    assert.equal(existsSync(`${p}.tmp`), false)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('a partial report.md carries the completeness banner, a complete one does not', () => {
  // report.md is the file the runbook sends a reader to first. Before rows were
  // flushed per cell a killed run left no report at all; now it leaves one whose
  // Overall figure looks exactly like a finished arm's.
  const out = dir()
  try {
    writeResults({ outDir: out, rows: [row(), row()], stamp: 's', expected: 78 })
    const partial = readFileSync(join(out, 'report.md'), 'utf8')
    assert.match(partial, /^> \*\*PARTIAL run — 2 cells of 78 expected \(76 never ran\)\./m)
    writeResults({ outDir: out, rows: [row(), row()], stamp: 's', expected: 2, complete: true })
    assert.doesNotMatch(readFileSync(join(out, 'report.md'), 'utf8'), /PARTIAL/)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('renderMarkdown says nothing about completeness when it is handed no manifest', () => {
  // Every pre-COS-12 caller passes only { when }, and their reports must not
  // grow a banner claiming anything either way.
  const md = renderMarkdown(summarize([row()]), { when: 's' })
  assert.doesNotMatch(md, /PARTIAL|completeness/)
})

test('the manifest marks a finished run complete', () => {
  const out = dir()
  try {
    const { manifest } = writeResults({ outDir: out, rows: [row()], stamp: 's', expected: 1, complete: true })
    assert.equal(manifest.complete, true)
    assert.match(describeManifest(manifest), /^complete run — 1 cell$/)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('readManifest returns null when there is no manifest or it is unreadable', () => {
  const out = dir()
  try {
    const rowsPath = join(out, 'rows.json')
    writeFileSync(rowsPath, '[]')
    assert.equal(readManifest(rowsPath), null)
    writeFileSync(join(out, MANIFEST), '{ not json')
    assert.equal(readManifest(rowsPath), null)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('describeManifest names a partial run, its shortfall, and what its figures mean', () => {
  const partial = describeManifest({ kind: 'run', complete: false, completed: 12, expected: 78 })
  assert.match(partial, /PARTIAL/)
  assert.match(partial, /12 cells of 78 expected \(66 never ran\)/)
  assert.match(partial, /did not finish/)
})

test('describeManifest handles an improve run, whose cell count is not known up front', () => {
  const m = describeManifest({ kind: 'improve', complete: false, completed: 24, expected: null })
  assert.match(m, /PARTIAL improve run — 24 cells\./)
  assert.doesNotMatch(m, /expected/)
})

test('describeManifest says completeness is unknown rather than assuming it', () => {
  // Pre-manifest runs in the ledger look like this. Silence would read as
  // "complete", which is the failure this whole file exists to prevent.
  const m = describeManifest(null)
  assert.match(m, /unknown/)
  assert.doesNotMatch(m, /PARTIAL/)
})

// --- the flush hook itself -------------------------------------------------

const CONTRACTS = { s: { defaultChecks: [], judgeWeight: 0.3 } }
const CASES = [{ id: 'c1', split: 'train', prompt: 'p' }, { id: 'c2', split: 'train', prompt: 'p' }, { id: 'c3', split: 'train', prompt: 'p' }]
const STYLES = [{ id: 's', text: 'style', body: 'style' }]
const VARIANTS = [{ id: 'baseline' }]
const OPTS = { repeats: 1, concurrency: 1, maxTurns: 4, maxBudgetUsd: 1, judge: false }

const fakeRunCell = async ({ styleId, variant, model, caseDef, repeat }) => ({
  styleId, variantId: variant.id, model, caseId: caseDef.id, split: caseDef.split, repeat,
  text: 'ok', allTurns: ['ok'], toolCalls: [], costUsd: 0.01, error: null
})

test('evaluate fires onRows after every completed cell', async () => {
  const seen = []
  const { rows } = await evaluate({
    styles: STYLES, variants: VARIANTS, models: ['haiku'], cases: CASES, contracts: CONTRACTS, opts: OPTS,
    onRows: rs => seen.push(rs.length),
    deps: { runCell: fakeRunCell }
  })
  assert.equal(rows.length, 3)
  assert.deepEqual(seen, [1, 2, 3], 'one flush per cell, growing by one each time')
})

test('the rows handed to onRows are the same rows, in the same order, as the final result', async () => {
  // A partial rows.json must be orderable against the complete file it would
  // have become; appending in completion order would make the two disagree.
  let last = null
  const { rows } = await evaluate({
    styles: STYLES, variants: VARIANTS, models: ['haiku'], cases: CASES, contracts: CONTRACTS, opts: OPTS,
    onRows: rs => { last = rs },
    deps: { runCell: fakeRunCell }
  })
  assert.deepEqual(last.map(r => r.caseId), rows.map(r => r.caseId))
})

test('onRows never hands out a hole, even when cells finish out of order', async () => {
  // concurrency 3 with a reversed finishing order: the middle cell lands last.
  const delays = { c1: 30, c2: 60, c3: 0 }
  const slowRunCell = async args => {
    await new Promise(r => setTimeout(r, delays[args.caseDef.id]))
    return fakeRunCell(args)
  }
  const seen = []
  await evaluate({
    styles: STYLES, variants: VARIANTS, models: ['haiku'], cases: CASES, contracts: CONTRACTS,
    opts: { ...OPTS, concurrency: 3 },
    onRows: rs => seen.push(rs.map(r => r.caseId)),
    deps: { runCell: slowRunCell }
  })
  for (const snapshot of seen) {
    assert.ok(snapshot.every(Boolean), 'no undefined entries')
    assert.deepEqual(snapshot, [...snapshot].sort((a, b) => a.localeCompare(b)), 'matrix order preserved')
  }
  assert.deepEqual(seen.at(-1), ['c1', 'c2', 'c3'])
})

test('a flushed partial file re-reads as the cells that survived', async () => {
  // The end-to-end shape of AC #1 and #3 without spending: flush every cell,
  // stop after two, then read what a later `score` would read.
  const out = dir()
  try {
    mkdirSync(out, { recursive: true })
    let stop = false
    await evaluate({
      styles: STYLES, variants: VARIANTS, models: ['haiku'], cases: CASES, contracts: CONTRACTS, opts: OPTS,
      onRows: rs => {
        if (stop) return
        writeResults({ outDir: out, rows: rs, stamp: 's', expected: 3 })
        if (rs.length === 2) stop = true // stand-in for the process dying here
      },
      deps: { runCell: fakeRunCell }
    })
    const saved = readJson(join(out, 'rows.json'))
    assert.equal(saved.length, 2)
    assert.equal(saved.every(r => r.total !== undefined), true, 'survivors are fully scored rows')
    const m = readManifest(join(out, 'rows.json'))
    assert.equal(m.complete, false)
    assert.equal(m.completed, 2)
    assert.equal(m.expected, 3)
    assert.match(describeManifest(m), /PARTIAL run — 2 cells of 3 expected \(1 never ran\)/)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

// ---------- COS-11: a cell that said nothing must not move any figure ----------

// The two halves of the score fail in opposite directions on a silent cell, so
// they never cancel: every deterministic check is a "no X found" search that an
// empty string wins or loses wholesale, and the judge is skipped and handed a
// neutral 1.0. These fixtures are built so a pooled mean would visibly move —
// good cells score high on rules and LOW on the judge, which is the real shape
// (measured: agentic-fix-verify on haiku, rules 10.3% judge 85.8% at 5 aborts
// in 6 cells) and the shape in which the two biases are easiest to confuse for
// noise.
const good = over => row({ rulesScore: 0.9, judgeScore: 0.4, total: 0.75, ...over })
const aborted = over => row({
  text: '', trace: '', error: 'error_max_turns',
  rulesScore: 0, checks: [], judgeScore: 1, total: 0.3, ...over
})
// No error flag, no text. evaluate.mjs's guard used to read `error && !text`, so
// this cell was scored: every ban check finds no banned thing in an empty string
// and the judge early-returns 1.0, which put it near 0.95 for saying nothing.
const silent = over => row({
  text: '', trace: '', error: null,
  rulesScore: 0.931, checks: [], judgeScore: 1, total: 0.951, ...over
})

test('an aborted cell raises no judge mean and lowers no rules mean, in one run', () => {
  const clean = summarize([good(), good({ caseId: 'conv-badnews' })])
  const withAbort = summarize([good(), good({ caseId: 'conv-badnews' }), aborted({ caseId: 'agentic-fix-verify' })])

  // Both halves, from the same run. Pooled, the abort would drag rules to 0.600
  // and lift judge to 0.600 — the two errors are the same size and opposite, so
  // checking only one of them would pass while the other stayed broken.
  assert.equal(withAbort.byModel[0].rules, clean.byModel[0].rules, 'rules mean unmoved')
  assert.equal(withAbort.byModel[0].judge, clean.byModel[0].judge, 'judge mean unmoved')
  assert.equal(withAbort.byModel[0].rules, 0.9)
  assert.equal(withAbort.byModel[0].judge, 0.4)
  assert.equal(withAbort.overall, clean.overall)

  // And the reader is told the arm is short, at the same place as the figures.
  assert.equal(withAbort.byModel[0].n, 2)
  assert.equal(withAbort.byModel[0].noReply, 1)
  assert.equal(withAbort.byModel[0].cells, 3)
  assert.equal(withAbort.n, 2)
  assert.equal(withAbort.noReply, 1)
  assert.equal(withAbort.cells, 3)
})

test('a cell that goes silent without an error flag is excluded on the same terms', () => {
  const clean = summarize([good(), good({ caseId: 'conv-badnews' })])
  const withSilent = summarize([good(), good({ caseId: 'conv-badnews' }), silent({ caseId: 'agentic-fix-verify' })])
  assert.equal(withSilent.byModel[0].rules, clean.byModel[0].rules)
  assert.equal(withSilent.byModel[0].judge, clean.byModel[0].judge)
  assert.equal(withSilent.byModel[0].noReply, 1, 'counted as no reply, not as a scored cell')
})

test('the cost of a cell that said nothing still counts against its arm', () => {
  // The one figure that must keep pooling them: an aborted cell burned real
  // tokens, and dropping its spend would understate what an arm cost to buy.
  const s = summarize([good({ costUsd: 0.02 }), aborted({ caseId: 'agentic-fix-verify', costUsd: 0.05 })])
  assert.equal(s.totalCostUsd, 0.07)
  assert.equal(s.byModel[0].costUsd, 0.07)
})

test('an arm where nothing replied reports as unmeasured, not as a score', () => {
  const s = summarize([
    aborted({ caseId: 'agentic-fix-verify' }),
    aborted({ caseId: 'reserve-agentic-write' })
  ])
  // null, not 0. Zero is a score — the worst one — and would publish "we could
  // not measure this" as "the style failed every rule".
  assert.equal(s.overall, null)
  assert.equal(s.byModel[0].score, null)
  assert.equal(s.byModel[0].rules, null)
  assert.equal(s.byModel[0].judge, null)
  assert.equal(s.byModel[0].n, 0)
  assert.equal(s.byModel[0].cells, 2)
  assert.equal(s.totalCostUsd > 0, true, 'it still cost money')
})

test('neither renderer prints an unmeasured arm as 0.0%', () => {
  const s = summarize([aborted({ caseId: 'agentic-fix-verify' })])
  const console_ = renderConsole(s)
  const md = renderMarkdown(s, { when: 's' })
  for (const [name, out] of [['console', console_], ['markdown', md]]) {
    assert.doesNotMatch(out, /0\.0%/, `${name} must not render null as a zero score`)
    assert.match(out, /n\/a/, `${name} must say the figure is missing`)
  }
  assert.match(console_, /no cell produced a reply/)
  assert.match(md, /no cell produced a reply/)
})

test('report.md and summary.json separate cells that replied from cells that did not', () => {
  const out = dir()
  try {
    const rows = [good(), good({ caseId: 'conv-badnews' }), aborted({ caseId: 'agentic-fix-verify' })]
    const { summary } = writeResults({ outDir: out, rows, stamp: 's', expected: 3, complete: true })

    // summary.json: the three counts on every level it aggregates, not just the top.
    const saved = readJson(join(out, 'summary.json'))
    assert.deepEqual(
      [saved.n, saved.noReply, saved.cells], [2, 1, 3],
      'the headline states its own sample'
    )
    for (const level of ['byModel', 'byVariant', 'byStyle', 'byStyleModel', 'byCase', 'bySplit']) {
      for (const g of saved[level]) {
        assert.equal(typeof g.n, 'number', `${level}.${g.key} states its sample`)
        assert.equal(typeof g.noReply, 'number', `${level}.${g.key} states what it dropped`)
        assert.equal(g.n + g.noReply, g.cells, `${level}.${g.key} counts add up`)
      }
    }
    assert.equal(saved.byCase.find(g => g.key === 'agentic-fix-verify').score, null)

    // report.md: the same split, in the table a reader quotes figures off.
    const md = readFileSync(join(out, 'report.md'), 'utf8')
    assert.match(md, /\| n \| cells \| no reply \|/)
    assert.match(md, /\*\*Measured over:\*\* 2 of 3 cells scored — 1 produced no reply/)
    assert.equal(summary.overall, 0.75)
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
})

test('a cell that said nothing briefs the optimizer on nothing', () => {
  // summary.failures drives the rewrite prompt. A silent cell graded against
  // every check files failures whose evidence quotes an empty string, and the
  // author model would rewrite the style to fix rules no reply ever broke.
  const s = summarize([
    good({ checks: [{ id: 'total_length', score: 0.5, weight: 1, evidence: ['178 words vs cap 80'], describe: 'cap' }] }),
    silent({ caseId: 'agentic-fix-verify', checks: [{ id: 'no_emoji', score: 0, weight: 1, evidence: [''], describe: 'no emoji' }] })
  ])
  assert.deepEqual(s.failures.map(f => f.checkId), ['total_length'])
})
