import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { USAGE, wantsHelp } from '../src/usage.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLI = join(ROOT, 'src/cli.mjs')

// Mirrors cli.mjs's parseArgs closely enough to exercise wantsHelp's contract.
const argv = (...parts) => {
  const out = { _: [] }
  for (const a of parts) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a)
    if (m) out[m[1]] = m[2] === undefined ? true : m[2]
    else out._.push(a)
  }
  return out
}

test('--help on a work subcommand asks for usage, not work', () => {
  // The regression this guards: `run --help` used to launch the whole matrix.
  assert.equal(wantsHelp(argv('run', '--help')), true)
  assert.equal(wantsHelp(argv('improve', '--help')), true)
  assert.equal(wantsHelp(argv('score', '-h')), true)
  assert.equal(wantsHelp(argv('audit', '--help')), true)
  // judge spends a model call per record and is the same trap as run.
  assert.equal(wantsHelp(argv('judge', '--help')), true)
})

test('bare and explicit help ask for usage', () => {
  assert.equal(wantsHelp(argv()), true)
  assert.equal(wantsHelp(argv('help')), true)
})

test('real invocations are not diverted to usage', () => {
  assert.equal(wantsHelp(argv('run', '--models=haiku')), false)
  assert.equal(wantsHelp(argv('audit')), false)
  assert.equal(wantsHelp(argv('score', '--rows=x.json')), false)
  assert.equal(wantsHelp(argv('judge', '--rows=x.json')), false)
})

test('usage names every subcommand', () => {
  for (const c of ['run', 'improve', 'score', 'judge', 'audit']) assert.match(USAGE, new RegExp(`cli\\.mjs ${c}\\b`))
})

test('run --help prints usage, exits 0 and creates no results directory', () => {
  const before = existsSync(join(ROOT, 'results')) ? readdirSync(join(ROOT, 'results')) : []
  const out = execFileSync(process.execPath, [CLI, 'run', '--help'], { encoding: 'utf8', timeout: 20000 })
  assert.match(out, /output-style harness/)
  const after = existsSync(join(ROOT, 'results')) ? readdirSync(join(ROOT, 'results')) : []
  assert.deepEqual(after, before, 'run --help must not start a run')
})

// COS-24: cli.mjs used to accept any --name and hand whatever followed it
// straight to pick()/Number(), so a mistyped or valueless flag changed what a
// paid run measured instead of stopping it. The parsing/validation rules
// themselves are exercised fast, in-process, in args.test.mjs (nothing here
// duplicates that). What stays here is real end-to-end wiring: every case
// below still runs the actual CLI (nothing imports cli.mjs; importing it
// runs it) but never with a flag combination that survives validation, so
// evaluate() — and the Agent SDK behind it — is never reached.
function runCli (args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 20000 })
    return { status: 0, stdout, stderr: '' }
  } catch (err) {
    return { status: err.status, stdout: err.stdout ?? '', stderr: err.stderr ?? '' }
  }
}

test('an unrecognised flag stops the CLI before any cell, naming it', () => {
  const before = existsSync(join(ROOT, 'results')) ? readdirSync(join(ROOT, 'results')) : []
  const { status, stderr } = runCli(['run', '--modles=haiku'])
  assert.notEqual(status, 0)
  assert.match(stderr, /"run" does not take --modles/)
  const after = existsSync(join(ROOT, 'results')) ? readdirSync(join(ROOT, 'results')) : []
  assert.deepEqual(after, before, 'a rejected flag must not start a run')
})

test('a typo\'d subcommand is reported as itself, even alongside an otherwise-invalid flag', () => {
  // Regression from review: matching --variants/--cases against live config
  // used to run unconditionally, so an unrecognised cmd combined with a bad
  // --variants value threw "matches nothing" instead of ever saying the
  // subcommand itself was the typo. cli.mjs now checks the command first.
  const { status, stderr } = runCli(['rnu', '--variants=typo'])
  assert.notEqual(status, 0)
  assert.match(stderr, /unknown command "rnu"/)
  assert.doesNotMatch(stderr, /matches nothing/)
})

test('an unmatched --variants or --cases value stops the CLI and names it, against live config', () => {
  const v = runCli(['run', '--variants=typo'])
  assert.notEqual(v.status, 0)
  assert.match(v.stderr, /--variants matches nothing: typo/)
  const c = runCli(['run', '--cases=typo'])
  assert.notEqual(c.status, 0)
  assert.match(c.stderr, /--cases matches nothing: typo/)
})

test('improve given more than one variant says so instead of silently using the first', () => {
  const { status, stderr } = runCli(['improve', '--variants=baseline,long-prompt'])
  assert.notEqual(status, 0)
  assert.match(stderr, /improve takes exactly one variant; matched 2 \(baseline,long-prompt\)/)
})

test('score --rows with no value is a CLI message, not a raw Node TypeError stack', () => {
  const bare = runCli(['score', '--rows'])
  assert.notEqual(bare.status, 0)
  assert.match(bare.stderr, /--rows needs a value/)
  assert.doesNotMatch(bare.stderr, /ERR_INVALID_ARG_TYPE/)
  // --rows= (written empty) used to pass validation, then fail the truthy
  // check at the resolve() call site and silently fall back to newestRows().
  const empty = runCli(['score', '--rows='])
  assert.notEqual(empty.status, 0)
  assert.match(empty.stderr, /--rows needs a value/)
})

test('judge --concurrency is accepted end to end, not rejected as an unrecognised flag', () => {
  // Regression from review: FLAGS.judge originally omitted 'concurrency' even
  // though the judge branch has always read opts.concurrency. With no --rows
  // and no saved runs this still errors, but on the "no saved runs found"
  // message, not "does not take --concurrency" — proving the flag itself is
  // accepted before that different, expected failure.
  const { status, stderr } = runCli(['judge', '--concurrency=4', '--rows=/does/not/exist/rows.json'])
  assert.notEqual(status, 0)
  assert.doesNotMatch(stderr, /does not take --concurrency/)
})

test('--help still short-circuits every one of the flags above, on both subcommands', () => {
  for (const args of [['run', '--help', '--modles=haiku'], ['improve', '--help', '--variants=a,b']]) {
    const out = execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 20000 })
    assert.match(out, /output-style harness/)
  }
})
