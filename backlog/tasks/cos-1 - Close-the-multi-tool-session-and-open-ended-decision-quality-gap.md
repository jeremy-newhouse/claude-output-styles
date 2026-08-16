---
id: COS-1
title: Close the multi-tool session and open-ended decision quality gap
status: To Do
assignee: []
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 12:49'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies: []
references:
  - harness/rejected/README.md
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two scenarios score around 48% on the LLM judge across every style, original and optimized alike: agentic-fix-verify (report a session with many tool calls) and conv-decision-holdout (an open-ended decision with no clean answer).

This is a content gap, not a wording gap. None of the three style files says anything about how to report a session containing a dozen tool calls, or how to handle a decision where neither option is clearly right. Six optimizer rewrites across two rounds all failed to close it, because the optimizer can only re-express rules that already exist.

Fixing this means adding guidance to the style files themselves, plus cases that measure it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the three style files states how to report a multi-tool session in a single final message
- [ ] #2 Each style file states how to handle a decision where neither option is clearly better
- [ ] #3 At least two new harness cases cover these scenarios, one per shape
- [ ] #4 Judge score on agentic-fix-verify and conv-decision-holdout exceeds 65% on both opus and sonnet
<!-- AC:END -->
