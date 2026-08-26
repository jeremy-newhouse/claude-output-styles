---
id: COS-32
title: >-
  Bound intermediate's unrationed comparison rule and settle the
  skip-the-internals contradiction
status: To Do
assignee: []
created_date: '2026-08-20 12:41'
updated_date: '2026-08-26 13:26'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-18
references:
  - plain-english-intermediate.md
  - plain-english-advanced.md
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-18 measured D2 and D4 on intermediate and left both unfixed; it fixed only D1. Run `2026-08-20T12-12-10-010Z`, 600 cells, 0 errored.

**D2 — an unbounded content requirement.** `plain-english-intermediate.md:28`, 'Comparisons like "this is the same pattern we used for sign-up" are good shortcuts. Use them.' — an imperative with no ration, where every other content rule in the file carries one (line 15 'on first use', 16 'one short phrase', 25 'a short gloss the first time', 27 'a one-line why'). Intermediate 26 (7.9%) Opus and 10 (3.4%) Sonnet against advanced's 4 (1.5%) and 3 (1.0%); 18 of the 26 Opus hits land on conv-explain-cache. COS-4's fix for the same shape on beginner was a ration: 'One per reply, not one per idea.'

**D4 — a rule that forbids what another requires.** `:27` 'Name the file or feature; skip the internals' against `:33`'s beat 2, 'how I verified it (tests, manual check)', and the file's own good example at `:50`, '31 tests pass, including a new one for the half-cent case'. A test count is an internal on the plain reading of 27. Intermediate 31 (9.4%) Opus and 28 (9.7%) Sonnet, against advanced's 6 (2.3%) and 15 (5.1%). COS-4's fix on beginner was a carve-out (`plain-english-beginner.md:46`).

**Advanced carries D4 too, weakly, and it is a different instance.** `:23` permits a diff under 10 lines; `:43` forbids pasting back a diff you just wrote. No precedence between them, and on the multi-tool session `:36` governs, every diff in scope is one you just wrote. At 2.3% / 5.1% it may not be worth text risk — decide with the numbers rather than by reading, and record the decision either way.

**COS-18's method finding applies directly here.** Its AC #1 read ranked these two D4 instances backwards: advanced's is the sharper contradiction on the page and fires two to four times less often, because the reply it governs is one the model seldom attempts. Do not rank by how bad the wording looks.

**Measure each edit alone.** COS-16's four-edit bundle showed an Opus reply-length regression that none of its four parts showed, and dropping the one edit that added a rule removed it. A ration and a carve-out both bound rather than add, which is the safer half of that lesson, but they are still two edits.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The D2 ration and the D4 carve-out are measured as separate edits, each at n >= 146 non-errored cells per model on the five shared cases
- [ ] #2 D2 and D4 violation shares are re-counted with COS-18's classifier and recorded before and after
- [ ] #3 A decision is recorded on advanced's D4 instance (line 23 vs line 43), with the measured share behind it, whether or not the text changes
- [ ] #4 No paired interval on rules, judge, composite or words is negative and clear of zero
- [ ] #5 Validated on the reserve split for every style whose text changes
<!-- AC:END -->
