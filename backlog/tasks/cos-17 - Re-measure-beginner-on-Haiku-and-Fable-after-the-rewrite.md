---
id: COS-17
title: Re-measure beginner on Haiku and Fable after the rewrite
status: To Do
assignee: []
created_date: '2026-08-17 03:46'
labels: []
dependencies:
  - COS-11
  - COS-16
references:
  - plain-english-beginner.md
  - harness/config/matrix.json
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 rewrote `plain-english-beginner.md` and measured it on Opus and Sonnet only, because those are the two models its acceptance criteria named. The four-tier baseline table's beginner row is therefore half history and half current, and three documents say so in a footnote rather than carrying a figure.

The gap matters more than a missing column usually would, because the rewrite's mechanism is exactly the thing the four-tier work was about. COS-7 established that word-cap overrun does not track model tier: mean reply words divided by each style's own cap ran Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300, a sequence that turns twice. COS-4 then cut beginner's overrun on the two tiers at the ends of that sequence. Whether the same rewrite moves Haiku and Fable, which sit in the middle and overrun for different reasons, is unknown and is a direct test of whether the fix is a property of the file or of two models.

Fable is deliberately absent from `matrix.models` and has no bare alias — it needs `--models='claude-fable-5[1m]'`, quoted, and `--variants=baseline` named explicitly. Haiku aborts on write-then-verify cases, 5 of 6 on `agentic-fix-verify` and 3 of 6 on `reserve-agentic-session`, so the arm must be sized on cells that return a reply rather than cells launched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beginner measured on Haiku and Fable on the five shared cases at n >= 146 non-errored cells per model, matching the sample size the Opus and Sonnet figures are held to
- [ ] #2 Figures reported beside the existing Opus and Sonnet numbers with the same paired case x model treatment and intervals, not as bare arm means
- [ ] #3 The four-tier table in FINDINGS.md, the epic and the coverage story carries four current beginner columns, and the history footnotes are removed rather than left beside live numbers
- [ ] #4 Whether the rewrite's length effect reproduces on the two middle tiers is stated as a result either way, and read against COS-7's finding that overrun does not track tier
- [ ] #5 Aborted cells are reported separately and excluded from every quoted mean
<!-- AC:END -->
