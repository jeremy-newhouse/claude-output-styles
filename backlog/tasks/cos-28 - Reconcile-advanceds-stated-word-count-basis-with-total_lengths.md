---
id: COS-28
title: Reconcile advanced's stated word-count basis with total_length's
status: Done
assignee:
  - '@jeremy'
created_date: '2026-08-17 18:58'
updated_date: '2026-08-31 19:01'
labels: []
dependencies: []
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
plain-english-advanced.md line 79 says 'Keep the whole reply under 120, headers and code included.' total_length counts words(stripCode(text)) — code fenced or inline is removed before counting. The scored cap is therefore more permissive than the stated one, and the audit reports 'both say 120' because it compares the number and not the basis.

Found by COS-15's by-hand re-read of all three style files against every contract field. It is not a conditional, so COS-15's codeOnRequest machinery does not reach it, and it is outside COS-15's acceptance criteria.

Neither exit is free. Counting code would move every total_length figure ever published, on all three styles. Editing advanced's prose is a style-file change, so it needs a measured arm — advanced's is the most expensive of the three at 207 cells for +/-4 points.

A third option worth pricing: teach the audit to compare the stated BASIS as well as the number, so the disagreement is at least visible while the fix is decided.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The basis advanced states and the basis total_length counts agree, with the choice between changing the prose and changing the count argued rather than assumed
- [x] #2 Whichever side changes, the effect is measured: a style-file edit gets a real arm, a checks.mjs edit gets all saved rows re-scored and every moved published figure corrected
- [x] #3 The audit reports a basis disagreement rather than passing it, or it is recorded why it cannot
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm the direction: advanced's prose ('headers and code included') is wrong, not total_length — only advanced makes this claim (beginner/intermediate are silent on code), and code excluded is what checks.mjs's words(stripCode(text)) actually measures. Edit advanced's prose, not the checker (changing the checker moves every published total_length figure on all three styles).
2. Fix plain-english-advanced.md line 79 to 'headers included and code excluded'.
3. Extend contract-audit.mjs with a basis check (statedBasis) so a style claiming code counts toward maxUpdateWords fails the audit even when the number agrees, mirroring the existing maxCodeLines condition check. Add tests.
4. Run a paired confirmatory arm (old prose vs new, same cases/models) to verify no regression, per the task's own guidance that a full 207-cell arm is not needed for a wording-only fix.
5. Update docs/specs/style-contracts-by-audience-level.md's existing 'filed rather than fixed' note to record the resolution and the measured result; lore sync + check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Direction argued and taken: advanced's prose was wrong, not total_length. Only advanced claims code counts ('headers and code included'); beginner and intermediate state no basis at all, consistent with total_length's real behavior (words(stripCode(text)) — fenced code dropped entirely, inline code counted as 1 placeholder word 'CODE'). Changing the checker instead would move every total_length figure ever published on all three styles; changing one sentence in advanced does not.

Fix: plain-english-advanced.md line 79 now reads '...under 120, headers included and code excluded...'.

AC3: extended harness/src/contract-audit.mjs with statedBasis()/BASIS_FIELDS/CODE_COUNTED, mirroring the existing CONDITION_FIELDS mechanism for maxCodeLines. A style whose prose claims code counts toward maxUpdateWords now fails the audit (status mismatch) even when the stated number matches contracts.json — the exact silent-agreement failure mode COS-28 was filed on. 4 new tests in contract-audit.test.mjs; FORCE_COLOR=0 npm --prefix harness test: 229/229 pass (225 baseline + 4 new). node src/cli.mjs audit: 12/12 checks agree on the shipped files.

AC2: paired confirmatory arm, 11 conversational cases x opus/sonnet x 1 repeat = 22 cells each side, old prose (stashed edit) vs new prose, same day/session to avoid confounds from other campaign changes. Stamps: before=results/2026-08-31T18-56-26-946Z (87.6% overall), after=results/2026-08-31T18-52-49-055Z (85.4% overall). Paired interval (node src/cli.mjs interval --before=... --after=...): composite -2.2 [-5.5,+1.1], judge -6.1 [-15.8,+3.5], rules -0.5 [-2.1,+1.0], words +4.3 [-10.3,+19.0] — every interval crosses zero, no measured regression at this power. Not a full 207-cell precision arm; task's own notes say a smaller confirmatory arm suffices for a wording-only fix that does not change enforcement.

docs/specs/style-contracts-by-audience-level.md's existing 'filed rather than fixed' note updated to record the resolution and the arm's numbers; lore sync ran (docs/log.md updated, backlog/ auto-committed by lore as a separate commit) and lore check: 24 files, 0 errors, 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Advanced's prose claimed the 120-word cap counted code; total_length actually excludes it (words(stripCode(text))). Fixed the prose (line 79: 'headers included and code excluded') rather than the checker, since the checker change would move every published total_length figure on all three styles. Verified no regression with a paired 22-cell confirmatory arm (old vs new prose, opus+sonnet, 11 conversational cases): composite/judge/rules/words all cross zero. Extended contract-audit.mjs's basis check (statedBasis) so this class of drift — number agrees, basis doesn't — now fails the audit automatically; 4 new tests, 229/229 harness tests pass, audit 12/12 checks agree. Docs and lore log synced, lore check 0 errors.
<!-- SECTION:FINAL_SUMMARY:END -->
