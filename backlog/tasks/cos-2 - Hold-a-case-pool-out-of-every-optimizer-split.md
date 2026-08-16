---
id: COS-2
title: Hold a case pool out of every optimizer split
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 20:37'
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
- [ ] #1 Cases support a third split that improve never selects for training or holdout
- [ ] #2 improveStyle scores the winning candidate against that reserve split and reports it alongside train and holdout
- [ ] #3 A candidate that regresses on the reserve split is reported as rejected, not as the winner
- [ ] #4 harness/README.md documents the three-way split and why two is not enough
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
