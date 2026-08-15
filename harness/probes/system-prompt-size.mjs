// Confirms CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT actually swaps the system prompt.
import { query } from "@anthropic-ai/claude-agent-sdk";
const ask = "Reply with ONLY a number: how many top-level '# ' markdown headings are in your system prompt?";
for (const v of ["1", "0"]) {
  let t = "";
  for await (const m of query({ prompt: ask, options: {
    model: "opus", maxTurns: 1, allowedTools: [], settingSources: [],
    systemPrompt: { type: "preset", preset: "claude_code" },
    env: { ...process.env, CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT: v } } })) {
    if (m.type === "assistant") for (const b of m.message.content ?? []) if (b.type === "text") t += b.text;
  }
  console.log(`SIMPLE_SYSTEM_PROMPT=${v} -> headings: ${t.trim().slice(0,60)}`);
}
