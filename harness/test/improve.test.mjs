import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { improveStyle, spendOf } from '../src/improve.mjs'
import { summarize } from '../src/evaluate.mjs'
import { renderConsole, renderMarkdown } from '../src/report.mjs'

const CASES = [
  { id: 'tr-1', split: 'train', prompt: 'p' },
  { id: 'ho-1', split: 'holdout', prompt: 'p' }
]

const CFG = {
  targetScore: 0.9,
  maxIterations: 1,
  authorModel: 'opus',
  trainSplit: 'train',
  holdoutSplit: 'holdout',
  minHoldoutDelta: -0.02,
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

const runLoop = (outDir, { evaluate, rewrite, rows, onRows }) => improveStyle({
  style: { id: 'demo', text: `---\nname: demo\n---\n${BODY}`, body: BODY, meta: { name: 'demo' } },
  variant: { id: 'baseline' },
  models: ['haiku'],
  cases: CASES,
  contracts: { demo: {} },
  opts: { repeats: 1 },
  cfg: CFG,
  outDir,
  log: () => {},
  rows,
  onRows,
  deps: { evaluate, rewrite }
})

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
