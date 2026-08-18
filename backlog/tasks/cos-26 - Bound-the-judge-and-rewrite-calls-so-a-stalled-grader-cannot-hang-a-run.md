---
id: COS-26
title: Bound the judge and rewrite calls so a stalled grader cannot hang a run
status: Done
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-17 15:27'
updated_date: '2026-08-18 17:20'
labels: []
dependencies: []
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-25 replaced the maxBudgetUsd spend ceiling with run.maxCellSeconds, a wall-clock AbortController guard around each cell in runCell. That guard bounds a cell and nothing else.

Two model calls on the run path remain unbounded. judge.mjs:66 issues its query with no abortController and no timeout, and improve.mjs:215 does the same for the optimizer's rewrite() call. Either one stalling mid-stream hangs the process indefinitely: runCell's guard has already returned and cleared its timer by the time the judge runs, so nothing is left holding a ceiling. A run that has bought hours of cells then sits there with no flush and no stop.

The gap predates COS-25 — maxBudgetUsd never covered either call — so this is not a regression, and COS-25's review deliberately left it out of scope rather than widening that task past its acceptance criteria. COS-25 narrowed the wording in matrix.json, harness/README.md and docs/reference/harness-architecture.md so the docs no longer call maxCellSeconds a run-level guard; this task closes the hole the wording now admits to.

judge.mjs already catches a thrown query error and returns a neutral 0.5 with the failure recorded on the row, so an abort has a landing place that keeps the run alive. improve.mjs's rewrite() needs its own decision about what a timed-out rewrite means for the iteration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A stalled judge query is aborted by a configured wall-clock timeout, and the cell it was grading comes back with the neutral score and a violation naming the timeout, rather than the run hanging
- [x] #2 A stalled rewrite call in improve.mjs is likewise aborted, and the iteration records the failure instead of hanging
- [x] #3 The timeouts are configured in matrix.json rather than hard-coded, and an absent or unusable value fails loudly at startup the way maxCellSeconds does
- [x] #4 Each timeout is proven to actually fire by an executed test driving a wedged query to a real abort, sabotage-verified
- [x] #5 matrix.json, harness/README.md and docs/reference/harness-architecture.md no longer say the judge and rewrite calls are unbounded
- [x] #6 npm --prefix harness test passes, node src/cli.mjs audit exits 0, and lore check exits 0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract run.mjs's cellLimitMs validator into a generic secondsToMs(name, seconds) shared validator, keep cellLimitMs as a thin wrapper (preserves existing tests/messages).
2. judge.mjs: add judgeTimeoutSeconds param, validate via secondsToMs right before the query call (after the two no-call early returns, so tests exercising those don't need a timeout), wire an AbortController into the query options, and name a timeout in the returned violations on both the throw and quiet abort paths, without discarding a real result that raced the timer.
3. improve.mjs: export rewrite() (was internal), add rewriteTimeoutSeconds + injectable deps.queryFn + optional log, same AbortController/timedOut wiring; timeout logs distinctly then still returns '' so the loop's existing "author returned nothing usable" stop path handles it.
4. Thread the new config through: evaluate.mjs -> judge(), rejudge.mjs -> judge(), cli.mjs -> rejudge()/improveStyle(); add run.judgeTimeoutSeconds and improve.rewriteTimeoutSeconds to matrix.json (120s each) with updated //run///improve comment blocks; validate both at CLI startup (fail loud) alongside the existing cellLimitMs check.
5. Tests: sabotage-verified wedge-then-abort tests (throw path + quiet path) for both judge() and rewrite(), missing/bad-config throw tests for both, config.test.mjs assertions on the two new matrix.json keys.
6. Update harness/README.md and docs/reference/harness-architecture.md to describe the new guards instead of calling the calls unbounded; lore sync/check.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented. secondsToMs(name, seconds) in run.mjs is now the shared validator (cellLimitMs delegates to it). judge() and improve.mjs's rewrite() each take a *TimeoutSeconds param, wrap their query() call in an AbortController with the same timedOut-flag pattern runCell already uses (handles both the throw-on-abort and quiet-end-of-iterator abort paths), and name the timeout in what they return rather than silently discarding it. A race where the timer fires just as a real result completes is not misreported: judge() only labels timeout when the output still fails to parse; rewrite() logs but still returns the real body if one came through.
Config: matrix.json gained run.judgeTimeoutSeconds=120 and improve.rewriteTimeoutSeconds=120 (backstops, not tuned figures -- no elapsedMs equivalent exists yet for these calls to tune against). Both validated once at CLI startup (cli.mjs) the same way maxCellSeconds is, before any cell/run.
Verified: npm --prefix harness test = 219/219 (was 214; +5: 2 wedge-then-abort tests for judge, 1 missing-config test for judge, 2 wedge-then-abort+missing-config tests for rewrite -- actually 4 new tests in checks.test.mjs+improve.test.mjs plus 1 in config.test.mjs). node src/cli.mjs audit exits 0. lore check: 24 files, 0 errors, 0 warnings.
Manually confirmed fail-loud at startup for both new keys: temporarily deleted run.judgeTimeoutSeconds from matrix.json and ran `node src/cli.mjs run ...` -> threw "run.judgeTimeoutSeconds must be a positive number -- got undefined" before any cell ran; same for improve.rewriteTimeoutSeconds via `node src/cli.mjs improve ...`. Config restored both times (diff matched only the intended edits afterward).
Docs: harness/README.md and docs/reference/harness-architecture.md no longer say the judge/rewrite calls are unbounded; grepped both plus matrix.json for "unbounded"/"no abortController"/"no timeout" post-edit -- no stale mentions remain.

/code-review high on the full branch diff (8 finder angles + adversarial verification) found no correctness bugs -- the timeout config threading and the timedOut-flag abort race were confirmed provably safe. Three real, non-blocking findings, all fixed on the branch:
1. cli.mjs's run.judgeTimeoutSeconds startup check fired even for `judge --judgements=...`, which spends no judge call (same asymmetry `score` is already excluded from for maxCellSeconds) -- scoped the check to exclude that branch.
2. judge.mjs's judge() and improve.mjs's rewrite() each hand-rolled the same AbortController+timedOut+try/catch/finally block around a single no-tool query() call -- extracted into a shared timedTextQuery({name, timeoutSeconds, prompt, options, queryFn}) in run.mjs, used by both.
3. The wedge-then-abort mock generators in checks.test.mjs and improve.test.mjs were byte-identical -- moved into shared test/abort-helpers.mjs (run.test.mjs's own copies left alone; different shape, pre-existing, out of scope).
Re-verified after the fixes: npm test 219/219, audit exit 0, lore check exit 0, and manually confirmed `judge --judgements=` no longer trips on a missing run.judgeTimeoutSeconds (reaches its own downstream validation instead).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bounded judge.mjs's judge() and improve.mjs's rewrite() query calls with their own AbortController timeouts (run.judgeTimeoutSeconds, improve.rewriteTimeoutSeconds in matrix.json, 120s each), reusing run.mjs's cellLimitMs validator now generalized as secondsToMs. A stalled judge call returns the neutral 0.5 with a violation naming the timeout; a stalled rewrite call is treated as the author returning nothing usable and the iteration stops with a log line naming why. Both configs fail loud at CLI startup on a missing/bad value, same discipline as maxCellSeconds. Verified: npm test 219/219 (5 new tests, including sabotage-verified wedge-then-real-abort tests on both the throw and quiet abort paths for each call), node src/cli.mjs audit exit 0, lore check 0 errors/0 warnings, and manual confirmation that deleting either new config key throws before any cell/run starts.
<!-- SECTION:FINAL_SUMMARY:END -->
