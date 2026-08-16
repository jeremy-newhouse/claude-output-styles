import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { statedCaps, auditStyle, auditAll, problemsOf, renderAudit, PATTERNS } from '../src/contract-audit.mjs'

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
  const badContract = { maxSentenceWords: 15, maxParagraphSentences: 3, maxUpdateWords: 80, maxCodeLines: 0 }
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

test('a contract that omits a cap is reported as unconfigured, not as a mismatch', () => {
  // Reachable whenever a temporary contract entry is hand-written to run a
  // paired experiment. "grades at undefined" would blame the style file.
  const rows = auditStyle('x', 'Sentences under 20 words.', {})
  const sent = rows.find(r => r.field === 'maxSentenceWords')
  assert.equal(sent.status, 'unconfigured')
  assert.match(sent.detail, /file says 20, contracts\.json sets no maxSentenceWords/)
  assert.equal(problemsOf(rows).length, rows.length)
})
