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

import { query } from '@anthropic-ai/claude-agent-sdk'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { evaluate } from './evaluate.mjs'
import { producedReply } from './checks.mjs'
import { parseStyle, renderStyle } from './style.mjs'

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
   re-check its own work. Those compound with the model's own behavior and cost
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

// summarize() reports an arm where nothing replied as null rather than as a
// score. These three keep that null intact through the loop's arithmetic and
// its log lines instead of letting `null - 0.7` quietly become -0.7.
const UNMEASURED = 'unmeasured'
const fmt = v => v == null ? UNMEASURED : v
const delta = (a, b) => (a == null || b == null) ? null : Number((a - b).toFixed(3))
const signed = d => d == null ? UNMEASURED : `${d >= 0 ? '+' : ''}${d.toFixed(3)}`

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

  const worst = transcripts
    .filter(r => r.styleId === styleId && r.text)
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

async function rewrite ({ style, brief, model }) {
  const user = [
    `CURRENT STYLE BODY (${style.id}):`, '"""', style.body, '"""',
    '', brief
  ].join('\n')

  let out = ''
  try {
    for await (const m of query({
      prompt: user,
      options: { systemPrompt: AUTHOR_SYSTEM, model, maxTurns: 3, allowedTools: [], settingSources: [], permissionMode: 'dontAsk' }
    })) {
      // Bare concatenation is correct here, unlike run.mjs: allowedTools is
      // empty, so there is nothing to split the blocks around, and the output is
      // one markdown document that a separator would corrupt.
      if (m.type === 'assistant') for (const b of m.message.content ?? []) if (b.type === 'text') out += b.text
    }
  } catch {
    return '' // caller treats an empty rewrite as "no more ideas" and stops
  }
  return out.replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```\s*$/, '').trim()
}

export async function improveStyle ({ style, variant, models, cases, contracts, opts, cfg, outDir, log, rows = [], onRows, deps = {} }) {
  // evaluate and rewrite are the loop's only boundaries to the outside world.
  // Injectable so the persistence below can be tested without spending anything.
  const { evaluate: evaluateFn = evaluate, rewrite: rewriteFn = rewrite } = deps
  // Callers pass a shared sink so that a style crashing mid-loop still leaves
  // the cells it already paid for in the caller's hands. This loop has crashed
  // a paid multi-style run before; the rows must not go with it.
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

  // Every cell the loop measures is kept. Without this the loop's transcripts —
  // most of the project's spend — vanish the moment the process exits: they
  // cannot be re-scored after a check is fixed, and the only record of what the
  // money bought is a summary number nobody can audit.
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
    // a long paid run is the ordinary ending, and rows only `score` can read are
    // the ones worth keeping.
    onRows?.(rows)
    return r
  }

  log(`[${style.id}] baseline...`)
  const b0 = await measure(best.text, train, cfg.trainSplit, 0)
  const h0 = await measure(best.text, holdout, cfg.holdoutSplit, 0)
  best.train = incumbent.train = b0.summary.overall
  best.holdout = incumbent.holdout = h0.summary.overall
  history.push({ iteration: 0, train: best.train, holdout: best.holdout, kept: true, note: 'baseline' })
  log(`[${style.id}] baseline train=${fmt(best.train)} holdout=${fmt(best.holdout)}`)
  // An unmeasured baseline is the one state this loop cannot recover from: every
  // later iteration is scored as a delta against it, and there is nothing to
  // subtract from. Say so once, here, rather than letting each iteration report
  // an incomparable delta.
  if (best.train == null || best.holdout == null) {
    log(`[${style.id}] WARNING: no baseline cell produced a reply on ${best.train == null ? cfg.trainSplit : cfg.holdoutSplit} — ` +
        'every iteration below is incomparable and nothing can be kept')
  }

  let lastRun = b0
  let sinceKeep = 0

  for (let i = 1; i <= cfg.maxIterations; i++) {
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
    const newBody = await rewriteFn({ style: { ...style, body: best.body }, brief, model: cfg.authorModel })
    if (!newBody || newBody.length < 200) {
      log(`[${style.id}] iteration ${i}: author returned nothing usable — stopping`)
      break
    }

    const candidateText = renderStyle(style.meta, newBody)
    writeFileSync(join(outDir, `${style.id}.v${i}.md`), candidateText)

    const t = await measure(candidateText, train, cfg.trainSplit, i)
    const h = await measure(candidateText, holdout, cfg.holdoutSplit, i)
    const dTrain = delta(t.summary.overall, best.train)
    const dHold = delta(h.summary.overall, best.holdout)
    // An incomparable side is a REVERT, never a KEEP. Both deltas are null when
    // either arm went entirely silent, and the alternative is arithmetic on
    // null, which JS reads as 0: an arm that measured nothing would then show a
    // delta equal to the other side's score and could be adopted on it.
    const keep = dTrain != null && dHold != null && dTrain > 0 && dHold >= cfg.minHoldoutDelta

    log(`[${style.id}] iter ${i}: train ${fmt(t.summary.overall)} (${signed(dTrain)}) ` +
        `holdout ${fmt(h.summary.overall)} (${signed(dHold)}) -> ${keep ? 'KEEP' : 'REVERT'}`)

    history.push({ iteration: i, train: t.summary.overall, holdout: h.summary.overall, dTrain, dHold, kept: keep })

    if (keep) {
      best = { text: candidateText, body: newBody, train: t.summary.overall, holdout: h.summary.overall, iteration: i }
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
  // Spend comes from the rows now on disk, not from a running counter: the
  // number in the log can be recomputed by anyone holding the transcripts.
  const spentUsd = spendOf(mine())
  log(`[${style.id}] adopted v${best.iteration}, spent ${spentUsd.toFixed(2)}`)
  return { styleId: style.id, best, history, reserve, spentUsd, rows: mine() }
}

/** Total cost of a set of persisted rows. The only source of truth for spend. */
export function spendOf (rows) {
  return Number(rows.reduce((a, r) => a + (r.costUsd ?? 0), 0).toFixed(4))
}
