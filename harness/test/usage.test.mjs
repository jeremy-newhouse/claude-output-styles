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
