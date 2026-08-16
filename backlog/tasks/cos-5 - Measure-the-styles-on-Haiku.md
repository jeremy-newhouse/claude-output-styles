---
id: COS-5
title: Measure the styles on Haiku
status: To Do
assignee: []
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 12:49'
labels:
  - 'doc:stories/extend-measurement-coverage'
dependencies: []
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
matrix.json lists haiku as a target model but no style has ever been run against it. Every measurement in the project covers opus and sonnet only.

Haiku is the cheapest model and the most likely to drop instructions under load, so it is the strongest test of whether a style file carries its own weight. It may also expose rules that the larger models satisfy by disposition rather than instruction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three styles measured on haiku across the standard case set
- [ ] #2 Per-model comparison in FINDINGS.md covers haiku alongside opus and sonnet
- [ ] #3 Any haiku-specific failure mode is recorded, or its absence stated
<!-- AC:END -->
