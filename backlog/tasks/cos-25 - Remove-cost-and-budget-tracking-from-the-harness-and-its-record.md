---
id: COS-25
title: Remove cost and budget tracking from the harness and its record
status: Done
assignee:
  - '@jeremy'
created_date: '2026-08-17 14:43'
updated_date: '2026-08-17 15:07'
labels: []
dependencies: []
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The project runs on a Claude subscription, so the dollar figures the harness records and the docs quote are notional — a list-price valuation of tokens that nobody was ever charged. Cost never enters a style's score (checks.mjs plus the judge do that), so every dollar figure is telemetry about the test rig rather than a finding about the styles. Carrying it invites budget reasoning into decisions that should be driven by statistical power alone.

Remove the cost instrumentation from the harness, the cost columns and dollar figures from the published record, and the budget framing from the campaign tracker. Sample-size claims keep their statistical basis and lose their price annotations.

matrix.json's `run.maxBudgetUsd` is the one live consumer: it is passed to the Agent SDK at run.mjs:59 and hard-stops a runaway cell. Deleting it without a replacement removes the only runaway guard. The SDK exposes three bounds (verified in sdk.d.ts): `abortController` (wall-clock, hard stop), `taskBudget` (tokens, advisory only, alpha), and `maxTurns` (tool rounds, already set to 12). Only abortController is a true circuit breaker, so the guard becomes a per-cell wall-clock timeout.

Done Backlog task bodies are deliberately out of scope: they are the immutable evidence record of what each session measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No dollar figure, cost column, or budget framing remains in docs/, FINDINGS.md, README.md, or harness/README.md
- [x] #2 The campaign tracker doc-1 carries no spend figures or no-spend/cost annotations in its cursor, queue, resolved, or session-log sections
- [x] #3 costUsd, totalCostUsd, spentUsd and spendOf are gone from harness/src and harness/test; no rows.json, summary.json, run.json or report output carries a cost field
- [x] #4 matrix.json no longer sets maxBudgetUsd and run.mjs no longer passes it to the SDK
- [x] #5 A per-cell wall-clock timeout replaces it as the runaway guard, driven by an AbortController, configured in matrix.json, and proven to actually abort a cell by an executed test
- [x] #6 Sample-size claims that were priced (the 146-cell figure and its siblings) keep their statistical basis and lose only the dollar annotations
- [x] #7 npm --prefix harness test passes, node src/cli.mjs audit exits 0, and lore check exits 0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Harness code: delete costUsd from run.mjs (runTurn/runCell), evaluate.mjs (per-model + summary aggregation), results.mjs (manifest), report.mjs (both cost lines); delete spendOf and spentUsd from improve.mjs and their consumers in cli.mjs.
2. Runaway guard: replace matrix.json run.maxBudgetUsd with run.maxCellSeconds. In run.mjs, build an AbortController per cell, arm a timer, pass it as options.abortController, and clear the timer in a finally. An aborted cell must return the same error-row shape runCell already produces so the existing errored-cell handling (COS-11) still applies.
3. Tests: strip cost assertions from results.test.mjs and improve.test.mjs; swap maxBudgetUsd for maxCellSeconds in config.test.mjs and results.test.mjs OPTS. Add a test that arms the timeout and observes an actual abort - a guard never seen to fire is not evidence (the campaign's own do-not-repeat list).
4. Docs: drop the ledger's cost column and its per-row dollar prose; strip dollar figures from FINDINGS.md, keeping the statistical basis of the sample-size passage at 760-763 and dropping only the price annotations; sweep the runbook, three stories, the epic, README.md and harness/README.md. Also strip the cost prose from matrix.json's //models and //improve comment blocks.
5. Tracker: rewrite doc-1 via backlog doc update - remove spend figures from the resolved rows, no-spend annotations from the queue, and the budget framing from the cursor and session log. Advance the cursor and log this session in the same edit.
6. Gates: npm --prefix harness test, node src/cli.mjs audit, LORE_BACKLOG_TIMEOUT_MS=120000 lore sync then lore check.
7. Commit with Refs COS-25, review the full branch diff with /code-review high and wait for it, then PR into dev, rebase-merge, promote main, prune.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Code layer done and exercised, not just compiled.

Guard: matrix.json run.maxBudgetUsd -> run.maxCellSeconds (600), enforced by an AbortController in runCell. The timer covers the whole cell, not each turn, so a multi-turn case cannot run N x the limit. A tripped cell returns error 'error_timeout' and is excluded from every mean like any other errored cell.

Two hazards found while writing the guard, both fixed:
- undefined * 1000 is NaN and setTimeout treats NaN as 0, so a config missing the key would have aborted every cell in the matrix on the next tick and labelled each one a timeout - a whole run of fabricated timeouts that no completeness check would flag. runCell now validates and throws instead of defaulting.
- An abort can end the SDK iterator quietly instead of throwing. On that path result stays null and the row would come back error: null with empty text, indistinguishable from a model that said nothing. A timedOut flag is the authority on the error, not the thrown exception.

New harness/test/run.test.mjs drives runCell to a real abort through an injected query seam: wedge-then-throw, wedge-then-quiet-end, a control that finishes in time, and the NaN/invalid config rejection. Verified these can fail - sabotaging the timedOut authority reds exactly the quiet test, and replacing the validation with a silent default reds exactly the config test.

Suite 124 -> 126 (removed 2 cost-only tests, added 4 guard tests). audit exit 0.

End-to-end on real saved data, no new cells: score --rows on the published 12-44-03 arm reproduces 81.0% exactly and the cost line is gone from the output. improve --cases=__none__ --iterations=0 runs the whole loop path at 0 cells and prints 'measured 0 cells' / '0 saved cells'. Written run.json and summary.json carry no cost field.

Verification of every criterion, run rather than inspected.

AC #1/#2 — 0 dollar figures across docs/, FINDINGS.md, README.md, harness/README.md and doc-1. The one $ left in FINDINGS.md (line 647, 'under $75k') is a case-fixture example of style content, not a testing figure. Verbatim user quotes in the tracker were left intact: altering an attributed quote falsifies the record, and two of them are the decisions that set the campaign's scope.

AC #3 — costUsd/totalCostUsd/spentUsd/spendOf return zero hits across harness/src and harness/test. Verified on written output, not just source: writeResults on a real row produced rows.json, summary.json, run.json and report.md with no cost/spend/$ match in any of the four.

AC #4 — maxBudgetUsd count is 0 in matrix.json and 0 in run.mjs. The single repo-wide mention left is the comment in run.test.mjs explaining what the guard replaced.

AC #5 — harness/test/run.test.mjs, 4/4 passing, driving runCell to a real abort through an injected query seam. Sabotage-verified: removing the timedOut authority reds exactly the quiet-abort test and nothing else; replacing the config validation with a silent default reds exactly the config test and nothing else.

AC #6 — the 146-cell figure survives in all four places that carried it (FINDINGS.md, the ledger, and two stories), now stated as what a 95% half-width of +/-4 points requires at SD 24.6 rather than as a price.

AC #7 — npm --prefix harness test 126/126; node src/cli.mjs audit exit 0; lore check exit 0 across 24 files, 0 errors, 0 warnings.

Story coupling: left uncoupled deliberately, on the precedent the tracker set for COS-23. No story covers removing a decision-irrelevant metric from the record, and filing it under measurement trustworthiness would misdescribe it — cost never entered any score, so removing it moved no figure. lore orphans reports it alongside COS-23; lore check is unaffected and exits 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed cost and budget tracking from the harness, the published record and the campaign tracker, and replaced the maxBudgetUsd runaway guard with a wall-clock one.

The dollar figures were never money. They came from the Agent SDK's total_cost_usd, a list-price valuation of tokens the SDK emits whether the caller is on per-token billing or a subscription, and this project runs on a subscription. Cost never entered a style's score either — checks.mjs plus the judge do that — so every figure was telemetry about the test rig that invited budget reasoning into decisions statistical power should drive.

The one part that was not telemetry was matrix.json's run.maxBudgetUsd: it was passed live to the SDK and hard-stopped a runaway cell. Of the three bounds the SDK exposes, only abortController is a true circuit breaker — maxTurns bounds tool rounds but not the time inside one, and taskBudget only tells the model its remaining tokens and asks it to pace itself, which is what a wedged loop will not do. The guard is now run.maxCellSeconds (600), covering the whole cell rather than each turn so a multi-turn case cannot run N times the limit; a tripped cell returns error_timeout and is excluded from every mean like any other errored cell.

Two hazards surfaced while building it. undefined * 1000 is NaN and setTimeout treats NaN as 0, so a config missing the key would have aborted every cell in the matrix instantly and labelled each one a timeout — runCell now throws rather than defaulting. And an abort can end the SDK iterator quietly rather than throwing, which would return a scoreable row with no reply, so a timedOut flag is the authority on the error rather than the thrown exception.

Verified by running, not reading: harness/test/run.test.mjs drives runCell to real aborts through an injected query seam, and both mechanisms were sabotaged on purpose to prove the tests go red. Suite 124 -> 126 (2 cost-only tests removed, 4 guard tests added); audit exit 0; lore check exit 0. Re-scoring the published 12-44-03 arm offline still returns 81.0%, so no published score moved.
<!-- SECTION:FINAL_SUMMARY:END -->
