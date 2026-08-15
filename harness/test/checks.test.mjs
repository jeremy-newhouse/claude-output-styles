import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKS, scoreDeterministic, sentences, codeBlocks } from '../src/checks.mjs'

const C = { maxSentenceWords: 20, maxParagraphSentences: 4, maxUpdateWords: 120, maxCodeLines: 10, level: 'advanced', bannedTerms: [], defaultChecks: ['no_emoji'] }

test('sentences ignores code fences', () => {
  const t = 'One short line.\n\n```js\nthis is not a sentence at all it is code\n```\n\nTwo short line.'
  assert.equal(sentences(t).length, 2)
})

test('codeBlocks counts lines', () => {
  assert.deepEqual(codeBlocks('```js\na\nb\nc\n```').map(b => b.length), [3])
})

test('sentence_length scores the failing fraction', () => {
  const good = 'I fixed it.'
  const long = 'I ' + 'really '.repeat(25) + 'fixed it.'
  assert.equal(CHECKS.sentence_length.run(good, C).score, 1)
  assert.equal(CHECKS.sentence_length.run(`${good} ${long}`, C).score, 0.5)
})

test('total_length scales, zero at 2x cap', () => {
  const w = n => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')
  assert.equal(CHECKS.total_length.run(w(120), C).score, 1)
  assert.equal(CHECKS.total_length.run(w(240), C).score, 0)
  assert.ok(Math.abs(CHECKS.total_length.run(w(180), C).score - 0.5) < 0.01)
})

test('no_emoji is all-or-nothing', () => {
  assert.equal(CHECKS.no_emoji.run('Done.', C).score, 1)
  assert.equal(CHECKS.no_emoji.run('Done ✅', C).score, 0)
})

test('active_voice flags "was fixed" but not "I fixed"', () => {
  assert.equal(CHECKS.active_voice.run('I fixed the index.', C).score, 1)
  assert.equal(CHECKS.active_voice.run('The index was dropped.', C).score, 0)
})

test('three_question_structure needs beats present, early, and in order', () => {
  const full = 'I fixed the token check. 14/14 tests pass. Next: nothing for you.'
  assert.equal(CHECKS.three_question_structure.run(full, C).score, 1)
  assert.ok(CHECKS.three_question_structure.run('I fixed the token check.', C).score < 0.5)
  const outOfOrder = 'Next: nothing for you. 14/14 tests pass. I fixed the token check.'
  assert.ok(CHECKS.three_question_structure.run(outOfOrder, C).score < 1)
  const tour = 'The file prices an order. It sums line items, applies a discount, then adds tax. '
    + 'The rates live in a constant. Callers pass cents throughout the module. '
    + 'I fixed the rounding. 3/3 tests pass. Next: nothing for you.'
  assert.ok(CHECKS.three_question_structure.run(tour, C).score < 1)
})

test('two_options_max scores structure, not literal labels', () => {
  const labelled = 'Option A: index it. Option B: denormalize. Trade-off is cost vs speed. I recommend A.'
  assert.equal(CHECKS.two_options_max.run(labelled, C).score, 1)
  const prose = 'Recommendation: covering index. Two hours instead of two days, and reversible. Trade-off: the summary table is faster but adds a nightly job.'
  assert.equal(CHECKS.two_options_max.run(prose, C).score, 1)
  const three = 'Option A: x. Option B: y. Option C: z. I recommend A. Faster.'
  assert.ok(CHECKS.two_options_max.run(three, C).score < 0.8)
  const neither = 'It depends on your situation.'
  assert.ok(CHECKS.two_options_max.run(neither, C).score < 0.5)
})

test('code_block_size treats maxCodeLines 0 as "no code"', () => {
  const beginner = { ...C, maxCodeLines: 0 }
  assert.equal(CHECKS.code_block_size.run('```js\na\n```', beginner).score, 0)
  assert.equal(CHECKS.code_block_size.run('No code here.', beginner).score, 1)
})

test('leads_with_conclusion flags hedged openers', () => {
  assert.equal(CHECKS.leads_with_conclusion.run('Fixed the 401s.', C).score, 1)
  assert.equal(CHECKS.leads_with_conclusion.run("Let me look at that for you.", C).score, 0)
})

test('scoreDeterministic applies weights', () => {
  const contract = { ...C, defaultChecks: ['no_emoji', 'active_voice'], weights: { no_emoji: 3 } }
  const s = scoreDeterministic('The index was dropped ✅', contract, {})
  // no_emoji 0 (w3), active_voice 0 (w1) -> 0
  assert.equal(s.total, 0)
  const s2 = scoreDeterministic('I dropped the index.', contract, {})
  assert.equal(s2.total, 1)
})
