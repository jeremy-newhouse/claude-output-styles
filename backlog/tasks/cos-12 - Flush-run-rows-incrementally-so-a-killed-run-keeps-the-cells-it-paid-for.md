---
id: COS-12
title: Flush run rows incrementally so a killed run keeps the cells it paid for
status: To Do
assignee: []
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 03:51'
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
- [ ] #1 A run killed partway through leaves a rows.json containing every cell that completed
- [ ] #2 A partial rows.json is distinguishable from a complete one without counting cells against the matrix
- [ ] #3 score --rows= reads a partial file and reports what it contains rather than failing or silently treating it as whole
- [ ] #4 Proved by killing a real run partway and re-scoring what survived, not by unit test alone
<!-- AC:END -->
