---
id: COS-7
title: Measure the styles on Fable
status: To Do
assignee: []
created_date: '2026-08-16 13:07'
updated_date: '2026-08-16 13:08'
labels:
  - 'doc:stories/extend-measurement-coverage'
dependencies: []
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fable is the top model tier and has never been measured. All coverage to date is Opus and Sonnet, plus a Haiku task that tests the opposite end.

The two ends test different things. Haiku asks whether a style file carries its own weight under a model likely to drop instructions. Fable asks whether a more capable model needs the file at all, and whether it drifts further from a stated cap in the direction it already leans — Opus already overruns word caps roughly twice as often as Sonnet, so tier and verbosity may be correlated rather than model-specific.

Fable is also the tier used for the longest-running agentic work, which is where the styles are weakest: agentic-fix-verify scores around 48% on the judge across every style and both measured models.

The SDK model value is claude-fable-5[1m]; there is no bare fable alias in the model list. Note Fable is the most expensive tier — scope the case set before running.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three styles measured on Fable across the standard case set, rules and judge reported separately
- [ ] #2 Per-model comparison in FINDINGS.md covers Fable alongside opus, sonnet, and haiku
- [ ] #3 Whether word-cap overrun tracks model tier is answered from the Opus, Sonnet, and Fable figures
- [ ] #4 The one-file-for-every-model decision is confirmed for Fable or amended
<!-- AC:END -->
