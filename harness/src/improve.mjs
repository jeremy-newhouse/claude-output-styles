// The optimizer loop: evaluate on train cases -> rewrite the style body from
// the observed failures -> re-evaluate -> keep only if train improves AND
// holdout does not regress. Holdout is what stops the rewrite from overfitting
// to the exact phrasing of the training prompts.
//
// Holdout is a tuning signal, not a verdict. It is drawn from the same small
// case pool as train, so a rewrite can satisfy both and still degrade on prompt
// shapes neither split contains — measured, not hypothesised: a candidate that
// won both in-loop splits was 6.8 points worse on cases the loop had never seen.
// So whatever the loop wants to adopt is validated once, at the end, against a
// reserve split the loop never selects. See the ADR
// docs/adr/validate-candidates-on-cases-held-out-of-every-split.md.

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { evaluate } from './evaluate.mjs'
import { producedReply } from './checks.mjs'
import { parseStyle, renderStyle } from './style.mjs'
import { timedTextQuery } from './run.mjs'

// Sourced from Anthropic's "Prompting Claude Opus 5" guide. These are the
// levers that actually move Opus, as opposed to adding more prohibitions.
const AUTHOR_SYSTEM = `You rewrite Claude Code output-style instructions so that Claude obeys them.

You are given: the current style body, and measured failures — which rules were
broken, by which model, with quoted evidence from real replies.

Rewrite the body to fix those failures. Rules for the rewrite:

1. Prefer positive examples of the wanted style over lists of prohibitions.
   A short good/bad pair beats three "do not" bullets.
2. Restate the single most-violated constraint as one short line at the very
   END of the body. Length and tone instructions placed only at the top of a
   long prompt get diluted.
3. Delete instructions that the measurements show are already satisfied, and
   delete any instruction telling the model to verify, double-check, or
   re-check its own work. Those compound with the model's own behavior and burn
   tokens without improving results.
4. Avoid "only", "just", and "be conservative". These are followed literally
   and produce less output than intended.
5. Make every rule checkable. "Under 20 words" beats "reasonably short".
6. Do not grow the file. Aim for the same length or shorter. Removing beats adding.
7. Keep the style's identity: same audience, same level, same guarantees.

Return ONLY the new body in Markdown. No frontmatter. No commentary.`

/**
 * Mean `total` over a set of rows; 0 for an empty set.
 *
 * Deliberately not summarize()'s null-for-nothing: the only caller is the
 * reserve gate, which tests `usable.a.length > 0` before it reads either mean,
 * so an empty set never reaches a published figure from here. A null would
 * instead have to be threaded through the delta and the verdict for a case that
 * is already rejected.
 */
export const meanTotal = rows =>
  rows.length ? Number((rows.reduce((a, r) => a + r.total, 0) / rows.length).toFixed(3)) : 0

/**
 * The rows the reserve gate may compare. A cell that said nothing on either side
 * is dropped from BOTH, so the two means are always taken over the same case set.
 * Pairing is by caseId rather than by index: `pool` preserves order today, but a
 * comparison that silently depends on that would be wrong the moment it does not.
 *
 * The test is producedReply, not `r.error`: a cell that goes silent without the
 * SDK flagging it biases this comparison exactly as an aborted one does, and
 * scoring it against the case would compare a reply with nothing.
 * @returns {{a: object[], b: object[]}} baseline rows and candidate rows
 */
export function comparableRows (baselineRows, candidateRows) {
  const bad = new Set([...baselineRows, ...candidateRows].filter(r => !producedReply(r)).map(r => r.caseId))
  return {
    a: baselineRows.filter(r => !bad.has(r.caseId)),
    b: candidateRows.filter(r => !bad.has(r.caseId))
  }
}

// Matches config/matrix.json. Only a fallback for a config that names a reserve
// split but omits the threshold — see where it is used.
const DEFAULT_MIN_RESERVE_DELTA = -0.02

// The fallback when a config carries no improve.models. Deliberately the
// smallest tier and only the smallest tier: an absent key has to fail small,
// because the loop runs its whole list on every arm. It is not matrix.models,
// which is the whole point — see resolveImproveModels.
export const DEFAULT_IMPROVE_MODELS = ['haiku']

/**
 * The model list an improve loop scores candidates on.
 *
 * `run` and `improve` used to share one list: cli.mjs resolved
 * `pick(args.models, matrix.models)` once, before the subcommand branch, and
 * handed the same array to both. So every model added to matrix.models ran on
 * every iteration of every optimizer loop run the documented way —
 * README's quick-start line passes no --models — and the top tier had to be kept
 * out of the default matrix to contain a load that only `improve` incurred.
 *
 * This function is not given matrix.models. Inheriting run's list is therefore
 * structurally impossible here rather than merely avoided, which is what the
 * deleted comment block in matrix.json was standing in for.
 *
 * An absent improve.models warns and uses DEFAULT_IMPROVE_MODELS, the shape
 * COS-8 used for a missing minReserveDelta: a named default plus a log line, so
 * the substitution is visible in the run's own output instead of silent.
 *
 * @param {object} a
 * @param {string[]} [a.cliModels] parsed --models: undefined when no flag was
 *   passed, `[]` when one was passed with nothing usable in it
 * @param {object} a.cfg matrix.improve
 * @param {(m: string) => void} [a.log]
 * @returns {string[]}
 */
export function resolveImproveModels ({ cliModels, cfg = {}, log = () => {} }) {
  // An explicit --models still wins: the flag is how a single loop is aimed at
  // one tier without editing the config it shares with everyone else.
  if (cliModels !== undefined) {
    // A flag that was passed and then ignored is worse than no flag on a path
    // this long. `--models=` and a bare `--models` both arrive here empty, and
    // falling through to the config would run the full configured list under a
    // log line naming the config as the source — indistinguishable from the
    // narrowing the operator was asking for. `--models="$SMALL"` with SMALL
    // unset is the ordinary way to reach it.
    if (!cliModels.length) throw new Error('--models was passed with no models in it — drop the flag to use matrix.improve.models, or name at least one model')
    log(`models: ${cliModels.join(',')} (--models)`)
    return cliModels
  }
  const usable = Array.isArray(cfg.models) && cfg.models.length && cfg.models.every(m => typeof m === 'string' && m)
  if (usable) {
    log(`models: ${cfg.models.join(',')} (matrix.improve.models)`)
    return cfg.models
  }
  // Named source in every branch, so a loop's own output says what it is about
  // to run. This one is a warning because it is the branch nobody
  // chose — and it says which of the two ways to land in it happened, because
  // "not set" over a `"models": "opus"` typo denies the key a reader is looking
  // straight at while the loop measures something else entirely.
  const why = cfg.models === undefined
    ? 'is not set'
    : `is not a non-empty array of model names (got ${JSON.stringify(cfg.models)})`
  log(`WARNING: improve.models ${why} — using ${DEFAULT_IMPROVE_MODELS.join(',')}`)
  return DEFAULT_IMPROVE_MODELS
}

// summarize() reports an arm where nothing replied as null rather than as a
// score. These keep that null intact through the loop's arithmetic and its log
// lines instead of letting `null - 0.7` quietly become -0.7.
const UNMEASURED = 'unmeasured'
const fmt = v => v == null ? UNMEASURED : v
const signed = d => d == null ? UNMEASURED : `${d >= 0 ? '+' : ''}${d.toFixed(3)}`

/**
 * The loop's own KEEP/REVERT comparison, paired by case.
 *
 * The same like-with-like rule the reserve gate has always applied, and for a
 * sharper reason here. Since COS-11 an arm's mean covers only the cells that
 * replied, so a rewrite that makes the model abort a hard case does not merely
 * escape the penalty it used to take — it is measured on the *easier remaining
 * cells* and can score higher for having broken one. Comparing two means over
 * different case sets would let the optimizer adopt a rewrite because it
 * destroyed a case, which is the opposite of what the loop is for.
 *
 * @returns {{delta: number|null, n: number, dropped: string[]}} null delta when
 *   no case produced a reply on both sides — no evidence, so never a KEEP.
 */
function pairedDelta (baselineRows, candidateRows) {
  const { a, b } = comparableRows(baselineRows, candidateRows)
  const dropped = [...new Set([...baselineRows, ...candidateRows].filter(r => !producedReply(r)).map(r => r.caseId))]
  if (!a.length) return { delta: null, n: 0, dropped }
  return { delta: Number((meanTotal(b) - meanTotal(a)).toFixed(3)), n: a.length, dropped }
}

function failureBrief (summary, styleId, transcripts) {
  const fails = summary.failures.filter(f => f.styleId === styleId).slice(0, 10)
  const lines = fails.map(f =>
    `- [${f.checkId}] ${f.describe} — avg ${f.avgScore} on ${f.model}, ${f.n} failing replies\n` +
    f.evidence.map(e => `    evidence: ${e}`).join('\n')
  )

  const judgeNotes = transcripts
    .filter(r => r.styleId === styleId && r.judgeViolations?.length)
    .flatMap(r => r.judgeViolations.map(v => `- [judge/${r.model}/${r.caseId}] ${v}`))
    .slice(0, 8)

  // producedReply, not `r.text`: an aborted cell that got as far as emitting
  // narration has `total` forced to the judge weight (rules 0, judge substituted
  // 1.0), which is below almost any genuine reply, so it would reliably win both
  // slots here and hand the author model a truncated turn to rewrite from.
  // summary.failures is filtered the same way; this is the brief's other input.
  const worst = transcripts
    .filter(r => r.styleId === styleId && producedReply(r))
    .sort((a, b) => a.total - b.total)
    .slice(0, 2)
    // The trace, not the final message: the author model is being shown what the
    // style produced, and on an agentic cell the narration is half of what went
    // wrong. Pre-COS-10 rows have no trace and fall back to their glued text.
    .map(r => `--- ${r.model} / ${r.caseId} (score ${r.total}) ---\n${(r.trace ?? r.text).slice(0, 1200)}`)

  return [
    'MEASURED RULE FAILURES:', lines.join('\n') || '(none)',
    '', 'JUDGE NOTES:', judgeNotes.join('\n') || '(none)',
    '', 'WORST ACTUAL REPLIES:', worst.join('\n\n') || '(none)'
  ].join('\n')
}

/**
 * @param {number} rewriteTimeoutSeconds  matrix.improve.rewriteTimeoutSeconds.
 *   Bounds the query call the same way judge.mjs's judgeTimeoutSeconds bounds
 *   the judge call — see run.mjs's timedTextQuery, which owns the
 *   AbortController and the validation. A stalled author call used to hang
 *   the loop indefinitely; runCell's cell-level guard covers `run`'s cells
 *   only and never wraps this call.
 * @param {(msg: string) => void} [log]  optional, so a timeout is named in the
 *   loop's own output rather than looking identical to "the author had nothing
 *   left to say" — the caller's existing empty-string handling still stops the
 *   loop either way.
 * @param {object} [deps]  queryFn, injectable so the timeout can be tested
 *   against a real wedge-then-abort without spending a model call — the same
 *   seam judge.mjs and runCell use.
 */
export async function rewrite ({ style, brief, model, rewriteTimeoutSeconds, log = () => {}, deps = {} }) {
  const user = [
    `CURRENT STYLE BODY (${style.id}):`, '"""', style.body, '"""',
    '', brief
  ].join('\n')

  const { out, timedOut, error, timeoutMs } = await timedTextQuery({
    name: 'improve.rewriteTimeoutSeconds',
    timeoutSeconds: rewriteTimeoutSeconds,
    prompt: user,
    options: { systemPrompt: AUTHOR_SYSTEM, model, maxTurns: 3, allowedTools: [], settingSources: [], permissionMode: 'dontAsk' },
    // Bare concatenation is correct here, unlike run.mjs: allowedTools is
    // empty, so there is nothing to split the blocks around, and the output is
    // one markdown document that a separator would corrupt — see
    // timedTextQuery, which does the concatenation.
    queryFn: deps.queryFn
  })
  // Named even when the call still produced something: `out` can hold a
  // complete body if the timer fired in the gap between the stream ending and
  // this loop resuming, and the caller's own length check (below, at the call
  // site) is what decides whether that content is usable — this only makes
  // sure a genuine timeout is never silently indistinguishable from "the
  // author had nothing left to say".
  if (timedOut) log(`rewrite call timed out after ${timeoutMs}ms`)
  if (error) return '' // caller treats an empty rewrite as "no more ideas" and stops
  return out.replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```\s*$/, '').trim()
}

export async function improveStyle ({ style, variant, models, cases, contracts, opts, cfg, outDir, log, rows = [], onRows, deps = {} }) {
  // evaluate and rewrite are the loop's only boundaries to the outside world.
  // Injectable so the persistence below can be tested without running a cell.
  const { evaluate: evaluateFn = evaluate, rewrite: rewriteFn = rewrite } = deps
  // Callers pass a shared sink so that a style crashing mid-loop still leaves
  // the cells it already measured in the caller's hands. This loop has crashed
  // a long multi-style run before; the rows must not go with it.
  const start = rows.length
  const mine = () => rows.slice(start)
  const train = cases.filter(c => c.split === cfg.trainSplit)
  const holdout = cases.filter(c => c.split === cfg.holdoutSplit)
  // Guarded on cfg: an older config with no reserveSplit would otherwise match
  // every case that carries no split at all.
  const reserveCases = cfg.reserveSplit ? cases.filter(c => c.split === cfg.reserveSplit) : []
  mkdirSync(outDir, { recursive: true })

  // The incumbent, kept whole. If the reserve rejects the loop's winner this is
  // what the run adopts, so it has to survive the loop intact rather than be
  // reconstructed from history afterwards.
  const incumbent = { text: style.text, body: style.body, train: null, holdout: null, iteration: 0 }
  let best = { ...incumbent }
  const history = []
  let unmeasurableBaseline = false

  // Every cell the loop measures is kept. Without this the loop's transcripts —
  // most of the project's measurement — vanish the moment the process exits:
  // they cannot be re-scored after a check is fixed, and the only record of what
  // the loop observed is a summary number nobody can audit.
  const measure = async (styleText, caseSet, split, iteration) => {
    const r = await evaluateFn({
      styles: [{ id: style.id, text: styleText }],
      variants: [variant], models, cases: caseSet, contracts, opts
    })
    // A row already carries its own `split`; `iteration` is what separates one
    // candidate's rows from the next, and 0 marks the baseline.
    const tagged = r.rows.map(row => ({ ...row, iteration }))
    rows.push(...tagged)
    writeFileSync(join(outDir, `${style.id}.v${iteration}.${split}.json`), JSON.stringify(tagged, null, 2))
    // Flush now, not at the end of the style: Ctrl-C or an OOM part-way through
    // a long run is the ordinary ending, and rows only `score` can read are
    // the ones worth keeping.
    onRows?.(rows)
    return r
  }

  log(`[${style.id}] baseline...`)
  const b0 = await measure(best.text, train, cfg.trainSplit, 0)
  const h0 = await measure(best.text, holdout, cfg.holdoutSplit, 0)
  best.train = incumbent.train = b0.summary.overall
  best.holdout = incumbent.holdout = h0.summary.overall
  // The rows, not just the means. Every later comparison is paired by case
  // against these, so the incumbent has to carry what it was measured on.
  best.trainRows = incumbent.trainRows = b0.rows
  best.holdoutRows = incumbent.holdoutRows = h0.rows
  history.push({ iteration: 0, train: best.train, holdout: best.holdout, kept: true, note: 'baseline' })
  log(`[${style.id}] baseline train=${fmt(best.train)} holdout=${fmt(best.holdout)}`)
  // An unmeasured baseline is the one state this loop cannot recover from: every
  // later iteration is scored as a delta against it, and there is nothing to
  // subtract from. Stop rather than warn — each further pass runs a rewrite call
  // plus a full train arm and a full holdout arm, and `keep` is false by
  // construction, so every one of them is work done on a verdict already decided.
  if (best.train == null || best.holdout == null) {
    log(`[${style.id}] no baseline cell produced a reply on ${best.train == null ? cfg.trainSplit : cfg.holdoutSplit} — ` +
        'nothing can be compared against, stopping before any candidate is measured')
    unmeasurableBaseline = true
  }

  let lastRun = b0
  let sinceKeep = 0

  for (let i = 1; i <= cfg.maxIterations && !unmeasurableBaseline; i++) {
    if (best.train >= cfg.targetScore && best.holdout >= cfg.targetScore) {
      log(`[${style.id}] target ${cfg.targetScore} reached — stopping at iteration ${i - 1}`)
      break
    }
    // Convergence: consecutive rewrites that fail to beat the incumbent mean the
    // optimizer has run out of ideas this brief can express. Stop, don't burn.
    if (sinceKeep >= cfg.patience) {
      log(`[${style.id}] ${sinceKeep} rewrites in a row failed to improve — converged at v${best.iteration}`)
      break
    }

    const brief = failureBrief(lastRun.summary, style.id, lastRun.rows)
    const newBody = await rewriteFn({ style: { ...style, body: best.body }, brief, model: cfg.authorModel, rewriteTimeoutSeconds: cfg.rewriteTimeoutSeconds, log })
    if (!newBody || newBody.length < 200) {
      log(`[${style.id}] iteration ${i}: author returned nothing usable — stopping`)
      break
    }

    const candidateText = renderStyle(style.meta, newBody)
    writeFileSync(join(outDir, `${style.id}.v${i}.md`), candidateText)

    const t = await measure(candidateText, train, cfg.trainSplit, i)
    const h = await measure(candidateText, holdout, cfg.holdoutSplit, i)
    // Paired by case against what the incumbent was measured on, not a
    // difference of two arm means — see pairedDelta.
    const pt = pairedDelta(best.trainRows, t.rows)
    const ph = pairedDelta(best.holdoutRows, h.rows)
    const dTrain = pt.delta
    const dHold = ph.delta
    // An incomparable side is a REVERT, never a KEEP. Both deltas are null when
    // no case replied on both sides, and the alternative is arithmetic on null,
    // which JS reads as 0: an arm that measured nothing would show a delta equal
    // to the other side's score and could be adopted on it.
    const keep = dTrain != null && dHold != null && dTrain > 0 && dHold >= cfg.minHoldoutDelta

    log(`[${style.id}] iter ${i}: train ${fmt(t.summary.overall)} (${signed(dTrain)}) ` +
        `holdout ${fmt(h.summary.overall)} (${signed(dHold)}) -> ${keep ? 'KEEP' : 'REVERT'}`)
    // Named, not just counted. A verdict taken over fewer cases than the split
    // holds is a weaker verdict, and which case vanished is the first thing
    // worth knowing when a rewrite starts winning by breaking things.
    for (const [split, p] of [[cfg.trainSplit, pt], [cfg.holdoutSplit, ph]]) {
      if (p.dropped.length) {
        log(`[${style.id}]   ${split}: compared ${p.n} case(s); ${p.dropped.length} produced no reply on one or both sides ` +
            `and were excluded: ${p.dropped.join(', ')}`)
      }
    }

    history.push({
      iteration: i,
      train: t.summary.overall,
      holdout: h.summary.overall,
      dTrain,
      dHold,
      // The paired comparison is the verdict's actual basis, so it is recorded
      // beside the arm means rather than left to be inferred from them.
      comparedTrain: pt.n,
      comparedHoldout: ph.n,
      droppedCases: [...new Set([...pt.dropped, ...ph.dropped])],
      kept: keep
    })

    if (keep) {
      // Rows travel with the winner: the next iteration pairs against these.
      best = {
        text: candidateText, body: newBody, iteration: i,
        train: t.summary.overall, holdout: h.summary.overall,
        trainRows: t.rows, holdoutRows: h.rows
      }
      lastRun = t
      sinceKeep = 0
    } else {
      // On revert, lastRun deliberately stays where it is, so the next brief
      // describes the incumbent rather than the candidate just discarded: the
      // author is handed best.body to rewrite, and evidence drawn from a
      // rejected candidate would describe text it is not editing. Pinned by
      // "a reverted iteration briefs from the incumbent, not the failed
      // candidate" in test/improve.test.mjs.
      sinceKeep++
    }
  }

  // Validation. The loop has finished arguing with itself; now the candidate it
  // wants to adopt meets cases it has never been measured on in any iteration.
  let reserve = null
  if (best.iteration === 0) {
    // Nothing was kept, so the style is unchanged and there is no claim to test.
    // Not measuring it is the point: the pass exists to guard an adoption.
    log(`[${style.id}] no rewrite kept — nothing to validate`)
  } else if (!reserveCases.length) {
    log(`[${style.id}] WARNING: no ${cfg.reserveSplit ? `${cfg.reserveSplit} cases` : 'reserve split configured'} — ` +
        `v${best.iteration} adopted on the loop's own verdict, unvalidated`)
  } else {
    log(`[${style.id}] validating v${best.iteration} on ${reserveCases.length} reserve cases...`)
    // Both sides measured here and now, on the same cases in the same run.
    // Reusing a reserve number from an earlier run would compare across model
    // drift and case edits, which is the comparison this guard exists to avoid.
    const r0 = await measure(incumbent.text, reserveCases, cfg.reserveSplit, 0)
    const rN = await measure(best.text, reserveCases, cfg.reserveSplit, best.iteration)
    // `summary.overall` averages errored rows in, and an errored row is scored
    // 0 on every rule but 1.0 by the judge (evaluate.mjs substitutes a neutral
    // score rather than calling the judge on empty text). Its `total` is
    // therefore the style's judgeWeight — 0.3 to 0.5 — against a reserve mean
    // nearer 0.65, so each one-sided abort drags that side down by roughly
    // 0.01 at 36 cells. minReserveDelta is -0.02, so two unmatched aborts can
    // flip the verdict on noise that has nothing to do with the rewrite. The
    // gate compares like with like instead: only cases that produced a reply on
    // BOTH sides count, so an abort removes a case from the comparison rather
    // than scoring it.
    const usable = comparableRows(r0.rows, rN.rows)
    const dropped = new Set([...r0.rows, ...rN.rows].filter(x => !producedReply(x)).map(x => x.caseId))
    const baseline = meanTotal(usable.a)
    const candidate = meanTotal(usable.b)
    const delta = Number((candidate - baseline).toFixed(3))
    if (dropped.size) {
      log(`[${style.id}] WARNING: ${dropped.size} reserve case(s) produced no reply on one or both sides and are excluded ` +
          `from the comparison: ${[...dropped].join(', ')}`)
    }
    if (!usable.a.length) {
      log(`[${style.id}] WARNING: no reserve cell produced a reply on both sides — v${best.iteration} cannot be validated`)
    }
    // Without a fallback a missing threshold means `delta >= undefined`, which
    // is false for every candidate: every run would roll back to v0 while
    // logging an ordinary-looking REJECT. Say so rather than fail silently.
    if (cfg.minReserveDelta === undefined) log(`[${style.id}] WARNING: improve.minReserveDelta is not set — using ${DEFAULT_MIN_RESERVE_DELTA}`)
    // No usable cell means no evidence, and no evidence is a rejection: this
    // project's stated asymmetry is that re-running a sound rewrite is cheap and
    // shipping a bad one is not. Accepting here would adopt on a mean of nothing.
    const accepted = usable.a.length > 0 && delta >= (cfg.minReserveDelta ?? DEFAULT_MIN_RESERVE_DELTA)
    reserve = {
      split: cfg.reserveSplit,
      cases: reserveCases.length,
      comparedCells: usable.a.length,
      droppedCases: [...dropped],
      baseline,
      candidate,
      delta,
      accepted,
      iteration: best.iteration
    }
    log(`[${style.id}] ${cfg.reserveSplit}: v${best.iteration} ${candidate} vs v0 ${baseline} ` +
        `(${delta >= 0 ? '+' : ''}${delta}) over ${usable.a.length} comparable cells -> ${accepted ? 'ACCEPT' : 'REJECT'}`)
    if (!accepted) {
      // A rejection is a rollback, not an annotation. best.md is documented as
      // the winner and is the file a reader diffs and copies, so it must hold
      // what survived. The rejected candidate stays at v<N>.md and in history.
      // Falling back to v0 rather than an earlier kept iteration is the only
      // move the evidence supports: reserve was measured for v0 and vN only.
      log(`[${style.id}] v${best.iteration} rejected on ${cfg.reserveSplit} — keeping v0`)
      best = { ...incumbent }
    }
  }

  writeFileSync(join(outDir, `${style.id}.best.md`), best.text)
  // The cell count comes from the rows now on disk, not from a running counter:
  // the number in the log can be recomputed by anyone holding the transcripts.
  const cells = mine().length
  log(`[${style.id}] adopted v${best.iteration}, measured ${cells} cells`)
  return { styleId: style.id, best, history, reserve, cells, rows: mine() }
}
