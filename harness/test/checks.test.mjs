import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKS, VIEWS, scoreDeterministic, sentences, codeBlocks, viewsOf } from '../src/checks.mjs'
import { splitTurn } from '../src/run.mjs'
import { judge } from '../src/judge.mjs'

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
  const s = scoreDeterministic(viewsOf({ text: 'The index was dropped ✅' }), contract, {})
  // no_emoji 0 (w3), active_voice 0 (w1) -> 0
  assert.equal(s.total, 0)
  const s2 = scoreDeterministic(viewsOf({ text: 'I dropped the index.' }), contract, {})
  assert.equal(s2.total, 1)
})

// ---------- COS-10: the text-block seam ----------

test('splitTurn separates pre-tool narration from the answer', () => {
  const { final, trace } = splitTurn([
    { type: 'text', text: "I'll look at the file first." },
    { type: 'tool_use', name: 'Read' },
    { type: 'text', text: 'The bug is in the rounding.' }
  ])
  assert.equal(final, 'The bug is in the rounding.')
  assert.equal(trace, "I'll look at the file first.\n\nThe bug is in the rounding.")
  // The old `text += b.text` produced this, and it is what every agentic figure
  // in the ledger was measured on: no separator, so one run-on sentence.
  assert.equal(sentences("I'll look at the file first.The bug is in the rounding.").length, 1)
  assert.equal(sentences(trace).length, 2)
})

test('splitTurn keeps only the blocks after the LAST tool call', () => {
  const { final } = splitTurn([
    { type: 'text', text: 'Let me search.' },
    { type: 'tool_use', name: 'Grep' },
    { type: 'text', text: 'Now let me read it.' },
    { type: 'tool_use', name: 'Read' },
    { type: 'text', text: 'Fixed. 3/3 tests pass.' }
  ])
  assert.equal(final, 'Fixed. 3/3 tests pass.')
})

test('splitTurn falls back to the last thing said when the turn ends on a tool call', () => {
  // maxTurns cuts a session here. '' would score 1.0 on every "no X found"
  // check, and the whole trace would re-glue what this function exists to split.
  const { final, trace } = splitTurn([
    { type: 'text', text: 'Let me search.' },
    { type: 'tool_use', name: 'Grep' },
    { type: 'text', text: 'Now let me read it.' },
    { type: 'tool_use', name: 'Read' }
  ])
  assert.equal(final, 'Now let me read it.')
  assert.equal(trace, 'Let me search.\n\nNow let me read it.')
})

test('splitTurn gives a no-tool turn identical views', () => {
  const { final, trace } = splitTurn([{ type: 'text', text: 'Fixed the 401s. 14/14 pass.' }])
  assert.equal(final, trace)
  assert.equal(final, 'Fixed the 401s. 14/14 pass.')
  assert.deepEqual(splitTurn([]), { final: '', trace: '' })
})

test('every check declares which view it reads', () => {
  for (const [id, chk] of Object.entries(CHECKS)) {
    assert.ok(VIEWS.includes(chk.reads), `check "${id}" must declare reads: 'final' | 'trace'`)
  }
})

test('a check scores the view it declares, and says which on its row', () => {
  const views = { final: 'Fixed the rounding. 3/3 tests pass.', trace: 'Let me read the file 🚀\n\nFixed the rounding. 3/3 tests pass.' }
  const contract = { ...C, defaultChecks: ['no_emoji', 'no_process_narration', 'leads_with_conclusion'] }
  const s = scoreDeterministic(views, contract, {})
  const by = Object.fromEntries(s.checks.map(c => [c.id, c]))
  // Banned outright, so they read the trace and see the narration block.
  assert.equal(by.no_emoji.reads, 'trace')
  assert.equal(by.no_emoji.score, 0)
  assert.ok(by.no_process_narration.score < 1)
  // Answer shape, so it reads the final message and is not dragged down by an
  // opener the rubrics do not ask about.
  assert.equal(by.leads_with_conclusion.reads, 'final')
  assert.equal(by.leads_with_conclusion.score, 1)
})

test('scoreDeterministic refuses a bare string', () => {
  // Every caller was migrated to viewsOf(); a missed one must fail loudly rather
  // than index a string and score every check on undefined.
  assert.throws(() => scoreDeterministic('Fixed it.', { ...C, defaultChecks: ['no_emoji'] }, {}), TypeError)
})

test('viewsOf flags a pre-COS-10 row and serves its glued text as both views', () => {
  const legacy = { text: "I'll look first.The bug is in the rounding." }
  assert.deepEqual(viewsOf(legacy), { final: legacy.text, trace: legacy.text, legacy: true })
  const fresh = { text: 'The bug is in the rounding.', trace: "I'll look first.\n\nThe bug is in the rounding." }
  assert.equal(viewsOf(fresh).legacy, false)
  assert.equal(viewsOf(fresh).final, 'The bug is in the rounding.')
})

test('sentences splits a list header from its first item', () => {
  // No terminal punctuation after the colon, so splitting on [.!?] or a blank
  // line alone merged these into one 12-word sentence the reader never wrote.
  const t = "Here's why:\nYou're paying twice."
  assert.deepEqual(sentences(t), ["Here's why:", "You're paying twice."])
  const list = 'Two things:\n- The index is missing.\n- The job runs late.'
  assert.equal(sentences(list).length, 3)
})

test('the list-header split changes what sentence_length measures', () => {
  const tight = { ...C, maxSentenceWords: 8 }
  // One header plus one short item: two short sentences, not one long one.
  const t = 'The cause is the nightly job:\nIt writes after the report reads.'
  assert.equal(CHECKS.sentence_length.run(t, tight).score, 1)
})

test('paragraph_length exempts a list that follows a lead-in line', () => {
  // The exemption used to test only the paragraph's first character, so a
  // lead-in plus bullets in one block was graded as prose. Harmless until
  // sentences() started splitting on a single newline; then five bullets became
  // five sentences and failed a cap of four.
  const t = 'Five things changed:\n- retry cap is now three\n- dead-letter table drains\n' +
            '- alerts cleared\n- queue is empty\n- sign-ins recover again'
  assert.equal(CHECKS.paragraph_length.run(t, C).score, 1)
  // A genuine wall of prose is still caught.
  const wall = 'One. Two. Three. Four. Five.'
  assert.equal(CHECKS.paragraph_length.run(wall, C).score, 0)
})

test('the ban checks read the trace, the rate checks read the final message', () => {
  // The line is ban vs cap, and it has to hold for the two heaviest beginner
  // checks: a level that shows no code, and its jargon list. Both are violated
  // by a pre-tool block the reader sees.
  for (const id of ['no_filler', 'no_celebration', 'no_emoji', 'no_process_narration', 'no_jargon', 'code_block_size']) {
    assert.equal(CHECKS[id].reads, 'trace', `${id} is a ban list and must read the whole turn`)
  }
  for (const id of ['sentence_length', 'paragraph_length', 'total_length', 'active_voice', 'three_question_structure', 'two_options_max', 'leads_with_conclusion']) {
    assert.equal(CHECKS[id].reads, 'final', `${id} is a rate over the answer and must read the final message`)
  }
  const beginner = { ...C, maxCodeLines: 0, bannedTerms: ['endpoint'], defaultChecks: ['code_block_size', 'no_jargon'] }
  const views = {
    final: 'I fixed the price rounding. 3 of 3 tests pass.',
    trace: 'Let me check the endpoint.\n\n```js\nconst x = 1\n```\n\nI fixed the price rounding. 3 of 3 tests pass.'
  }
  const by = Object.fromEntries(scoreDeterministic(views, beginner, {}).checks.map(c => [c.id, c.score]))
  assert.equal(by.code_block_size, 0, 'code shown before the last tool call is still code the reader saw')
  assert.ok(by.no_jargon < 1, 'jargon in narration is still jargon the reader saw')
})

test('judge refuses a view it does not recognise instead of scoring 1.0', async () => {
  const views = { final: 'Fixed it.', trace: 'Fixed it.' }
  const caseDef = { id: 'typo-case', judge: 'anything', judgeOn: 'finl' }
  // Falling through would index views as undefined, hit the empty-text guard
  // and hand over the whole judge weight for free.
  await assert.rejects(() => judge({ views, caseDef, contract: C, model: 'haiku' }), /judgeOn must be one of/)
})

test('judge defaults to the final message and honours an explicit trace', async () => {
  // No API call: an empty view short-circuits before the query, so this asserts
  // the selection without spending.
  const views = { final: '', trace: 'narration only' }
  assert.deepEqual(await judge({ views, caseDef: { id: 'a', judge: 'r' }, contract: C }), { score: 1, violations: [] })
  assert.deepEqual(await judge({ views, caseDef: { id: 'a', judge: 'r', judgeOn: 'final' }, contract: C }), { score: 1, violations: [] })
})
