import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  planJudgements,
  rejudge,
  varianceComponents,
  replyGroups,
  meansByReply,
  agreementBetween,
  cellsForHalfWidth,
  halfWidthAt,
  analyzeJudgements,
  renderJudgeReport
} from '../src/rejudge.mjs'

const CASES = [
  { id: 'conv-status-auth', judge: 'is the conclusion first' },
  { id: 'agentic-read-report', judge: 'is the narration terse', judgeOn: 'trace' },
  { id: 'no-rubric', judge: null }
]
const CONTRACTS = { s1: { level: 'beginner', judgeWeight: 0.5 }, s2: { level: 'advanced' } }
const BODIES = { s1: 'guide one', s2: 'guide two' }

const row = (over = {}) => ({
  styleId: 's1',
  variantId: 'baseline',
  model: 'opus',
  caseId: 'conv-status-auth',
  split: 'train',
  repeat: 0,
  text: 'Fixed it. Tests pass.',
  trace: 'Fixed it. Tests pass.',
  error: null,
  ...over
})

// ---------- planning ----------

test('the plan grades only what the live judge path would have graded', () => {
  const rows = [
    row(),
    row({ error: 'error_max_turns', text: '', trace: '' }), // said nothing
    row({ styleId: 'candidate-v3' }), //                        no contract
    row({ caseId: 'retired-case' }), //                         not in the pool
    row({ caseId: 'no-rubric' }) //                             no rubric to grade against
  ]
  const { tasks, eligible, skipped } = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet'], repeats: 1 })
  assert.deepEqual(eligible, [0])
  assert.equal(tasks.length, 1)
  assert.equal(skipped.noReply, 1)
  assert.equal(skipped.noRubric, 1)
  assert.deepEqual([...skipped.noContract], [['candidate-v3', 1]])
  assert.deepEqual([...skipped.noCase], [['retired-case', 1]])
})

test('the plan is ordered by sweep, so a killed run keeps balanced passes', () => {
  const rows = [row(), row({ model: 'sonnet' })]
  const { tasks } = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet', 'opus'], repeats: 2 })
  assert.equal(tasks.length, 8)
  // The regression this guards: ordering by reply would leave a killed run with
  // reply 0 judged four times and reply 1 not at all, which decomposes into
  // nothing. Every judge covers every reply once before any judge repeats.
  const firstPass = tasks.slice(0, 4).map(t => `${t.judgeModel}:${t.rowIndex}`)
  assert.deepEqual(firstPass, ['sonnet:0', 'sonnet:1', 'opus:0', 'opus:1'])
  assert.deepEqual(new Set(tasks.slice(0, 4).map(t => t.judgeRepeat)), new Set([0]))
  assert.deepEqual(new Set(tasks.slice(4).map(t => t.judgeRepeat)), new Set([1]))
})

test('the plan honours style and case filters', () => {
  const rows = [row(), row({ styleId: 's2' }), row({ caseId: 'agentic-read-report' })]
  const byStyle = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet'], repeats: 1, styleIds: ['s2'] })
  assert.deepEqual(byStyle.eligible, [1])
  assert.equal(byStyle.skipped.filtered, 2)
  const byCase = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet'], repeats: 1, caseIds: ['agentic-read-report'] })
  assert.deepEqual(byCase.eligible, [2])
})

// ---------- grading ----------

test('every record carries the provenance a figure drawn from it needs', async () => {
  const rows = [row(), row({ caseId: 'agentic-read-report', trace: undefined, text: 'glued turn' })]
  const { tasks } = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['opus'], repeats: 1 })
  const seen = []
  const records = await rejudge({
    rows,
    tasks,
    cases: CASES,
    contracts: CONTRACTS,
    styleBodies: BODIES,
    concurrency: 1,
    deps: {
      judge: async a => { seen.push(a); return { score: 0.75, violations: ['too long'], ok: true } },
      now: () => 0
    }
  })
  assert.equal(records.length, 2)
  assert.equal(seen[0].styleBody, 'guide one')
  assert.equal(seen[0].model, 'opus', 'the judge model, not the row model')
  assert.deepEqual(records[0], {
    rowIndex: 0,
    judgeModel: 'opus',
    judgeRepeat: 0,
    styleId: 's1',
    model: 'opus',
    caseId: 'conv-status-auth',
    variantId: 'baseline',
    split: 'train',
    repeat: 0,
    judgeReads: 'final',
    legacy: false,
    ok: true,
    score: 0.75,
    violations: ['too long'],
    elapsedMs: 0
  })
  assert.equal(records[1].judgeReads, 'trace', 'the case rubric names the view, not the default')
  assert.equal(records[1].legacy, true, 'a row with no trace key is graded on the glued turn and says so')
})

test('records flush incrementally and in plan order', async () => {
  const rows = [row(), row(), row()]
  const { tasks } = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet'], repeats: 1 })
  const lengths = []
  const records = await rejudge({
    rows,
    tasks,
    cases: CASES,
    contracts: CONTRACTS,
    styleBodies: BODIES,
    concurrency: 3,
    onRecords: rs => lengths.push(rs.length),
    deps: { judge: async () => ({ score: 0.5, violations: [], ok: true }) }
  })
  assert.deepEqual(lengths, [1, 2, 3])
  assert.deepEqual(records.map(r => r.rowIndex), [0, 1, 2])
})

test('a call that returned no parseable score is recorded and then excluded', async () => {
  const rows = [row(), row(), row()]
  const { tasks } = planJudgements({ rows, cases: CASES, contracts: CONTRACTS, judges: ['sonnet'], repeats: 2 })
  let n = 0
  const records = await rejudge({
    rows,
    tasks,
    cases: CASES,
    contracts: CONTRACTS,
    styleBodies: BODIES,
    concurrency: 1,
    deps: {
      judge: async () => (n++ === 0
        ? { score: 0.5, violations: ['judge call failed: 503'], ok: false }
        : { score: 0.9, violations: [], ok: true })
    }
  })
  assert.equal(records.filter(r => !r.ok).length, 1)
  const a = analyzeJudgements(records, { reference: 'sonnet' })
  assert.equal(a.dropped, 1)
  // The substituted 0.5 sits inside the range real scores occupy. Pooled, it
  // would read as this judge disagreeing with itself by 40 points on one reply.
  // Reply 0 is left with a single surviving call, so it carries no within-reply
  // information and drops out too: 2 replies, 4 calls, and a judge that agreed
  // with itself exactly.
  assert.equal(a.perJudge[0].replies, 2)
  assert.equal(a.perJudge[0].calls, 4)
  assert.equal(a.perJudge[0].sdJudge, 0)
})

// ---------- variance decomposition ----------

test('the decomposition recovers known components', () => {
  // Two replies, two calls each, chosen so the ANOVA is checkable by hand:
  // MSW = 50, MSB = 400, k0 = 2, so varJudge = 50 and varReply = (400-50)/2 = 175.
  const v = varianceComponents([[10, 20], [30, 40]])
  assert.equal(v.replies, 2)
  assert.equal(v.calls, 4)
  assert.equal(v.k0, 2)
  assert.equal(v.mean, 25)
  assert.equal(v.sdJudge, 7.07)
  assert.equal(v.sdReply, 13.23)
  assert.equal(v.sdTotal, 15)
  assert.equal(v.judgeShare, 0.222)
  assert.equal(v.icc, 0.778)
})

test('reply variance is clamped at zero rather than reported negative', () => {
  // Identical replies: every point of spread is the judge. (MSB - MSW) is
  // negative here, and a negative variance is a measurement, not a quantity.
  const v = varianceComponents([[10, 20], [10, 20], [20, 10]])
  assert.equal(v.sdReply, 0)
  assert.equal(v.judgeShare, 1)
  assert.equal(v.icc, 0)
})

test('the effective group size handles an unbalanced plan', () => {
  // A killed sweep leaves unequal repeat counts. k0 = (N - sum(ni^2)/N)/(R-1)
  // = (5 - 13/5)/1 = 2.4, not the 2.5 a plain average of group sizes gives.
  const v = varianceComponents([[0, 10], [0, 10, 20]])
  assert.equal(v.k0, 2.4)
  assert.equal(v.calls, 5)
})

test('a single pass carries no within-reply information and says so', () => {
  assert.equal(varianceComponents([[10], [20], [30]]), null)
  assert.equal(varianceComponents([[10, 20]]), null, 'one reply cannot separate the two components')
})

test('replyGroups and meansByReply key on the reply, not the record', () => {
  const recs = [
    { rowIndex: 0, score: 0.2 },
    { rowIndex: 1, score: 0.6 },
    { rowIndex: 0, score: 0.4 }
  ]
  assert.deepEqual(replyGroups(recs), [[0.2, 0.4], [0.6]])
  assert.deepEqual([...meansByReply(recs)], [[0, 0.30000000000000004], [1, 0.6]])
})

// ---------- agreement ----------

test('agreement pairs by reply and signs the difference against the reference', () => {
  const ref = new Map([[0, 40], [1, 60], [2, 80]])
  const other = new Map([[0, 50], [1, 65], [2, 95]])
  const a = agreementBetween(ref, other)
  assert.equal(a.n, 3)
  assert.equal(a.refMean, 60)
  assert.equal(a.otherMean, 70)
  assert.equal(a.meanDiff, 10, 'positive means the other judge marks higher')
  assert.equal(a.mad, 10)
  assert.equal(a.maxAbsDiff, 15)
  assert.equal(a.pearson, 0.982)
  assert.equal(a.spearman, 1, 'the ranking is identical even where the levels are not')
})

test('agreement uses only the replies both judges graded', () => {
  const a = agreementBetween(new Map([[0, 10], [1, 20]]), new Map([[1, 30], [9, 99]]))
  assert.equal(a.n, 1)
  assert.equal(a.meanDiff, 10)
  assert.equal(agreementBetween(new Map([[0, 10]]), new Map([[1, 10]])), null)
})

// ---------- sizing ----------

test('repeat-judging shrinks only the judge component', () => {
  // sdReply 0: every point of variance is the judge, so k halves the cells.
  assert.equal(cellsForHalfWidth({ sdReply: 0, sdJudge: 10, halfWidth: 1.96, judgeCalls: 1 }), 100)
  assert.equal(cellsForHalfWidth({ sdReply: 0, sdJudge: 10, halfWidth: 1.96, judgeCalls: 2 }), 50)
  assert.equal(cellsForHalfWidth({ sdReply: 0, sdJudge: 10, halfWidth: 1.96, judgeCalls: 4 }), 25)
  // sdJudge 0: repeat-judging buys nothing at all. This is the crossover's other
  // end, and it is why the split has to be measured before an arm is sized.
  for (const k of [1, 2, 4]) {
    assert.equal(cellsForHalfWidth({ sdReply: 10, sdJudge: 0, halfWidth: 1.96, judgeCalls: k }), 100)
  }
})

test('a between-arm difference costs twice the cells of one arm mean', () => {
  // Chosen so both sides land on whole numbers: rounding up is applied after
  // the doubling, so 2 x ceil(x) is not the contract — ceil(2x) is.
  const one = cellsForHalfWidth({ sdReply: 10, sdJudge: 10, halfWidth: 1.96 })
  const two = cellsForHalfWidth({ sdReply: 10, sdJudge: 10, halfWidth: 1.96, arms: 2 })
  assert.equal(one, 200)
  assert.equal(two, 400)
})

test('halfWidthAt inverts cellsForHalfWidth', () => {
  assert.equal(halfWidthAt({ sdReply: 0, sdJudge: 10, cells: 100, judgeCalls: 1 }), 1.96)
  const n = cellsForHalfWidth({ sdReply: 13.23, sdJudge: 7.07, halfWidth: 5 })
  assert.ok(halfWidthAt({ sdReply: 13.23, sdJudge: 7.07, cells: n }) <= 5)
})

// ---------- analysis and report ----------

test('the analysis reports per judge, per style, and against the reference', () => {
  const rec = (rowIndex, judgeModel, score, over = {}) => ({
    rowIndex, judgeModel, score, ok: true, styleId: 's1', caseId: 'conv-status-auth', model: 'opus', legacy: false, ...over
  })
  const records = [
    rec(0, 'sonnet', 0.4), rec(0, 'sonnet', 0.5), rec(1, 'sonnet', 0.8, { styleId: 's2' }), rec(1, 'sonnet', 0.7, { styleId: 's2' }),
    rec(0, 'opus', 0.6), rec(0, 'opus', 0.7), rec(1, 'opus', 0.9, { styleId: 's2' }), rec(1, 'opus', 0.8, { styleId: 's2' })
  ]
  const a = analyzeJudgements(records, { reference: 'sonnet' })
  assert.deepEqual(a.perJudge.map(j => j.judgeModel), ['sonnet', 'opus'])
  assert.equal(a.perJudge[0].mean, 60, 'scores are reported in points, like every other judge figure')
  assert.deepEqual(a.perJudgeStyle.map(j => `${j.judgeModel}/${j.styleId}`), ['sonnet/s1', 'sonnet/s2', 'opus/s1', 'opus/s2'])
  // Only one style's rows exist per reply here, so the per-style rows carry a
  // single reply each and cannot decompose. They still report the mean.
  assert.equal(a.perJudgeStyle[0].sdJudge, null)
  assert.equal(a.perJudgeStyle[0].mean, 45)
  const overall = a.agreement.find(x => x.judgeModel === 'opus' && x.scope === 'overall')
  assert.equal(overall.n, 2)
  // Paired per reply: opus is +20 on reply 0 and +10 on reply 1.
  assert.equal(overall.meanDiff, 15)
  assert.ok(a.agreement.some(x => x.scope === 'style:s2'))
  assert.ok(a.agreement.some(x => x.scope === 'case:conv-status-auth'))
  assert.ok(a.agreement.some(x => x.scope === 'model:opus'))
  assert.ok(!a.agreement.some(x => x.judgeModel === 'sonnet'), 'the reference is not compared with itself')
  assert.match(renderJudgeReport(a), /Agreement with sonnet/)
})

test('arms are sized per style, not from the pooled decomposition', () => {
  // Two styles whose replies sit at different levels. Pooling them pushes the
  // gap BETWEEN the styles into the reply component, and an arm is one style on
  // one model — so a pooled basis asks for cells the arm does not need.
  const rec = (rowIndex, score, styleId) => ({
    rowIndex, judgeModel: 'sonnet', score, ok: true, styleId, caseId: 'c', model: 'opus', legacy: false
  })
  const records = []
  for (const [i, base] of [[0, 0.10], [1, 0.20], [2, 0.80], [3, 0.90]].entries()) {
    const styleId = i < 2 ? 'low' : 'high'
    records.push(rec(base[0], base[1], styleId), rec(base[0], base[1] + 0.02, styleId))
  }
  const a = analyzeJudgements(records, { reference: 'sonnet' })
  assert.deepEqual([...new Set(a.sizing.map(s => s.basis))], ['high', 'low'], 'one basis per style, not one pooled row')
  const pooled = varianceComponents(replyGroups(records.map(r => ({ ...r, score: r.score * 100 }))))
  const perStyle = a.perJudgeStyle.find(j => j.styleId === 'low')
  assert.ok(pooled.sdReply > perStyle.sdReply, 'pooling inflates the reply component')
  assert.ok(a.sizing.find(s => s.basis === 'low' && s.halfWidth === 4).k1 <
    cellsForHalfWidth({ sdReply: pooled.sdReply, sdJudge: pooled.sdJudge, halfWidth: 4 }),
    'so the per-style arm is smaller than the pooled basis would demand')
})

test('sizing falls back to a pooled basis, labelled, when no style can decompose', () => {
  const rec = (rowIndex, score, styleId) => ({
    rowIndex, judgeModel: 'sonnet', score, ok: true, styleId, caseId: 'c', model: 'opus', legacy: false
  })
  // One reply per style: no style has two replies, so none decomposes alone.
  const records = [
    rec(0, 0.2, 'a'), rec(0, 0.3, 'a'),
    rec(1, 0.8, 'b'), rec(1, 0.9, 'b')
  ]
  const a = analyzeJudgements(records, { reference: 'sonnet' })
  assert.deepEqual([...new Set(a.sizing.map(s => s.basis))], ['all styles pooled'])
})

test('the report renders when a judge ran a single pass', () => {
  const records = [
    { rowIndex: 0, judgeModel: 'haiku', score: 0.3, ok: true, styleId: 's1', caseId: 'conv-status-auth', model: 'opus', legacy: false },
    { rowIndex: 1, judgeModel: 'haiku', score: 0.5, ok: true, styleId: 's1', caseId: 'conv-status-auth', model: 'opus', legacy: false }
  ]
  const a = analyzeJudgements(records, { reference: 'haiku' })
  assert.equal(a.perJudge[0].sdTotal, null)
  assert.deepEqual(a.sizing, [], 'no split measured, so no sample size is claimed')
  assert.match(renderJudgeReport(a), /haiku/)
})
