// LLM rubric judge for the parts no regex can see: is the conclusion actually
// first, is the technical level right, did the tone drift. Runs with a custom
// system prompt and no tools, so the judge is not itself under an output style.

import { query } from '@anthropic-ai/claude-agent-sdk'
import { VIEWS } from './checks.mjs'
import { secondsToMs } from './run.mjs'

const JUDGE_PROMPT = `You grade one assistant reply against the style guide it was written under.
Return ONLY a JSON object, no prose, no code fence:
{"score": <0.0-1.0>, "violations": ["<short specific quote or reason>", ...]}

The STYLE GUIDE is the standard. It outranks your own taste.

- Never penalise a reply for following the style guide. If the guide permits or
  requires a construction — a stock phrase like "Nothing for you", bold beat
  labels, a terse close — that construction is correct by definition.
- Do not invent requirements the guide does not state. Do not ask for detail the
  guide tells the writer to omit.
- Grade only what the RUBRIC asks about, judged against the guide.
- Penalise the reply for what it did, not for what the prompt made unavoidable.
  If the prompt gave no repo or no context, missing specifics is not a fault.

Be strict within those bounds: 1.0 means a careful editor holding this guide
would change nothing. Quote the offending text in each violation. Max 4.`

/**
 * `caseDef.judgeOn` names which view of the turn this case's rubric asks about.
 * Most rubrics here say "the final message ... in style", so 'final' is the
 * default; `agentic-read-report` asks about narration of the search and so must
 * see the whole turn. On a conversational cell the two views are the same
 * string, which is why only the agentic cases declare it — and a test asserts
 * that every one of them does.
 */
export const JUDGE_VIEW_DEFAULT = 'final'

/**
 * @param {number} judgeTimeoutSeconds  matrix.run.judgeTimeoutSeconds. Bounds
 *   the query call the same way maxCellSeconds bounds a cell — see run.mjs's
 *   cellLimitMs, whose validator (secondsToMs) this reuses. A stalled judge
 *   used to hang the run indefinitely: runCell's own guard has already
 *   returned and cleared its timer by the time the judge runs, so nothing was
 *   left holding a ceiling on this call.
 * @param {object} [deps]  queryFn, injectable so the four substituted-score
 *   paths — and the timeout — can be tested without a real model call.
 *   `runTurn` in run.mjs takes the same seam for the same reason.
 */
export async function judge ({ views, caseDef, contract, model, styleBody, judgeTimeoutSeconds, deps = {} }) {
  const { queryFn = query } = deps
  const on = caseDef.judgeOn ?? JUDGE_VIEW_DEFAULT
  // Throw rather than fall through. An unrecognised view would index `views` as
  // undefined, the empty-text guard below would return a free 1.0, and that is
  // the whole judge weight — 0.3 to 0.5 of the cell — awarded for a typo. The
  // check path throws on an unknown `reads` for the same reason, and the config
  // test only covers agentic cases, so a bad value on a conversational case
  // would otherwise ship green and inflate every cell of that case.
  if (!VIEWS.includes(on)) throw new Error(`case ${caseDef.id}: judgeOn must be one of ${VIEWS.join('|')}, got ${JSON.stringify(on)}`)
  const text = views?.[on] ?? ''
  // `ok` says whether a model call produced this number. The four returns that
  // substitute one — no rubric, no text, a failed call, unparseable output — all
  // land inside the range real scores occupy, so nothing downstream can tell
  // them apart by value. Scoring weight does not care (evaluate.mjs computes
  // `total` from whatever came back, as it always has), but a variance study
  // does: a substituted 0.5 pooled with real scores reads as the judge
  // disagreeing with itself.
  if (!caseDef.judge || !text) return { score: 1, violations: [], ok: false }

  const user = [
    'STYLE GUIDE:',
    '"""',
    (styleBody ?? '(not supplied)').slice(0, 8000),
    '"""',
    '',
    `RUBRIC: ${caseDef.judge}`,
    `AUDIENCE LEVEL: ${contract.level}`,
    `HARD LIMITS: sentences under ${contract.maxSentenceWords} words; whole reply under ~${contract.maxUpdateWords} words; code blocks under ${contract.maxCodeLines} lines (0 = show no code).`,
    '',
    'REPLY TO GRADE:',
    '"""',
    text.slice(0, 6000),
    '"""'
  ].join('\n')

  let out = ''
  // Validated here, immediately before the only branch that spends it, not at
  // the top of the function: the two returns above never reach a model call
  // and must not require a timeout they will not use — see secondsToMs in
  // run.mjs for why a bad or missing value throws rather than defaulting.
  const timeoutMs = secondsToMs('run.judgeTimeoutSeconds', judgeTimeoutSeconds)
  // A stalled judge call has no other ceiling: unlike a cell, it is not inside
  // runCell's own AbortController, so nothing else in the run would ever stop
  // it. `timedOut` (not the thrown error) is the authority on why the call
  // ended — an abort can either throw or end the iterator quietly, and the
  // quiet path must still be reported as a timeout rather than as unparseable
  // output.
  let timedOut = false
  const controller = new AbortController()
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  try {
    for await (const m of queryFn({
      prompt: user,
      options: {
        systemPrompt: JUDGE_PROMPT,
        model,
        // 1 is too tight: a turn spent on thinking leaves no room for the answer
        // and the SDK throws "Reached maximum number of turns", which used to
        // take down the whole run.
        maxTurns: 3,
        allowedTools: [],
        settingSources: [],
        permissionMode: 'dontAsk',
        abortController: controller
      }
    })) {
      // Bare concatenation is correct here, unlike run.mjs: allowedTools is
      // empty, so the judge's reply is one JSON object with no tool calls to
      // split it around, and a separator would break the parse below.
      if (m.type === 'assistant') for (const b of m.message.content ?? []) if (b.type === 'text') out += b.text
    }
  } catch (err) {
    // A judge failure must never kill a run that took an hour to produce. Score neutral
    // and say so, so the row is visibly untrusted rather than silently wrong.
    return {
      score: 0.5,
      violations: [timedOut ? `judge call timed out after ${timeoutMs}ms` : `judge call failed: ${String(err.message ?? err).slice(0, 120)}`],
      ok: false
    }
  } finally {
    clearTimeout(timer)
  }

  const m = /\{[\s\S]*\}/.exec(out)
  // A timeout that lands after the call already produced a complete, parseable
  // reply is not reported as one: the race between the timer firing and the
  // loop finishing naturally is the same one runCell's own cutShort guards
  // against, and a real score is worth keeping over a few milliseconds.
  if (!m) return { score: 0.5, violations: [timedOut ? `judge call timed out after ${timeoutMs}ms` : 'judge returned unparseable output'], ok: false }
  try {
    const parsed = JSON.parse(m[0])
    return {
      score: Math.max(0, Math.min(1, Number(parsed.score) || 0)),
      violations: (parsed.violations ?? []).slice(0, 4).map(String),
      ok: true
    }
  } catch {
    return { score: 0.5, violations: [timedOut ? `judge call timed out after ${timeoutMs}ms` : 'judge returned invalid JSON'], ok: false }
  }
}
