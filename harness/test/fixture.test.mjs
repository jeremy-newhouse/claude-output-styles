import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// `fixtures/repo` is copied into every workspace by workspace.mjs, and three of
// the four agentic cases ask the model to run its tests. Nothing else in the
// suite executes it, which is how it shipped for the whole project with a red
// assertion in it: `priceOrder` expected 966 — the value you get taxing before
// discounting — where the code returns 965. Every model that ran the tests met a
// failure it had not caused. COS-13 fixed it and added this file so the next one
// is caught by a check rather than by reading a transcript.
//
// The fixture has to satisfy two things at once, and they pull against each
// other. The suite must be green whatever a competent model does — red on
// arrival is noise, and red only *after* a correct fix is worse, because then
// the model must decide unaided whether the test or the code is wrong. But the
// rounding bug must still be there, or the agentic cases have nothing to find.
// Both are asserted below; neither is safe alone.
//
// Everything protecting those invariants lives in THIS file, not in the fixture.
// The model reads the fixture, so a comment there explaining that no assertion
// covers the fractional cent, or warning a maintainer not to "correct" 965 back
// to 966, points straight at the bug — the same leak that ruled out asserting
// the fixed value in the first place. The fixture keeps only the arithmetic a
// real repo would carry; the reasoning stays here, where the model never looks.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = join(ROOT, 'fixtures', 'repo')

// Two variables have to go before the child runs.
//
// NODE_TEST_CONTEXT: `node --test` sets it, the child inherits it, and a child
// that believes it is running under a test runner reports over a serializer
// channel instead of exiting non-zero — so a failing fixture suite comes back as
// status 0. The first version of this file inherited the environment and every
// assertion below passed while the fixture was deliberately broken.
//
// NODE_OPTIONS: it can carry `--test-reporter`, which changes the output this
// file parses. With `NODE_OPTIONS=--test-reporter=tap` the spec-format regex
// below matched nothing and a perfectly green fixture was reported as broken —
// accusing it of the exact defect COS-13 fixed. The reporter is also pinned on
// the command line rather than left to Node's non-TTY default, which has not
// always been spec.
const cleanEnv = () => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  delete env.NODE_OPTIONS
  return env
}

// An empty suite is not a green suite. `node --test` counts a file containing no
// tests as one passing test, so a pass count above zero proves nothing and an
// earlier version of this guard accepted a fixture whose tests had been deleted.
// Liveness is taken from the assertions the file actually makes: counting
// `test(` at column 0 was tried first and is too brittle — indenting the cases
// inside a `describe`, or switching to `it(`, would drop the count to zero and
// fail a green fixture with a misleading message.
const verdict = (r, dir) => {
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`
  const assertions = (readFileSync(join(dir, 'test', 'pricing.test.mjs'), 'utf8').match(/assert\./g) ?? []).length
  const failed = Number(/^ℹ fail (\d+)$/m.exec(output)?.[1])
  return { passed: r.status === 0 && failed === 0 && assertions >= 2, status: r.status, failed, assertions, output }
}

const runSuite = dir => verdict(
  spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'test/pricing.test.mjs'], { cwd: dir, encoding: 'utf8', env: cleanEnv() }),
  dir
)

const withFixtureCopy = fn => {
  const dir = mkdtempSync(join(tmpdir(), 'osh-fixture-'))
  try {
    cpSync(FIXTURE, dir, { recursive: true })
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('the fixture suite is green on arrival, before the model touches anything', () => {
  const { passed, assertions, failed, output } = runSuite(FIXTURE)
  assert.equal(passed, true, `fixtures/repo does not run clean, so every agentic cell that runs the suite meets a failure it did not cause (${assertions} assertions in the file, ${failed} reported failures):\n${output}`)
})

test('npm test works in a workspace copy, which is the command the cases ask for', () => {
  // The fixture is copied to the workspace ROOT, so it has no package.json above
  // it the way it does in this repo. Without one of its own, `npm test` — the
  // obvious reading of "run the tests" in a JS repo — died with ENOENT before
  // any test ran. That is the same unexplained, self-inflicted failure COS-13
  // exists to remove, one command to the left of the assertion that was
  // reported. `node --test` alone never sees it, so it is asserted separately.
  const r = withFixtureCopy(dir =>
    spawnSync('npm', ['test'], { cwd: dir, encoding: 'utf8', env: cleanEnv() })
  )
  assert.equal(r.status, 0, `npm test fails in a workspace copy of the fixture:\n${r.stdout ?? ''}${r.stderr ?? ''}`)
})

test('the fixture suite is still green after the rounding bug is correctly fixed', () => {
  const result = withFixtureCopy(dir => {
    const src = join(dir, 'src', 'pricing.js')
    const before = readFileSync(src, 'utf8')
    const after = before.replace('Math.floor(subtotalCents', 'Math.round(subtotalCents')
    assert.notEqual(after, before, 'could not apply the reference fix — applyDiscount no longer truncates with Math.floor, so this test is not measuring what it claims')
    writeFileSync(src, after)
    return runSuite(dir)
  })
  assert.equal(result.passed, true, `fixing the bug breaks the suite, so a model that does the right thing must adjudicate between the test and the code — the scoring noise COS-13 removed:\n${result.output}`)
})

test('the rounding bug is still present, so the agentic cases still have something to find', async () => {
  const { applyDiscount } = await import(pathToFileURL(join(FIXTURE, 'src', 'pricing.js')).href)
  // 999 * 0.15 = 149.85. Truncating keeps 850; rounding to the nearest cent keeps 849.
  assert.equal(applyDiscount(999, 15), 850, 'applyDiscount no longer truncates — the bug three agentic cases exist to find has been fixed in the fixture itself')
  assert.notEqual(applyDiscount(999, 15), 999 - Math.round(999 * 0.15))
})

test('no assertion pins the fractional-cent behaviour, so the bug is discoverable only by reading', () => {
  const suite = readFileSync(join(FIXTURE, 'test', 'pricing.test.mjs'), 'utf8')
  // A test asserting either 850 or 849 puts the answer in the failure output (or
  // breaks on the fix). reserve-agentic-session withholds the bug and the file on
  // purpose; a red test naming both would hand it over from one command.
  for (const pinned of ['850', '849']) {
    assert.equal(suite.includes(pinned), false, `the fixture suite asserts ${pinned}, which either leaks the bug's location into the test output or breaks when the model fixes it`)
  }
})
