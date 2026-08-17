import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { improveStyle, comparableRows, meanTotal, resolveImproveModels, DEFAULT_IMPROVE_MODELS } from '../src/improve.mjs'
import { summarize } from '../src/evaluate.mjs'
import { renderConsole, renderMarkdown, renderVerdict } from '../src/report.mjs'

const CASES = [
  { id: 'tr-1', split: 'train', prompt: 'p' },
  { id: 'ho-1', split: 'holdout', prompt: 'p' },
  { id: 'rs-1', split: 'reserve', prompt: 'p' }
]

const CFG = {
  targetScore: 0.9,
  maxIterations: 1,
  authorModel: 'opus',
  trainSplit: 'train',
  holdoutSplit: 'holdout',
  reserveSplit: 'reserve',
  minHoldoutDelta: -0.02,
  minReserveDelta: -0.02,
  patience: 2
}

/** Stand-in for evaluate(): returns one scored row per case, at a fixed cost. */
const fakeEvaluate = (score) => async ({ cases }) => {
  const rows = cases.map(c => ({
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
    split: c.split, repeat: 0, text: 'reply', error: null,
    rulesScore: score, checks: [], judgeScore: score, judgeViolations: [], total: score
  }))
  return { rows, summary: summarize(rows) }
}

async function withTmpDir (fn) {
  const dir = mkdtempSync(join(tmpdir(), 'improve-test-'))
  try { return await fn(dir) } finally { rmSync(dir, { recursive: true, force: true }) }
}

const BODY = 'x'.repeat(300)

const runLoop = (outDir, { evaluate, rewrite, rows, onRows, cfg = CFG, cases = CASES, log = () => {} }) => improveStyle({
  style: { id: 'demo', text: `---\nname: demo\n---\n${BODY}`, body: BODY, meta: { name: 'demo' } },
  variant: { id: 'baseline' },
  models: ['haiku'],
  cases,
  contracts: { demo: {} },
  opts: { repeats: 1 },
  cfg,
  outDir,
  log,
  rows,
  onRows,
  deps: { evaluate, rewrite }
})

// A rewrite the fake scorer can recognise, so a measurement can score the
// candidate differently from the incumbent it replaced.
const MARKED = `CANDIDATE ${'y'.repeat(300)}`
const proposeCandidate = async () => MARKED

/**
 * Stand-in for evaluate() that scores by split and by whether it is looking at
 * the candidate. That is what lets a rewrite win train and holdout and then be
 * caught, or cleared, by the reserve — the case the loop exists to handle.
 */
const splitAwareEvaluate = table => async ({ cases, styles }) => {
  const side = styles[0].text.includes('CANDIDATE') ? 'candidate' : 'baseline'
  const rows = cases.map(c => {
    const total = table[c.split][side]
    return {
      styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
      split: c.split, repeat: 0, text: 'reply', error: null,
      rulesScore: total, checks: [], judgeScore: total, judgeViolations: [], total
    }
  })
  return { rows, summary: summarize(rows) }
}

// Train rises and holdout holds, so the loop keeps the candidate. Only the
// reserve column differs between the two scenarios.
const WINS_THE_LOOP = {
  train: { baseline: 0.5, candidate: 0.7 },
  holdout: { baseline: 0.5, candidate: 0.5 }
}
const RESERVE_CLEARS = { ...WINS_THE_LOOP, reserve: { baseline: 0.5, candidate: 0.6 } }
const RESERVE_REGRESSES = { ...WINS_THE_LOOP, reserve: { baseline: 0.5, candidate: 0.4 } }

test('every iteration writes its train and holdout transcripts', async () => {
  await withTmpDir(async dir => {
    await runLoop(dir, {
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => 'y'.repeat(300)
    })
    const written = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    assert.deepEqual(written, [
      'demo.v0.holdout.json', 'demo.v0.train.json',
      'demo.v1.holdout.json', 'demo.v1.train.json'
    ])
    const v1 = JSON.parse(readFileSync(join(dir, 'demo.v1.train.json'), 'utf8'))
    assert.equal(v1.length, 1)
    assert.equal(v1[0].iteration, 1)
    assert.equal(v1[0].split, 'train')
    assert.equal(v1[0].text, 'reply')
  })
})

test('reverted iterations are persisted too, not just kept ones', async () => {
  await withTmpDir(async dir => {
    // A flat score means the candidate never beats the baseline, so it reverts.
    const r = await runLoop(dir, {
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => 'y'.repeat(300)
    })
    assert.equal(r.history.at(-1).kept, false)
    assert.equal(r.best.iteration, 0)
    assert.ok(readdirSync(dir).includes('demo.v1.train.json'))
  })
})

test('the cell count is derived from the persisted rows, not a counter', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => 'y'.repeat(300)
    })
    // 2 measurements per iteration x 1 case each x 2 iterations (v0, v1).
    assert.equal(r.rows.length, 4)
    assert.equal(r.cells, 4)
    assert.equal(r.cells, r.rows.length)
  })
})

test('a rewrite that returns nothing stops the loop after the baseline', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => ''
    })
    assert.deepEqual(readdirSync(dir).filter(f => f.endsWith('.json')).sort(),
      ['demo.v0.holdout.json', 'demo.v0.train.json'])
    assert.equal(r.rows.length, 2)
    assert.equal(r.cells, 2)
  })
})

test('a style that throws leaves its measured cells in the shared sink', async () => {
  await withTmpDir(async dir => {
    const shared = []
    let calls = 0
    await assert.rejects(runLoop(dir, {
      rows: shared,
      // Baseline train and holdout land, then the candidate measurement dies.
      evaluate: async arg => {
        if (++calls > 2) throw new Error('judge exploded')
        return fakeEvaluate(0.5)(arg)
      },
      rewrite: async () => 'y'.repeat(300)
    }), /judge exploded/)
    assert.equal(shared.length, 2)
    assert.deepEqual(shared.map(r => r.iteration), [0, 0])
  })
})

test('a style reports only its own rows out of a shared sink', async () => {
  await withTmpDir(async dir => {
    const shared = [{ styleId: 'other', iteration: 0 }]
    const r = await runLoop(dir, {
      rows: shared,
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => ''
    })
    assert.equal(shared.length, 3)
    assert.equal(r.rows.length, 2)
    assert.ok(r.rows.every(row => row.styleId === 'demo'))
    assert.equal(r.cells, 2)
  })
})

test('a reverted iteration briefs from the incumbent, not the failed candidate', async () => {
  await withTmpDir(async dir => {
    // The author is handed best.body to rewrite, so the evidence it is given has
    // to describe that same text. Tag each measurement's replies so the brief
    // says which run it was built from.
    let call = 0
    const briefs = []
    await runLoop(dir, {
      cfg: { ...CFG, maxIterations: 2 },
      evaluate: async ({ cases }) => {
        const tag = call++ < 2 ? 'BASELINE-REPLY' : `CANDIDATE-${Math.floor(call / 2)}-REPLY`
        const rows = cases.map(c => ({
          styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
          split: c.split, repeat: 0, text: tag, error: null,
          rulesScore: 0.5, checks: [], judgeScore: 0.5, judgeViolations: [], total: 0.5
        }))
        return { rows, summary: summarize(rows) }
      },
      // Flat scores, so every candidate reverts.
      rewrite: async ({ brief }) => { briefs.push(brief); return 'y'.repeat(300) }
    })
    assert.equal(briefs.length, 2)
    // Iteration 2 follows iteration 1's revert and still quotes the baseline.
    assert.match(briefs[1], /BASELINE-REPLY/)
    assert.doesNotMatch(briefs[1], /CANDIDATE-/)
  })
})

test('rows are flushed after every measurement, not once per style', async () => {
  await withTmpDir(async dir => {
    const seen = []
    await runLoop(dir, {
      onRows: rows => seen.push(rows.length),
      evaluate: fakeEvaluate(0.5),
      rewrite: async () => 'y'.repeat(300)
    })
    // Four measurements: v0 train, v0 holdout, v1 train, v1 holdout. An
    // interrupt after any one of them still leaves a readable rows.json.
    assert.deepEqual(seen, [1, 2, 3, 4])
  })
})

test('the loop never draws reserve cases into train or holdout', async () => {
  await withTmpDir(async dir => {
    await runLoop(dir, { evaluate: splitAwareEvaluate(RESERVE_CLEARS), rewrite: proposeCandidate })
    const written = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
    assert.deepEqual(written, [
      'demo.v0.holdout.json', 'demo.v0.reserve.json', 'demo.v0.train.json',
      'demo.v1.holdout.json', 'demo.v1.reserve.json', 'demo.v1.train.json'
    ])
    // Every measurement the loop itself used to decide is free of the reserve
    // case. If it leaked in, the validation would be scoring what it trained on.
    for (const f of written.filter(f => !f.includes('.reserve.'))) {
      const rows = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      assert.ok(rows.every(r => r.caseId !== 'rs-1'), `${f} contains a reserve case`)
    }
  })
})

test('a candidate that holds up on the reserve is adopted, with both numbers reported', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, { evaluate: splitAwareEvaluate(RESERVE_CLEARS), rewrite: proposeCandidate })
    assert.equal(r.best.iteration, 1)
    assert.deepEqual(r.reserve, {
      split: 'reserve', cases: 1, comparedCells: 1, droppedCases: [],
      baseline: 0.5, candidate: 0.6, delta: 0.1, accepted: true, iteration: 1
    })
    // Reported alongside train and holdout, not instead of them.
    assert.equal(r.best.train, 0.7)
    assert.equal(r.best.holdout, 0.5)
    assert.match(readFileSync(join(dir, 'demo.best.md'), 'utf8'), /CANDIDATE/)
  })
})

test('a candidate that regresses on the reserve is rejected, not reported as the winner', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, { evaluate: splitAwareEvaluate(RESERVE_REGRESSES), rewrite: proposeCandidate })
    // The loop wanted it: train rose, holdout held. That verdict stays visible.
    assert.equal(r.history.at(-1).kept, true)
    // The run's verdict is the opposite, and it names the rejected iteration.
    assert.equal(r.reserve.accepted, false)
    assert.equal(r.reserve.iteration, 1)
    assert.equal(r.reserve.delta, -0.1)
    // What is adopted is the incumbent, with the incumbent's own numbers —
    // not the candidate's train and holdout wearing a rejection label.
    assert.equal(r.best.iteration, 0)
    assert.equal(r.best.train, 0.5)
    assert.equal(r.best.holdout, 0.5)
    assert.doesNotMatch(readFileSync(join(dir, 'demo.best.md'), 'utf8'), /CANDIDATE/)
    // The rejected rewrite is kept for the record, as rejected/ requires.
    assert.match(readFileSync(join(dir, 'demo.v1.md'), 'utf8'), /CANDIDATE/)
  })
})

// COS-1 put a second agentic case on the reserve split, and agentic cases are
// the ones that abort on the 12-turn limit. An aborted cell is scored 0 on every
// rule and 1.0 by the judge, so its `total` is the style's judgeWeight — well
// below a normal reserve score. Averaged into one side of the comparison it
// moves the delta on its own.
const TWO_RESERVE = [
  { id: 'tr-1', split: 'train', prompt: 'p' },
  { id: 'ho-1', split: 'holdout', prompt: 'p' },
  { id: 'rs-1', split: 'reserve', prompt: 'p' },
  { id: 'rs-2', split: 'reserve', prompt: 'p' }
]

/** splitAwareEvaluate, but `aborts` case ids return no text on the named side. */
const abortingEvaluate = (table, aborts, abortSide = 'candidate') => async ({ cases, styles }) => {
  const side = styles[0].text.includes('CANDIDATE') ? 'candidate' : 'baseline'
  const rows = cases.map(c => {
    const aborted = side === abortSide && aborts.includes(c.id)
    // Mirrors evaluate.mjs on an errored cell: rules 0, judge left at 1, and a
    // `total` that is therefore the judge weight alone.
    const total = aborted ? 0.3 : table[c.split][side]
    return {
      styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
      split: c.split, repeat: 0, text: aborted ? '' : 'reply',
      error: aborted ? 'Reached maximum number of turns (12)' : null,
      rulesScore: aborted ? 0 : total, checks: [], judgeScore: aborted ? 1 : total,
      judgeViolations: [], total
    }
  })
  return { rows, summary: summarize(rows) }
}

test('comparableRows drops a case that errored on either side, from both sides', () => {
  const a = [{ caseId: 'x', error: null, text: 'r', total: 0.5 }, { caseId: 'y', error: null, text: 'r', total: 0.5 }]
  const b = [{ caseId: 'x', error: null, text: 'r', total: 0.6 }, { caseId: 'y', error: 'abort', text: '', total: 0.3 }]
  const { a: left, b: right } = comparableRows(a, b)
  assert.deepEqual(left.map(r => r.caseId), ['x'])
  assert.deepEqual(right.map(r => r.caseId), ['x'])
  // Symmetric: an error on the baseline side removes the case just the same.
  const flipped = comparableRows(b, a)
  assert.deepEqual(flipped.a.map(r => r.caseId), ['x'])
  assert.deepEqual(flipped.b.map(r => r.caseId), ['x'])
  assert.equal(meanTotal(left), 0.5)
  assert.equal(meanTotal([]), 0)
})

test('comparableRows drops a case that went silent without an error flag', () => {
  // The wider half of the same defect: no error flag, no text. Scored against
  // the case it would compare a reply with nothing, and the gate exists to
  // compare like with like.
  const a = [{ caseId: 'x', error: null, text: 'r', total: 0.5 }, { caseId: 'y', error: null, text: 'r', total: 0.5 }]
  const b = [{ caseId: 'x', error: null, text: 'r', total: 0.6 }, { caseId: 'y', error: null, text: '   ', total: 0.95 }]
  const { a: left, b: right } = comparableRows(a, b)
  assert.deepEqual(left.map(r => r.caseId), ['x'])
  assert.deepEqual(right.map(r => r.caseId), ['x'])
})

test('one aborted reserve cell cannot flip a sound candidate to rejected', async () => {
  await withTmpDir(async dir => {
    // rs-1 clears the bar on both sides; rs-2 aborts on the candidate only.
    // Averaged in, the candidate would read (0.6 + 0.3) / 2 = 0.45 against a
    // baseline of 0.5 — a −0.05 delta past the −0.02 threshold, and a rejection
    // caused entirely by the turn limit.
    const r = await runLoop(dir, {
      evaluate: abortingEvaluate(RESERVE_CLEARS, ['rs-2']),
      rewrite: proposeCandidate,
      cases: TWO_RESERVE
    })
    assert.equal(r.reserve.accepted, true)
    assert.equal(r.reserve.delta, 0.1)
    assert.equal(r.reserve.comparedCells, 1)
    assert.deepEqual(r.reserve.droppedCases, ['rs-2'])
    // The adopted style really is the candidate, not a rolled-back incumbent.
    assert.equal(r.best.iteration, 1)
    assert.match(readFileSync(join(dir, 'demo.best.md'), 'utf8'), /CANDIDATE/)
  })
})

test('an aborted cell still cannot rescue a candidate that genuinely regresses', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: abortingEvaluate(RESERVE_REGRESSES, ['rs-2']),
      rewrite: proposeCandidate,
      cases: TWO_RESERVE
    })
    // Excluding the aborted case leaves the real comparison intact: 0.4 vs 0.5.
    assert.equal(r.reserve.accepted, false)
    assert.equal(r.reserve.delta, -0.1)
    assert.equal(r.best.iteration, 0)
  })
})

test('a reserve that errors on every cell rejects rather than adopting on no evidence', async () => {
  await withTmpDir(async dir => {
    const warnings = []
    const r = await runLoop(dir, {
      evaluate: abortingEvaluate(RESERVE_CLEARS, ['rs-1', 'rs-2']),
      rewrite: proposeCandidate,
      cases: TWO_RESERVE,
      log: m => warnings.push(m)
    })
    assert.equal(r.reserve.comparedCells, 0)
    assert.equal(r.reserve.accepted, false)
    assert.equal(r.best.iteration, 0)
    assert.doesNotMatch(readFileSync(join(dir, 'demo.best.md'), 'utf8'), /CANDIDATE/)
    assert.ok(warnings.some(m => /cannot be validated/.test(m)), 'the run must say the candidate was never validated')
  })
})

test('a verdict computed over fewer cases than the split holds says so', () => {
  const line = renderVerdict({
    styleId: 'demo',
    best: { iteration: 1, train: 0.7, holdout: 0.5 },
    history: [],
    reserve: {
      split: 'reserve', cases: 2, comparedCells: 1, droppedCases: ['rs-2'],
      baseline: 0.5, candidate: 0.6, delta: 0.1, accepted: true, iteration: 1
    }
  })
  assert.match(line, /1 case\(s\) produced no reply and were excluded: rs-2/)
  assert.match(line, /1 cells compared/)
})

test('reserve rows are tagged with the iteration each one validates', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, { evaluate: splitAwareEvaluate(RESERVE_REGRESSES), rewrite: proposeCandidate })
    const reserveRows = r.rows.filter(row => row.split === 'reserve')
    // v0 is the incumbent's reserve score, v1 the candidate's: the two halves of
    // the comparison, both re-scorable offline from rows.json.
    assert.deepEqual(reserveRows.map(row => row.iteration), [0, 1])
    assert.equal(r.cells, r.rows.length)
    assert.equal(r.rows.length, 6)
  })
})

test('no reserve pass runs, and nothing is spent on it, when no rewrite was kept', async () => {
  await withTmpDir(async dir => {
    // Flat scores: the candidate never beats the baseline, so there is no
    // adoption to validate and the extra measurement is not worth paying for.
    const r = await runLoop(dir, { evaluate: fakeEvaluate(0.5), rewrite: proposeCandidate })
    assert.equal(r.best.iteration, 0)
    assert.equal(r.reserve, null)
    assert.ok(!readdirSync(dir).some(f => f.includes('.reserve.')))
    assert.ok(r.rows.every(row => row.split !== 'reserve'))
    assert.equal(r.cells, 4)
  })
})

test('a config missing minReserveDelta warns and still accepts a sound candidate', async () => {
  await withTmpDir(async dir => {
    const lines = []
    // `delta >= undefined` is false for every candidate, so without a fallback
    // this config would silently roll back every run it was used on.
    const { minReserveDelta, ...noThreshold } = CFG
    const r = await runLoop(dir, {
      cfg: noThreshold,
      evaluate: splitAwareEvaluate(RESERVE_CLEARS),
      rewrite: proposeCandidate,
      log: m => lines.push(m)
    })
    assert.equal(r.reserve.accepted, true)
    assert.equal(r.best.iteration, 1)
    assert.match(lines.join('\n'), /minReserveDelta is not set/)
  })
})

test('an adoption with no reserve cases is reported as unvalidated, not as validated', async () => {
  await withTmpDir(async dir => {
    const lines = []
    const r = await runLoop(dir, {
      cases: CASES.filter(c => c.split !== 'reserve'),
      evaluate: splitAwareEvaluate(RESERVE_CLEARS),
      rewrite: proposeCandidate,
      log: m => lines.push(m)
    })
    assert.equal(r.best.iteration, 1)
    // reserve: null means "not measured". It must never be readable as "passed".
    assert.equal(r.reserve, null)
    assert.match(lines.join('\n'), /unvalidated/)
  })
})

// What a caller of improveStyle hands the renderer, minus the rows.
const result = (best, reserve) => ({
  styleId: 'demo',
  best: { train: 0.914, holdout: 0.957, iteration: 3, ...best },
  history: [{ iteration: 0, train: 0.888, holdout: 0.905, kept: true }],
  reserve
})

test('a reserve rejection is rendered as a rejection, not as an adoption', () => {
  const out = renderVerdict(result({ train: 0.888, holdout: 0.905, iteration: 0 }, {
    split: 'reserve', cases: 4, baseline: 0.908, candidate: 0.84, delta: -0.068, accepted: false, iteration: 3
  }))
  assert.match(out, /v3 REJECTED on reserve — keeping v0/)
  assert.doesNotMatch(out, /adopted/)
  // The numbers on the headline are the incumbent's, and the losing side of the
  // comparison is named as v3 so it cannot be read as the style's new score.
  assert.match(out, /train 0\.888 holdout 0\.905/)
  assert.match(out, /reserve: v3 0\.84 vs v0 0\.908 \(-0\.068\) over 4 cases/)
})

test('an accepted candidate is rendered as adopted, with the reserve delta signed', () => {
  const out = renderVerdict(result({}, {
    split: 'reserve', cases: 4, baseline: 0.908, candidate: 0.912, delta: 0.004, accepted: true, iteration: 3
  }))
  assert.match(out, /demo: adopted v3/)
  assert.doesNotMatch(out, /REJECTED/)
  assert.match(out, /reserve: v3 0\.912 vs v0 0\.908 \(\+0\.004\) over 4 cases/)
})

test('an unmeasured reserve is never rendered as a pass', () => {
  const noRewrite = renderVerdict(result({ iteration: 0 }, null))
  assert.match(noRewrite, /reserve: not measured — no rewrite was kept/)

  // The dangerous one: a candidate WAS adopted and the reserve never ran.
  const unvalidated = renderVerdict(result({}, null))
  assert.match(unvalidated, /NOT MEASURED/)
  assert.match(unvalidated, /unvalidated/)
  assert.doesNotMatch(unvalidated, /REJECTED/)
})

// `text` is not decoration: summarize() pools a row into its means only if the
// cell produced a reply, and a fixture with no text models a cell that said
// nothing — which is now correctly reported as unmeasured, not as `total`.
const row = (styleId, iteration, split, total) => ({
  styleId, variantId: 'baseline', model: 'haiku', caseId: `c-${split}`,
  split, repeat: 0, iteration, error: null,
  text: 'a reply', trace: 'a reply',
  rulesScore: total, checks: [], judgeScore: total, total
})

test('summarize groups improve rows by iteration, in loop order', () => {
  const s = summarize([
    row('demo', 1, 'train', 0.9), row('demo', 0, 'holdout', 0.4),
    row('demo', 0, 'train', 0.5), row('demo', 1, 'holdout', 0.8)
  ])
  assert.deepEqual(s.byIteration.map(g => g.key),
    ['demo v0 holdout', 'demo v0 train', 'demo v1 holdout', 'demo v1 train'])
  assert.equal(s.byIteration.find(g => g.key === 'demo v1 train').score, 0.9)
  assert.equal(s.kind, 'improve')
})

test('two styles in one improve run keep separate traces', () => {
  // improve defaults to every style in the matrix and pools their rows. A
  // style-blind key would average these two into 0.6, describing neither.
  const s = summarize([row('a', 1, 'train', 0.95), row('b', 1, 'train', 0.25)])
  assert.equal(s.byIteration.length, 2)
  assert.equal(s.byIteration.find(g => g.key === 'a v1 train').score, 0.95)
  assert.equal(s.byIteration.find(g => g.key === 'b v1 train').score, 0.25)
})

test('summarize leaves byIteration empty for a plain run', () => {
  const s = summarize([{
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: 'c1',
    split: 'train', repeat: 0, error: null,
    text: 'a reply', trace: 'a reply',
    rulesScore: 1, checks: [], judgeScore: 1, total: 1
  }])
  assert.deepEqual(s.byIteration, [])
  assert.equal(s.kind, 'run')
})

test('an improve report is labelled a trace; a plain run report is not', () => {
  const trace = summarize([row('demo', 0, 'train', 0.5), row('demo', 1, 'train', 0.9)])
  const md = renderMarkdown(trace)
  assert.match(md, /^# Optimizer trace/)
  assert.match(md, /not any style's score/)
  assert.match(renderConsole(trace), /Optimizer trace/)

  const plain = summarize([{
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: 'c1',
    split: 'train', repeat: 0, error: null,
    text: 'a reply', trace: 'a reply',
    rulesScore: 1, checks: [], judgeScore: 1, total: 1
  }])
  assert.match(renderMarkdown(plain), /^# Output style adherence report/)
  assert.doesNotMatch(renderConsole(plain), /Optimizer trace/)
})

// ---------- COS-11 review: the loop must not reward a rewrite for breaking a case ----------

/**
 * A scorer where each case has its own score, and a named set of cases abort.
 * An aborted cell is what the harness actually writes for one: no text, the
 * error flag set, rules 0 and the judge substituted at 1.0.
 */
const perCaseEvaluate = (scores, aborts = {}) => async ({ styles, cases }) => {
  const v = styles[0].text.includes('REWRITTEN') ? 'v1' : 'v0'
  const rows = cases.map(c => {
    if (aborts[v]?.includes(c.id)) {
      return {
        styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
        split: c.split, repeat: 0, text: '', trace: '',
        error: 'error_max_turns', rulesScore: 0, checks: [], judgeScore: 1,
        judgeViolations: [], total: 0.3
      }
    }
    const s = scores[v][c.id]
    return {
      styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
      split: c.split, repeat: 0, text: 'reply', trace: 'reply',
      error: null, rulesScore: s, checks: [], judgeScore: s, judgeViolations: [], total: s
    }
  })
  return { rows, summary: summarize(rows) }
}

const WIDE = [
  { id: 'tr-1', split: 'train', prompt: 'p' },
  { id: 'tr-hard', split: 'train', prompt: 'p' },
  { id: 'ho-1', split: 'holdout', prompt: 'p' },
  { id: 'rs-1', split: 'reserve', prompt: 'p' }
]

test('a rewrite that makes a case abort cannot win by being measured on what survived', async () => {
  await withTmpDir(async dir => {
    // v0 answers both train cases: 0.80 and 0.40, arm mean 0.60.
    // v1 is WORSE on the case it still answers (0.80 -> 0.70) and makes the hard
    // one abort. Its arm mean over replying cells is 0.70 — higher than v0's
    // 0.60 — purely because the case that dragged the mean down is gone.
    // Paired on the one case both answered, the rewrite is -0.10 and must lose.
    const r = await runLoop(dir, {
      evaluate: perCaseEvaluate(
        { v0: { 'tr-1': 0.8, 'tr-hard': 0.4, 'ho-1': 0.6, 'rs-1': 0.6 },
          v1: { 'tr-1': 0.7, 'tr-hard': 0.4, 'ho-1': 0.6, 'rs-1': 0.6 } },
        { v1: ['tr-hard'] }
      ),
      rewrite: async () => `REWRITTEN ${'y'.repeat(300)}`,
      cases: WIDE
    })
    assert.equal(r.best.iteration, 0, 'the rewrite must be reverted, not adopted')
    assert.equal(r.history[1].kept, false)
    assert.equal(r.history[1].dTrain, -0.1, 'delta is paired on the case both sides answered')
    assert.equal(r.history[1].comparedTrain, 1, 'one case was comparable')
    assert.deepEqual(r.history[1].droppedCases, ['tr-hard'])
    // The unpaired reading is the trap this guards: v1's own arm mean is higher.
    assert.ok(r.history[1].train > r.history[0].train,
      'the arm mean really does rise — which is exactly why it must not be the verdict')
  })
})

test('a genuine improvement is still kept when no case aborts', async () => {
  // The complement of the test above: pairing must not make the loop refuse
  // every rewrite. Same shape, no aborts, v1 better on both train cases.
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: perCaseEvaluate({
        v0: { 'tr-1': 0.6, 'tr-hard': 0.4, 'ho-1': 0.6, 'rs-1': 0.6 },
        v1: { 'tr-1': 0.8, 'tr-hard': 0.6, 'ho-1': 0.7, 'rs-1': 0.7 }
      }),
      rewrite: async () => `REWRITTEN ${'y'.repeat(300)}`,
      cases: WIDE
    })
    assert.equal(r.best.iteration, 1, 'a real improvement is adopted')
    assert.equal(r.history[1].dTrain, 0.2)
    assert.equal(r.history[1].comparedTrain, 2)
    assert.deepEqual(r.history[1].droppedCases, [])
  })
})

test('an unmeasurable baseline stops the loop before it buys a candidate', async () => {
  await withTmpDir(async dir => {
    const logs = []
    let rewrites = 0
    const r = await runLoop(dir, {
      // Every cell aborts, so the baseline has no score to compare against.
      evaluate: perCaseEvaluate(
        { v0: {}, v1: {} },
        { v0: ['tr-1', 'tr-hard', 'ho-1', 'rs-1'], v1: ['tr-1', 'tr-hard', 'ho-1', 'rs-1'] }
      ),
      rewrite: async () => { rewrites++; return `REWRITTEN ${'y'.repeat(300)}` },
      cases: WIDE,
      log: m => logs.push(m)
    })
    assert.equal(rewrites, 0, 'no rewrite is bought when nothing can be compared')
    assert.equal(r.best.iteration, 0)
    assert.equal(r.best.train, null, 'reported as unmeasured, not as 0')
    assert.match(logs.join('\n'), /nothing can be compared against, stopping/)
  })
})

test('the author model is never briefed from an aborted transcript', async () => {
  await withTmpDir(async dir => {
    let brief = null
    await runLoop(dir, {
      // tr-hard aborts on the baseline while emitting narration; it must not be
      // quoted back as one of the worst replies.
      evaluate: async ({ styles, cases }) => {
        const rows = cases.map(c => c.id === 'tr-hard'
          ? { styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id, split: c.split, repeat: 0,
              text: 'ABORTED FRAGMENT', trace: 'ABORTED FRAGMENT', error: 'error_max_turns',
              rulesScore: 0, checks: [], judgeScore: 1, judgeViolations: [], total: 0.3 }
          : { styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id, split: c.split, repeat: 0,
              text: 'A GENUINELY POOR REPLY', trace: 'A GENUINELY POOR REPLY', error: null,
              rulesScore: 0.5, checks: [], judgeScore: 0.5, judgeViolations: [], total: 0.5 })
        return { rows, summary: summarize(rows) }
      },
      rewrite: async ({ brief: b }) => { brief = b; return `REWRITTEN ${'y'.repeat(300)}` },
      cases: WIDE
    })
    // total 0.3 sorts below the 0.5 replies, so the unfiltered selection would
    // hand the author a truncated turn to rewrite from.
    assert.ok(brief, 'the author was briefed')
    assert.doesNotMatch(brief, /ABORTED FRAGMENT/)
    assert.match(brief, /A GENUINELY POOR REPLY/)
  })
})

test('an unmeasured split is never printed as a null score', () => {
  const out = renderVerdict({
    styleId: 'demo',
    best: { iteration: 0, train: null, holdout: null },
    history: [{ iteration: 0, train: null, holdout: null, kept: true }],
    reserve: null
  })
  assert.doesNotMatch(out, /null/, 'neither the headline nor the history line may print null')
  // Same token the score tables use for a missing figure, so one vocabulary
  // covers both places a reader meets an unmeasured arm.
  assert.match(out, /\(train n\/a holdout n\/a\)/, 'headline')
  assert.match(out, /v0: train n\/a holdout n\/a/, 'history line')
})

// improve's model list used to be run's: cli.mjs resolved one array before the
// subcommand branch and passed it to both, so a model added for `run` was billed
// on every iteration of every optimizer loop. These pin the replacement (COS-14).
test('improve reads its own model list, not the matrix-wide one', () => {
  const lines = []
  const models = resolveImproveModels({ cfg: { ...CFG, models: ['haiku'] }, log: m => lines.push(m) })
  assert.deepEqual(models, ['haiku'])
  assert.match(lines.join('\n'), /models: haiku \(matrix\.improve\.models\)/)
  // cfg.models is the only list consulted. A config carrying run's list under
  // any other name resolves to the default, not to that list — which is what
  // "improve cannot inherit run's models" means operationally.
  assert.deepEqual(
    resolveImproveModels({ cfg: { ...CFG, matrixModels: ['opus', 'sonnet', 'haiku'] } }),
    DEFAULT_IMPROVE_MODELS
  )
})

test('--models still overrides the configured improve list', () => {
  const lines = []
  const models = resolveImproveModels({
    cliModels: ['sonnet'],
    cfg: { ...CFG, models: ['opus', 'sonnet', 'haiku'] },
    log: m => lines.push(m)
  })
  // Aiming one loop at one tier must not require editing a shared config file.
  assert.deepEqual(models, ['sonnet'])
  assert.match(lines.join('\n'), /models: sonnet \(--models\)/)
})

test('a config missing improve.models warns and uses the named default', () => {
  const lines = []
  const { models, ...noModels } = { ...CFG, models: ['opus', 'sonnet', 'haiku'] }
  const resolved = resolveImproveModels({ cfg: noModels, log: m => lines.push(m) })
  // Same shape as the missing-minReserveDelta fallback above: a named constant
  // and a warning that names it, so the substitution is in the run's own output.
  assert.deepEqual(resolved, DEFAULT_IMPROVE_MODELS)
  assert.match(lines.join('\n'), /improve\.models is not set/)
  // Failing cheap is the point. haiku is $0.0232 a baseline cell; opus is
  // $0.1493 and fable $0.2345, and the loop pays per iteration per candidate.
  assert.deepEqual(DEFAULT_IMPROVE_MODELS, ['haiku'])
})

test('an empty improve.models is treated as absent, not as zero models', () => {
  const lines = []
  // `models: []` would otherwise resolve to a loop that measures nothing and
  // reports every arm as unmeasured — a silent no-op run that still pays the
  // author model for its rewrites.
  const resolved = resolveImproveModels({ cfg: { ...CFG, models: [] }, log: m => lines.push(m) })
  assert.deepEqual(resolved, DEFAULT_IMPROVE_MODELS)
  // Named as the empty list it is rather than as an absent key, so the warning
  // points at what the file actually says.
  assert.match(lines.join('\n'), /improve\.models is not a non-empty array of model names \(got \[\]\)/)
})

test('a --models that carries no models is an error, not a fall-back', () => {
  // `--models=` and a bare `--models` both arrive as []. Falling through to the
  // config would buy the full configured list under a log line naming the config
  // as the source — identical output to passing no flag at all, on the paid
  // path, when the operator was asking to narrow it. `--models="$CHEAP"` with
  // CHEAP unset is the ordinary way to get here.
  assert.throws(
    () => resolveImproveModels({ cliModels: [], cfg: { ...CFG, models: ['opus', 'sonnet', 'haiku'] } }),
    /--models was passed with no models in it/
  )
})

test('a malformed improve.models is not reported as an absent one', () => {
  const lines = []
  // `"models": "opus"` is the JSON typo this catches. The old message said the
  // key "is not set" while the reader was looking straight at it, and the loop
  // measured haiku instead of the opus they asked for.
  const resolved = resolveImproveModels({ cfg: { ...CFG, models: 'opus' }, log: m => lines.push(m) })
  assert.deepEqual(resolved, DEFAULT_IMPROVE_MODELS)
  assert.match(lines.join('\n'), /improve\.models is not a non-empty array of model names \(got "opus"\)/)
  assert.doesNotMatch(lines.join('\n'), /is not set/)
  // A list holding a non-string is the same class of defect, not a usable list.
  const lines2 = []
  assert.deepEqual(resolveImproveModels({ cfg: { ...CFG, models: ['opus', 3] }, log: m => lines2.push(m) }), DEFAULT_IMPROVE_MODELS)
  assert.match(lines2.join('\n'), /is not a non-empty array of model names/)
})
