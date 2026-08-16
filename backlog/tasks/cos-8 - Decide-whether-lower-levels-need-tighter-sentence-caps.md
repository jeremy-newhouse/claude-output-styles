---
id: COS-8
title: Decide whether lower levels need tighter sentence caps
status: To Do
assignee: []
created_date: '2026-08-16 13:14'
updated_date: '2026-08-16 13:14'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies: []
documentation:
  - docs/specs/style-contracts-by-audience-level.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All three style files state the same sentence and paragraph limits: sentences under 20 words, paragraphs under 4 sentences. Only the reply-length cap differs by level — 80, 100, 120 words.

The harness contracts had invented a differentiation the files never state, grading beginner at 15 words and 3 sentences and intermediate at 18 words. That was a defect and is fixed: contracts now match the files. Correcting it moved measured rule scores up by 0.4 to 1.3 points and changed no conclusion.

The design question the defect exposed is real and unanswered. A reader with no programming background plausibly needs shorter sentences than a technical leader, and the styles currently do not give them any. If they should, the style files are what must change — not the contracts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A decision is recorded on whether beginner and intermediate state tighter sentence and paragraph caps than advanced
- [ ] #2 If tightened, the style files state the new caps and the contracts are updated to match
- [ ] #3 Any change is validated on both models against the current baseline
- [ ] #4 A check exists, or a documented procedure, that catches a style file and its contract disagreeing
<!-- AC:END -->
