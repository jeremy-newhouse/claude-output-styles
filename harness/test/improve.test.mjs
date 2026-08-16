import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { improveStyle, spendOf } from '../src/improve.mjs'
import { summarize } from '../src/evaluate.mjs'

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

const runLoop = (outDir, { evaluate, rewrite }) => improveStyle({
  style: { id: 'demo', text: `---\nname: demo\n---\n${BODY}`, body: BODY, meta: { name: 'demo' } },
  variant: { id: 'baseline' },
  models: ['haiku'],
  cases: CASES,
  contracts: { demo: {} },
  opts: { repeats: 1 },
  cfg: CFG,
  outDir,
  log: () => {},
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

test('spendOf tolerates rows with no recorded cost', () => {
  assert.equal(spendOf([]), 0)
  assert.equal(spendOf([{ costUsd: 0.5 }, { error: 'timeout' }]), 0.5)
})

test('summarize groups improve rows by iteration, in loop order', () => {
  const row = (iteration, split, total) => ({
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: `c-${split}`,
    split, repeat: 0, iteration, costUsd: 0.01, error: null,
    rulesScore: total, checks: [], judgeScore: total, total
  })
  const s = summarize([
    row(1, 'train', 0.9), row(0, 'holdout', 0.4), row(0, 'train', 0.5), row(1, 'holdout', 0.8)
  ])
  assert.deepEqual(s.byIteration.map(g => g.key),
    ['v0 holdout', 'v0 train', 'v1 holdout', 'v1 train'])
  assert.equal(s.byIteration.find(g => g.key === 'v1 train').score, 0.9)
})

test('summarize leaves byIteration empty for a plain run', () => {
  const s = summarize([{
    styleId: 'demo', variantId: 'baseline', model: 'haiku', caseId: 'c1',
    split: 'train', repeat: 0, costUsd: 0.01, error: null,
    rulesScore: 1, checks: [], judgeScore: 1, total: 1
  }])
  assert.deepEqual(s.byIteration, [])
})
