---
id: COS-19
title: Re-measure the four-tier baseline at a sample size its claims need
status: To Do
assignee: []
created_date: '2026-08-17 03:47'
labels: []
dependencies:
  - COS-10
  - COS-11
  - COS-12
  - COS-13
references:
  - harness/config/matrix.json
  - harness/src/judge.mjs
documentation:
  - FINDINGS.md
  - docs/reference/experiment-ledger.md
  - docs/epics/plain-english-output-styles.md
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every per-model judge figure this project has published rests on a ten-cell arm. COS-4 measured what that means: per-cell judge SD is 24.6 on the shipped beginner text — 24.1 Opus, 22.8 Sonnet — so a ten-cell arm carries a 95% interval about 30 points wide.

The demonstration is not theoretical. Beginner on Sonnet, measured four times on the same five cases with the same style text, same variant and same scorer, and only the repeat count differing, read 70.7, 65.8, 74.1 and 55.0. A paired judge delta computed at two cells per pair came out at +7.1 and agreed across two disjoint case sets; at seven cells per pair the same delta is +1.3. Two authoring passes were declared statistically identical on that basis, and the session's own first conclusion had to be withdrawn.

The four-tier table in `FINDINGS.md` is the project's headline result and twelve of its cells are ten-cell arms. Several conclusions rest on gaps inside the error bars — "Haiku is last every time", the claim that Opus and Fable rank advanced above intermediate while Haiku and Sonnet do the reverse (already labelled a hypothesis), and the 15-to-28-point beginner-to-advanced spread. Some of those will survive; the point is that at present nobody can say which.

The rules column is not in question. Deterministic per-cell variance is small and those figures are stable; this is about the judge.

Sequence this after the instrument fixes. Re-measuring on a scorer that hands the judge the whole turn, pools errored cells and reads a contradictory fixture would buy precision on the wrong quantity.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every judge cell in the four-tier table is measured at n >= 146 non-errored cells per style x model, which is what a 95% half-width of +/-4 points costs at the measured SD
- [ ] #2 The table carries an interval on every judge figure, not a bare point estimate
- [ ] #3 Each conclusion currently drawn from the table is re-checked against the intervals and either confirmed, withdrawn, or restated as a hypothesis
- [ ] #4 The pre-3370e4d contamination is retired: no published judge figure for beginner or intermediate still comes from a run whose judge was told a sentence cap the style file never stated
- [ ] #5 Costs are recorded per arm and the ledger's total is updated
<!-- AC:END -->
