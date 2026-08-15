# Output-style harness

Measures whether Claude actually obeys a Claude Code output style, per model,
and rewrites the style until it does.

Built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/typescript)
(`@anthropic-ai/claude-agent-sdk`). Verified against Claude Code 2.1.233 / SDK 0.3.233.

```bash
npm install
node src/cli.mjs run --styles=plain-english-advanced --models=opus,sonnet
node src/cli.mjs improve --styles=plain-english-advanced --iterations=4
```

## The injection recipe

Getting an output style to load through the SDK is not obvious. Three things
are required together; miss any one and the style is silently dropped with no
error:

```js
options: {
  systemPrompt: { type: 'preset', preset: 'claude_code' },  // required
  settingSources: ['project', 'local'],                     // both, not one
  cwd: workspaceWithDotClaudeOutputStyles                    // style file on disk
}
```

- **`systemPrompt` omitted** → no Claude Code system prompt exists, so there is
  nothing for the style to attach to.
- **`settingSources: ['local']` alone** → the `outputStyle` setting is read but
  the style *file* under `.claude/output-styles/` is never discovered.
- **`settings: { outputStyle: 'X' }`** as an option object → ignored. The value
  must be on disk in `.claude/settings.local.json`.

`src/workspace.mjs` builds a throwaway workspace with all three in place.

## What gets measured

Every reply is scored twice.

**Deterministic checks** (`src/checks.mjs`, 70% of the score) — one function
per rule the style file actually states, so a failure names the broken rule and
quotes the offending text. No model calls, so they are free and never drift:

| check | what it catches |
|---|---|
| `sentence_length` | sentences over the contract's word cap |
| `paragraph_length` | paragraphs over the sentence cap |
| `total_length` | replies over the word cap (scaled, zero at 2x) |
| `no_filler` | leverage, robust, seamless, comprehensive, furthermore, … |
| `no_celebration` | "Excellent!", "You're absolutely right", emoji bullets |
| `no_emoji` | any pictographic character |
| `no_process_narration` | "Let me start by", "First, I'll…" |
| `active_voice` | "was fixed" instead of "I fixed" |
| `code_block_size` | code blocks over the level's line cap (0 = none allowed) |
| `three_question_structure` | what I did / did it work / what you do next |
| `two_options_max` | exactly two options, trade-offs, one recommendation |
| `no_jargon` | level-inappropriate terms from the contract's ban list |
| `leads_with_conclusion` | replies that open with "I'll…" instead of the outcome |

**LLM judge** (`src/judge.mjs`, 30%) — a rubric grader for what regex cannot
see: is the conclusion genuinely first, is the technical level right, did the
tone drift by turn three. Runs with its own system prompt and no tools, so the
judge is not itself under an output style.

## The matrix

`config/matrix.json` crosses four axes:

- **styles** — which style files to test
- **models** — `opus`, `sonnet`, `haiku`
- **variants** — harness-level fixes tested *independently of the style text*,
  so you can tell whether a failure is the wording or the plumbing:
  - `baseline` — what a user gets today
  - `long-prompt` — `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=0`, forcing Claude Code's
    long system prompt (Opus gets an abridged one by default)
  - `tail-reminder` — a one-line restatement of the length rule at the end of
    the style body
  - `claude-md` — the contract restated in `CLAUDE.md`, which Claude Code wraps
    in an explicit override directive and re-injects as a user message
  - `all-fixes` — all three together
- **cases** — `cases/cases.json`. Conversational, agentic (against
  `fixtures/repo`), and one three-turn case that specifically tests drift.

`config/contracts.json` holds the numeric thresholds per style level, so the
same checks grade Beginner and Advanced against different caps.

## The improve loop

`node src/cli.mjs improve` runs:

1. Measure the current style on the **train** cases and the **holdout** cases.
2. Build a failure brief: which rules broke, on which model, with quoted
   evidence, plus the two worst actual replies.
3. Ask a model to rewrite the style body from that brief. The author's system
   prompt encodes Anthropic's Opus 5 guidance — prefer positive examples over
   prohibitions, restate the most-violated rule at the end, delete
   self-verification instructions, avoid "only"/"just", never grow the file.
4. Re-measure. **Keep only if train improves and holdout does not regress**
   past `minHoldoutDelta`. Otherwise revert and brief again from the failure.
5. Stop at `targetScore` or `maxIterations`.

Candidates land in `results/<stamp>/candidates/<style>.v<N>.md`, and the winner
in `<style>.best.md`. Nothing is written back to the real style files — diff and
copy them yourself.

The holdout split is the guard against the rewrite overfitting to the exact
phrasing of the training prompts. Watch the `BY SPLIT` table: train far above
holdout means the last rewrite gamed the checks.

**Noise.** At `repeats: 1` and a handful of cases, one case swings the mean by
~0.03. Treat gaps under about 3 points as noise. Raise `run.repeats` and add
cases before drawing a conclusion from a small difference.

## Offline re-scoring

`run` saves every raw transcript to `results/<stamp>/rows.json`. After editing
`checks.mjs`, re-grade them without spending a token:

```bash
node src/cli.mjs score --rows=results/<stamp>/rows.json
```

## Cost control

`config/matrix.json` → `run.maxBudgetUsd` caps each cell; `run.concurrency`
caps parallelism; `--no-judge` drops the LLM grader. A cell costs roughly
$0.10–0.15 conversational, more when agentic. Cell count is
`styles × variants × models × cases × repeats` — it multiplies fast.
