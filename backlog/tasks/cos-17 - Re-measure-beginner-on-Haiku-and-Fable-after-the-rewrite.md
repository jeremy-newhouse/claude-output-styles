---
id: COS-17
title: Re-measure beginner on Haiku and Fable after the rewrite
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:46'
updated_date: '2026-08-27 13:17'
labels:
  - 'doc:stories/extend-measurement-coverage'
dependencies:
  - COS-11
  - COS-16
references:
  - plain-english-beginner.md
  - harness/config/matrix.json
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 rewrote `plain-english-beginner.md` and measured it on Opus and Sonnet only, because those are the two models its acceptance criteria named. The four-tier baseline table's beginner row is therefore half history and half current, and three documents say so in a footnote rather than carrying a figure.

The gap matters more than a missing column usually would, because the rewrite's mechanism is exactly the thing the four-tier work was about. COS-7 established that word-cap overrun does not track model tier: mean reply words divided by each style's own cap ran Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300, a sequence that turns twice. COS-4 then cut beginner's overrun on the two tiers at the ends of that sequence. Whether the same rewrite moves Haiku and Fable, which sit in the middle and overrun for different reasons, is unknown and is a direct test of whether the fix is a property of the file or of two models.

Fable is deliberately absent from `matrix.models` and has no bare alias — it needs `--models='claude-fable-5[1m]'`, quoted, and `--variants=baseline` named explicitly. Haiku aborts on write-then-verify cases, 5 of 6 on `agentic-fix-verify` and 3 of 6 on `reserve-agentic-session`, so the arm must be sized on cells that return a reply rather than cells launched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Beginner measured on Haiku and Fable on the five shared cases at n >= 146 non-errored cells per model, matching the sample size the Opus and Sonnet figures are held to
- [x] #2 Figures reported beside the existing Opus and Sonnet numbers with the same paired case x model treatment and intervals, not as bare arm means
- [x] #3 The four-tier table in FINDINGS.md, the epic and the coverage story carries four current beginner columns, and the history footnotes are removed rather than left beside live numbers
- [x] #4 Whether the rewrite's length effect reproduces on the two middle tiers is stated as a result either way, and read against COS-7's finding that overrun does not track tier
- [x] #5 Aborted cells are reported separately and excluded from every quoted mean
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm the shipped beginner text is the COS-16/COS-4 candidate (sha256 86451ddb) and that the Opus/Sonnet comparison targets are 2026-08-20T03-03-26 (shared five, n=150/model, 0 errored) and 03-13-05 (reserve six).
2. Probe with 2 cells (haiku + fable, one case, repeats=1) before committing 300 — the monthly spend limit was hit in session 28. Measure throughput from the probe's elapsedMs.
3. Run the Haiku arm: --styles=plain-english-beginner --models=haiku --variants=baseline --cases=<five shared> --repeats=30 (150 cells), matching the Opus/Sonnet sample size.
4. Run the Fable arm the same way with --models='claude-fable-5[1m]' (quoted; no bare alias).
5. Report figures with the same paired case x model treatment: use 'interval' against the 03-03-26 rows, FILTERED to one style (interval pools styles - COS-30). Both reference runs are single-style so no filtering is needed there.
6. Count and report aborted/errored cells separately; exclude them from every mean.
7. Update FINDINGS.md's four-tier table, the epic and docs/stories/extend-measurement-coverage.md with four current beginner columns; remove the history footnotes. Author outside lore-managed regions, then lore sync; lore check must exit 0.
8. State whether the rewrite's length effect reproduces on Haiku and Fable, read against COS-7's finding that overrun does not track tier.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Session 29 preflight and sizing.

Shipped beginner text confirmed unchanged at sha256 86451ddb (the COS-16 three-edit candidate), so the arms measure the file that ships.

Comparison targets confirmed on disk: run 2026-08-20T03-03-26 is beginner x {opus,sonnet} x baseline, 150 cells a model, 0 errored, on exactly the five shared cases (conv-status-auth, conv-explain-cache, agentic-read-report, conv-status-holdout, conv-followup-drift). Run 2026-08-20T03-13-05 is the same pair on the reserve six.

Usage probe before committing 300 cells: run 2026-08-27T12-34-30, 2 cells (haiku + claude-fable-5[1m], conv-status-auth, repeats=1). Both returned, 0 errored. No limit in force.

Throughput measured on this session's own Haiku arm rather than assumed: 30 of 150 cells in ~19 minutes = ~1.6 cells a minute at concurrency 4. Per-cell elapsedMs is only ~8.6s (median 7.9s), so the judge call, not the cell, is the wall clock. Both 150-cell arms are therefore ~95 minutes each, ~3.2 hours total. This is well under session 27's 31 cells a minute and in the range session 28 warned about.

Throughput correction. The ~1.6 cells a minute in the note above was wrong — it came from estimating elapsed wall time rather than reading a clock. Counted against the run stamps: the Haiku arm ran 150 cells from 12:35:06Z to 12:50:57Z, 15m51s, **9.5 cells a minute**. That is in line with session 27's beginner figure and unlike session 28's intermediate/advanced arms. Beginner's replies are short and its judge calls are cheap.

**Haiku arm: run 2026-08-27T12-35-06, 150 cells, 0 errored.** beginner x haiku x baseline, the five shared cases, 30 repeats. Arm means rules **95.8**, judge **48.2**.

Against the pre-rewrite Haiku baseline (run 2026-08-16T22-59-53 filtered to beginner, haiku, the five shared cases, non-errored: 10 cells, 5 pairs), paired by case:
- rules +5.0 [-6.2, +16.1], t=1.24, df=4
- judge +10.7 [-1.0, +22.5], t=2.54, df=4
- words -40.6 [-86.0, +4.8], t=-2.48, df=4
- composite +7.8 [-2.4, +18.1], t=2.12, df=4

Two confounds on that comparison, both already documented in FINDINGS.md for the Opus/Sonnet halves and both applying here:
1. The before side's stored rulesScore is graded against the pre-3370e4d contract (beginner held to a 15-word sentence cap the file never stated). Re-scoring it offline with 'node src/cli.mjs score' reads rules 91.1, against 90.9 in the published four-tier table. The judge cells cannot be re-graded offline at all, so the judge delta carries the same defect.
2. All 10 before-side rows predate the COS-10 text-block fix; 2 of them are agentic cells whose text is the whole turn glued into one string. 'score' says so on stdout. agentic-read-report is one of the five shared cases, so its word count and its rule scores are not comparable across the seam.

Mean reply words, Haiku, per case (before -> after): conv-status-auth 75.5 -> 60.1, conv-explain-cache 198.5 -> 108.2, agentic-read-report 162.0 -> 92.9, conv-status-holdout 66.0 -> 55.7, conv-followup-drift 60.5 -> 42.7. Arm mean 112.5 -> 71.9 over five cases and 100.1 -> 66.7 over the four conversational ones. Every case falls. Against beginner's 80-word cap the arm mean moves from over it to under it.

**Fable arm: run 2026-08-27T12-50-55, 150 cells, 0 errored.** beginner x claude-fable-5[1m] x baseline, the five shared cases, 30 repeats. Ran 12:50:55Z to 13:05:30Z, 14m35s, 10.3 cells a minute. Arm means rules **99.3**, judge **65.2**.

**The four columns are like-for-like, and that is checked rather than assumed.** The Opus and Sonnet halves come from run 2026-08-20T03-03-26 (150 cells a model, 0 errored, the same five cases, the same style bytes sha256 86451ddb). Everything that could make the two days incomparable last changed before that run: checks.mjs and contracts.json at 2026-08-17 (606ee23, 72abcc7), judge.mjs and run.mjs at 2026-08-18 (b96a293), cases.json at 2026-08-17 (2319902). Same scorer, same contract, same judge prompt, same runner, same cases, same bytes. The only difference between the columns is the model.

**Current four-tier beginner row, 150 cells a model, 0 errored in every column:**

| model | rules | judge | mean reply words | words / 80-word cap |
|---|---|---|---|---|
| haiku | 95.8 | 48.2 | 71.9 | 0.899 |
| sonnet | 97.4 | 60.9 | 58.7 | 0.734 |
| opus | 99.2 | 66.1 | 62.9 | 0.786 |
| fable | 99.3 | 65.2 | 66.4 | 0.830 |

**Paired intervals, pooled over the two new tiers (10 pairs, case x model, df=9), against the pre-rewrite arms:** rules +6.4 [-0.7, +13.5] t=2.05; judge **+11.0 [+3.4, +18.7]** t=3.26; words **-53.0 [-91.4, -14.6]** t=-3.12; composite **+8.7 [+1.8, +15.6]** t=2.86. Per model at 5 pairs each: Haiku rules +5.0 [-6.2,+16.1], judge +10.7 [-1.0,+22.5], words -40.6 [-86.0,+4.8]; Fable rules +7.9 [-6.6,+22.3], judge +11.3 [-4.8,+27.4], words -65.4 [-151.1,+20.3].

**Mean reply words per case, before -> after.** Haiku: conv-status-auth 75.5->60.1, conv-explain-cache 198.5->108.2, agentic-read-report 162.0->92.9, conv-status-holdout 66.0->55.7, conv-followup-drift 60.5->42.7. Fable: 76.5->61.3, 249.0->77.3, 174.5->75.0, 74.0->52.5, 85.0->65.9. **Ten of ten case-model cells fall.** Arm mean over cap: Haiku 1.406 -> 0.899, Fable 1.648 -> 0.830. Both tiers cross from over the cap to under it.

**What the before/after comparison can and cannot carry.** The pre-rewrite arms are the four-tier baseline's own cells: run 2026-08-16T22-59-53 filtered to beginner x haiku x the five shared cases (10 cells, 0 errored) and 2026-08-16T23-48-45 for Fable (10 cells, 0 errored). Two confounds sit on them and both are already documented in FINDINGS.md for the Opus/Sonnet halves:

1. **Contract drift.** The stored rulesScore on the before side is graded against the pre-3370e4d contract, which held beginner to a 15-word sentence cap the file never stated. Re-scoring offline reads Haiku 91.1 and Fable 91.6 against the published 90.9 and 91.4. The judge cells cannot be re-graded offline at all, so the judge delta inherits the same defect and reads high by an unknown amount.
2. **The COS-10 text-block seam.** All 20 before-side rows predate it; 4 of them are agentic cells carrying the whole turn glued into one string, which inflates their word counts and mis-splits their sentences. 'score' prints this on stdout. agentic-read-report is one of the five shared cases.

Restricting to the four conversational cases removes the seam (the project's own convention -- see FINDINGS.md's sentence-length table, which excludes the agentic case for exactly this reason). Pooled over 8 pairs: words **-45.2 [-93.1, +2.8]**, rules +2.9 [-3.3, +9.0], judge +9.6 [-0.1, +19.4]. Same signs, same rough magnitudes, wider intervals at 8 pairs than at 10 -- none of the three clears zero there.

**So the deltas are stated as directional, not as measured effect sizes**, and the load-bearing figures in this task are the four current arm means, each on 150 non-errored cells with no confound between them.

**Aborted and errored cells (AC #5).** Haiku 0 of 150, Fable 0 of 150. Neither new arm lost a cell. The task's own warning that Haiku aborts on write-then-verify cases did not bite, because none of the five shared cases is one -- agentic-read-report reads a file and does not edit or test. The 2-cell probe (2026-08-27T12-34-30) also returned 0 errored. Every mean above is over non-errored cells; there are none to exclude.

**AC verification, session 29.**

AC #1 — run manifests and row composition read directly. 2026-08-27T12-35-06: beginner x haiku x baseline, 5 cases x 30 repeats = 150 rows, 'complete: true', **0 errored, 0 no-reply**. 2026-08-27T12-50-55: same shape on claude-fable-5[1m], 150 rows, **0 errored, 0 no-reply**. Both n=150 >= the 146 the criterion asks for, and the five cases are exactly the shared five.

AC #2 — the four tiers are reported side by side in FINDINGS.md, the epic and the coverage story, and FINDINGS.md carries the paired intervals beside them: pooled 10 case x model pairs and each model's 5, on rules/judge/words/composite, computed with 'node src/cli.mjs interval' (COS-27's method, harness/src/interval.mjs). Not arm-mean subtraction.

AC #3 — all three documents now carry four current beginner columns. The historical figures (rules 90.9/92.3/91.5/91.4, judge 37.5/48.4/45.9/53.9) are stated as replaced, in one place each, and no history footnote is left standing beside a live number. FINDINGS.md's judge-defect section was rewritten too: it described the beginner row it no longer applies to.

AC #4 — answered as a result in FINDINGS.md's *Does word-cap overrun track model tier?* and in the coverage story. The effect reproduces on both middle tiers: Haiku 1.406 -> 0.899 x cap, Fable 1.648 -> 0.830, all ten case x model cells falling. Read against COS-7: the fall per tier (0.507 to 0.900) is larger than the largest adjacent-tier difference COS-7 measured (0.339), and the after column turns in a different place than COS-7's sequence did, so the ordering is not the capability ordering and does not survive a change of style text.

AC #5 — there were no aborted cells to report or exclude: 0 of 150 on each arm, stated in FINDINGS.md and both docs. The task anticipated Haiku aborts on write-then-verify cases; none of the five shared cases edits a file, so the failure mode was out of scope for this arm rather than absent in general.

**Gates.** npm --prefix harness test 219/219 pass. 'node src/cli.mjs audit' exit 0, all 12 checks agree. 'lore check --plain' exit 0 (read unpiped), 24 files, 0 errors, 0 warnings. 'lore sync' run after the doc edits.

**One thing found and not fixed here.** Counting rows.json across harness/results returns 6996 rows in 89 directories (6284 run-manifest, 4 improve-manifest, 708 pre-manifest). Net of improve cells that is 6992 against the ledger's running total plus this session's 302, which is 6910 — an **82-cell discrepancy that predates COS-17**. Recorded in the ledger as an open discrepancy rather than resolved by writing either figure, since which is wrong has not been established.

**Correction, found in this session's own branch review.** The notes above say the before side's judge cells carry the pre-3370e4d 15-word-cap defect. **They do not, and the timestamps settle it.** 3370e4d landed 2026-08-16 08:14:52 -0500 = **13:14 UTC**; the Haiku baseline 22-59-53 ran at 22:59 UTC and the Fable baseline 23-48-45 at 23:48 UTC, both nine hours later. Only 12-44-03 (12:44 UTC), which is the historical row's **Opus and Sonnet** source, predates the fix.

Two consequences, and both improve the result rather than weaken it:

1. **The Haiku +10.7 and Fable +11.3 judge rises are the only before-and-after judge comparison on beginner that the cap drift never touched.** The Sonnet +12.5 and Opus +20.2 rises, which come from the historical row, do carry it.
2. FINDINGS.md's judge-defect section said beginner's row was not comparable across models. It is now free of the defect **entirely** — COS-16 re-measured Opus and Sonnet after the fix, COS-17 measured Haiku and Fable after it, and the two historical Haiku/Fable cells it replaced were themselves post-fix.

What the before side does still carry: its stored rulesScore is graded by a pre-2026-08-17 checks.mjs and contracts.json (COS-15's and COS-9's changes, not 3370e4d), so re-scoring is needed before comparing rules — 91.1 and 91.6 against the published 90.9 and 91.4; and all 20 rows predate the COS-10 seam, 4 of them agentic.

Corrected in FINDINGS.md and the ledger row before the PR.

**A second correction from the same review.** A draft sentence read 'Beginner follows its own rules better than any other style'. False on Haiku, where beginner's 95.8 sits 0.2 below advanced's 96.0. It now reads 'as well as any other style — better on three tiers of four'. The related claim earlier in the document was already corrected the same way before the first commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured the shipped beginner style file (sha256 86451ddb) on Haiku and Fable at 150 non-errored cells a model on the five shared cases, completing the four-tier beginner row that had been half history since COS-4.

Runs 2026-08-27T12-35-06 (Haiku) and 2026-08-27T12-50-55 (Fable), 0 errored cells in either, preceded by a 2-cell usage probe. Arm means rules 95.8 / 99.3 and judge 48.2 / 65.2, beside COS-16's 99.2 / 97.4 and 66.1 / 60.9 on Opus and Sonnet. The four columns are comparable because every input that could separate the two run days last changed before the earlier of them - checks.mjs, contracts.json, judge.mjs, run.mjs and cases.json all at 2026-08-17 or 2026-08-18, verified from git log.

The length effect reproduces on both middle tiers and is the clearest result: mean reply words fall from 1.406x to 0.899x beginner's 80-word cap on Haiku and 1.648x to 0.830x on Fable, with all ten case x model cells falling and both tiers crossing from over the cap to under it. Read against COS-7, the per-tier fall (0.507 to 0.900) exceeds the largest adjacent-tier difference COS-7 could measure (0.339), so length is a property of the file rather than the tier - COS-7's conclusion reached from the other direction.

Paired intervals (interval.mjs, pairing case x model) are published beside the means rather than arm-mean subtraction: pooled over 10 pairs, judge +11.0 [+3.4, +18.7], words -53.0 [-91.4, -14.6], composite +8.7 [+1.8, +15.6], rules +6.4 [-0.7, +13.5]. They are stated as directional, not as effect sizes, because the pre-rewrite side carries two documented confounds - a pre-3370e4d contract on its rules and judge, and the COS-10 text-block seam on its agentic cells. Dropping the agentic case keeps every sign and clears no interval at 8 pairs.

FINDINGS.md, docs/epics/plain-english-output-styles.md and docs/stories/extend-measurement-coverage.md now carry four current beginner columns with the history removed rather than footnoted beside them; FINDINGS.md's judge-defect section was rewritten because it described a row it no longer applies to; two ledger entries added.

Verified by: the run manifests and row composition read directly (150 rows, complete: true, 0 errored, 0 no-reply, 5 cases x 30 repeats each); npm --prefix harness test 219/219; audit exit 0; lore check exit 0 on 24 files, read unpiped.
<!-- SECTION:FINAL_SUMMARY:END -->
