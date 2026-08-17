import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CHECKS } from '../src/checks.mjs'

// `src/cli.mjs` reads these three files at startup, before any subcommand runs,
// so a malformed one breaks `run`, `improve`, `score` and `audit` alike. Nothing
// else in the suite loads them: the other files import modules, and cli.mjs is
// never imported. That gap let a comment block be added to matrix.json under
// COS-7 with `npm test` green and no assertion that the file still parses.
// cases/cases.json was the same gap one file over, and COS-1 added two cases to
// it, so it is asserted here too.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readConfig = name => JSON.parse(readFileSync(join(ROOT, 'config', name), 'utf8'))
const readCases = () => JSON.parse(readFileSync(join(ROOT, 'cases', 'cases.json'), 'utf8'))

test('matrix.json parses and carries the axes the CLI reads', () => {
  const m = readConfig('matrix.json')
  for (const axis of ['models', 'styles', 'variants']) {
    assert.ok(Array.isArray(m[axis]) && m[axis].length, `matrix.${axis} must be a non-empty array`)
  }
  assert.ok(m.variants.every(v => typeof v.id === 'string' && v.id), 'every variant needs an id')
  // The CLI does `matrix.variants.filter(v => variantIds.includes(v.id))`, so
  // duplicate ids would silently run the same variant twice.
  assert.equal(new Set(m.variants.map(v => v.id)).size, m.variants.length, 'variant ids must be unique')
  for (const key of ['repeats', 'concurrency', 'maxTurns', 'maxBudgetUsd']) {
    assert.equal(typeof m.run[key], 'number', `matrix.run.${key} must be a number`)
  }
})

test('contracts.json parses, and every contract points at a style file that exists', () => {
  const contracts = readConfig('contracts.json')
  const ids = Object.keys(contracts)
  assert.ok(ids.length, 'contracts.json must define at least one style')
  for (const [id, c] of Object.entries(contracts)) {
    assert.ok(existsSync(resolve(ROOT, c.styleFile)), `${id}: styleFile does not resolve — ${c.styleFile}`)
    assert.ok(Array.isArray(c.defaultChecks) && c.defaultChecks.length, `${id}: defaultChecks must be a non-empty array`)
  }
})

test('every style the matrix runs by default has a contract', () => {
  const m = readConfig('matrix.json')
  const contracts = readConfig('contracts.json')
  // cli.mjs throws `no contract for style "X"` on a mismatch, which is a crash
  // at startup rather than a skipped style.
  for (const id of m.styles) assert.ok(contracts[id], `matrix lists style "${id}" with no contract`)
})

test('cases.json parses, and every case is runnable and scorable', () => {
  const cases = readCases()
  assert.ok(Array.isArray(cases) && cases.length, 'cases.json must be a non-empty array')
  // A duplicate id makes `--cases=X` run two different cases and makes every
  // per-case summary row silently pool them.
  assert.equal(new Set(cases.map(c => c.id)).size, cases.length, 'case ids must be unique')
  for (const c of cases) {
    assert.ok(c.id, 'every case needs an id')
    assert.ok(c.prompt || c.multiTurn?.length, `${c.id}: needs a prompt or a multiTurn array`)
    assert.ok(Array.isArray(c.checks) && c.checks.length, `${c.id}: checks must be a non-empty array`)
    // scoreDeterministic throws `unknown check` mid-run, which is a crash after
    // the cell has already been paid for.
    for (const id of c.checks) assert.ok(CHECKS[id], `${c.id}: unknown check "${id}"`)
  }
})

test('every split the optimizer reads by name has cases in it', () => {
  const m = readConfig('matrix.json')
  const splits = new Set(readCases().map(c => c.split))
  // improve selects on trainSplit, keeps on holdoutSplit and validates on
  // reserveSplit. An empty one is not an error anywhere in the loop — it just
  // makes that gate pass on no evidence.
  for (const key of ['trainSplit', 'holdoutSplit', 'reserveSplit']) {
    assert.ok(splits.has(m.improve[key]), `improve.${key} is "${m.improve[key]}" but no case has that split`)
  }
})

test('a comment key is a string array, so it can never be read as an axis', () => {
  const m = readConfig('matrix.json')
  // Keys are prefixed `//` by convention here. They sit alongside real keys, so
  // the only thing protecting them is that nothing reads by prefix — assert the
  // shape anyway, since a `//models` that was accidentally a bare string would
  // read as a valid-looking value to a future change.
  for (const [k, v] of Object.entries(m)) {
    if (!k.startsWith('//')) continue
    assert.ok(Array.isArray(v) && v.every(line => typeof line === 'string'), `${k} must be an array of strings`)
  }
})
