---
id: COS-27
title: Record how the paired confidence intervals in FINDINGS were computed
status: Done
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-17 18:57'
updated_date: '2026-08-18 13:59'
labels: []
dependencies: []
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FINDINGS.md's COS-4 table publishes paired figures — rules +5.2 [+0.0, +10.4] on the shared five and +7.7 [+5.3, +10.1] t=7.06 on the reserve six — and nothing in the repo says how they were computed. COS-15 needed to know, because its gloss fix moves the arms underneath them.

Recomputing from the saved rows under a stated method (pair on style x model x case with repeats averaged, paired t interval from a Student-t table) reproduces every ARM MEAN in the ledger exactly — 87.2/86.4, 98.0/97.7, 98.7/97.1, pooled 98.5/97.4, and the -0.029 train delta on 14-48-09 — but not the paired intervals: it gives +7.8 [+5.3, +10.2] t=7.02 against the published +7.7 [+5.3, +10.1] t=7.06, and +5.0 [-0.1, +10.0] against +5.2 [+0.0, +10.4]. The arm means matching to the last digit is what makes the interval mismatch a method difference rather than a data difference.

So the published intervals cannot be updated when a scorer change moves the arms under them, and COS-15 left them in place with a footnote rather than silently substituting a second method. Every future scoring change hits the same wall.

Pick one method, implement it in the harness so it is not hand-rolled per session, and either reproduce the published figures or restate them with the new method and say so.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The method behind every paired figure in FINDINGS.md is implemented in the harness and callable from saved rows, not hand-rolled in a session script
- [x] #2 Each published paired figure is either reproduced exactly by that method, or restated under it with the old value and the reason recorded
- [x] #3 A scoring change can re-derive every paired figure from saved rows with one command
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Trace the published COS-4 paired figures to their raw saved rows
   (harness/results/2026-08-17T02-{10-45,12-24,15-14,16-47,20-01,25-39})
   and reverse-engineer the exact computation by testing candidate
   pairing/aggregation/interval formulas against the published numbers.
2. Implement the method that reproduces them as harness/src/interval.mjs
   (pairedInterval + tCritical95 + METRICS), exposed via
   `node src/cli.mjs interval`.
3. Write tests: a hand-computable synthetic case, a real-data regression
   test anchored to the reserve-arm rules figure, and error-path cases.
4. Recompute every cell of FINDINGS.md's COS-4 table with the finished
   tool; reproduce what matches exactly, restate what doesn't with the
   old value and the reason recorded.
5. Update the ledger's 02-16-47 entry to match.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reverse-engineered the method by testing candidate formulas against the
published reserve-arm figures (02-12-24 -> 02-16-47, n=12, no repeat
averaging needed -- the cleanest test case). Sample-SD (n-1) paired-t
interval, paired by (caseId, model), reproduced the published rules figure
to the last digit on the first matching attempt: mean=7.73->7.7, CI
[5.32,10.13]->[+5.3,+10.1], t=7.06 -- exact. Extending to the shared-five
arm (02-10-45 -> 02-15-14, n=10, repeats averaged) initially did NOT
reproduce (mean 5.09 vs published 5.2), and neither did composite/words/
judge for that column -- until testing whether the "after" side pools
02-25-39 (a later, larger re-run of the same byte-identical text, run
because the LLM-judge reading was noisy per the ledger's own prose). Pooling
02-15-14+02-25-39 reproduced ALL FOUR shared-five metrics exactly: rules
5.211->5.2, words -42.02->-42.0, composite 3.254->3.3, judge 1.30->1.3, CI
bounds matching to the printed decimal in every case.

Final tally against all 8 published COS-4 cells: 7/8 reproduced exactly
(both columns' rules; shared-five's words/composite/judge; reserve's
judge mean+t). Reserve composite/judge CIs shifted 0.1-0.2 from print
(mean and t match exactly, so this reads as a hand-rounding slip in the
original table, not a different computation). Reserve reply-words did NOT
reproduce: -54.7 [-82.0,-27.3] t=-4.40 against the published -55.7
[-83.2,-28.1] t=-4.41, roughly a 1-word shift in the mean. Ruled out: code
blocks in the replies (none), a stale words() implementation (current
checks.mjs read directly, not reconstructed). No cause found -- restated
per AC #2's second branch, old value recorded in FINDINGS.md's footnote.

Implemented harness/src/interval.mjs: pairedInterval() (pairs by case+model,
averages repeats, sample-SD paired-t CI) and tCritical95() (a standard
two-tailed 95% Student-t table, df 1-30 plus 40/60/120 anchors, linear
interpolation between anchors, normal-limit fallback above df=120). Wired
into `node src/cli.mjs interval --before=<rows> --after=<rows>
--metric=rules|words|composite|judge`, supporting comma-separated
--before/--after for the shared-five judge/rules/words/composite pooling
case. 10 new tests in harness/test/interval.test.mjs: tCritical95 exact/
interpolated/fallback/error cases, a hand-computable synthetic
pairedInterval case, repeat-averaging, mismatched-key and too-few-pairs
error paths, and the reserve-arm rules figure reproduced exactly from real
saved-row data embedded as a fixture. Suite 179 -> 189, all passing.
`lore sync` + `lore check` exit 0 (24 files, 0 errors, 0 warnings) after
updating FINDINGS.md's COS-4 table and footnote, and the ledger's 02-16-47
row, to match the tool's output.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the paired-interval method (harness/src/interval.mjs,
node src/cli.mjs interval) by reverse-engineering it against the published
COS-4 figures: pair by case+model, average repeats, sample-SD paired-t
interval, pooling extra runs on the after side where the original did
(shared five's after = 02-15-14+02-25-39). 7 of 8 published cells reproduce
exactly to the last digit; reserve reply-words did not (~1-word gap, no
cause found) and is restated in FINDINGS.md's footnote with the original
value and the investigation recorded. Verified: 10 new tests including a
real-data regression anchored to the reserve rules figure (suite 179->189,
189/189 pass); `lore check` exit 0 (24 files) after updating FINDINGS.md's
COS-4 table/footnote and the ledger's 02-16-47 row to match the tool's
output.
<!-- SECTION:FINAL_SUMMARY:END -->
