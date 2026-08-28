import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FLAGS, BOOLEAN_FLAGS, validateFlags, pick, num, matchList } from '../src/args.mjs'

test('validateFlags rejects a flag the subcommand does not read', () => {
  assert.throws(() => validateFlags('run', { _: ['run'], modles: 'haiku' }), /"run" does not take --modles/)
})

test('validateFlags is a no-op for an unrecognised command — cli.mjs reports that itself', () => {
  assert.doesNotThrow(() => validateFlags('bogus', { _: ['bogus'], anything: 'x' }))
})

test('validateFlags rejects a value-taking flag with no value, bare or written empty', () => {
  for (const flag of ['styles', 'models', 'variants', 'cases', 'repeats', 'concurrency']) {
    assert.throws(() => validateFlags('run', { _: ['run'], [flag]: true }), new RegExp(`--${flag} needs a value`), `${flag} bare`)
    assert.throws(() => validateFlags('run', { _: ['run'], [flag]: '' }), new RegExp(`--${flag} needs a value`), `--${flag}=`)
  }
})

test('validateFlags rejects a boolean flag given a value, including the string "false"', () => {
  assert.throws(() => validateFlags('run', { _: ['run'], 'no-judge': 'false' }), /--no-judge does not take a value/)
  assert.doesNotThrow(() => validateFlags('run', { _: ['run'], 'no-judge': true }))
})

test('validateFlags accepts a well-formed invocation for every subcommand', () => {
  assert.doesNotThrow(() => validateFlags('run', { _: ['run'], styles: 'a', repeats: '2' }))
  assert.doesNotThrow(() => validateFlags('improve', { _: ['improve'], iterations: '4' }))
  assert.doesNotThrow(() => validateFlags('score', { _: ['score'], rows: 'x.json' }))
  assert.doesNotThrow(() => validateFlags('judge', { _: ['judge'], concurrency: '4' }))
  assert.doesNotThrow(() => validateFlags('audit', { _: ['audit'] }))
  assert.doesNotThrow(() => validateFlags('interval', { _: ['interval'], before: 'a.json', after: 'b.json' }))
})

test('interval also accepts --rows on its own, for a single-sample interval', () => {
  assert.doesNotThrow(() => validateFlags('interval', { _: ['interval'], rows: 'x.json', metric: 'judge' }))
})

test('judge accepts --concurrency, same as run/improve', () => {
  // Regression from review: judge's rejudge() call is sized by opts.concurrency
  // same as run/improve size evaluate()'s pool, but FLAGS.judge originally
  // omitted the flag, so `judge --concurrency=N` — previously working — threw
  // "does not take --concurrency".
  assert.ok(FLAGS.judge.includes('concurrency'))
})

test('every BOOLEAN_FLAGS entry is actually listed for some subcommand', () => {
  for (const flag of BOOLEAN_FLAGS) assert.ok(Object.values(FLAGS).some(list => list.includes(flag)), flag)
})

test('num falls back when the flag is absent, converts a valid value, and rejects a non-number by name', () => {
  assert.equal(num('repeats', undefined, 2), 2)
  assert.equal(num('repeats', '5', 2), 5)
  assert.throws(() => num('repeats', 'abc', 2), /--repeats=abc is not a number/)
})

test('num treats 0 as a legitimate value, not a rejection', () => {
  assert.equal(num('repeats', '0', 2), 0)
})

test('matchList resolves to null when the flag is absent, so the caller applies its own default', () => {
  assert.equal(matchList('variants', undefined, ['baseline']), null)
})

test('matchList accepts a list that matches, rejects one that does not, and rejects an empty list', () => {
  assert.deepEqual(matchList('variants', 'a,b', ['a', 'b', 'c']), ['a', 'b'])
  assert.throws(() => matchList('variants', 'typo', ['a', 'b']), /--variants matches nothing: typo/)
  assert.throws(() => matchList('cases', '', ['a']), /--cases was passed with no values in it/)
})

test('pick splits, trims and drops empties, and falls back only when the flag is absent', () => {
  assert.deepEqual(pick(undefined, ['x']), ['x'])
  assert.deepEqual(pick('a, b ,,c', []), ['a', 'b', 'c'])
})
