---
id: COS-9
title: Make two_options_max see prose option sprawl
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 20:54'
updated_date: '2026-08-17 16:31'
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

SELF-REVIEW ROUND (step 6) — two defects the fix introduced, both found by probing the new detection rather than reading the diff.

1. FALSE POSITIVE on benefit lists. 'It helps in three ways: fewer retries, lower cost, and no drift' scored 0.3 — the cap fired on a status reply offering no choice at all. 'ways' is the one noun in the stated-count set that is routinely a manner adverbial. Fixed: 'ways' must now point at a course of action ('three ways to cut the p95', 'three ways forward'); options/approaches/choices/alternatives/paths/routes stay unconditional, since those already mean 'things to pick between'. Verified against 9 strings — kills 4 false positives, keeps every true positive including 'You have three paths', which is the row-21 reply.

2. THE CHECK READ RAW TEXT. two_options_max ran on text.toLowerCase(), never stripCode(text), while every other prose-shape check in the file strips code first. Pre-existing for the label count; the pivot detection widened it badly, because 'or you can', 'another option' and 'alternatively' are ordinary English in a code comment. Fixed by stripping code for the whole check.

Both got their own tests, and both tests are sabotage-verified: reverting the 'ways to' tightening reds the new test (133/134); reverting stripCode reds it at 0.7 vs 1 (133/134). Note that the first attempt at the stripCode sabotage silently failed to apply and the suite came back green — a green sabotage run is evidence of nothing until the substitution is confirmed on disk, which is how it was caught.

RE-VERIFICATION AFTER THE FIXES
Suite 133 -> 134, all pass. audit exit 0. lore check exit 0.
The per-row and aggregate re-scores were both re-run on the corrected code: identical results. Still exactly one moved row of 96 (22-59-53 / beginner / haiku / reserve-three-options, 1.00 -> 0.70), still 61 of 62 runs byte-identical, still the same three aggregate figures. Neither fix moved anything the first re-score had established.

3. LEDGER QUOTE WAS NOT VERBATIM. The ledger had the reply saying 'you have three paths'; the text is 'You need it faster and have three paths.' Corrected to quote only the verbatim fragment. Same defect class the campaign has hit repeatedly — a claim in prose that reads as a quotation but is not one.

REVIEW ROUND 2 (/code-review high, adversarial subagent) — six findings, all real, all addressed. Two duplicated defects I had already found and fixed by probing (stripCode, the 'three ways' benefit-list false positive). Four were new:

4. THE PIVOT ESTIMATOR WAS NET-NEGATIVE AND HAD TO GO. The reviewer showed a compliant two-option reply scoring 0.70: 'Add the covering index today; it is reversible. Alternatively, raise the cache TTL, which is cheaper but goes stale. I recommend the index — or you could hand it to on-call.' Two connectives, one pair of options, and the check rebuilt the exact defect the label-blindness rewrite existed to remove — on the third attempt to fix this check. It also claimed the pivot regex never fires on real data. VERIFIED INDEPENDENTLY, and the corpus is blunter than the report: across the 96 re-scorable saved rows carrying the check, the connective set matches ZERO times, while the stated count matches exactly two rows, both reserve-three-options (20-41-22 row7 'three ways to', 22-59-53 row21 'three paths'). An estimator with no observed true positive and a live false-positive path is worse than no estimator.
Fixed by splitting the pivots on whether they ASSERT a count or merely imply one. Kept: 'a/the/my second|third|fourth|fifth <option-noun>', which states its own ordinal, and 'another <option-noun>', where each occurrence claims one more than the reply already had (so one of them means two — the cap, not a breach). Dropped entirely: 'alternatively', 'or you could/can'. The reviewer's reply now scores 1.0 and has its own regression test.

5. TWO SOURCES OF TRUTH -> A SILENT NaN. OPTION_WORDS and the count alternation were separate literals. A word added to the regex but not the map made the lookup undefined, Math.max NaN, and both 'counted <= 2' and 'counted > 2' false — the reply would lose the 0.3 cap point with NO evidence line saying why. Fixed: COUNT_WORDS and ORDINAL_WORDS are separate maps and every alternation is built from its own map's keys. A first attempt derived both from one map with an exclusion filter; that was worse — the same class of fragility the finding was about — and was replaced.

6. THE LABEL PATTERN HAD NO TRAILING BOUNDARY. Pre-existing, but this change makes that line the floor of 'counted'. /option\s+([a-d1-4])/ matched ordinary prose: 'the obvious option adds latency, the cheap option burns a week, and the safe option costs nothing' reads as options a, b and c, tripping the cap and emitting the confidently wrong '3 labelled options (cap is 2)' on a reply with no labels. Fixed with \b. Confirmed against the corpus that the boundary changes the label count on 0 of 96 rows, so no saved figure moves.

7. THE 96 DENOMINATOR DID NOT REPRODUCE. Correct and my error. 106 saved rows carry this check; 96 of them are re-scorable, the other 10 naming optimizer-candidate styles with no contract (plain-english-advanced-cand 4, plain-english-intermediate-cand 4, plain-english-advanced-optimized 2) — which is exactly what the score CLI already reports as orphan rows. Ledger now states both numbers and the rule.

SABOTAGE VERIFICATION, ROUND 2
- Connectives put back into the count: 134/135, failure on the new connective test.
- \b removed from the label pattern: 134/135, failure on the boundary test at 0.7 vs 1.
- The first attempt at that second sabotage passed 135/135 because my fixture produced only two pseudo-labels, under the cap. The fixture was wrong, not the fix — corrected to three clauses, and it reds properly.

RE-VERIFICATION
Suite 134 -> 135, all pass. audit exit 0. lore check exit 0.
Per-row and aggregate re-scores re-run on the reworked check: IDENTICAL to the first round. Still exactly one moved row of 96, still 61 of 62 runs byte-identical, still the same three aggregate figures. The AC #3 evidence has now held across four independent versions of the check.

AC #3, STRENGTHENED (found while re-verifying rather than by a review).

Chasing the ADR's published 'two_options_max | Opus 1.00 | Sonnet 0.85' row to its source run was the wrong approach — 12-44-03, the obvious candidate, does not carry this check at all (none of its five cases use it), and no saved run reproduces sonnet 0.85 exactly, so the row may rest on a run that is not in results/.

Settled it a stronger way instead. Splitting the old-vs-new per-row diff by model: 0 of 34 Opus rows move, 0 of 32 Sonnet rows move, and the single moved row is one of the 30 Haiku rows. Both published two_options_max figures are Opus/Sonnet numbers — the ADR row, and FINDINGS.md:205's account of the Sonnet regression — so neither can move whichever run backs it. That is a fact about the whole corpus rather than an argument about which claim rests on which case, and it does not depend on provenance I could not establish.

One near-miss worth recording. A saved-score-versus-current-code comparison flagged 20-10-29 sonnet at 0.80 -> 0.90 and looked like an unreported move. It is not mine: re-running the same comparison against dev's checks.mjs reproduces it exactly, so the gap is the historical label-blindness fix, which FINDINGS.md:205 already documents. The lesson is that 'saved score vs current code' and 'old code vs new code' answer different questions, and only the second one is evidence about this change.

ROUND 3 SELF-PROBE — two more, both mine, both about what the estimators count.

8. A REPLY THAT NAMES A COUNT IN ORDER TO REJECT IT IS READ AS CLAIMING IT. 'You asked whether there are "three options here". There are two. Index or cache. I recommend the index' scores 0.70, and so does 'THREE WAYS TO DO THIS? No. Two.' Telling these apart needs negation scope, which is the semantic path this check explicitly refuses — building a fragile negation heuristic here would be the same mistake as the connectives. Applied the round-2 test instead: does the shape appear in the corpus? No. The stated count fires on exactly two saved rows and both are real sprawl, so its measured precision is 2 of 2. Documented as a known limit in the comment rather than patched.

9. EVIDENCE STRING RENAMED. It said '~3 options presented in prose', which is wrong twice: the count can come from a markdown bullet list or from digits rather than prose, and it is never a count of things actually counted — it is what the reply says it has. Now '~3 options claimed (cap is 2)'. Notes above quoting the old string describe what was true when they were written; the string on the branch is the new one.

Also probed and found correct, no change needed: markdown tables of two options (1.0), 'another way to think about it' as a rhetorical aside (1.0, because one 'another' claims two, which is the cap), 'the second option in the runbook' referring to a document rather than an offer (1.0), digits as a stated count ('3 options' -> 0.70), a four-option claim reporting ~4, and repeated 'another option' accumulating correctly.

Re-score re-run after both: unchanged. One moved row, same figures. Suite 135/135.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored the option cap for replies that never write a label, and did not re-break the reply the label-blindness was written to protect.

THE DEFECT. Dropping the literal 'Option A / Option B' requirement was right and stays right — scoring the label penalised the better reply, the one that leads with its recommendation and names alternatives in prose. But nothing replaced the cap: with no labels present the cap term was free, so three alternatives walked through in prose scored a clean 1.0. That left the deterministic 70% of the score blind on reserve-three-options, the case COS-2 added specifically to test whether a style narrows to two.

THE FIX. The cap keys on max(labelled.size, statedCount, claimedOrdinal, another + 1) — four estimators, all of which require the reply to ASSERT a count rather than merely imply one: a stated count ('three ways to'), a claimed ordinal ('a third approach'), and 'another option', where each occurrence claims one more than the reply already had, so one of them means two — the cap, not a breach. It does not identify alternatives semantically; a reply naming three approaches without asserting a count is still invisible and is the judge's to catch, because counting nouns or sentences would re-break the protected reply. The comment says that, and names the blind spot in the other direction too: a reply that states a count in order to reject it is read as claiming it.

AC #1 verified: three sprawl fixtures — stated count, 'another' run, ordinal chain — all below 1.0 with the evidence string asserted.
AC #2 verified, and written FIRST: three fixtures pin the recommendation-first prose reply at exactly 1.0, and they passed on the unmodified check before the fix existed, which is what makes them a regression guard rather than a restatement of the fix.
AC #3 verified by an old-vs-new diff, not an assertion. A baseline was captured before the check was touched. Of the 106 saved rows carrying this check, 96 are re-scorable (the other 10 name optimizer-candidate styles with no contract); exactly ONE moves — 22-59-53, beginner on Haiku, reserve-three-options, 1.00 -> 0.70 — and it is a true positive: that reply labels two options, tells the reader they 'have three paths', and closes by naming the third in prose. 61 of the 62 saved runs re-score byte-identical. No published figure moves, settled by the model split rather than by tracing provenance: 0 of 34 Opus rows and 0 of 32 Sonnet rows move, and both published two_options_max figures (the one-style-file ADR's 1.00/0.85 row and FINDINGS' Sonnet regression) are Opus/Sonnet numbers. The ledger records the re-score, since results/ is gitignored.

REVIEW. Three rounds, eleven findings, all fixed. The decisive one killed half the original fix: connective pivots ('alternatively', 'or you could') scored a compliant two-option reply at 0.70 — the original defect rebuilt, on the third attempt to fix this check — and auditing them against the corpus showed they matched ZERO of the 96 rows while the stated count matched exactly the two real sprawl replies. An estimator with no observed true positive and a live false-positive path is worse than none, so they came out. Also fixed: the check read raw text where every other shape check strips code; 'three ways' fired on benefit lists; the count alternation and its lookup could drift into a silent NaN that costs a reply the cap point with no evidence line; and the label pattern had no trailing boundary, so 'the obvious option adds latency' read as option A.

GATES. npm --prefix harness test 131 -> 135, all pass. node src/cli.mjs audit exit 0. lore check exit 0, 24 files, 0 errors, 0 warnings. Every new test is sabotage-verified — and two sabotage runs came back green and were wrong, once because the substitution silently failed to apply and once because the fixture was too weak to trip the cap, so each was re-run with the sabotage confirmed on disk. The re-score was re-run after every round of fixes and never changed: one moved row, the same three figures, stable across five versions of the check.
<!-- SECTION:FINAL_SUMMARY:END -->
