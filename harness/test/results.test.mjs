import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeResults, writeAtomic, readManifest, describeManifest, MANIFEST } from '../src/results.mjs'
import { evaluate } from '../src/evaluate.mjs'

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
