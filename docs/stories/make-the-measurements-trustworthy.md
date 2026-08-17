---
type: Story
title: Make the measurements trustworthy
tags:
  - measurement
  - evidence
summary: Fix the scorer, then re-establish every published figure at a sample size its claims need
tasks:
  - cos-10
  - cos-11
  - cos-12
  - cos-13
  - cos-15
  - cos-19
  - cos-20
  - cos-21
  - cos-24
  - cos-22
generated:
  by: lore/0.3.0
  at: 2026-08-17T03:50:43.715Z
lore_task_status: todo
---

# Make the measurements trustworthy

## Goal

This project's conclusions are only as good as the instrument that produced
them, and eight sessions have accumulated four known defects in that instrument
plus one measured reason to doubt the sample sizes behind almost every published
judge figure.

**The scorer read the wrong string on agentic cells — fixed under COS-10.**
`run.mjs` accumulated every assistant text block in a turn with no separator, so
pre-tool narration was glued to the answer that followed. `sentence_length` and
`paragraph_length` were unquotable on those cells for every model, and — found
later and worse — the judge read the same concatenated text, so every agentic
judge score in the project measures the whole turn rather than the final message
its rubric asks about. In 16 of 18 `agentic-fix-verify` cells the reply carries
pre-update narration and in all 16 a judge violation quotes it.

`run.mjs` now keeps the blocks in order and saves each turn twice: the full trace
and the final message after the last tool call. Every check declares which of the
two it grades and every agentic case declares which one its judge rubric asks
about — three say "the final message", `agentic-read-report` grades narration and
so reads the whole turn. `sentences()` also splits on a single newline now, so a
list header is no longer merged into its first item.

What the fix cannot do is reach backwards. Gluing is lossy, so every saved
agentic figure still describes the whole turn and is labelled as such in
`FINDINGS.md` and the ledger; replacing one costs a re-run. The newline half *is*
re-derivable, was re-derived across all 61 saved runs, and moves rule totals by at
most 1.50 points — but it moves published sentence-segmentation figures by more
than that, and those were corrected in place.

**Errored cells biased both halves of the score, in opposite directions — fixed
under COS-11.** An empty reply scores 0.0 on every deterministic check and,
because `evaluate.mjs` substitutes `{ score: 1 }` when it skips the judge, a free
100% on the judge. The two did not cancel. One turn-limit abort moved a published
figure from 33.0 to 44.2, and the three aborts inside `22-59-53`'s 26-cell
advanced arm understated its rule compliance by 10.8 points, 94.2 down to 83.4.
`improve`'s adoption gate was fixed
under COS-1; `summarize()`, which every quoted arm mean comes from, now excludes
them too, and every figure states the sample it was taken over.

The exclusion is keyed on whether the cell produced a turn, not on the SDK's
error flag, which closes a second and wider version of the same bias: a cell that
went silent *without* the flag was scored, and scored well — 0.931 on rules for
beginner on `agentic-fix-verify`, because every "no X found" check finds no X,
plus the free judge 1.0. Re-deriving the fix across every saved run corrected one
published conclusion: `14-48-09`'s holdout arm read "rules up, judge down" only
because one of its four v0 cells had aborted.

**The fixture the agentic cases run against contradicted itself — fixed under
COS-13.** It asserted that `applyDiscount(999, 15)` is 850 while its own comment
computed 849, so a model that correctly fixed the rounding bug broke a passing
test and had to decide unaided which to believe. Reading the rest of the fixture
found two more of the same shape, both worse than the one that was reported. The
`priceOrder` assertion expected 966 where the code returns 965 — 966 is what you
get taxing *before* discounting, so the number contradicted the test's own name —
which meant **the suite was red on a clean checkout**, and three of the four
agentic cases ask the model to run it. Every model that did met a failure it had
not caused and that had nothing to do with the bug it was sent to fix. The source
comment naming the bug was self-contradicting too ("yields 670 instead of 670")
and cited a case that does not exhibit the bug at all, since a 33% discount on
1000 cents is exactly 330 under both truncation and rounding. The branch review
then found a fourth, one command earlier still: the fixture had no
`package.json`, and it is copied to the workspace *root* with nothing above it,
so `npm test` — the obvious reading of "run the tests" in a JavaScript repo —
failed with `ENOENT` before any test ran. Only `node --test` worked, and nothing
in the repo said so.

The fix keeps the suite green *both* before and after a correct fix, which is the
invariant that removes the adjudication: no assertion pins the fractional-cent
behaviour any more, so fixing the bug cannot break a test, and the bug stays
discoverable only by reading the code — which preserves the difficulty of
`reserve-agentic-session`, the case that withholds both the bug and the file on
purpose. Asserting the *corrected* value instead would have been the obvious
move and was rejected for that reason: it makes the suite red on arrival with a
failure that names the file and the expected value, handing that case its answer
from one command. `harness/test/fixture.test.mjs` now enforces all of it — the
defect was found by reading a transcript, not by a check, and nothing else in the
suite executes the fixture.

**And a killed run lost every cell it paid for — fixed under COS-12.** `run` used
to write `rows.json` only after the whole matrix completed. One session ran a
$6.64 arm with that exposure live, and the arms this story requires are an order
of magnitude larger. `run` now re-writes `rows.json`, `summary.json`, `report.md`
and a new `run.json` manifest after every completed cell, each through a
temp-file rename so a kill mid-write cannot truncate the paid data. Verified by
SIGKILLing a real four-cell run after two cells: both survivors re-scored
offline, and `score` prefixed them with `PARTIAL run — 2 cells of 4 expected`.

**Underneath all four sits a sample-size problem that COS-4 measured.** Per-cell
judge SD on the shipped beginner text is 24.6 — 24.1 Opus, 22.8 Sonnet — so the
ten-cell arms every per-model judge figure in this project rests on carry 95%
intervals about 30 points wide. The demonstration is not theoretical: beginner on
Sonnet, measured four times on the same five cases with the same style text,
variant and scorer and only the repeat count differing, read 70.7, 65.8, 74.1 and
55.0. A paired judge delta computed at two cells per pair came out at +7.1 and
agreed across two disjoint case sets; at seven cells per pair the same delta is
+1.3, and the session's own first conclusion had to be withdrawn.

Two published results rest on arms smaller than that. The four-tier baseline —
this project's headline table — has twelve judge cells at ten cells each. The
*Reject harness-level reinforcement* ADR is Accepted on **five cells per arm**,
one style, one model, and style text that no longer ships.

**The judge itself has never been validated.** One model, one call per cell, no
separation of judge-call variance from reply variance, and no inter-judge
agreement measured. Doing that first may cut the sample sizes everything else
needs, because judging saved replies is free of generation cost.

The order matters. Buying precision on a scorer that reads the wrong string,
pools errored rows and grades against a self-contradicting fixture would be
expensive and worthless.

## Acceptance criteria

- Each check and the judge score the string its case rubric asks about, and a
  saved row carries both the final message and the full trace.
- No quoted mean pools cells that returned no reply, in either direction.
- A killed run keeps every cell it completed, and the partial file is readable
  and visibly partial.
- The agentic fixture states one arithmetic answer.
- The judge is characterised as an instrument: repeat-judging variance separated
  from reply variance, and agreement with at least two other model tiers
  reported.
- Every published judge figure carries an interval, and the sample size behind it
  is stated rather than implied.
- Every conclusion currently drawn from a ten-cell or five-cell arm is confirmed,
  narrowed, or withdrawn against those intervals.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-10](../../backlog/tasks/cos-10%20-%20Score-the-final-assistant-message-not-the-whole-turn.md) | Score the final assistant message, not the whole turn | Done |
| [COS-11](../../backlog/tasks/cos-11%20-%20Stop-errored-cells-from-biasing-every-score-the-project-quotes.md) | Stop errored cells from biasing every score the project quotes | Done |
| [COS-12](../../backlog/tasks/cos-12%20-%20Flush-run-rows-incrementally-so-a-killed-run-keeps-the-cells-it-paid-for.md) | Flush run rows incrementally so a killed run keeps the cells it paid for | Done |
| [COS-13](../../backlog/tasks/cos-13%20-%20Fix-the-agentic-fixtures-contradictory-assertion.md) | Fix the agentic fixture's contradictory assertion | Done |
| [COS-15](../../backlog/tasks/cos-15%20-%20Make-the-contract-audit-express-conditional-caps.md) | Make the contract audit express conditional caps | To Do |
| [COS-19](../../backlog/tasks/cos-19%20-%20Re-measure-the-four-tier-baseline-at-a-sample-size-its-claims-need.md) | Re-measure the four-tier baseline at a sample size its claims need | To Do |
| [COS-20](../../backlog/tasks/cos-20%20-%20Validate-the-judge-instrument-itself.md) | Validate the judge instrument itself | To Do |
| [COS-21](../../backlog/tasks/cos-21%20-%20Re-test-the-variant-sweep-the-reinforcement-ADR-rests-on.md) | Re-test the variant sweep the reinforcement ADR rests on | To Do |
| [COS-24](../../backlog/tasks/cos-24%20-%20Stop-the-CLI-silently-substituting-defaults-for-malformed-flags.md) | Stop the CLI silently substituting defaults for malformed flags | To Do |
| [COS-22](../../backlog/tasks/cos-22%20-%20Harden-the-fixture-guard-COS-13-added.md) | Harden the fixture guard COS-13 added | To Do |
<!-- lore:tasks:end -->

## Notes

**Budget is not a constraint on this story.** The user settled that on 2026-08-17
("we have to get everything tested - no budget"), which is what makes it
tractable — the bars stand and the arms get sized to support them rather than the
other way round.

The working figure is **146 non-errored cells per model**, which is what a 95%
half-width of ±4 points costs at SD 24.6, about $19 a model-arm at the measured
$0.1297 a cell. Detecting a real difference *between* two arms costs roughly
double: 47 cells per arm for 10 points, 95 for 7, 187 for 5, 291 for 4. COS-20
may lower all of these.

Note what sample size does and does not buy. It narrows an interval; it does not
move a point estimate. Beginner on Sonnet measures 58.1 against a 70% bar, and no
arm size changes that — only a better style file will.

Budget off the worst cell, not the mean. Fable's worst single agentic cell has
cost $1.1315, and `reserve-agentic-session` aborts 3 of 6 on Haiku, so an arm
must be sized on cells that return a reply rather than cells launched.

Two figures in this story's Goal are themselves subject to it. The 24.6 SD comes
from 70 cells of one style on two models, and the "22 to 32" range quoted
elsewhere is the per-arm spread across six arms of the same task. Neither is a
general constant, and COS-19 and COS-20 between them should replace both with
something measured across styles and tiers.
