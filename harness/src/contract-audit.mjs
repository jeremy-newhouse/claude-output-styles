// Cross-checks what a style file SAYS its caps are against what
// config/contracts.json GRADES them at. These two drifted apart once already:
// contracts graded beginner at 15 words and 3 sentences per paragraph while the
// file itself said 20 and 4, so every beginner run was scored against a rule no
// reader of the style could see. Nothing caught it — the numbers are in two
// different files, in two different notations, and neither one references the
// other.
//
// The parse is deliberately strict. A cap the prose states in a phrasing this
// module does not recognise is reported as UNSTATED rather than skipped: a
// silent skip is how the guard would go quiet the next time someone rewrites a
// style file. The recognised phrasings are the ones the three shipped styles
// already use, and they are documented in harness/README.md.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseStyle } from './style.mjs'

/**
 * How each contract field is stated in a style file's prose. Every pattern
 * captures the number in group 1. Multiple patterns per field are alternatives,
 * not a priority list — all of them run, and disagreeing numbers are an error.
 */
export const PATTERNS = {
  maxSentenceWords: [/sentences?\s+under\s+(\d+)\s+words/gi],
  maxParagraphSentences: [/paragraphs?\s+under\s+(\d+)\s+sentences/gi],
  maxUpdateWords: [/(?:whole|entire)\s+(?:update|reply|response|answer)\s+under\s+(?:about\s+|roughly\s+|~)?(\d+)/gi],
  maxCodeLines: [/(?:code|diffs?|snippets?)[^.\n]{0,40}?under\s+(\d+)\s+lines/gi]
}

/** Prose that sets the code cap to zero without naming a number. */
const NO_CODE_AT_ALL = /never show code|shows? no code|no code, ever/i

/**
 * Prose that lifts a cap when the READER ASKS. This is the only kind of
 * condition the audit recognises, and the restriction is deliberate: a
 * reader's request is a property of the prompt, so a case can state whether it
 * holds and a contract can state what it lifts. Conditions of any other kind
 * cannot be, which is exactly why they must not be quietly treated as one.
 *
 * Advanced's "Code or diffs under 10 lines WHEN THEY CARRY THE POINT faster
 * than prose" is the case that must not match. It is a judgement the writer
 * makes, not a request the reader sends; nothing outside the writer can
 * evaluate it, so it stays an ordinary unconditional cap.
 */
const ON_REQUEST = [
  /\bunless\s+(?:they|you|the reader|the user)\s+ask/i,
  /\bunless\s+asked\b/i,
  /\bonly\s+when\s+asked\b/i,
  /\b(?:when|if)\s+(?:they|you|the reader|the user)\s+ask/i
]

/**
 * Which contract field expresses each recognised condition. A field absent
 * from this map has no way to say "unless", so prose that conditions it is
 * drift by construction.
 */
export const CONDITION_FIELDS = { maxCodeLines: 'codeOnRequest' }

/**
 * The prose segments that state one field's cap. The condition is tested
 * against these and nothing else — beginner's file says "Do not elaborate
 * unless asked" three sections above its code rule, and a whole-body test
 * would read that as a code-cap condition.
 */
function capSegments (body, field) {
  const segments = body.split(/(?<=[.!?])\s+|\n/).map(s => s.trim()).filter(Boolean)
  // Non-global clones on purpose. PATTERNS carries /g for matchAll, and .test()
  // on a /g/ regex advances its lastIndex — which matchAll then copies, so a
  // single test here silently made the NEXT statedValues() skip the front of
  // the file. That showed up as a cap the audit called `unstated`.
  const res = PATTERNS[field].map(re => new RegExp(re.source, re.flags.replace('g', '')))
  if (field === 'maxCodeLines') res.push(NO_CODE_AT_ALL)
  return segments.filter(s => res.some(re => re.test(s)))
}

/** The request-condition the prose attaches to one field's cap, if any. */
export function statedCondition (body, field) {
  if (!CONDITION_FIELDS[field]) return null
  for (const seg of capSegments(body, field)) {
    for (const re of ON_REQUEST) {
      const m = re.exec(seg)
      if (m) return m[0]
    }
  }
  return null
}

/**
 * Every distinct number the prose states for one field.
 * @returns {number[]} sorted, deduplicated
 */
export function statedValues (body, field) {
  const found = new Set()
  for (const re of PATTERNS[field]) {
    for (const m of body.matchAll(re)) found.add(Number(m[1]))
  }
  return [...found].sort((a, b) => a - b)
}

/**
 * What one style file says its caps are, and under what condition.
 * @returns {Record<string, {value: number|null, status: string, detail: string, condition: string|null}>}
 */
export function statedCaps (body) {
  const out = {}
  for (const field of Object.keys(PATTERNS)) {
    const values = statedValues(body, field)
    const condition = statedCondition(body, field)

    if (field === 'maxCodeLines') {
      const bansCode = NO_CODE_AT_ALL.test(body)
      if (bansCode && values.length) {
        out[field] = {
          value: null,
          status: 'ambiguous',
          detail: `prose both bans code outright and permits ${values.join('/')} lines`,
          condition
        }
        continue
      }
      if (bansCode) {
        out[field] = { value: 0, status: 'stated', detail: 'prose shows no code at all', condition }
        continue
      }
    }

    if (values.length > 1) {
      out[field] = { value: null, status: 'ambiguous', detail: `prose states ${values.join(' and ')}`, condition }
    } else if (values.length === 1) {
      out[field] = { value: values[0], status: 'stated', detail: `prose states ${values[0]}`, condition }
    } else {
      out[field] = { value: null, status: 'unstated', detail: 'no recognised phrasing found', condition }
    }
  }
  return out
}

/**
 * Compare one style file's prose against its contract.
 * @returns {Array<{styleId,field,stated,configured,status,detail}>} one row per field
 */
export function auditStyle (styleId, body, contract) {
  const caps = statedCaps(body)
  return Object.keys(PATTERNS).map(field => {
    const { value, status, detail, condition } = caps[field]
    const configured = contract[field]
    // A contract that omits the field is its own failure, and reporting it as a
    // mismatch "against undefined" names the wrong file as the problem.
    if (configured === undefined) {
      return {
        styleId,
        field,
        stated: status === 'stated' ? value : null,
        configured,
        status: 'unconfigured',
        detail: status === 'stated'
          ? `file says ${value}, contracts.json sets no ${field}`
          : `neither the file nor contracts.json states ${field}`
      }
    }
    if (status !== 'stated') return { styleId, field, stated: null, configured, status, detail, condition }
    if (value !== configured) {
      return {
        styleId,
        field,
        stated: value,
        configured,
        status: 'mismatch',
        detail: `file says ${value}, contracts.json grades at ${configured}`,
        condition
      }
    }
    // The numbers agree. That used to end it, and it is where this guard was
    // silent: beginner's "Never show code UNLESS THEY ASK" parses to 0, matches
    // maxCodeLines: 0, and was reported as agreement — while the prose granted a
    // permission the contract had no field to hold and code_block_size scored a
    // requested snippet 0 at weight 2. A condition the contract cannot express
    // is drift even when every number lines up.
    if (condition) {
      const lift = CONDITION_FIELDS[field]
      if (!contract[lift]) {
        return {
          styleId,
          field,
          stated: value,
          configured,
          status: 'mismatch',
          detail: `both say ${value}, but the file lifts the cap "${condition}" and contracts.json sets no ${lift}`,
          condition
        }
      }
      return {
        styleId,
        field,
        stated: value,
        configured,
        status: 'ok',
        detail: `both say ${value}, both lift it on request ("${condition}")`,
        condition
      }
    }
    // The mirror case: the contract says the cap lifts on request and the prose
    // never grants that. The reader of the style would never know the permission
    // exists, which is the same defect pointing the other way.
    const lift = CONDITION_FIELDS[field]
    if (lift && contract[lift]) {
      return {
        styleId,
        field,
        stated: value,
        configured,
        status: 'mismatch',
        detail: `both say ${value}, but contracts.json sets ${lift} and the file states no such permission`,
        condition
      }
    }
    return { styleId, field, stated: value, configured, status: 'ok', detail: `both say ${value}`, condition }
  })
}

/**
 * Audit every style in a contracts map. `styleFile` paths are resolved against
 * the harness root, which is how cli.mjs resolves them — resolving them against
 * config/ instead silently points one directory too deep.
 * @returns {Array} one row per style x field
 */
export function auditAll (contracts, harnessRoot) {
  return Object.entries(contracts).flatMap(([styleId, contract]) => {
    const file = resolve(harnessRoot, contract.styleFile)
    let body
    try {
      body = parseStyle(readFileSync(file, 'utf8'), file).body
    } catch (err) {
      // A styleFile that does not resolve IS drift between the contract and the
      // files, so report it as a finding. Throwing here would make the one
      // command meant to diagnose config problems die on a config problem.
      return [{
        styleId,
        field: 'styleFile',
        stated: null,
        configured: contract.styleFile,
        status: 'unreadable',
        detail: `cannot read ${contract.styleFile}: ${err.code ?? err.message}`
      }]
    }
    return auditStyle(styleId, body, contract)
  })
}

export const problemsOf = rows => rows.filter(r => r.status !== 'ok')

/** Human-readable audit table; `ok` is a single summary line. */
export function renderAudit (rows) {
  if (!rows.length) return 'style file vs contract\n\n  nothing to audit'
  const problems = problemsOf(rows)
  const lines = rows.map(r => {
    const mark = r.status === 'ok' ? 'ok  ' : r.status === 'mismatch' ? 'FAIL' : 'WARN'
    return `  ${mark} ${r.styleId.padEnd(26)} ${r.field.padEnd(22)} ${r.detail}`
  })
  const verdict = problems.length
    ? `${problems.length} of ${rows.length} checks need attention`
    : `all ${rows.length} checks agree`
  return `style file vs contract\n${lines.join('\n')}\n\n${verdict}`
}
