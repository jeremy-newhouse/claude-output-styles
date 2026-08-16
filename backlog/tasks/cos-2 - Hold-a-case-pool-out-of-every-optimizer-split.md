---
id: COS-2
title: Hold a case pool out of every optimizer split
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 21:02'
labels:
  - 'doc:stories/harden-the-optimizer-loop'
dependencies: []
references:
  - harness/src/improve.mjs
documentation:
  - harness/rejected/README.md
  - docs/stories/harden-the-optimizer-loop.md
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The improve loop draws train and holdout from the same small case pool, so a rewrite can satisfy both splits and still degrade on genuinely unseen prompts. This was measured, not hypothesised: two candidates that the loop kept on its own train and holdout were 6.8 and 0.6 points worse on four cases the optimizer had never seen in any split.

The loop's holdout is a useful tuning signal but not a verdict. The harness needs a third split the optimizer never touches, and improveStyle should report against it before a candidate is presented as a winner.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cases support a third split that improve never selects for training or holdout
- [x] #2 improveStyle scores the winning candidate against that reserve split and reports it alongside train and holdout
- [x] #3 A candidate that regresses on the reserve split is reported as rejected, not as the winner
- [x] #4 harness/README.md documents the three-way split and why two is not enough
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a third split named `reserve`. Config: `improve.reserveSplit` and `improve.minReserveDelta` in config/matrix.json. improve.mjs already filters train/holdout by name, so a case tagged `reserve` is structurally unreachable as training or tuning signal — AC #1 needs the split named in config plus real cases carrying it.

2. Write FOUR NEW reserve cases rather than carving them out of the existing nine. The ADR (validate-candidates-on-cases-held-out-of-every-split) says case-set size is load-bearing and three splits from nine cases raises the noise floor; moving conv-decision-db / conv-badnews / agentic-fix-verify / conv-decision-holdout into reserve would cut train 5->3 and holdout 4->2. New cases must be SHAPES no existing split contains, since the ADR's whole finding is that a rewrite overfits to case shape: (a) a forward-looking scope/estimate question with no work done and no options supplied; (b) a two-turn case where the user pushes back on the recommendation (the existing multi-turn case is cooperative); (c) a decision case supplying THREE options, so the two-options rule has to bite (both existing decision cases pre-supply exactly two); (d) an agentic case that WRITES new code (existing agentic cases read and fix).

3. improveStyle validates the adopted candidate on the reserve before presenting it (AC #2/#3). After the loop, when and only when a rewrite was actually kept (best.iteration > 0) and reserve cases exist: measure the ORIGINAL style and the winner on the reserve, both through the existing `measure` helper so rows persist and carry `iteration` — v0 and vN — landing as `<style>.v<N>.reserve.json` and in the BY ITERATION table under the existing `<style> v<N> <split>` key. No new labelling convention. Return `reserve: { split, cases, baseline, candidate, delta, accepted, iteration }`, or null when the pass did not run, with the reason logged.

4. Rejection is a rollback, not a note (AC #3). When delta < minReserveDelta the candidate is NOT the winner: `best` reverts to the measured baseline, so `<style>.best.md` — documented as the winner and the file a user diffs and copies — holds the incumbent. The rejected candidate survives at `<style>.v<N>.md` and in history. Falling back to v0 rather than an intermediate kept iteration is the only defensible move: reserve was measured for v0 and vN only. cli.mjs prints the verdict on the style's headline line so a rejection cannot be read as a win.

5. Tolerance: minReserveDelta = -0.02, matching minHoldoutDelta. README's noise section says treat gaps under ~3 points as noise, so a 2-point bar can fire on noise. That is the intended direction — rejecting a sound candidate costs a re-run, adopting a bad one ships a regression. Document the asymmetry rather than widening the bar.

6. Tests in harness/test/improve.test.mjs using the existing deps seam (injected evaluate/rewrite), so the accept path, the reject-and-roll-back path, the skip path, and reserve-never-in-train/holdout are proved free and deterministically.

7. Evidence: (a) `npm --prefix harness test` green; (b) a real plain `run` over just the four reserve cases on haiku, proving the new cases execute and score; (c) a real `improve` run on a small subset proving the reserve pass runs end-to-end against the real evaluate. If no candidate is adopted in that run the skip path is what gets proved live — report that honestly rather than claiming the measured path.

8. README (AC #4): document the three-way split, why two is not enough (cite the ADR's measured 6.8-point out-of-sample drop, do not re-derive), the rollback behaviour, the new knob, and the extra cost. Grep docs/, FINDINGS.md and reference/ for statements the case-count change (9 -> 13) makes false.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation landed on feature/COS-2 in two commits (781aebd, 5e49f2e).

Design decisions worth recording:

- The reserve pass runs ONLY when a rewrite was actually kept (best.iteration > 0). A run that reverts every candidate leaves the style unchanged, so there is no claim to validate and nothing is spent on the extra measurement. Past improve runs reverted everything more often than not, so this is the common case.
- Both sides are measured in the same run on the same cases. Comparing the candidate against a reserve figure from an earlier run would fold in model drift and case edits, which is the confound the guard exists to remove.
- A rejection is a ROLLBACK, not an annotation. harness/README.md documents <style>.best.md as the winner and tells the reader to diff and copy it, so on rejection best.md is rewritten with the incumbent and best reverts to the baseline record. The rejected candidate survives at <style>.v<N>.md and in history, and reserve.iteration names it.
- Rollback goes to v0, never to an intermediate kept iteration. The reserve was measured for v0 and the winner only, so no other fallback is supported by evidence actually collected.
- The verdict line was extracted from cli.mjs into report.mjs as renderVerdict(). AC #3 says a regressing candidate must be REPORTED as rejected; leaving that in a console.log would have made the criterion unverifiable except by eye. It is now three unit tests, including the dangerous case where a candidate was adopted and the reserve never ran — that renders as NOT MEASURED / unvalidated, deliberately not the same as a pass.

Case-set decision: four NEW reserve cases rather than carving them out of the existing nine. The ADR says case-set size is load-bearing; moving the four historically-unseen cases into reserve would have cut train 5->3 and holdout 4->2, shrinking the training signal the loop depends on. Pool is now 13 (5 train / 4 holdout / 4 reserve). The new cases are shapes no existing split contains — a forward-looking scope question, a decision offering three options rather than two, a turn where the user overrides the recommendation, and an agentic case that writes new code — because the ADR's finding is that candidates overfit to case SHAPE, not wording.

REVIEW (/code-review high) found six issues. All were real. Five fixed on the branch, one raised as a separate task.

1. MEDIUM — reserve-three-options claimed to make the two-options rule bite, and it cannot. two_options_max counts only literal 'option a/b/1/2' labels, so a three-option prose reply with a recommendation scores 1.000 (verified). The check's label-blindness is deliberate and documented in checks.mjs; the gap is that nothing replaced it. NOT fixed here: changing checks.mjs moves scores already quoted in docs/ and FINDINGS.md, which is outside this task's criteria. Raised as COS-9 with that constraint written into its acceptance criteria. The case stays — its judge rubric targets the behaviour precisely, and the check does fire when a model labels its options, which happened in the 20-40-22 run ('3 labelled options (cap is 2)'). What was wrong was the claim, not the case.

2. LOW — reserve-pushback graded its own reward as a failure. Its judge asks the second reply to accept the override plainly and move on; leads_with_conclusion scores 0 for exactly that, because "I'll split it into per-region jobs." trips the hedge regex (verified: score 0, evidence quotes the sentence). The check is tuned for task-start narration, not for accepting an instruction. Fixed by dropping leads_with_conclusion from that one case; no_process_narration correctly scores 1.0 on the same text and stays.

3. LOW — cfg.minReserveDelta had no fallback. A matrix.json that set reserveSplit but omitted the threshold would evaluate 'delta >= undefined', false for every candidate, silently rolling back every run while logging an ordinary REJECT. Fixed with DEFAULT_MIN_RESERVE_DELTA and a warning log, pinned by a test that deletes the key from the config.

4. LOW — the README told readers to compare splits in BY SPLIT. On an improve run that table pools every iteration, so train and holdout average the baseline with every discarded candidate while reserve holds only v0 and the winner; the run at 20-41-22 shows exactly that (train n=3 over v0/v1/v2, reserve n=4 over v0/v1). It also contradicted the same file's warning about pooled improve figures. Rewritten to send the reader to the by-iteration table and to scope the BY SPLIT reading to a plain run.

5. LOW — cli.mjs help text still described improve as 'keep if train up and holdout flat', with no mention of a gate that can roll a run back to v0. Updated.

6. LOW — task not finalized. That is this step.

Also fixed before the review returned, found by re-reading my own runbook edit: the rejection example printed the rejected candidate's train and holdout on the REJECTED headline. best is rolled back before rendering, so that line carries v0's figures. The renderVerdict test already asserted the correct behaviour; only the prose disagreed. Same class as the two traps the previous sessions hit — a plausible number in a file, passing every automated gate.

EVIDENCE — all four criteria verified against real improve runs on the committed code (d041908), not against unit tests alone. Six paid runs this session, $1.18 total against a ~$3 budget.

The decisive run is results/2026-08-16T20-57-54-086Z/ (beginner, Haiku, 1 train + 1 holdout + 2 reserve cases, 3 iterations, 12 cells, $0.30). The real optimizer produced a candidate that the loop wanted and the reserve refused:

  baseline train=0.7 holdout=0.644
  iter 1: train 0.725 (+0.025) holdout 0.695 (+0.051) -> KEEP
  iter 2: train 0.775 (+0.050) holdout 0.99  (+0.295) -> KEEP
  iter 3: train 0.99  (+0.215) holdout 0.725 (-0.265) -> REVERT
  validating v2 on 2 reserve cases...
  reserve: v2 0.623 vs v0 0.8 (-0.177) -> REJECT
  v2 rejected on reserve — keeping v0

v2 won both of the loop's own splits — holdout by 29.5 points — and was 17.7 points worse on cases the loop never selected. Re-scoring the saved rows offline shows the exact signature the ADR names: on the reserve, v2's deterministic rules were roughly flat (92.6 -> 89.6) while its judge score collapsed (67.5 -> 35.0). This is the failure the ADR measured at 6.8 points, reproduced live and caught automatically instead of by a follow-up run.

AC #1 — a third split improve never selects. cases.json is now 13 cases: 5 train, 4 holdout, 4 reserve. Verified against persisted rows rather than by reading the filter: in run 20-41-22 every measurement the loop used to decide (v0/v1/v2 train and holdout) contained only conv-status-auth and conv-status-holdout, and a scripted check for reserve case ids appearing in any train or holdout row returned 0. Reserve rows exist only under the reserve split. Confirmed again in 20-57-54: reserve files exist for v0 and v2 only — the two sides of the validation — and never for v1 or v3.

AC #2 — improveStyle scores the winner against the reserve and reports it alongside train and holdout. Proved live twice on adopting runs: 20-50-12 (reserve v1 0.582 vs v0 0.591, -0.009, ACCEPT — inside tolerance) and 20-57-54 (REJECT above). Both print the reserve line directly under the train/holdout headline. The reserve rows land in rows.json tagged v0/vN and appear in the BY ITERATION table under the existing '<style> v<N> <split>' key, so no new labelling convention was invented — the offline re-score of 20-57-54 reproduces all ten iteration rows including both reserve rows.

AC #3 — a regressing candidate is reported as rejected, not as the winner. The 20-57-54 headline reads 'plain-english-beginner: v2 REJECTED on reserve — keeping v0  (train 0.7 holdout 0.644)' — v0's numbers, not v2's. The rollback is real, not cosmetic: candidates/plain-english-beginner.best.md is byte-identical to the shipped plain-english-beginner.md (diff -q reports no difference), while the rejected rewrite survives separately at v2.md. Rendering is additionally pinned by three renderVerdict tests covering rejection, acceptance, and the dangerous NOT MEASURED case.

AC #4 — harness/README.md documents the three-way split and why two is not enough. New 'Three splits, not two' section: a table of who uses each split, the ADR's measured 6.8-point out-of-sample drop cited rather than re-derived, the five behavioural rules (pass runs only on adoption, both sides measured in the same run, rejection rolls back, rollback goes to v0, unmeasured is not passed), the minReserveDelta asymmetry, and the extra cost. It also states plainly what four cases cannot prove.

Gates: npm --prefix harness test 34/34 (11 new, was 23 at the start of the session). lore check 0 errors after lore sync. Offline re-scoring still reproduces a run's figures exactly (20-41-22 re-scored to the same 71.9% and $0.2448), so COS-3's capability is intact.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The improve loop no longer decides on its own whether a rewrite is good. Cases carry a third split, reserve, that the loop never selects for train or holdout, and when a rewrite is kept improveStyle measures the incumbent and the winner on it — same cases, same run — before presenting a winner. A candidate that comes in below the incumbent by more than minReserveDelta is rolled back to v0, so <style>.best.md holds what survived rather than what the loop liked; the rejected rewrite stays at v<N>.md. Rollback targets v0 and not an earlier kept iteration because the reserve was measured for v0 and the winner only.

The four reserve cases are new rather than carved out of the existing nine, which would have cut train to three and holdout to two. They are shapes no existing split contains — a forward-looking scope question, a decision offering three options rather than two, a turn where the user overrides the recommendation, and an agentic case that writes new code — because the ADR's finding is that candidates overfit to case shape.

Verified on real runs, not unit tests alone. In results/2026-08-16T20-57-54-086Z/ the optimizer produced a candidate that won train and beat holdout by 29.5 points, and was 17.7 points worse on the reserve; the guard rejected it and best.md came out byte-identical to the shipped style file. Offline re-scoring shows the ADR's signature exactly: reserve rules flat at 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. The accept path was proved separately in 20-50-12 and the no-adoption skip path in 20-47-28 and 20-55-37. npm --prefix harness test 34/34; lore check 0 errors; $1.18 spent against a ~$3 budget.

Review found six issues, all real. Five fixed here, including a config footgun where a missing minReserveDelta would have silently rolled back every run. The sixth is COS-9: two_options_max counts only literal option labels, so it cannot see prose option sprawl — fixing it moves scores already quoted in docs/ and FINDINGS.md, so it is its own task.
<!-- SECTION:FINAL_SUMMARY:END -->
