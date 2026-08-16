import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { improveStyle, spendOf } from '../src/improve.mjs'
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
const fakeEvaluate = (score, costUsd) => async ({ cases }) => {
  const rows = cases.map(c => ({
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: c.id,
    split: c.split, repeat: 0, text: 'reply', costUsd, error: null,
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
      split: c.split, repeat: 0, text: 'reply', costUsd: 0.01, error: null,
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
      evaluate: fakeEvaluate(0.5, 0.01),
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
      evaluate: fakeEvaluate(0.5, 0.01),
      rewrite: async () => 'y'.repeat(300)
    })
    assert.equal(r.history.at(-1).kept, false)
    assert.equal(r.best.iteration, 0)
    assert.ok(readdirSync(dir).includes('demo.v1.train.json'))
  })
})

test('spend is the sum of the persisted rows, not a counter', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: fakeEvaluate(0.5, 0.01),
      rewrite: async () => 'y'.repeat(300)
    })
    // 2 measurements per iteration x 1 case each x 2 iterations (v0, v1).
    assert.equal(r.rows.length, 4)
    assert.equal(r.spentUsd, 0.04)
    assert.equal(r.spentUsd, spendOf(r.rows))
  })
})

test('a rewrite that returns nothing stops the loop after the baseline', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, {
      evaluate: fakeEvaluate(0.5, 0.01),
      rewrite: async () => ''
    })
    assert.deepEqual(readdirSync(dir).filter(f => f.endsWith('.json')).sort(),
      ['demo.v0.holdout.json', 'demo.v0.train.json'])
    assert.equal(r.rows.length, 2)
    assert.equal(r.spentUsd, 0.02)
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
        return fakeEvaluate(0.5, 0.01)(arg)
      },
      rewrite: async () => 'y'.repeat(300)
    }), /judge exploded/)
    assert.equal(shared.length, 2)
    assert.equal(spendOf(shared), 0.02)
    assert.deepEqual(shared.map(r => r.iteration), [0, 0])
  })
})

test('a style reports only its own rows out of a shared sink', async () => {
  await withTmpDir(async dir => {
    const shared = [{ styleId: 'other', costUsd: 5, iteration: 0 }]
    const r = await runLoop(dir, {
      rows: shared,
      evaluate: fakeEvaluate(0.5, 0.01),
      rewrite: async () => ''
    })
    assert.equal(shared.length, 3)
    assert.equal(r.rows.length, 2)
    assert.ok(r.rows.every(row => row.styleId === 'demo'))
    assert.equal(r.spentUsd, 0.02)
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
          split: c.split, repeat: 0, text: tag, costUsd: 0.01, error: null,
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
      evaluate: fakeEvaluate(0.5, 0.01),
      rewrite: async () => 'y'.repeat(300)
    })
    // Four measurements: v0 train, v0 holdout, v1 train, v1 holdout. An
    // interrupt after any one of them still leaves a readable rows.json.
    assert.deepEqual(seen, [1, 2, 3, 4])
  })
})

test('spendOf tolerates rows with no recorded cost', () => {
  assert.equal(spendOf([]), 0)
  assert.equal(spendOf([{ costUsd: 0.5 }, { error: 'timeout' }]), 0.5)
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
      split: 'reserve', cases: 1, baseline: 0.5, candidate: 0.6,
      delta: 0.1, accepted: true, iteration: 1
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

test('reserve rows are tagged with the iteration each one validates', async () => {
  await withTmpDir(async dir => {
    const r = await runLoop(dir, { evaluate: splitAwareEvaluate(RESERVE_REGRESSES), rewrite: proposeCandidate })
    const reserveRows = r.rows.filter(row => row.split === 'reserve')
    // v0 is the incumbent's reserve score, v1 the candidate's: the two halves of
    // the comparison, both re-scorable offline from rows.json.
    assert.deepEqual(reserveRows.map(row => row.iteration), [0, 1])
    assert.equal(r.spentUsd, spendOf(r.rows))
    assert.equal(r.rows.length, 6)
  })
})

test('no reserve pass runs, and nothing is spent on it, when no rewrite was kept', async () => {
  await withTmpDir(async dir => {
    // Flat scores: the candidate never beats the baseline, so there is no
    // adoption to validate and the extra measurement is not worth paying for.
    const r = await runLoop(dir, { evaluate: fakeEvaluate(0.5, 0.01), rewrite: proposeCandidate })
    assert.equal(r.best.iteration, 0)
    assert.equal(r.reserve, null)
    assert.ok(!readdirSync(dir).some(f => f.includes('.reserve.')))
    assert.ok(r.rows.every(row => row.split !== 'reserve'))
    assert.equal(r.spentUsd, 0.04)
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

const row = (styleId, iteration, split, total) => ({
  styleId, variantId: 'baseline', model: 'haiku', caseId: `c-${split}`,
  split, repeat: 0, iteration, costUsd: 0.01, error: null,
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
    split: 'train', repeat: 0, costUsd: 0.01, error: null,
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
    split: 'train', repeat: 0, costUsd: 0.01, error: null,
    rulesScore: 1, checks: [], judgeScore: 1, total: 1
  }])
  assert.match(renderMarkdown(plain), /^# Output style adherence report/)
  assert.doesNotMatch(renderConsole(plain), /Optimizer trace/)
})
