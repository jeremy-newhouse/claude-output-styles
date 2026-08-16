# Output-style harness

Measures whether Claude actually obeys a Claude Code output style, per model,
and rewrites the style until it does.

Built on the [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/typescript)
(`@anthropic-ai/claude-agent-sdk`). Verified against Claude Code 2.1.233 / SDK 0.3.233.

```bash
npm install
node src/cli.mjs run --styles=plain-english-advanced --models=opus,sonnet
node src/cli.mjs improve --styles=plain-english-advanced --iterations=4
node src/cli.mjs audit
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
  `fixtures/repo`), and multi-turn cases that specifically test drift. Each case
  carries a `split`: `train`, `holdout`, or `reserve` (see below).

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
   past `minHoldoutDelta`. Otherwise discard the candidate and brief the next
   iteration from the incumbent again — the author is always asked to rewrite
   the style that is currently winning, so the evidence it gets has to describe
   that same text.
5. Stop at `targetScore` or `maxIterations`.
6. **Validate the winner on the reserve split** before presenting it. See below.

Candidates land in `results/<stamp>/candidates/<style>.v<N>.md`, and the winner
in `<style>.best.md`. Nothing is written back to the real style files — diff and
copy them yourself.

An improve run leaves the same artifacts a `run` does: `rows.json`,
`summary.json`, and `report.md` at `results/<stamp>/`, holding every cell the
loop measured. Each row carries the `iteration` that produced it — 0 is the
baseline — and each iteration's cells are also written separately as
`candidates/<style>.v<N>.<split>.json`. Reverted iterations are kept too: the
rewrites that failed are the record of what the money bought. Rows are flushed
after every measurement, so interrupting a long run still leaves everything it
paid for readable. The run's total spend is the sum of those rows, not a side
counter, so any number the loop reports can be recomputed from the files it left
behind.

**An improve `report.md` is not a scorecard.** It pools the baseline with every
candidate the loop tried and rejected, so its headline is their mean and belongs
to no style. The file says so at the top, `summary.json` carries
`kind: "improve"`, and the honest reading is the by-iteration table, which is
keyed by style so a multi-style run does not blend two traces into one.

## Three splits, not two

Cases are split three ways. The optimizer sees two of them:

| split | who uses it | what it is for |
|---|---|---|
| `train` | the loop, every iteration | the failure evidence the rewrite is authored from |
| `holdout` | the loop, every iteration | tuning signal — catches a rewrite overfitting to the exact phrasing of the training prompts |
| `reserve` | **nobody, until the end** | the verdict — measured once, on the candidate the loop wants to adopt |

**Two splits were not enough, and this is measured rather than assumed.** Train
and holdout are drawn from the same small pool, written by the same author in
the same session. A rewrite can satisfy both and still degrade on prompt shapes
neither split contains. Two candidates that won both in-loop splits were then
run on cases the optimizer had seen in no split: the advanced candidate came in
**6.8 points worse out of sample** while its deterministic rules stayed flat and
its judge score collapsed. Full numbers in `rejected/README.md` and the
reasoning in
`docs/adr/validate-candidates-on-cases-held-out-of-every-split.md`.

So the loop's own verdict is not the run's verdict:

- The reserve pass runs **only when a rewrite was actually kept**. If every
  candidate reverted, the style is unchanged and there is nothing to validate,
  so nothing is spent on it.
- It measures the **incumbent and the winner on the same cases in the same run**.
  Comparing against a reserve number from an earlier run would fold in model
  drift and case edits — the exact confound this guard exists to remove.
- If the candidate comes in below the incumbent by more than `minReserveDelta`,
  it is **rejected and rolled back**: `<style>.best.md` holds the incumbent, the
  console headline says `REJECTED`, and the rejected rewrite stays at
  `<style>.v<N>.md`. A rejection is a rollback, not a footnote — `best.md` is
  the file you diff and copy, so it has to hold what survived.
- Rollback goes to **v0**, not to an earlier kept iteration. The reserve was
  measured for v0 and the winner only, so v0 is the only alternative the
  evidence actually supports.
- With no reserve cases configured, an adopted candidate is reported as
  `NOT MEASURED — unvalidated`. That is deliberately not the same thing as
  passing.

`minReserveDelta` is as tight as `minHoldoutDelta` (−0.02) even though the noise
section below puts the noise floor near 3 points, so it can fire on noise. That
asymmetry is intended: rejecting a sound rewrite costs a re-run, adopting a bad
one ships a regression.

The pass costs one extra measurement round per adopting style — the reserve
cases twice, once per side. Nothing is adopted without paying it.

Reserve rows land in `rows.json` like any other, tagged with the iteration they
validate (`v0` for the incumbent, `v<N>` for the candidate), so the comparison
can be re-scored offline.

Read those splits from the **by-iteration** table, not `BY SPLIT`. On an improve
run `BY SPLIT` pools every iteration, so its `train` and `holdout` rows average
the baseline together with every candidate the loop tried and threw away, while
its `reserve` row holds only v0 and the winner. The three are not measured over
the same versions and comparing them across an improve run says nothing. On a
plain `run` they are comparable, and there train far above holdout means the
style is tuned to the training prompts.

**Noise.** At `repeats: 1` and a handful of cases, one case swings the mean by
~0.03. Treat gaps under about 3 points as noise. Raise `run.repeats` and add
cases before drawing a conclusion from a small difference.

This bites the reserve hardest, because it is the smallest split — four cases,
measured once per side. At `repeats: 1` a single case moves the reserve mean far
more than `minReserveDelta`, so the pass is a floor and not a proof: it reliably
catches a collapse of the size that motivated it (6.8 points), and it can miss a
small real regression or reject a sound candidate on a coin flip. Raise
`run.repeats` for a rewrite you intend to ship, and grow the reserve. Treating
`ACCEPT` as "measured to be no worse" overstates what four cases can say.

## Offline re-scoring

`run` and `improve` both save every raw transcript to
`results/<stamp>/rows.json`. After editing `checks.mjs`, re-grade them without
spending a token:

```bash
node src/cli.mjs score --rows=results/<stamp>/rows.json
```

With no `--rows`, `score` re-grades the newest run of either kind. Re-grading an
improve run adds the `BY ITERATION` table and the same trace warning, so a
scoring change can be replayed across the whole optimization rather than one
snapshot of it.

## Auditing a style file against its contract

A style file states its caps in prose; `config/contracts.json` states them as
numbers. Nothing connected the two, and they diverged: contracts graded beginner
at 15 words and 3 sentences per paragraph against a file that said 20 and 4, so
every beginner run was scored against a rule no reader of the style could see.

```bash
node src/cli.mjs audit     # exit 1 on any disagreement
```

Against that divergence it prints:

```
style file vs contract
  FAIL plain-english-beginner     maxSentenceWords       file says 20, contracts.json grades at 15
  FAIL plain-english-beginner     maxParagraphSentences  file says 4, contracts.json grades at 3
  ok   plain-english-beginner     maxUpdateWords         both say 80
  ...
2 of 12 checks need attention
```

It reports every field rather than stopping at the first, so one run tells you
the whole extent of the drift.

The same comparison runs in `test/contract-audit.test.mjs`, so `npm test` fails
on drift too. Recognised phrasings, one per contract field:

| field | prose |
|---|---|
| `maxSentenceWords` | "sentences under _N_ words" |
| `maxParagraphSentences` | "paragraphs under _N_ sentences" |
| `maxUpdateWords` | "the whole update/reply under _N_" |
| `maxCodeLines` | "code/diffs/snippet under _N_ lines", or "never show code" for 0 |

**Unrecognised phrasing fails as `unstated` rather than passing.** A style file
that states a cap some other way is a gap in the guard, and the guard says so
instead of quietly checking three fields where it used to check four. Two
different numbers for one cap, or prose that both bans code and sizes it, report
as `ambiguous`. Add the phrasing to `PATTERNS` in `src/contract-audit.mjs` when a
style legitimately needs a new one.

Run it after editing a style file or a contract — those are the two moments the
pair can drift. After adopting an optimizer candidate too; see the adopt step in
`docs/runbooks/measure-and-optimize-an-output-style.md` for why that one bites.

**It compares numbers, not conditions.** Beginner's file says "Never show code
*unless they ask*", and the guard reads that as a flat 0 because that is all
`maxCodeLines` can express. `code_block_size` then scores 0 for any code block at
weight 2, whether or not the user asked — so on a prompt that requests a snippet,
beginner follows its own style file and takes the heaviest penalty in its
contract while `audit` reports "both say 0". The conditional half of a rule is
invisible to both instruments. Treat a clean audit as "the numbers agree", not as
"the file and the contract mean the same thing".

## Cost control

`config/matrix.json` → `run.maxBudgetUsd` caps each cell; `run.concurrency`
caps parallelism; `--no-judge` drops the LLM grader. A cell costs roughly
$0.10–0.15 conversational, more when agentic. Cell count is
`styles × variants × models × cases × repeats` — it multiplies fast.

Probe on Haiku to decide whether an experiment is worth running, but do not
conclude from it. A tighter sentence cap moved Haiku a lot and Opus and Sonnet
not at all, because the cap sat under what Haiku already wrote and above what the
other two did (`docs/reference/experiment-ledger.md`, runs `22-18-53` and
`22-27-15`). Measure the baseline on the target model before believing a probe.
