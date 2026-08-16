---
id: COS-4
title: Raise beginner style prose quality
status: To Do
assignee: []
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 12:49'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies: []
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beginner scores lowest of the three styles on the LLM judge — around 55 to 60 percent — while its deterministic rules pass at 92.6 percent. It follows every rule it states and still reads worse than the other two.

The optimizer could not help. Both cross-model rewrites raised train by about 6 points and dropped holdout by about 8, so the keep rule rejected them and the loop converged at v0 having changed nothing. Raising its judge weight to 0.5 did not change the outcome.

The gap is in what the style asks for, not how well it is followed. Judge complaints centre on vague next-steps, restated ideas, and reverting to a helper-assistant register on follow-up turns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beginner judge score exceeds 70% on both opus and sonnet
- [ ] #2 Deterministic rule score stays at or above 92%
- [ ] #3 The change is validated on cases held out of every optimizer split
<!-- AC:END -->
