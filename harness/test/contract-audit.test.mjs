import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { statedCaps, statedCondition, statedBasis, auditStyle, auditAll, problemsOf, renderAudit, PATTERNS } from '../src/contract-audit.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONTRACTS_PATH = join(ROOT, 'config/contracts.json')
const contracts = JSON.parse(readFileSync(CONTRACTS_PATH, 'utf8'))

// ---------- the guard itself ----------

test('every shipped style file agrees with its contract', () => {
  const rows = auditAll(contracts, ROOT)
  const problems = problemsOf(rows)
  assert.deepEqual(problems, [], `\n${renderAudit(rows)}`)
})

test('every contract field the audit covers is actually stated by every style', () => {
  // Guards the guard: if a style file stops stating a cap in a recognised
  // phrasing, this fails rather than the audit quietly covering three fields
  // instead of four.
  const rows = auditAll(contracts, ROOT)
  // Derived, not hardcoded: adding a PATTERNS field or a fourth style should
  // fail on the thing that actually broke, not on an arithmetic constant here.
  assert.equal(rows.length, Object.keys(contracts).length * Object.keys(PATTERNS).length)
  for (const r of rows) assert.notEqual(r.status, 'unstated', `${r.styleId}.${r.field}: ${r.detail}`)
})

// ---------- parsing ----------

test('statedCaps reads the phrasings the shipped styles use', () => {
  const beginner = 'Keep sentences under 20 words. Keep paragraphs under 4 sentences.\n\nNever show code unless they ask.\n\nKeep the whole update under about 80 words when things are normal.'
  const caps = statedCaps(beginner)
  assert.equal(caps.maxSentenceWords.value, 20)
  assert.equal(caps.maxParagraphSentences.value, 4)
  assert.equal(caps.maxUpdateWords.value, 80)
  assert.equal(caps.maxCodeLines.value, 0)
})

test('statedCaps reads the terse advanced phrasing and a bare word count', () => {
  const advanced = 'Sentences under 20 words. Paragraphs under 4 sentences.\n\nCode or diffs under 10 lines when they carry the point.\n\nKeep the whole reply under 120, headers and code included.'
  const caps = statedCaps(advanced)
  assert.equal(caps.maxSentenceWords.value, 20)
  assert.equal(caps.maxParagraphSentences.value, 4)
  assert.equal(caps.maxUpdateWords.value, 120)
  assert.equal(caps.maxCodeLines.value, 10)
})

test('statedCaps reads a code cap stated as a snippet size', () => {
  const body = 'Show code only when asked, or when a snippet under 5 lines says it faster than prose.'
  assert.equal(statedCaps(body).maxCodeLines.value, 5)
})

test('a cap stated in an unrecognised phrasing is unstated, not skipped', () => {
  const caps = statedCaps('Keep your sentences to a maximum of 20 words.')
  assert.equal(caps.maxSentenceWords.status, 'unstated')
  assert.equal(caps.maxSentenceWords.value, null)
})

test('two different numbers for one cap are ambiguous, not first-wins', () => {
  const caps = statedCaps('Keep sentences under 20 words. In status updates, sentences under 12 words.')
  assert.equal(caps.maxSentenceWords.status, 'ambiguous')
  assert.match(caps.maxSentenceWords.detail, /12 and 20/)
})

test('prose that both bans code and sizes it is ambiguous', () => {
  const caps = statedCaps('Never show code unless they ask. Use a snippet under 5 lines.')
  assert.equal(caps.maxCodeLines.status, 'ambiguous')
})

// ---------- comparison ----------

test('auditStyle catches the divergence that actually shipped', () => {
  // contracts.json once graded beginner at 15 words / 3 sentences against a
  // file that said 20 / 4. This is that exact case.
  const body = 'Keep sentences under 20 words. Keep paragraphs under 4 sentences.\n\nNever show code unless they ask.\n\nKeep the whole update under about 80 words.'
  // codeOnRequest is present so the two numeric divergences are the only
  // findings; the conditional half of the code rule has its own tests below.
  const badContract = { maxSentenceWords: 15, maxParagraphSentences: 3, maxUpdateWords: 80, maxCodeLines: 0, codeOnRequest: true }
  const rows = auditStyle('beginner', body, badContract)
  const bad = problemsOf(rows)
  assert.equal(bad.length, 2)
  assert.deepEqual(bad.map(r => r.field).sort(), ['maxParagraphSentences', 'maxSentenceWords'])
  assert.match(bad[0].detail, /file says 20, contracts\.json grades at 15/)
})

test('an unstated cap is reported even when the contract has a value', () => {
  const rows = auditStyle('x', 'Sentences under 20 words. Paragraphs under 4 sentences. Code or diffs under 10 lines.', {
    maxSentenceWords: 20, maxParagraphSentences: 4, maxUpdateWords: 120, maxCodeLines: 10
  })
  const bad = problemsOf(rows)
  assert.equal(bad.length, 1)
  assert.equal(bad[0].field, 'maxUpdateWords')
  assert.equal(bad[0].status, 'unstated')
})

test('renderAudit marks a mismatch FAIL and a clean audit with a count', () => {
  const clean = auditAll(contracts, ROOT)
  assert.match(renderAudit(clean), new RegExp(`all ${clean.length} checks agree`))
  const dirty = auditStyle('x', 'Sentences under 20 words.', { maxSentenceWords: 15 })
  assert.match(renderAudit(dirty), /FAIL x\s+maxSentenceWords/)
})

test('a styleFile that does not resolve is a finding, not a crash', () => {
  // The command exists to diagnose config problems; dying on one is the worst
  // possible response. Before this it threw a raw ENOENT and printed nothing.
  const rows = auditAll({ ghost: { styleFile: '../no-such-style.md', maxSentenceWords: 20 } }, ROOT)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].status, 'unreadable')
  assert.match(rows[0].detail, /cannot read \.\.\/no-such-style\.md: ENOENT/)
  assert.equal(problemsOf(rows).length, 1)
  assert.match(renderAudit(rows), /WARN ghost\s+styleFile/)
})

// ---------- conditional caps (COS-15) ----------

test('a cap the prose lifts on request is drift when the contract cannot say so', () => {
  // The defect COS-15 opened on. The numbers agree — 0 and 0 — and the old
  // audit called that agreement while beginner's prose granted a permission
  // maxCodeLines had no field to hold.
  const body = 'Never show code unless they ask.'
  const rows = auditStyle('beginner', body, { maxCodeLines: 0 })
  const code = rows.find(r => r.field === 'maxCodeLines')
  assert.equal(code.status, 'mismatch')
  assert.equal(code.condition, 'unless they ask')
  assert.match(code.detail, /both say 0, but the file lifts the cap "unless they ask" and contracts\.json sets no codeOnRequest/)
})

test('a lifted cap passes once the contract expresses the lift', () => {
  const rows = auditStyle('beginner', 'Never show code unless they ask.', { maxCodeLines: 0, codeOnRequest: true })
  const code = rows.find(r => r.field === 'maxCodeLines')
  assert.equal(code.status, 'ok')
  assert.match(code.detail, /both lift it on request/)
})

test('a contract that lifts a cap the prose never lifts is drift too', () => {
  // The mirror: a reader of the style would never learn the permission exists.
  const rows = auditStyle('x', 'Code or diffs under 10 lines.', { maxCodeLines: 10, codeOnRequest: true })
  const code = rows.find(r => r.field === 'maxCodeLines')
  assert.equal(code.status, 'mismatch')
  assert.match(code.detail, /contracts\.json sets codeOnRequest and the file states no such permission/)
})

test('a judgement condition is not a request condition', () => {
  // Advanced's real line. "when they carry the point faster than prose" is the
  // writer's call, not the reader's request: nothing outside the writer can
  // evaluate it, so it must stay an ordinary unconditional cap rather than
  // demanding a codeOnRequest that would then be graded on every reply.
  const rows = auditStyle('advanced', 'Code or diffs under 10 lines when they carry the point faster than prose.', { maxCodeLines: 10 })
  const code = rows.find(r => r.field === 'maxCodeLines')
  assert.equal(code.status, 'ok')
  assert.equal(code.condition, null)
})

test('a condition is read from the sentence that states the cap, not the whole file', () => {
  // Beginner's file says "Do not elaborate unless asked" three sections above
  // its code rule. A whole-body test would read that as a code-cap condition
  // and report drift on a file that has none.
  const body = 'Reply with the minimum that is needed. Do not elaborate unless asked.\n\nCode or diffs under 10 lines.'
  assert.equal(statedCondition(body, 'maxCodeLines'), null)
  const rows = auditStyle('x', body, { maxCodeLines: 10 })
  assert.equal(rows.find(r => r.field === 'maxCodeLines').status, 'ok')
})

test('the shipped beginner and intermediate files both state the code cap conditionally', () => {
  // Grounds the two contracts' codeOnRequest in the files themselves: if a
  // style stops granting the permission, this fails rather than the flag
  // sitting in contracts.json unread.
  for (const id of ['plain-english-beginner', 'plain-english-intermediate']) {
    const body = readFileSync(resolve(ROOT, contracts[id].styleFile), 'utf8')
    assert.ok(statedCondition(body, 'maxCodeLines'), `${id} no longer lifts its code cap on request`)
    assert.equal(contracts[id].codeOnRequest, true)
  }
  const advanced = readFileSync(resolve(ROOT, contracts['plain-english-advanced'].styleFile), 'utf8')
  assert.equal(statedCondition(advanced, 'maxCodeLines'), null)
  assert.equal(contracts['plain-english-advanced'].codeOnRequest, undefined)
})

// ---------- word-cap basis (COS-28) ----------

test('a word cap the prose says includes code is drift even when the number agrees', () => {
  // The defect COS-28 opened on. total_length always scores
  // words(stripCode(text)) — code excluded, for every style — so a file that
  // claims code counts toward its cap is wrong regardless of what number it
  // states, and the old audit only ever compared the number.
  const body = 'Keep the whole reply under 120, headers and code included.'
  const rows = auditStyle('x', body, { maxUpdateWords: 120 })
  const length = rows.find(r => r.field === 'maxUpdateWords')
  assert.equal(length.status, 'mismatch')
  assert.match(length.detail, /both say 120, but the file says code counts toward it and total_length excludes code/)
})

test('a word cap that excludes code, or says nothing about code, passes', () => {
  const excludes = auditStyle('x', 'Keep the whole reply under 120, headers included and code excluded.', { maxUpdateWords: 120 })
  assert.equal(excludes.find(r => r.field === 'maxUpdateWords').status, 'ok')

  const silent = auditStyle('x', 'Keep the whole update under about 80 words.', { maxUpdateWords: 80 })
  assert.equal(silent.find(r => r.field === 'maxUpdateWords').status, 'ok')
})

test('statedBasis is read from the sentence that states the cap, not the whole file', () => {
  assert.equal(statedBasis('Code included in every code review.\n\nKeep the whole reply under 120.', 'maxUpdateWords'), null)
})

test('the shipped advanced file no longer claims code counts toward its word cap', () => {
  const advanced = readFileSync(resolve(ROOT, contracts['plain-english-advanced'].styleFile), 'utf8')
  assert.equal(statedBasis(advanced, 'maxUpdateWords'), null)
})

test('parsing the same body twice gives the same answer', () => {
  // The condition scan tests PATTERNS against individual sentences. PATTERNS
  // carries /g for matchAll, and .test() on a /g/ regex advances lastIndex,
  // which matchAll copies — so the second parse of a file skipped its own
  // opening lines and reported a stated cap as `unstated`. Idempotence is the
  // property that catches it; the symptom is two different audits of one file.
  const body = readFileSync(resolve(ROOT, contracts['plain-english-advanced'].styleFile), 'utf8')
  assert.deepEqual(statedCaps(body), statedCaps(body))
  assert.deepEqual(statedCaps(body), statedCaps(body))
  for (const field of Object.keys(PATTERNS)) {
    assert.equal(statedCaps(body)[field].status, 'stated', field)
  }
})

// ---------- AC #3: the guard still goes red on a real disagreement ----------

test('breaking a shipped contract on purpose turns the guard red', () => {
  // A guard is only worth its exit code if the red is reachable. Each mutation
  // is asserted to have landed before its effect is believed — two sabotage
  // runs in this campaign came back green because the mutation never applied.
  const mutations = [
    { field: 'maxSentenceWords', to: 15, expect: /file says 20, contracts\.json grades at 15/ },
    { field: 'maxUpdateWords', to: 999, expect: /file says 80, contracts\.json grades at 999/ },
    { field: 'codeOnRequest', to: undefined, expect: /sets no codeOnRequest/ }
  ]
  const original = contracts['plain-english-beginner']
  const body = readFileSync(resolve(ROOT, original.styleFile), 'utf8')
  assert.deepEqual(problemsOf(auditStyle('plain-english-beginner', body, original)), [])

  for (const { field, to, expect } of mutations) {
    const mutated = { ...original, [field]: to }
    if (to === undefined) delete mutated[field]
    assert.notEqual(mutated[field], original[field], `mutation of ${field} did not land`)
    const bad = problemsOf(auditStyle('plain-english-beginner', body, mutated))
    assert.equal(bad.length, 1, `${field}: expected exactly one finding, got ${bad.length}`)
    assert.match(bad[0].detail, expect)
  }

  // And the original is still clean, so the red came from the mutation.
  assert.deepEqual(problemsOf(auditStyle('plain-english-beginner', body, original)), [])
})

test('a contract that omits a cap is reported as unconfigured, not as a mismatch', () => {
  // Reachable whenever a temporary contract entry is hand-written to run a
  // paired experiment. "grades at undefined" would blame the style file.
  const rows = auditStyle('x', 'Sentences under 20 words.', {})
  const sent = rows.find(r => r.field === 'maxSentenceWords')
  assert.equal(sent.status, 'unconfigured')
  assert.match(sent.detail, /file says 20, contracts\.json sets no maxSentenceWords/)
  assert.equal(problemsOf(rows).length, rows.length)
})

test('every audit row carries the same keys, whatever its status', () => {
  // A caller reading rows[i].condition must not have to know which branch
  // produced the row. The unconfigured branch was the one that forgot it.
  const shapes = [
    auditStyle('a', 'Sentences under 20 words.', {}),
    auditStyle('b', 'Never show code unless they ask.', { maxCodeLines: 0 }),
    auditStyle('c', 'Never show code unless they ask.', { maxCodeLines: 0, codeOnRequest: true }),
    auditStyle('d', 'Sentences under 20 words.', { maxSentenceWords: 15 }),
    auditAll({ ghost: { styleFile: '../no-such-style.md' } }, ROOT)
  ].flat()
  const expected = ['condition', 'configured', 'detail', 'field', 'stated', 'status', 'styleId']
  for (const row of shapes) assert.deepEqual(Object.keys(row).sort(), expected, JSON.stringify(row))
})
