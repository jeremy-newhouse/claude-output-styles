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
lore_task_status: in-progress
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
discoverable only by reading the code. Asserting the *corrected* value instead
would have been the obvious move and was rejected for that reason: it makes the
suite red on arrival with a failure that names the file and the expected value,
handing `reserve-agentic-session` its answer from one command.
`harness/test/fixture.test.mjs` now enforces all of it — the defect was found by
reading a transcript, not by a check, and nothing else in the suite executes the
fixture.

That difficulty claim is qualified, not absolute: `src/pricing.js` still carries
a literal `BUG:` comment naming the function and the defect, so `grep -rn BUG`
locates it in one command — the same leak that ruled out asserting 850/849, just
in source instead of test output. The marker is deliberate for
`agentic-read-report`, which explicitly asks whether the file has a bug. For
`reserve-agentic-session`, which withholds both the bug and the file on purpose,
it means the remaining difficulty is search, not comprehension: the case still
forces find-and-read over being handed the answer in a prompt, but a maintainer
searching for the word "bug" gets there without reasoning about the arithmetic.

**And a killed run lost every cell it measured — fixed under COS-12.** `run` used
to write `rows.json` only after the whole matrix completed. One session ran a
50-cell arm with that exposure live, and the arms this story requires are an order
of magnitude larger. `run` now re-writes `rows.json`, `summary.json`, `report.md`
and a new `run.json` manifest after every completed cell, each through a
temp-file rename so a kill mid-write cannot truncate the measured data. Verified by
SIGKILLing a real four-cell run after two cells: both survivors re-scored
offline, and `score` prefixed them with `PARTIAL run — 2 cells of 4 expected`.

**And the contract could not say "unless" — fixed under COS-15.** Two style
rules stated a conditional their contract had no field to hold, and both scored.
Beginner says "Never show code **unless they ask**", which parsed to a flat 0,
matched `maxCodeLines: 0`, and was reported as *agreement* while
`code_block_size` scored a requested snippet 0 at weight 2. Beginner also tells
the writer to gloss a term it must keep — "I updated the API (the messenger that
lets two programs talk)" is the file's own worked example — while `no_jargon`
matched the bare term, so following the example cost the heaviest-weighted check
in the contract. The instrument was extended rather than the styles edited: the
gloss is conditioned on the reply, which a check already reads, so `no_jargon`
now grades first use and forgives a gloss; "unless they ask" is conditioned on
the request, which no check can see, so the condition lives in `codeOnRequest` on
the contract and `requestsCode` on the case, and the audit fails a prose
conditional with no matching contract field. Re-scoring all 63 saved runs old
code against new moved 6 of 651 rows, every one a genuine gloss, and no
conclusion. Fixing the guard also exposed a defect in the guard: testing a
`/g`-flagged pattern with `.test()` advanced its `lastIndex`, which `matchAll`
then copied, so the second parse of a file skipped its own opening lines.

**Underneath all five sits a sample-size problem that COS-4 measured.** Per-cell
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

**The judge itself had never been validated — COS-20 did it, and it did not cut
the sample sizes.** Re-judging the 60 saved replies of `12-44-03` three times
each with four model tiers, at no cell cost, splits beginner's 24.6-point
per-cell SD into **10.17 points of judge and 22.58 of reply**. The reply is 83%
of the variance, which is the component more cells buy and repeat-judging cannot
touch, so the arms below stand. What the run did establish is that the judge is
worth choosing deliberately: Sonnet, the configured judge, is the least
repeatable of the four tiers, and a change of judge moves three published
conclusions — see the ledger.

The order matters. Buying precision on a scorer that reads the wrong string,
pools errored rows and grades against a self-contradicting fixture is a large
run spent on nothing.

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
| [COS-15](../../backlog/tasks/cos-15%20-%20Make-the-contract-audit-express-conditional-caps.md) | Make the contract audit express conditional caps | Done |
| [COS-19](../../backlog/tasks/cos-19%20-%20Re-measure-the-four-tier-baseline-at-a-sample-size-its-claims-need.md) | Re-measure the four-tier baseline at a sample size its claims need | To Do |
| [COS-20](../../backlog/tasks/cos-20%20-%20Validate-the-judge-instrument-itself.md) | Validate the judge instrument itself | Done |
| [COS-21](../../backlog/tasks/cos-21%20-%20Re-test-the-variant-sweep-the-reinforcement-ADR-rests-on.md) | Re-test the variant sweep the reinforcement ADR rests on | In Progress |
| [COS-24](../../backlog/tasks/cos-24%20-%20Stop-the-CLI-silently-substituting-defaults-for-malformed-flags.md) | Stop the CLI silently substituting defaults for malformed flags | Done |
| [COS-22](../../backlog/tasks/cos-22%20-%20Harden-the-fixture-guard-COS-13-added.md) | Harden the fixture guard COS-13 added | Done |
<!-- lore:tasks:end -->

## Notes

**Arm size is chosen by statistical power, not by run size.** The user settled
that on 2026-08-17 — everything gets tested — which is what makes this story
tractable: the bars stand and the arms get sized to support them rather than the
other way round.

The working figure is **148 non-errored cells per model on beginner**, which is
what a 95% half-width of ±4 points requires at the components COS-20 measured.
Detecting a real difference *between* two arms takes double: 48 cells per arm for
10 points, 97 for 7, 189 for 5, 295 for 4. COS-20 did not lower these — it
confirmed them to within two cells and added a floor. Judging each cell three
times instead of once takes ±4 from 148 cells to 131, and no number of judge
calls takes it below 123, because the reply is 83% of the variance. Judging is
also not the cheaper buy: a cell costs about one judge call in wall clock and the
crossover is 10.9.

**148 is the cheapest of the three styles, not a project constant.** Under the
same judge, ±4 costs 169 cells on intermediate and 207 on advanced. Any arm this
story sizes has to be sized on the style it measures.

Note what sample size does and does not give you. It narrows an interval; it does
not move a point estimate. Beginner on Sonnet measures 60.9 against a 70% bar
(COS-16, run `19-42-55`, 150 cells; 58.1 at COS-4's 35), and no arm size changes
that — only a better style file will. COS-16 is the worked example in both
directions: re-measuring the same bytes at 150 cells left Sonnet 2.8 points higher
and took Opus 7.1 points lower, from 73.9 to 66.8, which moved Opus from above the
bar to below it. The estimates did not move because the text changed; the
intervals were simply wide enough to contain both readings.

**COS-16 then changed the bytes, and that did not move the estimates either.** The shipped file is now the three-edit candidate (sha256 `86451ddb`), measured at 150 cells a model on both splits (runs `2026-08-20T03-03-26` and `03-13-05`, 0 errored cells). Sonnet still reads 60.9 against the 70% bar and Opus 66.1. All twenty paired intervals — the four pooled metrics on each split, and rules, judge and reply words per model on each split — contain zero. A style edit that removes three self-contradictions moved no score this instrument can detect, which is the same lesson from the other side: at this SD, only a large effect is visible at all.

**The choice of judge does move it, though, and by more than the gap.** COS-20
measured Haiku grading the same beginner replies +18.01 [+12.34, +23.68] above
Sonnet, against a Sonnet-to-bar gap of 11.9 points. The bar is stated against a
judge, not against a reply, and nothing before COS-20 said which. Any re-measure
of beginner has to name the judge model it was scored under, and any comparison
has to hold it fixed.

Size on cells that answer, not cells launched. `reserve-agentic-session` aborts
3 of 6 on Haiku, and an errored cell contributes nothing to an interval, so an arm
must be sized on its expected non-errored yield.

Two figures in this story's Goal were themselves subject to it. The 24.6 SD came
from 70 cells of one style on two models, and the "22 to 32" range quoted
elsewhere is the per-arm spread across six arms of the same task. **COS-20 tested
both across three styles and two generation models and they held**: 24.76 on the
same style-and-judge pairing, and 22.33 to 31.31 across the six style x model
arms. Neither is a general constant even so — both are Sonnet-as-judge figures,
and the three other tiers COS-20 measured span 23.08 to 29.38 pooled. COS-19 is
still what widens them past one saved arm.
