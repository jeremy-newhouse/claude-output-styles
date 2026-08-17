---
id: COS-28
title: Reconcile advanced's stated word-count basis with total_length's
status: To Do
assignee: []
created_date: '2026-08-17 18:58'
labels: []
dependencies: []
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
plain-english-advanced.md line 79 says 'Keep the whole reply under 120, headers and code included.' total_length counts words(stripCode(text)) — code fenced or inline is removed before counting. The scored cap is therefore more permissive than the stated one, and the audit reports 'both say 120' because it compares the number and not the basis.

Found by COS-15's by-hand re-read of all three style files against every contract field. It is not a conditional, so COS-15's codeOnRequest machinery does not reach it, and it is outside COS-15's acceptance criteria.

Neither exit is free. Counting code would move every total_length figure ever published, on all three styles. Editing advanced's prose is a style-file change, so it needs a measured arm — advanced's is the most expensive of the three at 207 cells for +/-4 points.

A third option worth pricing: teach the audit to compare the stated BASIS as well as the number, so the disagreement is at least visible while the fix is decided.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The basis advanced states and the basis total_length counts agree, with the choice between changing the prose and changing the count argued rather than assumed
- [ ] #2 Whichever side changes, the effect is measured: a style-file edit gets a real arm, a checks.mjs edit gets all saved rows re-scored and every moved published figure corrected
- [ ] #3 The audit reports a basis disagreement rather than passing it, or it is recorded why it cannot
<!-- AC:END -->
