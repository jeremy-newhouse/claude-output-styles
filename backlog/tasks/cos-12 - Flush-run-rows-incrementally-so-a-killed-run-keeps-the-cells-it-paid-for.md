---
id: COS-12
title: Flush run rows incrementally so a killed run keeps the cells it paid for
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 05:35'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/run.mjs
  - harness/src/cli.mjs
  - harness/src/improve.mjs
documentation:
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`run` writes `rows.json` only after the entire matrix completes. A killed, crashed or interrupted run loses every cell it has already paid for, including the expensive ones.

The exposure is real and growing. Session 6 ran $12.84 of `run` invocations with this live; session 8 ran a single 50-cell arm costing $6.64 that would have returned nothing if the process had died at cell 49. The follow-up measurement work is deliberately larger than anything run so far — arms of 146 cells per model, on the top tier where a single cell has cost $1.13 — so the amount at risk in one process goes up by an order of magnitude.

`improve` already persists after every style, so the pattern exists in the codebase and this is a matter of applying it to the path that spends the most.

A partial file also has to be readable: `score --rows=` and any offline re-derivation must work on a run that stopped early, and it must be obvious from the file that it is partial rather than complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A run killed partway through leaves a rows.json containing every cell that completed
- [x] #2 A partial rows.json is distinguishable from a complete one without counting cells against the matrix
- [x] #3 score --rows= reads a partial file and reports what it contains rather than failing or silently treating it as whole
- [x] #4 Proved by killing a real run partway and re-scoring what survived, not by unit test alone
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. New module harness/src/results.mjs: writeResults({outDir, rows, stamp, kind, expected, complete}) writes rows.json + run.json manifest + summary.json + report.md, each via write-temp-then-rename so a kill mid-write cannot truncate the paid data. readManifest(rowsPath) reads the sibling run.json.
2. evaluate() gains an onRow callback, fired as each cell resolves inside pool(), carrying the rows completed so far (completion order, not matrix order). No change to its return value.
3. cli.mjs run branch: flush after every completed cell with complete:false, then once more with complete:true when evaluate() returns. Keeps the existing final artifacts identical for a run that finishes.
4. improve's flush switches to the same writer so its runs also carry a manifest — otherwise score cannot tell an improve rows.json apart from a pre-manifest one.
5. cli.mjs score branch: read the sibling manifest and print an explicit PARTIAL / complete / unknown line before the table. Never fail on a partial file.
6. Tests in harness/test/results.test.mjs (writer, manifest shape, atomic replace, readManifest on all three cases) plus an evaluate() onRow test with a stubbed pool. AC #4 needs a real killed run, so also run one small paid haiku run, SIGINT it partway, and re-score the survivors.
7. Docs: harness/README.md, docs/runbooks/measure-and-optimize-an-output-style.md, docs/reference/experiment-ledger.md, docs/reference/harness-architecture.md, story doc. lore sync then lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Design.** rows.json stays a bare array — every run in the ledger is one, score --rows= and every offline re-derivation read it as one, so a wrapper object would have broken all of them. The completeness flag lives in a sibling run.json instead: {kind, stamp, complete, completed, expected, costUsd}.

New module harness/src/results.mjs owns the run directory: writeResults() writes rows.json, summary.json, report.md and run.json, each via a temp file and rename(2) so a kill landing inside a write cannot truncate the one file that holds the paid cells. The manifest is written LAST on purpose — a kill between rows and manifest leaves a manifest that undercounts what is on disk, which reads as less finished than it is; writing it first would let it claim cells that never landed, or claim complete for a file that is not.

evaluate() gained onRows (fired after every completed cell) and deps.runCell (injectable, so the flush is testable without spending). The rows it hands out are indexed by cell, not appended in completion order, so a partial rows.json is ordered exactly like the complete file it would have become.

improve's flush switched to the same writer so its runs carry a manifest too — otherwise score could not tell an improve rows.json from a pre-manifest one. Caught while wiring it: improveStyle calls onRows(rows), and flush's first parameter is the completeness flag, so passing flush bare would have marked every mid-loop flush complete. Wrapped as () => flush().

Stale prose fixed while here: usage.mjs's wantsHelp comment asserted the old once-at-the-end behaviour as a present fact.

**Verification — AC #4 is the one that carries the others.** Two real paid Haiku runs, $0.0898 recorded.

results/2026-08-17T05-29-31-663Z — beginner, Haiku, baseline, 4 conversational cases, repeats 1, concurrency 1, judge on. SIGKILLed (kill -9, no handler, no graceful shutdown) once run.json read completed=2. Survivors: conv-status-auth (rules 0.985, judge 0.62, total 0.802, $0.0256825) and conv-decision-db (rules 1.0, judge 0.58, total 0.79, $0.0424745) — fully scored rows, not stubs. run.json: complete false, completed 2, expected 4, costUsd 0.0682. The killed process printed no 'wrote' line, so nothing but the per-cell flush put those files there. AC #1 and AC #2.

score --rows= on that partial file exited 0 and printed 'PARTIAL run — 2 cells of 4 expected (2 never ran). This run did not finish. Every figure below describes the cells that survived, not the matrix that was requested.' before any table. AC #3.

results/2026-08-17T05-31-40-879Z — the same configuration allowed to finish, 1 cell, $0.0216: run.json complete true, and score prints 'complete run — 1 cell'. Happy path unchanged.

Legacy path: score --rows= on results/2026-08-16T12-44-03-883Z (pre-manifest) prints 'no run manifest beside these rows — completeness unknown' and still reproduces 81.0% at $7.517, the published figure. The flush moved no number.

Spend caveat, recorded in the ledger: the cell in flight when SIGKILL landed had already spent tokens and will never be written, so 05-29-31's $0.07 is the two cells that landed and not what the process cost. Flushing recovers completed cells, not the interrupted one.

Gates: npm --prefix harness test 64 -> 77 (new harness/test/results.test.mjs, 13 cases); node src/cli.mjs audit exit 0; lore check exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
run now re-writes its whole results directory after every completed cell, so a killed arm keeps the cells it paid for instead of returning nothing.

New harness/src/results.mjs writes rows.json, summary.json, report.md and a new run.json completeness manifest, each through a temp file and rename(2) so a kill mid-write cannot truncate the paid data; the manifest is written last so it can only ever undercount. rows.json stays a bare array, because every saved run in the ledger is one and every offline re-derivation reads it as one — the completeness flag lives beside the rows, not inside them. evaluate() gained an onRows callback (fired per completed cell, rows indexed by cell so a partial file is ordered like the complete one it would have become) and an injectable runCell for testing. improve uses the same writer, so both commands produce a manifest. score reads it and names what it is holding before printing a single figure: complete, PARTIAL with the shortfall, or completeness unknown for pre-manifest runs.

Verified by killing a real run, not by unit test alone: a 4-cell paid Haiku run SIGKILLed after 2 cells left both survivors fully scored in rows.json with run.json reading complete false / completed 2 / expected 4, and score --rows= re-read them at exit 0 behind 'PARTIAL run — 2 cells of 4 expected (2 never ran)'. A 1-cell run allowed to finish writes complete true. Re-scoring the published 12-44-03 arm still returns 81.0% at $7.517, so nothing moved. npm --prefix harness test 64 -> 77; audit exit 0; lore check exit 0. Session spend $0.0898.
<!-- SECTION:FINAL_SUMMARY:END -->
