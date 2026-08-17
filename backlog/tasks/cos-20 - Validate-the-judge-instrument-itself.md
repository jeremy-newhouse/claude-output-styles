---
id: COS-20
title: Validate the judge instrument itself
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:47'
updated_date: '2026-08-17 18:12'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/judge.mjs
  - harness/config/matrix.json
documentation:
  - docs/reference/experiment-ledger.md
  - docs/adr/score-styles-with-deterministic-checks-plus-a-style-aware-judge.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every judge figure in this project comes from one model, Sonnet, called once per cell, with no measurement of how much of the score is the reply and how much is the judge.

Two properties have never been tested:

- **Stability.** The same reply scored twice by the same judge may not get the same number. Nothing in the project separates reply-to-reply variance from judge-call variance, so COS-4's per-cell SD of 24.6 is an upper bound containing both, and the sample sizes derived from it may be larger than they need to be — or the judge may be the larger share, in which case more cells buys less than the arithmetic says and repeat judging of the same reply is the cheaper fix.
- **Agreement.** `judgeModel` is `sonnet` in `matrix.json`. Whether Opus, Haiku or Fable would rank the same replies the same way is unknown. The four-tier baseline already carries the caveat "it is 10 cells per figure, one judge model" without ever testing the second half.

This is cheap relative to what it protects, because judging is free of the generation cost: existing saved replies can be re-judged without re-running a single cell. Every arm in `harness/results/` is available.

There is already one recorded instance of the judge being the problem rather than the reply. Run `21-10-34` "exposed a judge grading against its own taste rather than the style guide", and the prompt was corrected before `21-12-58`. That was found by reading, not by a check.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Judge-call variance is separated from reply variance by re-judging the same saved replies repeatedly, and reported as a share of the 24.6 per-cell SD
- [x] #2 At least two other model tiers judge the same saved arm, and their agreement with Sonnet is reported per style and per case, not only in aggregate
- [x] #3 The sample sizes quoted in the ledger's noise-floor section are recomputed against whichever component dominates, and corrected if the arithmetic changes
- [x] #4 If repeat-judging one reply is cheaper per point of precision than adding cells, the runbook says so and gives the crossover
- [x] #5 Any disagreement large enough to move a published conclusion is named, with the conclusion it would move
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build the missing re-judge path. Nothing re-judged a saved row: `score` re-runs deterministic checks only, and `judge()` is called from evaluate.mjs per live cell. Add src/rejudge.mjs (plan, grade, variance decomposition, agreement, sizing) plus a `judge` subcommand, with tests.
2. Give judge() an `ok` flag so a substituted 0.5 is distinguishable from a real one. A failed call pooled into a variance study reads as the judge disagreeing with itself.
3. Re-judge one saved arm with four tiers x 3 repeats. Arm: 12-44-03, the per-model baseline (60 rows, 3 styles, Opus+Sonnet, 5 cases, 2 repeats).
4. AC #1: one-way random-effects ANOVA splits judge-call variance from reply variance; report against COS-4's 24.6.
5. AC #2: agreement with Sonnet paired per reply, reported per style and per case, never arm mean against arm mean.
6. AC #3: recompute the ledger's noise-floor sample sizes against the dominant component.
7. AC #4: derive the crossover between repeat-judging and adding cells, and measure both costs rather than assuming them.
8. AC #5: check every published conclusion the disagreement could move.
9. Ledger, story, runbook and FINDINGS updated; lore sync; lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## The instrument run

`node src/cli.mjs judge --rows=results/2026-08-16T12-44-03-883Z/rows.json --judges=sonnet,opus,haiku,claude-fable-5[1m] --judge-repeats=3 --concurrency=16`

720 judge calls over the 60 saved replies of `12-44-03`, the per-model baseline. No cell was run. Output: `harness/results/2026-08-17T16-47-17-091Z/` (`judgements.json`, `analysis.json`, `report.md`, `judge.json`, complete: true). Six calls returned unparseable JSON, all Haiku, all on beginner, and are excluded by the `ok` flag rather than pooled as 0.5.

Qualification recorded on every record: the replies are pre-COS-10 rows, so `trace` falls back to the glued turn on `agentic-read-report`; and the style files have been rewritten since the run, so this grades those replies against today's guide. Both are constant across the four judges, so neither reaches the decomposition or the agreement figures. Style SHAs are in `judge.json`.

## AC #1 — the split

Beginner @ Sonnet, the arm COS-4's figure describes: **SD total 24.76, of which judge 10.17 and reply 22.58.** The judge is **16.9% of the per-cell variance and 41% of the per-cell SD**; the reply is the dominant component at 83.1% (ICC 0.831). SD total 24.76 against COS-4's 24.6 is an independent reproduction on a different arm.

Pooled over all three styles: SD total 29.38, judge 10.17, reply 27.56, judge share 0.120.

Per style x generation model under Sonnet, SD total runs 22.33 to 31.31 — the same 22-to-32 range the ledger quotes across COS-4's six arms.

**Sonnet is the noisiest judge of the four tested.** Judge SD 10.17, against Opus 5.49, Haiku 7.29 and Fable 4.18; ICC 0.88 against 0.96, 0.90 and 0.97.

Corroboration from the other direction: the saved Sonnet judge score against a fresh Sonnet mean over the same 60 replies is +0.26 [-4.11, +4.62] in the mean, but MAD 10.81 per reply and one reply 55.7 points apart. Two independent draws at SD 10.17 predict a MAD of 11.5. The whole per-reply difference is judge-call noise.

## AC #2 — agreement

Paired per reply, other judge minus Sonnet, n=60 overall:

- Opus **+2.36 [-1.43, +6.14]**, r 0.858, rho 0.890 — no detectable level shift.
- Haiku **+10.80 [+6.81, +14.78]**, r 0.830, rho 0.831.
- Fable **+6.89 [+3.60, +10.18]**, r 0.887, rho 0.881.

Per style (n=20 each), advanced / beginner / intermediate: Opus +6.32 / +1.82 / -1.07; Haiku +9.05 / **+18.01** / +5.33; Fable +8.88 / +10.25 / +1.53. The disagreement is largest where the score is lowest.

Per case (n=12 each), the outlier is `conv-followup-drift`: Opus +13.33, Haiku +20.42, Fable +13.72, and the rank correlations collapse — Haiku rho **0.007**, Opus 0.280, Fable 0.518. On that one case the four judges do not order the replies the same way at all. Full table in `analysis.json`.

Practical costs, measured on this run: Haiku averaged 59.5s per judge call (median 51.5) against Opus 7.6s, Fable 14.1s and Sonnet 13.9s, and was the only judge to return unparseable output (6 of 180).

## AC #3 — the sample sizes, recomputed

The reply is the dominant component, so the ledger's arithmetic barely moves. Cells per model for a 95% half-width, computed from the measured components rather than a single pooled SD:

| half-width | ledger (SD 24.6) | k=1 | k=2 | k=3 | k=inf |
|---|---|---|---|---|---|
| +/-10 | 24 | 24 | 22 | 21 | 20 |
| +/-7 | 48 | 49 | 45 | 43 | 40 |
| +/-5 | 94 | 95 | 87 | 84 | 79 |
| +/-4 | 146 | **148** | 135 | 131 | **123** |

Between two arms, double: 48 / 97 / 189 / 295 at k=1 against the ledger's 47 / 95 / 187 / 291.

So the published figures were right to within two cells, and the correction is small. What is new is the floor: **no amount of repeat-judging takes a +/-4 arm below 123 cells**, because 83% of the variance is the reply and repeat-judging cannot touch it.

## AC #4 — the crossover, and which side of it this project is on

Variance of an arm mean is (varReply + varJudge/k)/n. Going from k to k+1 judge calls per cell beats spending the same budget on cells only when one cell costs fewer than (k+1)(varReply + varJudge/k)/varJudge - k judge calls. At the measured components that is **10.9 judge calls at k=1**, 14.3 at k=2, 18.1 at k=3.

Measured, not assumed. A conversational Sonnet cell took 5.4-15.1s (mean 10.5s over the five cases of this arm, `results/2026-08-17T17-09-49-361Z`, --no-judge so the figure is generation only). A Sonnet judge call took 6.1s median, 13.9s mean. **One cell costs about one judge call, not eleven.**

**So judge each cell once and buy more cells.** The story's own speculation — that repeat-judging might be the cheaper fix — is refuted: at k=1 to k=2 it buys 13 cells' worth of precision (148 to 135) for the price of 148 extra judge calls, where 13 more cells would cost 13.

The ratio, not the seconds, is the reusable part. It flips where a cell is genuinely expensive against the judge: an agentic cell that runs to the 600s `maxCellSeconds` cap, graded by an Opus judge at 7.6s, is 79 judge calls and well past the crossover. That is a measurement to take on such an arm, not an assumption to carry.

## AC #5 — conclusions the disagreement would move

**Moved: the beginner bar's verdict.** Beginner on Sonnet is published at 58.1 against a 70 bar, a gap of 11.9 points. Haiku's measured level shift on beginner is **+18.01 [+12.34, +23.68]** — the whole interval is wider than the gap. Which model grades the arm decides whether beginner passes. The shift is measured on this arm and the 58.1 on another, so carrying one to the other is an inference; what is measured is that a judge-choice effect larger than the gap exists on this style.

**Moved: the four-tier table's Opus-vs-Sonnet ordering.** Sonnet-generated replies lead under the Sonnet judge (-0.94) and the Opus judge (-1.21); Opus-generated replies lead under Haiku (+2.89) and Fable (+0.79). Two of four judges reverse it. Every delta is inside the noise floor, so the honest reading is that the ordering was never resolvable, and a change of judge flips its sign.

**Moved: advanced vs intermediate.** The gap is 2.7 points under Sonnet, 6.4 under Haiku and 10.0 under both Opus and Fable. The judge choice moves it by 7.3 points, which is larger than the gap Sonnet reports.

**Moved: any per-case conclusion drawn from `conv-followup-drift`.** Rank correlation with Sonnet is 0.007 for Haiku and 0.280 for Opus; the judges are not measuring the same thing on that case.

**Survives: the style ranking.** Advanced > intermediate > beginner holds under all four judges. The intermediate-to-beginner gap — the one large gap in the table — is 25.2 points under Sonnet, 22.4 Opus, 16.5 Fable, 13.0 Haiku: it narrows under every other judge but never closes or reverses.

**Correction to the AC #4 timings above.** The 10.5s figure is the mean over all five cases of `results/2026-08-17T17-09-49-361Z`, which includes `agentic-read-report` at 14.0s. The conversational-only mean is **9.6s** over four cases (5.4, 12.4, 5.5, 15.1). Stated both ways because a Sonnet judge call is 6.1s median and 13.9s mean over 180 calls, so a cell is 0.7 to 1.6 judge calls whichever statistic is picked — the conclusion does not turn on the choice, and the crossover is 10.9 either way. The docs and the commit message carry the corrected figures.

## Branch review

`/code-review high` returned seven findings, all real, all fixed in `6e3ba30`. Two mattered.

**Data loss.** `judge --judgements=<path>` rewrote `report.md` in the directory it was handed with no check on the file. `--rows` and `--judgements` are adjacent in the usage text and take paths of the same shape from the same directory; handed a run's `rows.json`, every record filtered out (rows carry no `ok`) and an empty judge report landed on that run's adherence report, reported only as "5 of 5 judge calls returned no parseable score". `assertJudgements()` now refuses before the first write — verified on a copy of `17-09-49`, report.md byte-identical afterwards, and no stray results directory created.

**A wrong figure, published.** The re-derive path defaulted the reference judge to `matrix.run.judgeModel` rather than the reference the run was measured against, so re-deriving a non-Sonnet run silently produced a different analysis, mislabelled it, and overwrote the correct one beside a `judge.json` that still named the real reference. It reads `judge.json` now. Underneath it, `analyzeJudgements` fell back to `perJudge[0]` when the reference had no records, which titled a sizing table "sonnet as judge" over Opus's numbers. No fallback now; the CLI refuses a reference outside `--judges` before spending a call.

Also fixed: an unmeasured judge x style pair rendered as a real 0.00 on every partial report; `noRubric`/`filtered` skip counts were computed and never printed; the style-body loop called `loadStyle` on every contract so `judge` died with a bare ENOENT over a style the rows never mention; and a `process.exit(0)` that could truncate a piped report.

**Self-review, before the agent returned**, found one the agent then confirmed independently: the sizing table was built on the pooled decomposition across all styles, which puts the gap *between* styles into the reply component — 27.56 points against beginner's 22.58 — and asked for 208 cells where the arm needs 148. Sized per style now, and the docs say which style their figures are for. That in turn found that beginner is the cheapest of the three: +/-4 is 169 cells on intermediate and 207 on advanced, corrected in the ledger, the runbook, FINDINGS.md and both stories.

**Sabotage-verified.** Eight mutations, one per guard this task added, each applied by exact-string replacement with the mutated line printed and its presence in the file asserted before the suite ran. All eight go red on the test that names them, and the suite is green when restored. The first pass found a real gap this way: removing `ok: false` from judge.mjs's unparseable-output return left the suite green, because the rejudge tests inject a fake judge and never reach judge.mjs's own returns. `judge()` now takes the `queryFn` seam `runTurn` already had, and a test drives all four substituted-score paths.

**Arithmetic verified independently.** The headline decomposition was recomputed from `judgements.json` with arithmetic that imports nothing from `rejudge.mjs`: SD judge 10.17, SD reply 22.58, SD total 24.76, judge share 0.169, and Haiku-minus-Sonnet on beginner +18.01 [12.34, 23.68]. Identical to the tool's output to the last digit.

Final gates: `npm --prefix harness test` **159/159** (was 135), `node src/cli.mjs audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Characterised the judge as an instrument, and built the path that made it possible.

**The missing tool came first.** Nothing in the harness could re-judge a saved row: `score` re-runs deterministic checks only, and `judge()` was reachable only from `evaluate.mjs`, once per live cell. New `harness/src/rejudge.mjs` and a `judge` subcommand plan, grade, decompose and report, with `--judgements` re-deriving a finished run offline for nothing. `judge()` gained an `ok` flag because its four substituted scores all sit inside the range real scores occupy, and a substituted 0.5 pooled into a variance study reads as the judge disagreeing with itself.

**The run**: `results/2026-08-17T16-47-17-091Z`, 720 judge calls over the 60 saved replies of `12-44-03`, four judge tiers, three repeats each. No cells.

**AC #1** — one-way random-effects ANOVA on beginner under Sonnet, the pairing COS-4's 24.6 came from: SD total **24.76 = 10.17 judge + 22.58 reply**. The judge is 16.9% of the variance and 41% of the SD; ICC 0.831. Reproducing 24.6 on a different arm, and the six style x model arms spanning 22.33-31.31 against the ledger's quoted 22-to-32, confirm both published figures rather than replacing them.

**AC #2** — Opus +2.36 [-1.43, +6.14], Haiku +10.80 [+6.81, +14.78], Fable +6.89 [+3.60, +10.18], paired per reply and reported per style and per case. Rank agreement 0.83-0.89 overall, collapsing to 0.007 on `conv-followup-drift`.

**AC #3** — the reply dominates, so the sizes moved by at most two cells: 24/49/95/148 per model on beginner, 48/97/189/295 between arms. Corrected in place, with a floor the old arithmetic could not express: repeat-judging touches only the judge's 17%, so +/-4 never falls below 123 cells. And beginner is the cheapest style, not the constant — 169 on intermediate, 207 on advanced.

**AC #4** — the crossover is 10.9 judge calls per cell, and both sides were measured rather than assumed: a conversational Sonnet cell 9.6s mean, a Sonnet judge call 6.1s median and 13.9s mean. A cell is 0.7 to 1.6 judge calls. **Judge once and buy cells** — the opposite of what the task expected. The runbook carries the formula, the measurement and the one case that flips it.

**AC #5** — four conclusions are judge-dependent: beginner's verdict against its 70 bar (gap 11.9 points, Haiku's shift +18.01 [+12.34, +23.68]); the four-tier table's Opus-vs-Sonnet ordering, which flips sign between judges on deltas under 3 points; the advanced-to-intermediate gap, 2.7 under Sonnet and 10.0 under Opus and Fable; and anything from `conv-followup-drift`. The style ranking survives all four judges.

**Verification.** Every AC rests on the run's saved records, not on reading code. The headline decomposition was recomputed with arithmetic importing nothing from the module under test and matched to the last digit. Eight sabotage mutations, one per guard, each printed and confirmed present before the suite ran, all eight red on the intended test. `/code-review high` returned seven findings, all real, all fixed — including one that overwrote a run's report when `--judgements` was pointed at a `rows.json`. Suite **135 -> 159**; `audit` exit 0; `lore check` exit 0.

`judgeModel` deliberately left at `sonnet` despite being the least repeatable tier, with the reason recorded in `matrix.json`: every published judge figure was scored by it.
<!-- SECTION:FINAL_SUMMARY:END -->
