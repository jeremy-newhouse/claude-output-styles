---
id: COS-9
title: Make two_options_max see prose option sprawl
status: To Do
assignee: []
created_date: '2026-08-16 20:54'
updated_date: '2026-08-17 03:52'
labels:
  - 'doc:stories/harden-the-optimizer-loop'
dependencies: []
documentation:
  - harness/src/checks.mjs
  - docs/stories/harden-the-optimizer-loop.md
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
two_options_max counts only literal "option a/b/1/2" labels, so a reply that walks through three or four alternatives in prose and recommends one scores a perfect 1.0. Verified: a three-option prose reply naming an index, a cache and a vendor, with a recommendation and trade-offs, scores 1.000 on the check.

The label-blindness is deliberate — the comment in checks.mjs records that scoring the literal label penalised the better reply, which leads with the recommendation and names the alternatives in prose. That reasoning still holds. The gap is that nothing replaced it: the check now rewards structure it cannot actually see, and option sprawl is only caught when the model happens to label its options.

Found reviewing COS-2, which added reserve-three-options — a reserve case whose whole purpose is to present three options and see whether the style narrows to two. On that case the deterministic 70% of the score is blind to the failure, leaving the judge alone to catch it, on the smallest split in the pool.

Note for whoever takes this: changing checks.mjs moves scores that are already quoted in docs/ and FINDINGS.md. Re-score the saved rows offline (node src/cli.mjs score --rows=...) and update every figure the change invalidates, in the same change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 two_options_max scores below 1.0 for a reply that presents three or more distinct alternatives in prose, with a matching case in harness/test/checks.test.mjs
- [ ] #2 A reply that leads with one recommendation and names two alternatives in prose still scores 1.0 — the behaviour the current check was deliberately written to protect
- [ ] #3 Every figure in docs/ and FINDINGS.md that the re-scoring changes is updated in the same change, or the change is shown to move none
<!-- AC:END -->
