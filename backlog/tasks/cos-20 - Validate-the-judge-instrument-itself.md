---
id: COS-20
title: Validate the judge instrument itself
status: To Do
assignee: []
created_date: '2026-08-17 03:47'
labels: []
dependencies: []
references:
  - harness/src/judge.mjs
  - harness/config/matrix.json
documentation:
  - docs/reference/experiment-ledger.md
  - docs/adr/score-styles-with-deterministic-checks-plus-a-style-aware-judge.md
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
- [ ] #1 Judge-call variance is separated from reply variance by re-judging the same saved replies repeatedly, and reported as a share of the 24.6 per-cell SD
- [ ] #2 At least two other model tiers judge the same saved arm, and their agreement with Sonnet is reported per style and per case, not only in aggregate
- [ ] #3 The sample sizes quoted in the ledger's noise-floor section are recomputed against whichever component dominates, and corrected if the arithmetic changes
- [ ] #4 If repeat-judging one reply is cheaper per point of precision than adding cells, the runbook says so and gives the crossover
- [ ] #5 Any disagreement large enough to move a published conclusion is named, with the conclusion it would move
<!-- AC:END -->
