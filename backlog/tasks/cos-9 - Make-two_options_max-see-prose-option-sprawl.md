---
id: COS-9
title: Make two_options_max see prose option sprawl
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-16 20:54'
updated_date: '2026-08-17 16:13'
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
- [x] #1 two_options_max scores below 1.0 for a reply that presents three or more distinct alternatives in prose, with a matching case in harness/test/checks.test.mjs
- [x] #2 A reply that leads with one recommendation and names two alternatives in prose still scores 1.0 — the behaviour the current check was deliberately written to protect
- [x] #3 Every figure in docs/ and FINDINGS.md that the re-scoring changes is updated in the same change, or the change is shown to move none
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTATION

checks.mjs: the cap term in two_options_max no longer keys on the literal label count alone. It keys on max(labelled.size, statedCount, pivots+1):
- statedCount — a reply that says its own count: /(three|four|five|six|3-6)\s+(?:\w+\s+){0,2}?(options|ways|approaches|choices|alternatives|paths|routes)/. 'two options' is deliberately absent from OPTION_WORDS: stating two is the rule being followed.
- pivots — the phrases that introduce each alternative past the first: 'another option/approach/...', 'alternatively', 'or you/we could/can', 'a|the|my second/third/fourth/fifth option/approach/...'. Each pivot is one alternative beyond the one the reply opened with, so zero pivots reads as one option, not zero.
Evidence string distinguishes the two: an exact '3 labelled options (cap is 2)' where labels were counted, '~3 options presented in prose (cap is 2)' where the count is an estimate.

What it deliberately does NOT do: identify alternatives semantically. A reply naming three approaches with no stated count and no pivot is still invisible and is the judge's to catch. Counting nouns or sentences would re-break the reply the label-blindness was written to protect, which is the trade the original comment refused. The code comment says this rather than overclaiming the check's reach.

VERIFICATION

npm --prefix harness test: 133/133 pass (was 131 before this change; 2 tests added).
node src/cli.mjs audit: exit 0, all 12 checks agree.
lore check: exit 0, 24 files, 0 errors, 0 warnings.

Sabotage-verified both estimators independently, since a new guard that has never been observed to fail is not evidence:
- Before any src change, the new AC #1 test failed on 'expected sprawl below 1, got 1' and the new AC #2 test passed — the AC #2 guard is a real regression guard, not a tautology (132/133).
- Stated-count estimator disabled (stated ? OPTION_WORDS[...] : 0 -> 0): 132/133, failure lands on the AC #1 test.
- Pivot estimator disabled (pivots.length + 1 -> 1): 132/133, failure lands on the AC #1 test.
- Restored: 133/133.

AC #3 RE-SCORE

Captured a baseline before touching the check, then re-scored on the new code and diffed both per-row and in aggregate.
- Per-row: a probe scored two_options_max on every saved row across all 62 results/*/rows.json — 96 rows carry the check. Exactly ONE moved: 2026-08-16T22-59-53-852Z row 21, plain-english-beginner, haiku, reserve-three-options, 1.00 -> 0.70, evidence '~3 options presented in prose (cap is 2)'.
- That row is a true positive, not a false one. The reply labels Option A and Option B, opens 'you need it faster and have three paths', and closes by naming the third — 'The index option splits the difference'. Two labels, three alternatives: the exact blind spot, on the one case written to provoke it.
- Aggregate: 'node src/cli.mjs score' over all 62 runs, diffed against the baseline. 61 of 62 byte-identical. The one that moved: beginner@haiku 63.4% -> 63.3% (rules unchanged at 86.9%), reserve-three-options 67.0% -> 66.7% (rules 89.4 -> 89.0), reserve split rules 88.1 -> 88.0.
- No published figure moves. 'reserve-three-options' appears in no doc outside backlog and archived handovers. The published claims about run 22-59-53 are the 90.9-96.0 rule-compliance range on the five shared cases (conv-status-auth, conv-status-holdout, conv-explain-cache, conv-followup-drift, agentic-read-report), the 37.5-62.2 judge range, and its six aborted cells — none of which includes a reserve case, and judge scores are saved rather than re-derived. The three figures the task flagged as at risk (docs/adr/ship-one-style-file-for-every-model.md two_options_max row 1.00/0.85, FINDINGS.md 'regressing on Sonnet 1.00 -> 0.50', docs/reference/experiment-ledger.md) all sit on runs the per-row diff shows unmoved.
- The 63.4 that appears in docs/adr/reject-harness-level-reinforcement-of-style-rules.md and FINDINGS.md is a coincidental match: it is a judge column for an Opus variant experiment, unrelated to run 22-59-53.

DOCS

docs/reference/experiment-ledger.md: the 'Instruments needed fixing mid-project, twice' lesson read as the final word on two_options_max and no longer was. Added the third pass — what the first fix over-corrected, what COS-9 restored, the one row that moved, that no published figure moved, and what the check still cannot see. results/ is gitignored, so the ledger is the durable record of this re-score.
<!-- SECTION:NOTES:END -->
