---
id: COS-26
title: Bound the judge and rewrite calls so a stalled grader cannot hang a run
status: To Do
assignee: []
created_date: '2026-08-17 15:27'
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
- [ ] #1 A stalled judge query is aborted by a configured wall-clock timeout, and the cell it was grading comes back with the neutral score and a violation naming the timeout, rather than the run hanging
- [ ] #2 A stalled rewrite call in improve.mjs is likewise aborted, and the iteration records the failure instead of hanging
- [ ] #3 The timeouts are configured in matrix.json rather than hard-coded, and an absent or unusable value fails loudly at startup the way maxCellSeconds does
- [ ] #4 Each timeout is proven to actually fire by an executed test driving a wedged query to a real abort, sabotage-verified
- [ ] #5 matrix.json, harness/README.md and docs/reference/harness-architecture.md no longer say the judge and rewrite calls are unbounded
- [ ] #6 npm --prefix harness test passes, node src/cli.mjs audit exits 0, and lore check exits 0
<!-- AC:END -->
