import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCell, cellLimitMs } from '../src/run.mjs'

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

const MULTI = { ...CELL, caseDef: { id: 'c2', split: 'train', multiTurn: ['p1', 'p2'] } }

/**
 * A query that says something, then wedges. `after` decides which way the abort
 * ends the stream. Both must keep the fragment: it is the only record of what
 * the model was doing when the guard stopped it.
 */
const narratesThenWedges = after => async function * ({ options }) {
  yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Let me check the tests first.' }] } }
  yield { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash' }] } }
  await new Promise((resolve, reject) => {
    options.abortController.signal.addEventListener(
      'abort', () => after === 'throw' ? reject(new Error('This operation was aborted')) : resolve(), { once: true })
  })
}

/**
 * Answers turn 1, then wedges on turn 2. `after` decides which abort path the
 * wedged turn takes — throwing, or ending the iterator quietly.
 */
const answersThenWedges = after => async function * ({ prompt, options }) {
  if (prompt === 'p1') {
    yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Turn one answer.' }] } }
    yield { type: 'result', is_error: false, session_id: 's1', num_turns: 1 }
    return
  }
  await new Promise((resolve, reject) => {
    options.abortController.signal.addEventListener(
      'abort', () => after === 'throw' ? reject(new Error('This operation was aborted')) : resolve(), { once: true })
  })
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

/**
 * Delivers a complete turn, then stalls until the timer fires. This is the race
 * `cutShort` exists for: the SDK handed over everything, and the abort landed in
 * the gap before the loop resumed.
 */
const answersThenTimerFires = async function * ({ options }) {
  yield { type: 'assistant', message: { content: [{ type: 'text', text: 'Done in time.' }] } }
  yield { type: 'result', is_error: false, session_id: 's1', num_turns: 1 }
  await new Promise(resolve => {
    options.abortController.signal.addEventListener('abort', resolve, { once: true })
  })
}

test('a timer that fires after the cell already finished does not discard it', async () => {
  // `timedOut` was unconditionally authoritative, so a cell completing at 599.9s
  // of a 600s limit came back stamped error_timeout — and producedReply then
  // dropped a complete, fully scoreable measurement out of every mean and out of
  // summary.failures. Losing a real measurement to a few milliseconds is the
  // same class of error as grading a cell that said nothing, in the opposite
  // direction.
  const row = await runCell({
    ...CELL, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: answersThenTimerFires }
  })

  assert.equal(row.error, null, 'the cell finished, so it carries no timeout')
  assert.equal(row.text, 'Done in time.', 'and its reply is kept')
})

test('a cell that finishes inside the limit is untouched by the guard', async () => {
  // The other half of the evidence: a guard that fires on everything is not a
  // guard. This is the case that must survive.
  const row = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 30 }, deps: { query: answersAtOnce } })

  assert.equal(row.error, null, 'a cell that answered in time carries no error')
  assert.equal(row.text, 'Done.')
})

test('a timeout keeps the turns that finished, on both abort paths', async () => {
  // The defect this covers: `turns` used to be declared inside the try, so the
  // catch could not see it and the throwing path returned allTurns: []. A
  // three-turn case whose first two turns completed and whose third wedged lost
  // both completed transcripts — while the quiet path, which never enters the
  // catch, kept them. Identical events, structurally different rows, decided by
  // which way the SDK happened to end the stream.
  const rows = {}
  for (const after of ['throw', 'quiet']) {
    rows[after] = await runCell({
      ...MULTI, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: answersThenWedges(after) }
    })
  }

  for (const [after, row] of Object.entries(rows)) {
    assert.equal(row.error, 'error_timeout', `${after}: the row names the timeout`)
    assert.ok(row.allTurns.includes('Turn one answer.'), `${after}: turn 1's transcript survived the abort`)
    assert.ok(row.allFinals.includes('Turn one answer.'), `${after}: turn 1's final message survived the abort`)
  }

  // The two paths must agree on what the cell produced, not merely each keep
  // something. runTurn catches its own abort, so the wedged turn now returns a
  // turn object on both paths and the two rows are identical.
  assert.deepEqual(rows.throw.allFinals, rows.quiet.allFinals,
    'both abort paths report the same turns')
  assert.deepEqual(rows.throw.allTurns, rows.quiet.allTurns)
})

test('a partial reply survives the abort that interrupted it, on both paths', async () => {
  // The fragment is what an operator has to tune maxCellSeconds with: it says
  // what the model was doing when the guard stopped it. runTurn had no catch,
  // so on the throwing abort path the blocks accumulated for the in-flight turn
  // died with the exception — while the quiet path kept them and graded them.
  // Same wedge, one row scoreable and one empty, decided by SDK internals.
  const rows = {}
  for (const after of ['throw', 'quiet']) {
    rows[after] = await runCell({
      ...CELL, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: narratesThenWedges(after) }
    })
  }

  for (const [after, row] of Object.entries(rows)) {
    assert.equal(row.error, 'error_timeout', `${after}: still reported as a timeout`)
    assert.equal(row.text, 'Let me check the tests first.', `${after}: the fragment survived`)
    assert.deepEqual(row.toolCalls, ['Bash'], `${after}: the tool call it made survived`)
  }
  assert.deepEqual(rows.throw.text, rows.quiet.text, 'both paths report the same fragment')
})

test('every row records how long the cell took', async () => {
  // matrix.json tells a reader to "lower it only against measured cell
  // durations" and harness/README.md calls 600 "well above any cell observed
  // here". Nothing in the harness measured a cell until this field: no
  // Date.now, no hrtime, no duration on any row. Both claims were unsupported,
  // and the change that introduced them had just deleted costUsd, the only
  // per-cell size proxy the project had.
  const ok = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 30 }, deps: { query: answersAtOnce } })
  assert.equal(typeof ok.elapsedMs, 'number')
  assert.ok(ok.elapsedMs >= 0, 'a completed cell carries its duration')

  // Bounded below the 50ms limit on purpose. `startedAt` is captured after the
  // timer is armed, so elapsedMs measures a strictly shorter span than the
  // delay, and Date.now() is coarse enough that asserting >= 50 would red on a
  // loaded machine. The claim under test is "the guard's duration is recorded",
  // not "the clock is exact".
  const timedOut = await runCell({ ...CELL, opts: { maxTurns: 4, maxCellSeconds: 0.05 }, deps: { query: throwsOnAbort } })
  assert.ok(timedOut.elapsedMs >= 40, `an aborted cell ran about its limit, got ${timedOut.elapsedMs}ms`)
})

test('cellLimitMs converts a good value and rejects an unusable one', async () => {
  // Exported so the CLI can run this check once, beside where `opts` is built,
  // instead of leaving the first failure to surface per cell.
  assert.equal(cellLimitMs(600), 600000)
  assert.equal(cellLimitMs('1.5'), 1500)
  // Infinity sits here rather than with the over-range values below: it fails
  // the finiteness check first, and asserting the message says which branch
  // caught it.
  for (const bad of [undefined, null, 0, -1, 'soon', NaN, Infinity]) {
    assert.throws(() => cellLimitMs(bad), /maxCellSeconds must be a positive number/,
      `maxCellSeconds=${String(bad)} must be rejected, not defaulted`)
  }

  // The high end fails identically to the low end and far less visibly.
  // setTimeout truncates any delay past 2^31-1 ms to 1 ms — measured: a limit
  // of 999999999 seconds fires after 2 ms. So the obvious way to "disable" the
  // guard aborts every cell in the matrix on the next tick and labels each one
  // a timeout, which is the exact failure the low-end check exists to stop.
  assert.equal(cellLimitMs(2147483.647), 2147483647, 'the largest usable limit is accepted')
  for (const tooBig of [2147484, 999999999, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => cellLimitMs(tooBig), /at most/,
      `maxCellSeconds=${tooBig} exceeds setTimeout's range and must be rejected`)
  }
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
