import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FIXTURE = join(ROOT, 'fixtures', 'repo')

// NODE_TEST_CONTEXT must be stripped from the child's environment. `node --test`
// sets it, the child inherits it, and a child that believes it is running under a
// test runner reports its results over a serializer channel instead of exiting
// non-zero — so a failing fixture suite comes back as status 0. The first version
// of this file inherited the environment and every assertion below passed while
// the fixture was deliberately broken. Verified by reintroducing the 966
// assertion: without the scrub, status 0; with it, status 1.
const runSuite = dir => {
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  const r = spawnSync(process.execPath, ['--test', 'test/pricing.test.mjs'], { cwd: dir, encoding: 'utf8', env })
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`
  // An empty suite is not a green suite. `node --test` counts a file containing no
  // tests as one passing test — `ℹ pass 1` — so a pass count above zero proves
  // nothing and an earlier version of this guard accepted a fixture whose tests had
  // been deleted. Compare the reported passes against the number the file declares.
  const declared = (readFileSync(join(dir, 'test', 'pricing.test.mjs'), 'utf8').match(/^test\(/gm) ?? []).length
  const reported = Number(/^ℹ pass (\d+)$/m.exec(output)?.[1])
  return {
    passed: r.status === 0 && declared > 0 && reported === declared,
    status: r.status,
    declared,
    reported,
    output
  }
}

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
  const { passed, declared, reported, output } = runSuite(FIXTURE)
  assert.equal(passed, true, `fixtures/repo does not run clean, so every agentic cell that runs the suite meets a failure it did not cause (declared ${declared} tests, ${reported} passed):\n${output}`)
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
  const { applyDiscount } = await import(join(FIXTURE, 'src', 'pricing.js'))
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
