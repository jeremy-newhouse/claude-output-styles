---
id: COS-3
title: Persist transcripts from improve runs
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 14:55'
labels:
  - 'doc:stories/harden-the-optimizer-loop'
dependencies: []
references:
  - harness/src/improve.mjs
documentation:
  - docs/stories/harden-the-optimizer-loop.md
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The improve loop spends most of the money in this project but writes no rows.json. Its cells cannot be re-scored offline after a check is fixed, cannot be audited, and do not appear in any spend total — the only reason the loop's cost is known at all is a spentUsd counter added late.

Every run command already persists rows, summary, and a markdown report per invocation. The loop should do the same per iteration, so a completed optimization is as inspectable as a single run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each improve iteration writes its train and holdout transcripts under the run directory
- [x] #2 Total spend for an improve run is reported from the persisted rows, not a separate counter
- [x] #3 The score command can re-grade an improve run offline with no token spend
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Tag every row produced inside the improve loop with the iteration number and the phase that produced it (baseline vs candidate), and accumulate them in improveStyle instead of discarding them.
2. Write per-iteration transcripts under the run directory: candidates/<styleId>.v<i>.<split>.json for every iteration including the v0 baseline (AC #1).
3. Return the accumulated rows from improveStyle; cli.mjs writes an aggregated results/<stamp>/rows.json plus summary.json after each style, matching what the run command already writes and keeping the same crash-safety as improve.json.
4. Derive total spend by summing costUsd over the persisted rows and delete the spentUsd accumulator, so the reported number is reproducible from disk (AC #2).
5. score needs no new path resolution: newestRows() already globs results/*/rows.json, so an improve run becomes discoverable the moment step 3 lands. Add a byIteration grouping to summarize (only when rows carry iterations) so an offline re-grade of an improve run is readable per iteration.
6. Add harness/test/improve.test.mjs for the tagging, per-iteration file layout and spend derivation with a stubbed evaluate; point npm test at the whole test directory so new files are picked up.
7. Prove it with one real minimal improve run (one style, one model=haiku, repeats=1, iterations=1) and then score --rows=<that run>/rows.json offline, recording the stamp and the zero-spend evidence in the notes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Design decision on where improve rows live (AC #3): improve now writes rows.json/summary.json/report.md at results/<stamp>/, the same paths and shapes the run command uses. score needed no new path resolution — newestRows() already globs results/*/rows.json, so an improve run became discoverable the moment the write landed. The alternative (teaching score a separate improve layout) was rejected: it would have added a second discovery path for no gain.

Rows are tagged with the iteration that produced them (0 = baseline) and each iteration's cells are also written separately as candidates/<style>.v<N>.<split>.json. Reverted iterations are persisted too — the rewrites that failed are most of what the money bought. summarize() gained a byIteration grouping that appears only when rows carry iterations, so a plain run's output is unchanged.

improveStyle now takes an optional deps { evaluate, rewrite } so the persistence can be tested without spending anything; both are the loop's only boundaries to the outside world. improve.json is written with the rows stripped out, so it stays a summary of the loop rather than a duplicate of rows.json.

Docs updated for statements the change made false: docs/reference/harness-architecture.md said improve does not yet persist rows; docs/reference/experiment-ledger.md said improve writes candidates but no rows; harness/README.md documented offline re-scoring as a run-only property. The runbook and the ledger's optimizer table also gained the new run.

VERIFICATION — real improve run, results/2026-08-16T14-48-09-866Z/ (beginner, Haiku, repeats 1, iterations 1, baseline variant). 18 cells, $0.6097, exit 0.

AC #1 — the run directory holds candidates/plain-english-beginner.v0.train.json, .v0.holdout.json, .v1.train.json, .v1.holdout.json. rows.json has 18 rows grouping exactly as { v0 train: 5, v0 holdout: 4, v1 train: 5, v1 holdout: 4 }, matching the 5 train / 4 holdout case pool over the baseline plus one candidate. Iteration 1 was REVERTED and its transcripts are present anyway.

AC #2 — summary.json totalCostUsd 0.6097 equals the sum of costUsd over the 18 persisted rows (0.6097) and equals improve.json spentUsd 0.6097. The spentUsd accumulator is deleted; the number now comes from spendOf(rows). Unit test 'spend is the sum of the persisted rows, not a counter' asserts the identity r.spentUsd === spendOf(r.rows).

AC #3 — 'node src/cli.mjs score --rows=results/2026-08-16T14-48-09-866Z/rows.json' re-graded the run and reproduced all four of the live loop's own numbers to three decimals: v0 train 65.4% / v0 holdout 71.6% / v1 train 62.5% / v1 holdout 52.3% against the loop's logged 0.654 / 0.716 / 0.625 / 0.523. 'node src/cli.mjs score' with no arguments now discovers the improve run unaided. Zero spend proved by re-running the same command with ANTHROPIC_BASE_URL=http://127.0.0.1:1 and ANTHROPIC_API_KEY=invalid-on-purpose: identical output, exit 0, so no API call was made; no new results directory was created (13 before and after).

Gates: npm --prefix harness test 18/18 pass (11 pre-existing + 7 new in harness/test/improve.test.mjs). checks.mjs is unchanged, so no new case was required there. The npm test script now globs test/*.test.mjs — it named checks.test.mjs explicitly and would have silently skipped the new file.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
improve now persists every cell it measures. Each iteration writes its train and holdout transcripts to results/<stamp>/candidates/<style>.v<N>.<split>.json, and the run as a whole writes rows.json, summary.json and report.md at results/<stamp>/ — the same shapes and paths a plain run uses, with an iteration tag on every row. Because score's newestRows() already globs results/*/rows.json, an improve run became re-scorable offline with no change to score itself. The spentUsd counter is gone: total spend is summed from the persisted rows via spendOf(). summarize() gained a byIteration grouping that appears only for improve rows, leaving plain-run output untouched.

Verified by a real run, results/2026-08-16T14-48-09-866Z (beginner, Haiku, 1 iteration, 18 cells, $0.6097). The four expected transcript files exist and rows group 5/4/5/4 across v0 and v1 including the reverted iteration; summary totalCostUsd equals the row sum equals improve.json spentUsd at 0.6097; and score --rows on that directory reproduced the loop's own 0.654/0.716/0.625/0.523 exactly, still exit 0 with the API pointed at a dead socket, creating no new results directory. npm --prefix harness test 18/18, with 7 new cases in harness/test/improve.test.mjs driving the loop through injected deps. Docs corrected where they stated improve persists nothing: harness/README.md, docs/reference/harness-architecture.md, docs/reference/experiment-ledger.md, docs/runbooks/measure-and-optimize-an-output-style.md.
<!-- SECTION:FINAL_SUMMARY:END -->
