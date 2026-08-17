---
id: COS-9
title: Make two_options_max see prose option sprawl
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-16 20:54'
updated_date: '2026-08-17 16:07'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read two_options_max and its four existing fixtures; the label-blindness is deliberate and AC #2 protects it.
2. Capture a BASELINE: run 'node src/cli.mjs score' over every saved results/*/rows.json on the unchanged code and store the output, so AC #3 has an old-vs-new diff rather than an assertion.
3. Write the AC #2 regression fixtures FIRST (recommendation-first prose with two alternatives, and the existing labelled two-option reply) so the fix cannot be tuned to AC #1 alone.
4. Change the cap term to key on max(literal labels, estimated prose alternatives) instead of literal labels only. Detect prose sprawl from the signals replies actually carry: a stated count ('three ways/options/approaches'), and pivot markers ('another option', 'alternatively', 'or you could', 'a third approach'). Do NOT attempt semantic alternative-counting; document the residual blind spot in the comment instead of overclaiming.
5. Add AC #1 fixtures: a stated-count sprawl reply and a marker-chain sprawl reply, both scoring below 1.0. Sabotage-verify every new test (revert the fix, confirm the failure lands on the intended test).
6. Re-score every saved run on the new code, diff against the baseline, and correct every published figure the change moves in docs/, FINDINGS.md and the ledger. If nothing moves, show the diff rather than claiming it.
7. Gates: npm --prefix harness test, node src/cli.mjs audit exit 0, lore sync + lore check exit 0 if docs/ changed.
8. Update doc-1 on the branch (COS-9 to Resolved, cursor to COS-20, session log), commit, /code-review high until a round returns nothing structural, PR into dev, rebase-merge, sync dev, fast-forward main, push both, prune.
<!-- SECTION:PLAN:END -->
