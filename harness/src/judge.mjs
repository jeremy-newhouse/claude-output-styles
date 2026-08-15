// LLM rubric judge for the parts no regex can see: is the conclusion actually
// first, is the technical level right, did the tone drift. Runs with a custom
// system prompt and no tools, so the judge is not itself under an output style.

import { query } from '@anthropic-ai/claude-agent-sdk'

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

export async function judge ({ text, caseDef, contract, model, styleBody }) {
  if (!caseDef.judge || !text) return { score: 1, violations: [] }

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
  try {
    for await (const m of query({
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
        permissionMode: 'dontAsk'
      }
    })) {
      if (m.type === 'assistant') for (const b of m.message.content ?? []) if (b.type === 'text') out += b.text
    }
  } catch (err) {
    // A judge failure must never kill a run that costs dollars. Score neutral
    // and say so, so the row is visibly untrusted rather than silently wrong.
    return { score: 0.5, violations: [`judge call failed: ${String(err.message ?? err).slice(0, 120)}`] }
  }

  const m = /\{[\s\S]*\}/.exec(out)
  if (!m) return { score: 0.5, violations: ['judge returned unparseable output'] }
  try {
    const parsed = JSON.parse(m[0])
    return {
      score: Math.max(0, Math.min(1, Number(parsed.score) || 0)),
      violations: (parsed.violations ?? []).slice(0, 4).map(String)
    }
  } catch {
    return { score: 0.5, violations: ['judge returned invalid JSON'] }
  }
}
