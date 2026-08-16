---
id: COS-2
title: Hold a case pool out of every optimizer split
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
