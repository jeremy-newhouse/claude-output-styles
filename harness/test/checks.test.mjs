import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CHECKS, VIEWS, scoreDeterministic, sentences, codeBlocks, viewsOf, producedReply, hasTurnText } from '../src/checks.mjs'
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

// The reply the label-blindness was written to protect: recommendation first,
// both alternatives in prose, no labels anywhere. Making the check see prose
// sprawl must not cost this reply a point — that regression is the whole reason
// the literal-label scoring was removed in the first place.
test('two_options_max leaves an unlabelled two-option reply at 1', () => {
  const pivot = 'Recommendation: the covering index. Two hours and reversible. '
    + 'Alternatively, denormalize into a summary table — faster reads, but you own a nightly job.'
  assert.equal(CHECKS.two_options_max.run(pivot, C).score, 1)
  const orYouCould = 'Add the index. It gets p95 to 40ms this afternoon. '
    + 'Or you could raise the cache TTL, which is cheaper but goes stale. I recommend the index.'
  assert.equal(CHECKS.two_options_max.run(orYouCould, C).score, 1)
  const twoStated = 'Two options here. Ship the index now, or wait for the rewrite. '
    + 'I recommend shipping — the rewrite is a quarter away and this is a one-line risk.'
  assert.equal(CHECKS.two_options_max.run(twoStated, C).score, 1)
})

// AC #1: sprawl with no labels at all. Both the stated count and the pivot
// chain have to land, because replies signal the sprawl one way or the other.
test('two_options_max sees prose option sprawl without labels', () => {
  const stated = 'Three ways to cut the p95. A covering index gets it to 40ms in an afternoon and is reversible. '
    + 'A read-through cache gets it to 5ms but adds an invalidation path. '
    + 'A managed search vendor removes the problem and costs $2k a month. I recommend the index.'
  const statedResult = CHECKS.two_options_max.run(stated, C)
  assert.ok(statedResult.score < 1, `expected sprawl below 1, got ${statedResult.score}`)
  assert.match(statedResult.evidence.join(' '), /cap is 2/)

  const chained = 'A covering index gets p95 to 40ms in an afternoon. '
    + 'Another option is a read-through cache, faster still, but it adds an invalidation path. '
    + 'Another option is a managed vendor, which removes the problem and costs $2k a month. I recommend the index.'
  const chainedResult = CHECKS.two_options_max.run(chained, C)
  assert.ok(chainedResult.score < 1, `expected sprawl below 1, got ${chainedResult.score}`)
  assert.match(chainedResult.evidence.join(' '), /cap is 2/)

  const ordinal = 'Ship the index. A second approach is the summary table, cheaper to read but it needs a nightly job. '
    + 'A third approach is the vendor, which costs more. I recommend the index.'
  assert.ok(CHECKS.two_options_max.run(ordinal, C).score < 1)

  // One "another option" claims a second, which is the cap rather than a breach.
  const justTwo = 'Add the covering index; it is reversible and ships today. '
    + 'Another option is the cache, cheaper but it goes stale. I recommend the index.'
  assert.equal(CHECKS.two_options_max.run(justTwo, C).score, 1)
})

// Connectives were in the sprawl detection and were taken back out. They cost
// the exact reply the label-blindness rewrite existed to protect, and they
// never caught anything: across the 96 saved rows carrying this check they
// matched zero times, while the stated count matched the two real sprawl
// replies. An estimator with no observed true positive and a live false-
// positive path is worse than no estimator.
test('two_options_max does not count connectives as separate options', () => {
  const twoConnectives = 'Add the covering index today; it is reversible. '
    + 'Alternatively, raise the cache TTL, which is cheaper but goes stale. '
    + 'I recommend the index — or you could hand it to on-call if you would rather not touch it today.'
  assert.equal(CHECKS.two_options_max.run(twoConnectives, C).score, 1)
})

// Both found by probing the new detection rather than by any failing test, so
// both get one. A sprawl detector that fires on replies offering no choice at
// all would cost the check more than the blind spot it was built to close.
test('two_options_max does not read benefit lists or code as option sprawl', () => {
  // "three ways" is the one count phrase that is usually a manner adverbial.
  const benefits = 'I cut the retry storm. It helps in three ways: fewer retries, lower cost, and no drift. '
    + 'Next: nothing for you.'
  assert.equal(CHECKS.two_options_max.run(benefits, C).evidence.filter(e => /cap is 2/.test(e)).length, 0)
  const diagnosis = 'There are three ways this query can go wrong, but only the missing index matters here. '
    + 'I recommend adding it — faster and reversible.'
  assert.equal(CHECKS.two_options_max.run(diagnosis, C).score, 1)
  // Pointed at a course of action, the same phrasing is sprawl again.
  assert.ok(CHECKS.two_options_max.run('Three ways to fix it. Index, cache, or vendor. I recommend the index. Cheaper.', C).score < 1)

  // Code is not the reply offering the reader a choice.
  const withCode = 'I recommend the index.\n\n```sh\n# a third option, if you prefer: run this instead\npsql -c "create index"\n```\n\n'
    + 'The cache is cheaper but goes stale.'
  assert.equal(CHECKS.two_options_max.run(withCode, C).score, 1)
  const labelsInCode = 'Ship it. Faster. I recommend it.\n\n```\noption a\noption b\noption c\n```'
  assert.equal(CHECKS.two_options_max.run(labelsInCode, C).score, 1)

  // The label pattern needs its trailing boundary. Without it "option adds"
  // reads as "option a", and three such clauses trip the cap while reporting
  // the confidently wrong "3 labelled options" — on a reply with no labels.
  const prosePastLabels = 'The obvious option adds latency, the cheap option burns a week, '
    + 'and the safe option costs nothing. I recommend the index — faster, and reversible.'
  const proseResult = CHECKS.two_options_max.run(prosePastLabels, C)
  assert.equal(proseResult.score, 1)
  assert.deepEqual(proseResult.evidence, [])
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
  // the selection without running a cell.
  const views = { final: '', trace: 'narration only' }
  assert.deepEqual(await judge({ views, caseDef: { id: 'a', judge: 'r' }, contract: C }), { score: 1, violations: [] })
  assert.deepEqual(await judge({ views, caseDef: { id: 'a', judge: 'r', judgeOn: 'final' }, contract: C }), { score: 1, violations: [] })
})

test('producedReply separates a cell that said something from one that did not', () => {
  // The flag is the common way a cell goes silent, not the only one.
  assert.equal(producedReply({ error: 'error_max_turns', text: '', trace: '' }), false)
  assert.equal(producedReply({ error: null, text: '', trace: '' }), false, 'silent without a flag is still silent')
  assert.equal(producedReply({ error: null, text: '   \n  ', trace: '  ' }), false, 'whitespace is not a reply')
  assert.equal(producedReply({ error: null, text: 'I fixed it.', trace: 'I fixed it.' }), true)

  // An error flag beats surviving text: a turn that aborted part-way holds a
  // fragment of a reply, not a reply, and pooling the fragment measures how far
  // the model got before the harness stopped it.
  assert.equal(producedReply({ error: 'error_max_turns', text: 'I fixed', trace: 'I fixed' }), false)
})

test('hasTurnText asks the other question: is there anything to grade', () => {
  // The two predicates part company on exactly one row shape, and that is the
  // point — an aborted cell that emitted text is graded (the score is real and
  // rows.json is what offline re-derivation reads) but never pooled.
  const abortedWithText = { error: 'error_max_turns', text: 'I fixed', trace: 'I fixed' }
  assert.equal(hasTurnText(abortedWithText), true, 'gradeable')
  assert.equal(producedReply(abortedWithText), false, 'not poolable')

  // Everywhere else they agree, stated as the table it is.
  const cases = [
    [{ error: null, text: 'a reply', trace: 'a reply' }, true, true],
    [{ error: null, text: '', trace: '' }, false, false],
    [{ error: null, text: '  \n ', trace: ' ' }, false, false],
    [{ error: 'error_max_turns', text: '', trace: '' }, false, false]
  ]
  for (const [row, gradeable, poolable] of cases) {
    assert.equal(hasTurnText(row), gradeable, `hasTurnText ${JSON.stringify(row)}`)
    assert.equal(producedReply(row), poolable, `producedReply ${JSON.stringify(row)}`)
  }
})

test('producedReply reads the whole turn, not just the final message', () => {
  // A cell that narrated and then ended on a tool call has an empty `final` and
  // a real `trace`. That is measurable behaviour and belongs in the mean; it is
  // a different question from a cell that produced nothing at all.
  assert.equal(producedReply({ error: null, text: '', trace: 'Let me read the file.' }), true)

  // A pre-COS-10 row has no `trace` key at all and must fall back to `text`
  // rather than read as silent — every row in the ledger's saved runs is one.
  assert.equal(producedReply({ error: null, text: 'the glued turn' }), true)
  assert.equal(producedReply({ error: null, text: '' }), false)
})
