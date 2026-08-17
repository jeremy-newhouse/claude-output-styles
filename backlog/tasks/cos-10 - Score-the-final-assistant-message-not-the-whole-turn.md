---
id: COS-10
title: 'Score the final assistant message, not the whole turn'
status: To Do
assignee: []
created_date: '2026-08-17 03:44'
labels: []
dependencies: []
references:
  - harness/src/run.mjs
  - harness/src/checks.mjs
  - harness/src/evaluate.mjs
documentation:
  - docs/reference/experiment-ledger.md
  - docs/reference/harness-architecture.md
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`run.mjs` accumulates every assistant text block in a turn with `text += b.text` and no separator. On an agentic turn the model's pre-tool and inter-tool narration is glued to the answer that follows it: "I'll look at the file first.The bug is in ...". Everything downstream then scores the wrong string.

Three consequences, all measured:

- `sentences()` needs whitespace after a full stop and `paragraphs()` needs a blank line, so a run-on scores as one long sentence in one paragraph. Present in 0 of 131 conversational cells and most agentic ones — Opus 3/6, Sonnet 1/7, Haiku 10/12, Fable 5/6, and 6/6 on Fable's `agentic-fix-verify`, where `paragraph_length` reads 16.7 and is measuring the harness rather than the style.
- **The judge reads the same concatenated text.** Every agentic judge score in this project is a measure of the whole turn, not the final message the case rubrics ask about. In 16 of 18 `agentic-fix-verify` cells the saved reply carries pre-update narration, and in all 16 a judge violation quotes it.
- `sentences()` separately merges a list header into its first item, because it does not split on a single newline: "Here's why:\nYou're paying twice." scores as one long sentence. Measured at 12.2% of over-cap sentences. Same subsystem, so it belongs in this task.

This is the blocking defect under COS-1's AC #4, which cannot be measured until an agentic judge score means what it says. It also gates any re-measurement of the published baseline, because fixing it moves agentic numbers already in `docs/` and `FINDINGS.md`.

Note that the fix is not simply "take the last text block". Some rubrics ask about the whole turn on purpose — `agentic-read-report`'s rubric is 'no narration of the search process', which needs the narration to be visible. The right shape is to preserve both and let the scorer choose, not to throw the trace away.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Assistant text blocks are preserved separately rather than concatenated, and the saved row carries both the final message and the full trace
- [ ] #2 Every check and the judge score the string its case rubric actually asks about, with the choice stated per check rather than implied
- [ ] #3 sentences() splits on a single newline so a list header is not merged into its first item
- [ ] #4 New tests in harness/test/checks.test.mjs cover the seam and the list-header case, and fail against the current implementation
- [ ] #5 Every published agentic figure in docs/ and FINDINGS.md is re-derived on the fixed scorer and corrected, or explicitly marked as measured on the old one
<!-- AC:END -->
