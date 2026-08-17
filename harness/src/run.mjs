import { query } from '@anthropic-ai/claude-agent-sdk'
import { buildWorkspace } from './workspace.mjs'

/**
 * Split one turn's assistant blocks into the two strings a scorer can ask for.
 *
 * A conversational turn is one text block, so both views are the same string and
 * the distinction costs nothing. An agentic turn is text, tool, text, tool, text:
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
async function runTurn ({ prompt, ws, env, model, opts, resume }) {
  const blocks = []
  let sessionId = null
  let result = null
  const toolCalls = []

  for await (const m of query({
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
      maxBudgetUsd: opts.maxBudgetUsd,
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

  return {
    ...splitTurn(blocks),
    sessionId,
    toolCalls,
    costUsd: result?.total_cost_usd ?? 0,
    numTurns: result?.num_turns ?? 0,
    error: result?.is_error ? (result.subtype ?? 'error') : null
  }
}

/**
 * Run one cell of the matrix: (style x variant x model x case x repeat).
 * Returns the transcript entry that the scorer consumes.
 */
export async function runCell ({ styleId, styleText, variant, model, caseDef, repeat, opts }) {
  const wsp = buildWorkspace({ styleText, variant })
  try {
    const prompts = caseDef.multiTurn ?? [caseDef.prompt]
    const turns = []
    let resume

    for (const p of prompts) {
      const t = await runTurn({ prompt: p, ws: wsp.dir, env: wsp.env, model, opts, resume })
      turns.push(t)
      resume = t.sessionId ?? resume
      if (t.error) break
    }

    return {
      styleId,
      variantId: variant.id,
      model,
      caseId: caseDef.id,
      split: caseDef.split,
      repeat,
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
      costUsd: turns.reduce((a, t) => a + t.costUsd, 0),
      error: turns.find(t => t.error)?.error ?? null
    }
  } catch (err) {
    return { styleId, variantId: variant.id, model, caseId: caseDef.id, split: caseDef.split, repeat, text: '', trace: '', allTurns: [], allFinals: [], toolCalls: [], costUsd: 0, error: String(err.message ?? err) }
  } finally {
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
