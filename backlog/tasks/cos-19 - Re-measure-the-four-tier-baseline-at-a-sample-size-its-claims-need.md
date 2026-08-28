---
id: COS-19
title: Re-measure the four-tier baseline at a sample size its claims need
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:47'
updated_date: '2026-08-28 14:00'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
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
  - docs/stories/make-the-measurements-trustworthy.md
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
- [x] #2 The table carries an interval on every judge figure, not a bare point estimate
- [x] #3 Each conclusion currently drawn from the table is re-checked against the intervals and either confirmed, withdrawn, or restated as a hypothesis
- [x] #4 The pre-3370e4d contamination is retired: no published judge figure for beginner or intermediate still comes from a run whose judge was told a sentence cap the style file never stated
- [x] #5 Costs are recorded per arm and the ledger's total is updated
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm scope by reading the current four-tier table (FINDINGS.md ~L264-462) and the ledger. Findings: beginner is already at 150 cells/model on every tier (COS-16/17), clean of the pre-3370e4d judge-cap defect. Advanced/intermediate Opus+Sonnet are already at 150 cells (COS-18, run 2026-08-20T12-12-10), also clean. The ONLY cells still at n=10 are advanced x Haiku, advanced x Fable, intermediate x Haiku, intermediate x Fable (from runs 22-59-53 and 23-48-45, both 9h after the 3370e4d fix landed -- clean of AC #4's contamination, just underpowered for AC #1's n>=146).
2. AC #4 is therefore already satisfied for every cell that still stands in the live table -- the contaminated cells (12-44-03's Opus/Sonnet judge halves) were already superseded by COS-16/17/18. Verify this explicitly (run timestamps vs 3370e4d's 13:14 UTC landing) and state it in the task notes and FINDINGS rather than re-running anything for it.
3. Measure the 4 remaining cells at the project's established n=150 (5 shared cases x 30 repeats), same shared five cases as COS-17/18 (agentic-read-report, conv-explain-cache, conv-followup-drift, conv-status-auth, conv-status-holdout), baseline variant, current shipped style bytes:
   a. plain-english-advanced x haiku
   b. plain-english-advanced x claude-fable-5[1m]
   c. plain-english-intermediate x haiku
   d. plain-english-intermediate x claude-fable-5[1m]
   Probe 2 cells per arm first (pacing rule), then commit the full 150-cell arm. Record wall-clock + non-errored count per arm as it lands via --append-notes.
4. AC #2 needs a single-sample 95% CI (mean +/- t*(SD/sqrt(n))) on every judge figure in the table, not the paired before/after delta the project already has in interval.mjs (pairedInterval). Add a small single-sample interval function (reusing tCritical95) to src/interval.mjs, exposed via the existing `interval` CLI subcommand as a single-rows-file mode, with a matching case in the harness test suite.
5. AC #3: re-read every conclusion paragraph in the four-tier section (the clean split, "Haiku is last every time", the 15-28pt beginner-advanced spread, etc.) against the new intervals; confirm, withdraw, or restate each as a hypothesis explicitly in FINDINGS.md.
6. AC #5: record cost per arm (from usage.mjs / run.json if it carries cost, else token counts) and correct the ledger's running total by counting rows.json files on disk, the same method COS-18/21 used.
7. Update FINDINGS.md's four-tier table and prose, docs/reference/experiment-ledger.md, and any doc-linked story via lore (never hand-edit docs/). Run harness tests, lore check, self-review the diff before opening the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Probed 2 cells on all four target arms (advanced x haiku, advanced x fable, intermediate x haiku, intermediate x fable) using conv-status-auth + agentic-read-report, 1 repeat each. All 8 probe cells non-errored. Proceeding to full 150-cell arms (5 shared cases x 30 repeats), one at a time.

Arm 1/4 done: advanced x haiku, run 2026-08-28T02-58-38-491Z. 150/150 cells, 0 errored, complete:true. 13m45s wall clock (02:58:38Z start to 03:12:23Z per file mtime), ~10.9 cells/min. Arm means: rules 96.6, judge 57.1 (down from the 10-cell baseline's rules 96.0 / judge 52.9 -- directionally consistent, both clean of the pre-3370e4d contamination since that baseline ran at 22:59 same day as the 3370e4d fix). Launching arm 2/4: advanced x fable.

Correction to the arm 1 note above: both rules (96.6 vs 96.0) and judge (57.1 vs 52.9) went UP relative to the 10-cell baseline, not down. Directionally consistent with the pattern in the rest of the table (larger samples generally read higher here).

Arm 2/4 (advanced x fable, run 2026-08-28T03-13-14-527Z) hit repeated session-limit errors: 45 of 150 cells errored (all on conv-status-holdout tail + all of conv-followup-drift), 105 non-errored -- below AC #1's n>=146 floor. User directed (2026-08-28) to skip further Fable measurement rather than keep re-hitting the session limit. Scope decision: advanced x fable and intermediate x fable stay at insufficient sample for this task; will document as a known gap in FINDINGS/AC #1 rather than block the rest of COS-19. Proceeding with intermediate x haiku (last measurable arm) and the tooling/doc work.

Arm 3/4 done: intermediate x haiku, run 2026-08-28T13-31-38-172Z. 150/150 cells, 0 errored, complete:true. ~11m43s wall clock, ~12.8 cells/min. All three measurable arms (advanced x haiku, intermediate x haiku, and advanced x fable at its degraded 105/150) are now on disk. Fable arms excluded from further attempts per user direction (2026-08-28) after repeated session-limit errors. Moving to AC #2's single-sample interval tooling next.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Raised 10 of 12 four-tier cells to n=150 non-errored (advanced/intermediate x haiku this session, joining beginner's full row and advanced/intermediate x opus/sonnet from COS-16/17/18). AC #1 is unchecked: advanced x Fable and intermediate x Fable remain at their original n=10 -- two attempts to raise them hit repeated session-limit errors on claude-fable-5[1m] (one, run 2026-08-28T03-13-14-527Z, got 105/150 before the user directed stopping), and the user approved closing this out with a follow-up (COS-34, linked to this story) rather than keep re-hitting the limit.

AC #2: added singleSampleInterval to harness/src/interval.mjs (a 95% Student-t interval on one run's own mean, reusing tCritical95), wired through `interval --rows=` in cli.mjs, tested in interval.test.mjs and args.test.mjs. Every judge figure in FINDINGS.md's four-tier table now carries one.

AC #3: re-checked every conclusion in FINDINGS.md's four-tier section against the new data. Two were withdrawn/restated: (1) "beginner's rules beat advanced on three tiers of four" no longer holds once advanced's own 150-cell Sonnet/Opus figures (COS-18) are used instead of its old ten-cell ones -- it's parity, 2 of 4 each way. (2) The "clean split" (which models rank intermediate above advanced on the judge) held on Sonnet and Opus at 150 cells but collapsed on Haiku -- a 9.3-point gap at n=10 read as 1.6 points with heavily overlapping CIs at n=150. Both corrections applied to FINDINGS.md, the epic doc, and the story doc via lore.

AC #4: confirmed every cell the live table currently carries -- including the two still-underpowered Fable cells -- comes from a run measured after 3370e4d landed (13:14 UTC 2026-08-16). No re-measurement was needed for this AC; the contamination was already fully retired from the table, just never stated as such in one place. Documented in FINDINGS.md's "judge column carries a defect" section.

AC #5: recorded per-arm cell counts and wall-clock in docs/reference/experiment-ledger.md (458 attempted cells this session: 8 probes + 2 clean 150-cell arms + 1 degraded 105/150 Fable attempt). Disk-counted rows.json across harness/results/: 9866 rows in 118 directories. Flagged (not resolved, per this doc's own established practice) that COS-21's legs 2-3 (~1500 cells) were never logged in this ledger table -- that gap is COS-21's, not COS-19's, and backfilling it is out of scope here.

Verification: 223/223 harness tests pass (4 new), lore check exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
