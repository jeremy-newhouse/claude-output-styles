import { query } from '@anthropic-ai/claude-agent-sdk'
import { buildWorkspace } from './workspace.mjs'

/**
 * Split one turn's assistant blocks into the two strings a scorer can ask for.
 *
 * A conversational turn is one text block, so both views are the same string and
 * the distinction is free. An agentic turn is text, tool, text, tool, text:
 * pre-tool narration and the answer are separate messages the user reads as
 * separate messages, and gluing them with `+=` produced "I'll look first.The bug
 * is ..." — a run-on that `sentences()` and `paragraphs()` cannot split and that
 * the judge graded as if it were the answer.
 *
 * - `trace` is everything the model said this turn, blocks joined by a blank
 *   line. Narration is visible, which is what the narration rules are about.
 * - `final` is the message the turn ended on: the text blocks after the last
 *   tool call. If the turn ended ON a tool call there is no such block, and the
 *   last thing the model actually said is the honest answer — falling back to
 *   the trace would re-glue exactly what this function exists to separate, and
 *   falling back to '' would score 1.0 on every "no X found" check.
 *
 * @param {Array<{type:string,text?:string,name?:string}>} blocks  in emission order
 * @returns {{ trace: string, final: string }}
 */
export function splitTurn (blocks) {
  const texts = blocks.filter(b => b.type === 'text').map(b => b.text ?? '')
  const lastTool = blocks.map(b => b.type).lastIndexOf('tool_use')
  const after = lastTool === -1
    ? texts
    : blocks.slice(lastTool + 1).filter(b => b.type === 'text').map(b => b.text ?? '')
  const join = xs => xs.map(s => s.trim()).filter(Boolean).join('\n\n')
  return {
    trace: join(texts),
    final: join(after.length ? after : texts.slice(-1))
  }
}

/** Collect the assistant's visible text for one turn, plus telemetry. */
async function runTurn ({ prompt, ws, env, model, opts, resume, controller, queryFn = query }) {
  const blocks = []
  let sessionId = null
  let result = null
  const toolCalls = []
  let thrown = null

  try {
    for await (const m of queryFn({
      prompt,
      options: {
        cwd: ws,
        model,
        // REQUIRED: without the preset there is no Claude Code system prompt,
        // so the output style has nothing to attach to and is silently dropped.
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        // REQUIRED: both sources. 'local' alone reads the outputStyle setting but
        // never discovers the style file under .claude/output-styles/.
        settingSources: ['project', 'local'],
        permissionMode: 'bypassPermissions',
        env: { ...process.env, ...env },
        maxTurns: opts.maxTurns,
        abortController: controller,
        ...(resume ? { resume } : {})
      }
    })) {
      if (m.type === 'assistant') {
        for (const b of m.message.content ?? []) {
          // Order across the whole turn, not just within one message: splitTurn
          // needs to know which text came after the last tool call.
          if (b.type === 'text') blocks.push({ type: 'text', text: b.text })
          if (b.type === 'tool_use') { blocks.push({ type: 'tool_use', name: b.name }); toolCalls.push(b.name) }
        }
      } else if (m.type === 'result') {
        result = m
        sessionId = m.session_id
      } else if (m.type === 'system' && m.session_id) {
        sessionId = m.session_id
      }
    }
  } catch (err) {
    // Everything the model had already said this turn is in `blocks`, and
    // letting the exception past this point threw it away. An abort ends the
    // stream one of two ways — a throw or a quiet close — and only the quiet
    // one kept the partial reply, so a cell that narrated "Let me check the
    // tests first." and then wedged came back either with that fragment and a
    // real score, or with nothing at all, depending on SDK internals. The
    // fragment is also the one diagnostic an operator has for tuning
    // maxCellSeconds: it says what the model was doing when it was stopped.
    //
    // The error is returned rather than rethrown; runCell's loop already breaks
    // on a turn that carries one, and that path builds a complete row.
    thrown = String(err.message ?? err)
  }

  return {
    ...splitTurn(blocks),
    sessionId,
    toolCalls,
    // Did the SDK deliver a result message, or did the stream just stop? This is
    // the only signal that separates a turn that genuinely finished from one an
    // abort closed quietly, and `runCell` needs it to decide whether a timer
    // that fired actually cut anything short.
    completed: result !== null,
    numTurns: result?.num_turns ?? 0,
    error: thrown ?? (result?.is_error ? (result.subtype ?? 'error') : null)
  }
}

/** setTimeout's 32-bit signed ceiling, past which a delay silently becomes 1ms. */
const MAX_TIMER_MS = 2147483647

/**
 * The cell timeout in milliseconds, or a throw naming the bad value.
 *
 * Validated rather than defaulted. A missing key would otherwise reach
 * setTimeout as NaN, which fires on the next tick — turning the guard into a
 * machine that aborts every cell in the matrix instantly and calls each one a
 * timeout. Failing loudly is the only reading of that state anyone can act on.
 *
 * Exported so the CLI can run it once, next to where `opts` is built, instead
 * of leaving the first failure to surface per cell: under `improve` a per-cell
 * throw is caught by the per-style handler and filed as a style failure, so a
 * config typo reads like an optimizer crash; under `run` it lands as an
 * unhandled rejection after an empty `results/<stamp>/` already exists.
 * `runCell` still checks, as the backstop for direct callers such as the tests.
 */
export function cellLimitMs (maxCellSeconds) {
  const ms = Number(maxCellSeconds) * 1000
  if (!Number.isFinite(ms) || ms <= 0) {
    throw new Error(`maxCellSeconds must be a positive number — got ${maxCellSeconds}`)
  }
  // The high end fails the same way the low end does, and less obviously.
  // setTimeout takes a 32-bit signed delay: anything past 2147483647 ms logs a
  // TimeoutOverflowWarning and is set to 1 ms. Measured — a limit of 999999999
  // seconds fires after 2 ms. So the one edit an operator would make to "turn
  // the guard off" produces exactly the runaway this function exists to
  // prevent: every cell in the matrix aborted on the next tick, every row
  // labelled error_timeout, and a green run as far as any completeness check
  // can tell. There is no value here worth accepting silently.
  if (ms > MAX_TIMER_MS) {
    throw new Error(`maxCellSeconds must be at most ${MAX_TIMER_MS / 1000} — got ${maxCellSeconds}. setTimeout truncates a longer delay to 1ms, which would abort every cell instantly.`)
  }
  return ms
}

/**
 * Run one cell of the matrix: (style x variant x model x case x repeat).
 * Returns the transcript entry that the scorer consumes.
 *
 * A wall-clock timeout bounds the cell. It is the only hard stop the SDK
 * offers: `maxTurns` bounds tool rounds but not the time spent inside one, and
 * `taskBudget` is advisory — the model is told its remaining tokens and asked
 * to pace itself, which is exactly what a wedged loop will not do. The timer
 * covers the whole cell rather than each turn, so a multi-turn case cannot
 * quietly run for N times the configured limit.
 *
 * `timedOut` is the authority on why the cell ended, not the thrown error:
 * aborting mid-stream can either throw or end the iterator quietly, and the
 * quiet path would otherwise return a scoreable row with no reply in it.
 *
 * @param {object} [deps]  query, injectable so the timeout can be observed
 *   actually firing. A guard nobody has watched fail is not evidence.
 */
export async function runCell ({ styleId, styleText, variant, model, caseDef, repeat, opts, deps = {} }) {
  const { query: queryFn = query } = deps
  // Before the workspace is built, so a bad config cannot leave a directory
  // behind on its way out. The CLI checks the same value once at startup.
  const limitMs = cellLimitMs(opts.maxCellSeconds)
  const wsp = buildWorkspace({ styleText, variant })
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, limitMs)
  // Started with the timer rather than at the top of the function, so the number
  // recorded on the row measures the same window the guard bounds. Comparing an
  // `elapsedMs` that included the workspace build against `maxCellSeconds` would
  // be comparing two different spans.
  const startedAt = Date.now()
  // Declared outside the try so the catch can still see the turns that finished.
  // Aborting mid-stream either throws or ends the iterator quietly, and with
  // `turns` scoped to the try the throwing path returned empty arrays: a
  // multi-turn case whose turns 1 and 2 completed and whose turn 3 wedged lost
  // both transcripts, while the quiet path kept them. Same event, two different
  // rows, decided by SDK internals.
  const turns = []
  const base = { styleId, variantId: variant.id, model, caseId: caseDef.id, split: caseDef.split, repeat }
  try {
    const prompts = caseDef.multiTurn ?? [caseDef.prompt]
    let resume

    for (const p of prompts) {
      const t = await runTurn({ prompt: p, ws: wsp.dir, env: wsp.env, model, opts, resume, controller, queryFn })
      turns.push(t)
      resume = t.sessionId ?? resume
      if (t.error || timedOut) break
    }

    // The timer having fired is not by itself proof the cell was cut short. It
    // can land in the gap between the SDK delivering the last chunk and this
    // loop resuming — a cell that finishes at 599.9s of a 600s limit. Stamping
    // that row `error_timeout` drops a complete, fully scoreable measurement out
    // of every mean on the strength of a few milliseconds, which is the same
    // class of loss as grading a cell that said nothing.
    //
    // A turn is only trusted here if the SDK closed it with a result message.
    // `!t.error` alone would not do: the quiet abort path returns a turn with no
    // error and no reply, which is the case the `timedOut` flag was added for.
    const last = turns.at(-1)
    const ranEverything = turns.length === prompts.length && last.completed && !last.error
    const cutShort = timedOut && !ranEverything

    return {
      ...base,
      // Style adherence is judged on the LAST turn: that is where drift shows.
      // Two views of it are saved, and each check and each case rubric names the
      // one it grades — see CHECKS[].reads and caseDef.judgeOn. `text` is the
      // final message because that is what most rubrics ask about; a row with no
      // `trace` key predates this and carries the glued whole turn in `text`.
      text: turns.at(-1).final,
      trace: turns.at(-1).trace,
      allTurns: turns.map(t => t.trace),
      allFinals: turns.map(t => t.final),
      toolCalls: turns.flatMap(t => t.toolCalls),
      elapsedMs: Date.now() - startedAt,
      error: cutShort ? 'error_timeout' : (turns.find(t => t.error)?.error ?? null)
    }
  } catch (err) {
    // Reached only by something outside runTurn now that runTurn catches its
    // own abort — a workspace or scoring fault, not a model call. Kept because
    // it is the difference between one bad cell and a dead run, and it still
    // reports whatever turns finished before it.
    return {
      ...base,
      // '' because no turn object exists for whatever failed here. The turns
      // that did complete are below, exactly as on the ordinary path.
      text: '',
      trace: '',
      allTurns: turns.map(t => t.trace),
      allFinals: turns.map(t => t.final),
      toolCalls: turns.flatMap(t => t.toolCalls),
      elapsedMs: Date.now() - startedAt,
      error: timedOut ? 'error_timeout' : String(err.message ?? err)
    }
  } finally {
    clearTimeout(timer)
    // Measured on a real 3s-limit cell: one `claude` subprocess outlives this
    // call holding the just-unlinked workspace as its cwd, and is gone by two
    // seconds later. No workspace leaks (the count returns to baseline
    // immediately) and cells never share a directory, so the window is visible
    // but inert. Waiting for the child would cost every timed-out cell that
    // delay for no measured gain.
    wsp.cleanup()
  }
}

/** Bounded-concurrency map. Keeps the matrix from stampeding the API. */
export async function pool (items, limit, fn) {
  const out = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      out[idx] = await fn(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return out
}
