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
 * What one style file says its caps are.
 * @returns {Record<string, {value: number|null, status: string, detail: string}>}
 */
export function statedCaps (body) {
  const out = {}
  for (const field of Object.keys(PATTERNS)) {
    const values = statedValues(body, field)

    if (field === 'maxCodeLines') {
      const bansCode = NO_CODE_AT_ALL.test(body)
      if (bansCode && values.length) {
        out[field] = {
          value: null,
          status: 'ambiguous',
          detail: `prose both bans code outright and permits ${values.join('/')} lines`
        }
        continue
      }
      if (bansCode) {
        out[field] = { value: 0, status: 'stated', detail: 'prose shows no code at all' }
        continue
      }
    }

    if (values.length > 1) {
      out[field] = { value: null, status: 'ambiguous', detail: `prose states ${values.join(' and ')}` }
    } else if (values.length === 1) {
      out[field] = { value: values[0], status: 'stated', detail: `prose states ${values[0]}` }
    } else {
      out[field] = { value: null, status: 'unstated', detail: 'no recognised phrasing found' }
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
    const { value, status, detail } = caps[field]
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
    if (status !== 'stated') return { styleId, field, stated: null, configured, status, detail }
    if (value !== configured) {
      return {
        styleId,
        field,
        stated: value,
        configured,
        status: 'mismatch',
        detail: `file says ${value}, contracts.json grades at ${configured}`
      }
    }
    return { styleId, field, stated: value, configured, status: 'ok', detail: `both say ${value}` }
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
