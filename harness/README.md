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
- **models** — `opus`, `sonnet`, `haiku`. `run`'s list only: `improve` has its
  own (`improve.models`) and never reads this one, so a model added here is one
  extra pass of the matrix rather than one pass per optimizer iteration. Fable is
  still out of it by choice, on run length rather than on that coupling. Pass it
  explicitly, and quote it — the `[1m]` is a glob pattern in most shells:
  `--models='claude-fable-5[1m]'`. There is no bare `fable` alias.
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

The loop runs `matrix.improve.models`, not `matrix.models`, so the quick-start
line above is safe to copy without `--models`: its size is set by the
`improve` block alone and cannot grow when a model is added for `run`. Every arm
runs across that whole list — two arms for the baseline, two per iteration
(train and holdout), two more at the reserve gate, so 16 at `maxIterations: 6` —
which makes adding a tier there a much larger commitment than adding one to the
matrix. `--models` still overrides it for a single loop; `--models` with nothing
in it is an error rather than a silent fall-back, since a flag that was passed
and ignored would run the full list under a log line naming the config. A config
with no usable `improve.models` warns and falls back to the smallest tier alone,
rather than silently inheriting `run`'s.

Candidates land in `results/<stamp>/candidates/<style>.v<N>.md`, and the winner
in `<style>.best.md`. Nothing is written back to the real style files — diff and
copy them yourself.

An improve run leaves the same artifacts a `run` does: `rows.json`,
`summary.json`, `report.md` and `run.json` at `results/<stamp>/`, holding every
cell the loop measured. Each row carries the `iteration` that produced it — 0 is the
baseline — and each iteration's cells are also written separately as
`candidates/<style>.v<N>.<split>.json`. Reverted iterations are kept too: the
rewrites that failed are the record of what the loop tried. Rows are flushed
after every measured split, so interrupting a long loop leaves everything it
measured readable except the split in flight. Its `run.json` carries no expected
cell count, because how many iterations the loop runs is not known until it stops.
The run's cell count is derived from those rows, not a side counter, so any number
the loop reports can be recomputed from the files it left behind.

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
  so it does not run at all.
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
asymmetry is intended: rejecting a sound rewrite means a re-run, adopting a bad
one ships a regression.

The pass adds one extra measurement round per adopting style — the reserve
cases twice, once per side. Nothing is adopted without it.

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
running a single new cell:

```bash
node src/cli.mjs score --rows=results/<stamp>/rows.json
```

With no `--rows`, `score` re-grades the newest run of either kind. Re-grading an
improve run adds the `BY ITERATION` table and the same trace warning, so a
scoring change can be replayed across the whole optimization rather than one
snapshot of it.

`score` prints one line about the file before any figure, read from the
`run.json` beside it:

- `complete run — 78 cells` — the whole matrix ran.
- `PARTIAL run — 12 cells of 78 expected (66 never ran)` — the process died
  partway. The rows are real and fully scored; they describe the cells that
  survived and not the matrix that was asked for.
- `no run manifest beside these rows — completeness unknown` — a run saved
  before COS-12 added the manifest, or a `rows.json` copied out of its directory.

That line goes to **stdout, with the tables**, not to stderr beside the progress
chatter — `npm run score > figures.txt` has to carry the qualifier along with the
numbers it qualifies. A partial `report.md` carries the same sentence as a
blockquote under its title, for the same reason: since COS-12 a killed run leaves
a report behind, and an unlabelled one reads exactly like a finished arm.

Partial files are ordinary input: `score` reads them, exits 0, and says what it
read. What it will not do is let a half-finished arm be quoted as a whole one.

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

**Every agentic figure saved before COS-10 is measured on a glued turn.** Until
COS-10, `runTurn` accumulated the assistant's visible text with `text += b.text`.
A conversational turn has one text block, so nothing happened. An agentic turn
has several, split around the tool calls, and they were concatenated with no
separator — a saved transcript reads `"I'll look at the file first.The bug is in
..."`. `sentences()` requires whitespace after the full stop to split and
`paragraphs()` requires a blank line, so the run-on scored as one long sentence
in one paragraph. Measured across four models, a no-whitespace seam appears in 0
of the 131 cells that made no tool call and in most of those that did; on Fable's
`agentic-fix-verify`, where the model made ten tool calls per cell,
`paragraph_length` reads 16.7 and is measuring this, not the style. The judge was
handed the same string, so every agentic judge score saved before COS-10 grades
the whole turn against a rubric that asks about the final message: across the 18
`agentic-fix-verify` cells in `00-44-03` and `00-48-49`, 16 carry pre-update text
and in **all 16** a judge violation quotes it.

COS-10 fixed the seam. `runTurn` now keeps the blocks in order and `splitTurn`
derives two strings from them — `trace`, every block joined by a blank line, and
`final`, the blocks after the last tool call. Each check declares which one it
grades in `CHECKS[].reads` and each case names the one its rubric asks about in
`judgeOn`. Both are the same string on a conversational turn.

**The fix does not reach backwards.** The glue is lossy, so a row saved before
COS-10 cannot be re-split: `score` serves its `text` as both views and prints how
many rows and how many agentic cells are affected. Every agentic figure in
`FINDINGS.md` and the experiment ledger therefore still describes the glued turn,
and is labelled there. Replacing one means re-running the cells, not re-scoring
them. `leads_with_conclusion`, `total_length` and the abort counts were never
affected — the first reads the genuine opening text, the second counts words, the
third does not depend on segmentation — and neither is any conversational figure.

**Every agentic figure saved before COS-13 is also measured on a fixture whose
test suite failed on arrival.** `fixtures/repo` is copied into every workspace,
and three of the four agentic cases ask the model to run its tests. Until COS-13
the suite was red on a clean checkout — `priceOrder` asserted 966 where the code
returns 965 — so a model that ran the tests met a failure it had not caused and
that was unrelated to the rounding bug. A second assertion pinned the buggy value
(850) while its own comment computed the fixed one (849), so correctly fixing the
bug broke a passing test and the model had to adjudicate. A third, one command to
the left: the fixture carried no `package.json`, and it is copied to the
workspace *root* with nothing above it, so `npm test` failed with `ENOENT`
before any test ran — only `node --test` worked. COS-13 removed all three: the
suite is green before *and* after a correct fix, no assertion pins the
fractional-cent behaviour so the bug stays discoverable only by reading the code,
and the fixture now ships a `package.json` so the command the cases actually ask
for works. This does not reach backwards either — the fixture shapes what the model
did, not how it was scored, so no re-score can undo it. Replacing an affected
figure means re-running the cells. Note the difference from the paragraph above:
the seam was a scoring artifact, so it could be pinned to the checks that
re-segment and the rest declared clear. This one changed the session the model
had, so on a cell that met it any check can move, the judge included. It is
bounded by reach instead — conversational cases never touch the repo.

**A cell that said nothing is excluded from every mean, automatically.** This
used to be a discipline — *filter `!row.error` before quoting anything* — and
three sessions had to remember it, one of which forgot and published four wrong
figures. Since COS-11 `summarize()` does it, so `report.md`, `summary.json`,
`score` and the optimizer's own comparisons all read the same way.

What it protects against: a cell that returns no text scores 0 on every rule
*and* 1.0 on the judge — `evaluate.mjs` substitutes `{ total: 0, checks: [] }`
for the rules and skips the judge call, substituting `{ score: 1 }`. The two
biases run in opposite directions and do not cancel. One turn-limit abort in
`01-03-21` moved that run's `agentic-fix-verify`-on-Opus judge from 33.0 to 44.2.
In `22-59-53`, the three aborts that landed in the 26-cell advanced arm
understated its rule compliance by 10.8 points — 94.2 down to 83.4. (That run
aborted six cells in all; the other three sit in the intermediate and beginner
arms, which move 92.3 → 85.2 and 86.6 → 83.3 on their own aborts. Attributing
all six to the advanced figure would overstate what three cells did.)

**Two predicates in `checks.mjs`, because these are two questions.**

`hasTurnText(row)` — is there anything to grade? Grade whenever there is, even a
turn an abort cut short: that score is real, and `rows.json` is what every
offline re-derivation reads. Overwriting a measurement with a fabricated 0 to
express "do not trust this" destroys data that `error` already flags.

`producedReply(row)` — may this row go into a mean? Stricter: `!error &&
hasTurnText`. A truncated turn is a *fragment* of a reply, and pooling it
measures how far the model got before the harness stopped it, not how well the
style was followed.

Both read the **turn, not the error flag.** The zero above comes from the guard,
not from the checks: `scoreDeterministic` on an empty string returns 0.931 for
beginner on `agentic-fix-verify`, because every "no X found" check finds no X. A
cell that returned no text *without* the SDK reporting an error would therefore
have scored near-perfect on rules and taken the free 1.0 on top. That combination
has still never been seen in a saved run — all twelve silent cells across the 41
saved runs had the flag set — and the live path and the `score` path, which
previously used different tests, now apply the same two.

A cell that narrated and then ended on a tool call has an empty *final message*
but a real turn: measurable behaviour, and it stays in the mean.

**Every figure states its own sample.** Each group in `summary.json` carries `n`
(cells behind `score`/`rules`/`judge`), `dropped`, and `cells` (the arm as
requested); `report.md` renders all three as columns, and the console tables
print `n=` with a `dropped=k/N` suffix when they differ. An arm where nothing
replied reports `null`, and both renderers print `n/a` rather than `0.0%` — "we
could not measure this" must never publish as "it failed every rule".

`dropped` is not the manifest's "never ran": a dropped cell ran, and may even
have been graded — it is excluded from the mean. A cell that never ran is one the
matrix asked for and the run did not reach.

**The optimizer compares paired, not pooled.** Because an arm's mean now covers
only the cells that replied, a rewrite that makes the model abort a hard case
would otherwise be measured on the easier remaining cells and could score higher
for having broken one. `improve`'s KEEP/REVERT pairs candidate against incumbent
by case id and drops any case that failed to reply on either side — the same rule
the reserve gate has always used, now applied to the loop's own verdict. Each
iteration logs which cases it dropped, and `improve.json` records
`comparedTrain`/`comparedHoldout` beside the arm means.

## Keeping a run bounded

`config/matrix.json` → `run.maxCellSeconds` bounds each cell; `run.concurrency`
caps parallelism; `run.maxTurns` bounds tool rounds; `--no-judge` drops the LLM
grader. Cell count is `styles × variants × models × cases × repeats` — it
multiplies fast, and **every axis you do not name on the command line takes its
full default.** Omitting `--variants` alone runs five variants instead of one;
that turned a one-cell model-id probe into a five-cell one under COS-7.

**The pool grew to 15 cases under COS-1, and two of the new ones are agentic.**
A bare `node src/cli.mjs run` takes every default axis, so those two cases add
2 × 3 styles × 5 variants × 3 models × 2 repeats = **180 cells**, half of them
agentic and therefore the slowest kind. `improve` runs them too: the `reserve`
split is now 6 cases, so an adopting style validates over 36 cells a side instead
of 24. Name `--cases` and `--variants` unless you mean the lot.

Relative cell size, measured on the five shared cases: a conversational cell is
the unit, a read-only agentic cell is roughly twice one, and a write-then-verify
cell — `agentic-fix-verify` — is **about 4.8× a conversational cell** on the top
tier. The `long-prompt` variant is a separate multiplier of roughly 3.9× over the
baseline variant.

Every one of those ratios is **within** a model, which is what makes them
derivable from the cost figures this project used to record: same per-token
price on both sides, so a cost ratio is a size ratio. **Nothing here supports a
cross-tier comparison.** Per-token prices differ by roughly the same factor as
the per-cell costs did, so the old table's ~10× between the smallest and largest
model is explained by price alone and implies nothing about token counts. Use
`elapsedMs` on the rows for cross-tier sizing; it is the only measurement the
harness takes that means the same thing on every model.

`run.maxCellSeconds` is the runaway guard **for a cell**, and it is a wall-clock
ceiling enforced by an `AbortController`. It is the only hard stop the SDK
offers: `maxTurns` bounds tool rounds but not the time spent inside one, and the
SDK's `taskBudget` merely tells the model how many tokens it has left and asks
it to pace itself — advisory, and no use against the wedged loop a guard exists
for. A cell that trips it comes back with `error: "error_timeout"` and is
excluded from every mean, like any other errored cell.

**It does not bound a run.** The judge call in `judge.mjs` and the rewrite call
in `improve.mjs` take no `abortController` and no timeout, so either one
stalling mid-stream hangs the run with nothing to stop it — `runCell`'s guard
has already returned and cleared its timer by then. That gap predates the guard:
the `maxBudgetUsd` ceiling it replaced never covered those two calls either. It
is COS-26, kept as its own issue rather than folded into the change that
narrowed this wording.

600 is a backstop, not a tuned figure. Every row now carries `elapsedMs`, the
wall-clock span the guard actually bounds, so the ceiling can be lowered against
measured durations once a run has produced them. Nothing in the harness recorded
a cell duration before that field existed, so no earlier figure supports a
tighter value.

Probe on Haiku to decide whether an experiment is worth running, but do not
conclude from it — and **re-measure the probe's own baseline before you explain
its result.** A four-cell probe reported that a tighter sentence cap moved Haiku
a lot; the validation found nothing on Opus or Sonnet, and a later 25-cell run
found Haiku's untightened baseline sitting right where the probe's "improved" arm
landed, so there was no movement left to explain. Two rounds of mechanism were
written for an effect that a larger sample of the same configuration dissolved
(`docs/reference/experiment-ledger.md`, runs `22-18-53`, `22-27-15`, `22-59-53`).
Re-scoring saved rows needs no new cells; use it before believing a probe.

**Killing a run no longer forfeits it.** `run` used to write `rows.json` once, at
the end, so a long arm that died at the last cell returned nothing for all the
work it had done. It now re-writes the run directory after every completed cell,
so an interrupted arm keeps everything except the cell in flight. (`improve`
flushes on the same writer but per measured split, as it has since COS-3, so a
killed improve loses the split in flight.) The cell or split in flight is still
gone — flushing recovers completed transcripts, not the interrupted one — so the
surest way to avoid repeating work remains naming your axes before you start.
