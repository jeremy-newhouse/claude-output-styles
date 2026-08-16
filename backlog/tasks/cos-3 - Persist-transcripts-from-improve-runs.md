---
id: COS-3
title: Persist transcripts from improve runs
status: To Do
assignee: []
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 12:49'
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
- [ ] #1 Each improve iteration writes its train and holdout transcripts under the run directory
- [ ] #2 Total spend for an improve run is reported from the persisted rows, not a separate counter
- [ ] #3 The score command can re-grade an improve run offline with no token spend
<!-- AC:END -->
