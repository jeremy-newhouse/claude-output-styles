// Deterministic scorers. Each check maps 1:1 onto a rule the style file
// actually states, so a failure names the violated rule and quotes evidence.
// No model calls here: cheap, reproducible, and safe to run every iteration.

const FILLER = [
  'leverage', 'leveraging', 'robust', 'seamless', 'seamlessly', 'delve', 'utilize',
  'utilizing', 'holistic', 'cutting-edge', 'best-in-class', 'synergy', 'streamline',
  'streamlined', 'facilitate', 'paradigm', 'ecosystem of', 'game-changer',
  'unlock', 'supercharge', 'elevate', 'empower', 'furthermore', 'moreover',
  'it is worth noting', 'it is important to note', 'in conclusion', 'comprehensive'
]

const CELEBRATION = [
  'excellent!', 'perfect!', 'great!', 'awesome!', 'amazing!', 'fantastic!',
  'wonderful!', "you're absolutely right", 'you are absolutely right',
  'great question', 'happy to help', 'i hope this helps', 'let me know if',
  'absolutely!', 'certainly!', 'success!', '🎉', '✅', '🚀', '💡', '🔥'
]

const NARRATION = [
  'let me start by', 'first, i', "first i'll", 'i will start by', 'let me first',
  'now let me', "i'm going to start", 'to begin,', 'let me search', 'let me read',
  'let me check', "i'll begin by", 'next, i', 'then i read', 'after that, i'
]

const IRREGULAR_PP = 'been|done|made|found|seen|taken|given|written|built|run|set|put|sent|held|kept|left|told|shown|known|thrown|drawn|caught|brought|bought|fixed'

const EMOJI = /\p{Extended_Pictographic}/u

// ---------- text utilities ----------

export function stripCode (text) {
  return text.replace(/```[\s\S]*?```/g, '\n').replace(/`[^`\n]*`/g, 'CODE')
}

export function codeBlocks (text) {
  return [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m => m[1].replace(/\n$/, '').split('\n'))
}

export function sentences (text) {
  return stripCode(text)
    .replace(/^[-*>#|\s]*/gm, '')
    // A single newline ends a sentence. Models write list headers as
    // "Here's why:\nYou're paying twice." — no terminal punctuation, so splitting
    // only on [.!?] or a blank line merged the header into its first item and
    // reported one long sentence where the reader sees two short ones.
    .split(/(?<=[.!?])[\s\n]+|\n+/)
    .map(s => s.replace(/\*\*/g, '').trim())
    .filter(s => s.length > 1)
}

export function words (s) {
  return s.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w))
}

export function paragraphs (text) {
  return stripCode(text).split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
}

const hit = (text, list) => {
  const lower = text.toLowerCase()
  return list.filter(p => lower.includes(p))
}

// ---------- views ----------

/** The two readings of a turn a check can ask for. */
export const VIEWS = ['final', 'trace']

/**
 * The two views of a saved row, for offline re-scoring.
 *
 * Rows written before the text-block seam was fixed have no `trace` key: their
 * `text` is the whole turn with the blocks glued together, so on an agentic cell
 * neither view is recoverable from it. Both fall back to that string and the row
 * is flagged, because the alternative — quietly serving a glued turn as `final` —
 * is how a figure measured on the old scorer gets republished as a new one.
 */
export function viewsOf (row) {
  const text = row.text ?? ''
  return { final: text, trace: row.trace ?? text, legacy: row.trace === undefined }
}

/**
 * Is there anything here to grade?
 *
 * Grading an empty string is the defect underneath COS-11: every deterministic
 * check is a "no X found" search that an empty string wins wholesale, so a cell
 * that said nothing scores ~0.93 on rules for beginner on `agentic-fix-verify`
 * — verified — and takes a free 1.0 from the judge on top of it.
 *
 * Reads the whole turn. A cell that narrated and then ended on a tool call has
 * an empty FINAL message and a real turn; it produced measurable behaviour and
 * is graded like any other.
 */
export const hasTurnText = row => String(row.trace ?? row.text ?? '').trim() !== ''

/**
 * Did this cell complete a reply that belongs in a mean?
 *
 * Stricter than `hasTurnText`, and the difference is the point. A turn that
 * aborted part-way holds a *fragment* of a reply: pooling it measures how far
 * the model got before the harness stopped it, not how well the style was
 * followed. So an aborted cell is excluded from every mean whether or not text
 * survived it — but it is still graded, and its real score is kept on the row,
 * because throwing away a measurable number is the same sin in the other
 * direction.
 *
 * Nothing keyed on `row.error` alone would do: an SDK error flag is the common
 * way a cell goes silent, not the only one, and a turn that produced no text
 * without setting the flag carries the identical bias.
 */
export const producedReply = row => !row.error && hasTurnText(row)

// ---------- checks ----------
// Each: (text, contract, caseDef) => { score: 0..1, evidence: string[] }
// score is a continuous rate so the optimizer can see partial progress.
//
// `reads` names which view of the turn the check grades, and every check states
// it rather than inheriting a default — on a conversational turn the two views
// are the same string, so an implied default stays invisible right up until it
// is wrong on an agentic cell.
//
// The line is a ban/cap distinction, and it is drawn from what the style files
// state rather than from taste:
//
//   'final' — the check is a RATE over the answer's own units: sentences,
//             paragraphs, words, options, beats. Three of the four agentic case
//             rubrics grade "the final message ... in style", and pre-tool
//             narration is not part of that message. Counting it would dilute
//             the rate with sentences no rubric asked about.
//   'trace'  — the check is a BAN LIST: a set of things the style says must not
//             appear, where one occurrence anywhere in the turn is a violation.
//             Filler, celebration, emoji, narration, unglossed jargon and — for
//             a level whose cap is 0 — code. Grading these on the final message
//             alone would score a turn that opened "Let me grep the repo 🚀" and
//             pasted a 30-line diff before the last tool call as clean.
//
// code_block_size sits on 'trace' even where the cap is nonzero. Its cap is
// about what is on the reader's screen, and a cap cannot be conditional on the
// contract from here; erring toward seeing more of the turn is the direction
// that cannot silently lose a violation.
//
// `agentic-read-report` grades the whole turn on purpose — its rubric is "no
// narration of the search process", which needs the narration present. That is a
// case-level choice about the judge, carried by caseDef.judgeOn, not by a check.

export const CHECKS = {
  sentence_length: {
    reads: 'final',
    describe: c => `sentences under ${c.maxSentenceWords} words`,
    run: (text, c) => {
      const all = sentences(text)
      if (!all.length) return { score: 1, evidence: [] }
      const bad = all.filter(s => words(s).length > c.maxSentenceWords)
      return {
        score: 1 - bad.length / all.length,
        evidence: bad.slice(0, 4).map(s => `${words(s).length}w: "${s.slice(0, 110)}"`)
      }
    }
  },

  paragraph_length: {
    reads: 'final',
    describe: c => `paragraphs under ${c.maxParagraphSentences} sentences`,
    // The cap is about walls of prose, so a list is exempt — but the exemption
    // used to test only the paragraph's first character, which misses the shape
    // models actually write: a lead-in line and then the bullets, all in one
    // block with no blank line between them. That was harmless while sentences()
    // ignored single newlines and read the whole block as one sentence. Once it
    // stopped, every bullet became a sentence and a five-item list failed a cap
    // of four. Test every line instead.
    run: (text, c) => {
      const ps = paragraphs(text).filter(p => !p.split('\n').some(l => /^[-*|\d]/.test(l.trim())))
      if (!ps.length) return { score: 1, evidence: [] }
      const bad = ps.filter(p => sentences(p).length > c.maxParagraphSentences)
      return { score: 1 - bad.length / ps.length, evidence: bad.slice(0, 3).map(p => p.slice(0, 120)) }
    }
  },

  total_length: {
    reads: 'final',
    describe: c => `whole reply under ~${c.maxUpdateWords} words`,
    run: (text, c) => {
      const n = words(stripCode(text)).length
      const over = Math.max(0, n - c.maxUpdateWords)
      // Full credit at the cap, zero at 2x the cap.
      return { score: Math.max(0, 1 - over / c.maxUpdateWords), evidence: over ? [`${n} words vs cap ${c.maxUpdateWords}`] : [] }
    }
  },

  no_filler: {
    reads: 'trace',
    describe: () => 'no filler or buzzwords',
    run: text => {
      const h = hit(stripCode(text), FILLER)
      return { score: h.length ? Math.max(0, 1 - h.length / 3) : 1, evidence: h }
    }
  },

  no_celebration: {
    reads: 'trace',
    describe: () => 'no celebratory or servile filler',
    run: text => {
      const h = hit(text, CELEBRATION)
      return { score: h.length ? Math.max(0, 1 - h.length / 2) : 1, evidence: h }
    }
  },

  no_emoji: {
    reads: 'trace',
    describe: () => 'no emoji',
    run: text => {
      const h = [...text].filter(ch => EMOJI.test(ch))
      return { score: h.length ? 0 : 1, evidence: h.slice(0, 8) }
    }
  },

  no_process_narration: {
    reads: 'trace',
    describe: () => 'reports results, does not narrate process',
    run: text => {
      const h = hit(stripCode(text), NARRATION)
      return { score: h.length ? Math.max(0, 1 - h.length / 2) : 1, evidence: h }
    }
  },

  active_voice: {
    reads: 'final',
    describe: () => 'active voice',
    run: text => {
      const all = sentences(text)
      if (!all.length) return { score: 1, evidence: [] }
      const re = new RegExp(`\\b(was|were|been|being|is|are|be)\\s+(\\w+ed|${IRREGULAR_PP})\\b`, 'i')
      const bad = all.filter(s => re.test(s))
      return { score: 1 - bad.length / all.length, evidence: bad.slice(0, 3).map(s => s.slice(0, 110)) }
    }
  },

  code_block_size: {
    reads: 'trace',
    describe: c => c.maxCodeLines === 0 ? 'shows no code' : `code blocks under ${c.maxCodeLines} lines`,
    run: (text, c) => {
      const blocks = codeBlocks(text)
      if (!blocks.length) return { score: 1, evidence: [] }
      if (c.maxCodeLines === 0) return { score: 0, evidence: [`${blocks.length} code block(s) shown; this level shows none`] }
      const bad = blocks.filter(b => b.length > c.maxCodeLines)
      return { score: 1 - bad.length / blocks.length, evidence: bad.map(b => `${b.length} lines vs cap ${c.maxCodeLines}`) }
    }
  },

  three_question_structure: {
    reads: 'final',
    describe: () => 'answers what I did / did it work / what you do next, in that order',
    // Keyword presence alone is too weak: a reply can contain "next" and "tests
    // pass" while having no beat structure at all. Beat 1 must be an action the
    // assistant took, it must appear early, and the three must arrive in order.
    run: text => {
      const t = stripCode(text).toLowerCase()
      const beats = [
        /\*\*what i did|^\s*i\s+(fixed|changed|added|removed|replaced|read|ran|found|cut|wrote)|(?:^|[.\n]\s*)i\s+(fixed|changed|added|removed|replaced)\b/m,
        /did it work|tests? (pass|fail)|\d+\s*\/\s*\d+|\d+\s+(tests?|checks?) (pass|fail)|verified|unproven|not tested|it works|no longer/,
        /what you do next|\bnext\b|nothing for you|nothing —|nothing -|i'll keep going|your call|no action/
      ]
      const at = beats.map(re => { const m = re.exec(t); return m ? m.index : -1 })
      const found = at.map(i => i >= 0)
      const names = ['what I did', 'did it work', 'what next']

      const ev = found.flatMap((ok, i) => ok ? [] : [`missing beat ${i + 1} (${names[i]})`])
      let score = found.filter(Boolean).length / 3

      if (found.every(Boolean)) {
        const ordered = at[0] < at[1] && at[1] < at[2]
        if (!ordered) { score *= 0.6; ev.push('beats present but out of order') }
        // Beat 1 buried past the halfway mark means the reply opened with
        // something else — context, a file tour, or narration.
        if (at[0] > t.length * 0.5) { score *= 0.7; ev.push('opens with something other than what I did') }
      }
      return { score, evidence: ev }
    }
  },

  two_options_max: {
    reads: 'final',
    describe: () => 'at most two options, compared, with one recommendation',
    // Deliberately does NOT require the literal "Option A / Option B" labels.
    // A reply that leads with the recommendation and names both alternatives in
    // prose satisfies the style's actual rule, and scoring the label instead of
    // the structure penalised exactly that — the better reply.
    run: text => {
      const t = text.toLowerCase()
      const labelled = new Set([...t.matchAll(/option\s+([a-d1-4])/g)].map(m => m[1]))
      const hasReco = /recommend|i'd pick|my pick|i suggest|go with|do (a|b)\b/.test(t)
      const hasTradeoff = /trade-?off|faster|slower|cheaper|cost|risk|quality|instead of|\bvs\.?\b/.test(t)
      let score = 0
      if (labelled.size <= 2) score += 0.3
      if (hasReco) score += 0.4
      if (hasTradeoff) score += 0.3
      const ev = []
      if (labelled.size > 2) ev.push(`${labelled.size} labelled options (cap is 2)`)
      if (!hasReco) ev.push('no recommendation')
      if (!hasTradeoff) ev.push('no trade-off comparison')
      return { score: Math.min(1, score), evidence: ev }
    }
  },

  no_jargon: {
    reads: 'trace',
    describe: c => `avoids unglossed jargon (${c.level} level)`,
    run: (text, c) => {
      const banned = c.bannedTerms ?? []
      if (!banned.length) return { score: 1, evidence: [] }
      const clean = stripCode(text)
      const h = banned.filter(term => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(clean))
      return { score: h.length ? Math.max(0, 1 - h.length / 3) : 1, evidence: h }
    }
  },

  leads_with_conclusion: {
    reads: 'final',
    describe: () => 'first sentence states the outcome',
    run: text => {
      const first = sentences(text)[0] ?? ''
      const hedge = /^(i'?ll |let me |i'?m going to |i will |sure|okay|alright|to (start|begin)|before )/i.test(first)
      return { score: hedge ? 0 : 1, evidence: hedge ? [first.slice(0, 120)] : [] }
    }
  }
}

/**
 * @param {{final: string, trace: string}} views  the turn as viewsOf() returns it
 * @returns {{ total: number, checks: Array<{id,score,weight,evidence,describe,reads}> }}
 */
export function scoreDeterministic (views, contract, caseDef) {
  if (typeof views === 'string') throw new TypeError('scoreDeterministic takes {final, trace} — use viewsOf(row)')
  const ids = caseDef.checks ?? contract.defaultChecks
  const rows = ids.map(id => {
    const chk = CHECKS[id]
    if (!chk) throw new Error(`unknown check: ${id}`)
    if (!VIEWS.includes(chk.reads)) throw new Error(`check ${id} declares no view to read`)
    const { score, evidence } = chk.run(views[chk.reads], contract, caseDef)
    const weight = contract.weights?.[id] ?? 1
    // `reads` travels with the score: a saved checks[] row says which string it
    // graded, so a figure quoted from it can be read back without the source.
    return { id, score: Number(score.toFixed(3)), weight, evidence, describe: chk.describe(contract), reads: chk.reads }
  })
  const wsum = rows.reduce((a, r) => a + r.weight, 0) || 1
  const total = rows.reduce((a, r) => a + r.score * r.weight, 0) / wsum
  return { total: Number(total.toFixed(3)), checks: rows }
}
