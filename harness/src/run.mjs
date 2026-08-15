import { query } from '@anthropic-ai/claude-agent-sdk'
import { buildWorkspace } from './workspace.mjs'

/** Collect the assistant's visible text for one turn, plus telemetry. */
async function runTurn ({ prompt, ws, env, model, opts, resume }) {
  let text = ''
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
        if (b.type === 'text') text += b.text
        if (b.type === 'tool_use') toolCalls.push(b.name)
      }
    } else if (m.type === 'result') {
      result = m
      sessionId = m.session_id
    } else if (m.type === 'system' && m.session_id) {
      sessionId = m.session_id
    }
  }

  return {
    text: text.trim(),
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
      text: turns.at(-1).text,
      allTurns: turns.map(t => t.text),
      toolCalls: turns.flatMap(t => t.toolCalls),
      costUsd: turns.reduce((a, t) => a + t.costUsd, 0),
      error: turns.find(t => t.error)?.error ?? null
    }
  } catch (err) {
    return { styleId, variantId: variant.id, model, caseId: caseDef.id, split: caseDef.split, repeat, text: '', allTurns: [], toolCalls: [], costUsd: 0, error: String(err.message ?? err) }
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
