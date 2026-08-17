import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCell } from '../src/run.mjs'

// The runaway guard, watched actually firing.
//
// `maxBudgetUsd` used to hold this line: the SDK stopped a cell once it had
// spent $2. That number was never money anyone was charged — the harness runs
// on a subscription and `total_cost_usd` is a list-price valuation of tokens —
// so it went with the rest of the cost tracking. What it was really doing was
// bounding a cell that never finishes, and that job still needs doing.
//
// A wall-clock timeout is the only replacement the SDK can enforce. `maxTurns`
// bounds tool rounds but not the time inside one, and `taskBudget` merely tells
// the model how many tokens it has left and asks it to pace itself — advisory,
// and useless against exactly the wedged loop a guard exists for.
//
// These tests exist because a guard nobody has observed fail is not evidence.
// Each one drives `runCell` to a real abort through the injected `query` seam
// and asserts the row that comes back, rather than reading the source and
// concluding it looks right.

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STYLE = readFileSync(join(ROOT, '..', 'plain-english-advanced.md'), 'utf8')

const CELL = {
  styleId: 'demo',
  styleText: STYLE,
  variant: { id: 'baseline' },
  model: 'haiku',
  caseDef: { id: 'c1', split: 'train', prompt: 'p' },
  repeat: 0
}

/** A query that hangs until aborted, then throws — the SDK's usual abort path. */
const throwsOnAbort = async function * ({ options }) {
  await new Promise((_resolve, reject) => {
    options.abortController.signal.addEventListener(
      'abort', () => reject(new Error('This operation was aborted')), { once: true })
  })
  yield { type: 'result', is_error: false }
}

/**
 * A query that hangs until aborted, then ends the iterator with no result
 * message. This is the path the `timedOut` flag exists for: nothing throws, so
 * the catch never runs and `result` stays null.
 */
const quietOnAbort = async function * ({ options }) {
  await new Promise(resolve => {
    options.abortController.signal.addEventListener('abort', resolve, { once: true })
  })
}

/** A query that answers immediately. The control: no abort, no timeout. */
const answersAtOnce = async function * () {
  yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Done.' }] } }
  yield { type: 'result', is_error: false, session_id: 's1', num_turns: 1 }
}

test('a cell that wedges is aborted by the timeout and reported as one', async () => {
  const started = Date.now()
  const row = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: throwsOnAbort } })

  assert.equal(row.error, 'error_timeout', 'the row names the timeout, not the SDK abort message')
  assert.equal(row.text, '', 'a wedged cell produced no reply')
  // The point of a guard: it returns rather than hanging. Generous bound —
  // this asserts the timer fired, not how fast the machine is.
  assert.ok(Date.now() - started < 5000, 'runCell returned instead of hanging')
})

test('an abort that ends the stream quietly is still reported as a timeout', async () => {
  // Without the `timedOut` flag this row comes back `error: null` with empty
  // text — a silent cell indistinguishable from a model that said nothing, and
  // one that summarize() would count as a legitimately dropped cell rather than
  // a harness-imposed stop. Nothing throws on this path, so the catch that
  // handles the ordinary abort never runs.
  const row = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: quietOnAbort } })

  assert.equal(row.error, 'error_timeout')
  assert.equal(row.text, '')
})

test('a cell that finishes inside the limit is untouched by the guard', async () => {
  // The other half of the evidence: a guard that fires on everything is not a
  // guard. This is the case that must survive.
  const row = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 30 }, deps: { query: answersAtOnce } })

  assert.equal(row.error, null, 'a cell that answered in time carries no error')
  assert.equal(row.text, 'Done.')
})

test('a missing or unusable maxCellSeconds throws instead of aborting everything', async () => {
  // `undefined * 1000` is NaN, and setTimeout treats NaN as 0. Left to default,
  // a config that forgot the key would abort every cell in the matrix on the
  // next tick and label each one a timeout — a whole run of fabricated
  // timeouts, all of them green as far as any completeness check is concerned.
  for (const bad of [undefined, null, 0, -1, 'soon', NaN]) {
    await assert.rejects(
      () => runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: bad }, deps: { query: answersAtOnce } }),
      /maxCellSeconds must be a positive number/,
      `maxCellSeconds=${String(bad)} must be rejected, not defaulted`)
  }
})
