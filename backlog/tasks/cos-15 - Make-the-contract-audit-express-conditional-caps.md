---
id: COS-15
title: Make the contract audit express conditional caps
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 19:11'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/contract-audit.mjs
  - harness/config/contracts.json
  - harness/src/checks.mjs
documentation:
  - docs/specs/style-contracts-by-audience-level.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`node src/cli.mjs audit` compares numbers and cannot express a condition. Beginner's file says "Never show code **unless they ask**"; `maxCodeLines: 0` drops the second half. The audit reports the pair as agreeing, and `code_block_size` scores 0 on any reply containing a code block — including one the reader explicitly asked for, which the style permits.

Documented in `harness/README.md` as a limit of the instrument. That was the right call when it was found; it is now the only known place where a style file and its contract disagree and the guard says they agree, which is precisely the failure mode the guard exists to catch.

COS-4 surfaced a second instance of the same shape, from the other direction. Beginner's core rules say to gloss a technical word if you must use it, and give "I updated the API (the messenger that lets two programs talk)" as the worked example. `no_jargon` regex-matches 28 banned terms with no awareness of a gloss, and "API" is one of them at weight 2 — so a model following the file's own example scores 0.667 on the heaviest-weighted check. The prose states a conditional permission and the contract encodes an unconditional ban.

Both cases are the same defect: the contract language cannot say "unless". Decide whether to extend it or to change the two style files so they state only what the contract can hold, and say which and why.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The beginner code-block rule and the beginner gloss rule each either audit correctly or are restated so no conditional survives, with the choice argued rather than assumed
- [x] #2 No style file states a permission its contract cannot express, verified by re-reading all three against the contract fields rather than by running audit alone
- [x] #3 audit still exits 1 on a genuine disagreement, proved by breaking a contract on purpose and watching the suite go red
- [x] #4 Any change to a style file is measured, since both cases touch rules that currently score
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
DECISION (AC #1): extend the contract language; change no style file. The two conditionals differ in WHAT they are conditioned on, and that decides each.

- The gloss rule is conditioned on the REPLY. A check reads the reply, so the condition is expressible exactly where it is enforced. no_jargon already calls itself 'avoids unglossed jargon' — the contract's intent is already conditional and only the implementation is not. Make no_jargon gloss-aware.
- 'Never show code unless they ask' is conditioned on the REQUEST. A per-style number cannot hold it, so add contract+case language that can: contracts gain codeOnRequest, cases gain requestsCode.
- Restating the prose instead was rejected: the style files are the shipped product and the harness is the instrument. Both prose rules are correct guidance for a real reader. Editing a shipped artifact to fit a scorer is the tail wagging the dog, and it would cost a 148-cell beginner arm to re-measure something the harness never exercises.

1. contract-audit.mjs: recognise request-conditional phrasing per field; new status 'conditional'. Prose conditional + contract expresses it (codeOnRequest) => ok. Prose conditional + contract silent => mismatch/FAIL. Advanced's 'when they carry the point faster than prose' is a judgement condition, not a reader request, and must NOT match.
2. checks.mjs code_block_size: honour caseDef.requestsCode against contract.codeOnRequest. No current case sets it, so no measured figure can move; prove that by re-scoring.
3. checks.mjs no_jargon: a banned term violates only if its FIRST occurrence is unglossed. Gloss forms = the ones the three style files' own worked examples use: TERM (>=3-word parenthetical), and expansion-form '>=2 words (TERM)'.
4. contracts.json: codeOnRequest on beginner and intermediate; absent on advanced.
5. AC #2: read all three files against every contract field by hand, not by running audit. Record every finding; open follow-ups for anything outside these ACs.
6. AC #3: sabotage a contract on purpose in test/contract-audit.test.mjs, assert the mutation landed, watch red, restore.
7. AC #4: no style file changes, so nothing to measure. The checks changes do move saved scores — re-score all saved runs and report exactly what moved and whether any published figure is affected.
8. Docs: harness/README.md's 'It compares numbers, not conditions' section is now wrong; rewrite. lore sync + lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
IMPLEMENTED. contract-audit.mjs gained ON_REQUEST condition patterns, CONDITION_FIELDS, statedCondition() and capSegments(); statedCaps() carries a condition per field; auditStyle() reports a prose conditional the contract cannot hold as a mismatch, and the mirror (contract lifts, prose does not) too. contracts.json gained codeOnRequest on beginner and intermediate. checks.mjs: code_block_size honours caseDef.requestsCode against contract.codeOnRequest, lifting the BAN and never a size cap; no_jargon now grades first use only and forgives two gloss forms, 'TERM (>=3-word phrase)' and '>=2-word expansion (TERM)'.

Defect found and fixed mid-implementation: capSegments() tested PATTERNS (which carry /g for matchAll) with .test(), which advances lastIndex; matchAll copies lastIndex, so the SECOND parse of a body skipped its opening lines and reported a stated cap as 'unstated'. Fixed with non-global clones; regression test 'parsing the same body twice gives the same answer'.

TESTS: 175/175 pass (was 159). audit exits 0.

AC #3 evidence, live at the CLI, both mutations asserted to have landed before the red was believed:
- delete beginner.codeOnRequest -> audit prints 'FAIL plain-english-beginner maxCodeLines both say 0, but the file lifts the cap "unless they ask" and contracts.json sets no codeOnRequest', exit 1, 4 audit tests red. Restored -> exit 0.
- beginner.maxSentenceWords 20 -> 15 -> 'FAIL ... file says 20, contracts.json grades at 15', exit 1. Restored -> exit 0.
Four further mutations on checks.mjs, each asserted landed, each red on its intended test and only that test: gloss detector disabled (2 red), MIN_GLOSS_WORDS 3->0 (1 red), codeOnRequest lifting without a case request (1 red), codeOnRequest lifting a nonzero size cap (1 red). All restored; 41/41 green after each.

AC #4 evidence, old code vs new code on the same saved rows (not saved-score vs current code): 63 saved runs, 651 rows graded, 72 skipped (all optimizer candidates and ad-hoc experiment styles with no contracts.json entry: *-optimized, *-cand, beginner-tight, beginner-baseline-20w). Exactly 6 rows move, all no_jargon, all beginner; code_block_size moves ZERO rows because no case sets requestsCode. Every one of the 6 was hand-read and is a genuine gloss: 'the messenger...(serialization)', 'the name of the repository (the storage place for your project's files)', 'Any pass (token) issued during that swap window', and three of 'the saved copy (cache)'.

REVIEW. /code-review high returned six findings after a self-review had already found three (audit rows missing `condition` on two branches, a standing-fact claim in FINDINGS the change made false, a sample audit failure with the wrong column widths).

The substantive one reversed a call. `codeOnRequest` originally lifted only a ZERO cap, on the reasoning that a ban and a size cap are different things. That ran backwards: intermediate says 'Show code only when asked, OR when a snippet under 5 lines says it faster than prose', where the 'only when X or Y' governs whether to show code and the 5 belongs to the second trigger — so the asked branch states no length, and keeping the 5-line cap there applied a number no reader of the style could find. It also left the flag inert at intermediate while `audit` printed 'both lift it on request', certifying a lift the scorer ignored. Now lifts the whole cap at every level; `describe()` says so at every level too, since that string is what the optimizer is briefed with.

Second real fix: `no_jargon` runs on `stripCode`, which leaves `**` in place, and both gloss forms turn on the bracket being adjacent to the term — so '**API** (the messenger that lets two programs talk)', the bold-label shape beginner's own file uses throughout, read as unglossed. Emphasis markers and a possessive are now stripped before the adjacency test. Latent, not active: zero occurrences across the 63 saved runs, confirmed by re-running the comparison.

Three documentation fixes: 'five of them in these arms' was four (and two inside the paired comparisons the footnote attaches to); the footnote marker sat outside the table cell and would not have rendered; and the two appended queue rows were numbered 20/21 but placed above row 19.

Suite 178 -> 179. Re-score after every fix: still exactly 6 of 651 rows, unchanged, so no finding fix moved a figure.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Extended the contract language rather than editing the style files, because the two conditionals are conditioned on different things.

The gloss is conditioned on the REPLY, which is the string a check already reads — and no_jargon was named 'avoids unglossed jargon' from the start, so only the implementation was unconditional. It now grades first use and forgives two gloss forms: TERM followed by a parenthetical of three words or more, and a two-word-or-longer phrase followed by (TERM). The em-dash appositive is not recognised, because 'the cache — the saved copy' is indistinguishable from 'the cache — tests pass'.

'Unless they ask' is conditioned on the REQUEST, which no check can see, so the condition lives where the request does: codeOnRequest on the contract, requestsCode on the case. It lifts the whole cap at every level, since neither file granting it states a length on the asked branch. The audit fails a prose conditional with no matching contract field, and the mirror too. Only a reader's request counts — advanced's 'when they carry the point faster than prose' is a writer's judgement and stays an ordinary cap.

Restating the two style files was rejected: they are the shipped product, both prose rules are correct guidance for a real reader, and the edit would have cost a 148-cell beginner arm to re-measure something the harness never exercises.

VERIFIED. Suite 159 -> 179, audit exit 0, lore check exit 0. AC #3 proved live: deleting beginner.codeOnRequest makes audit print the FAIL and exit 1, restoring returns it to 0; same for maxSentenceWords 20 -> 15. Six mutations in all, each asserted to have landed before its red was believed, each red only on its intended test. AC #4 needed nothing measured because no style file changed, but the checks change moves saved scores, so all 63 saved runs were re-scored old code against new: 651 rows graded, 72 skipped (all optimizer candidates and experiment styles with no contract), exactly 6 rows moved, all no_jargon, all beginner, every one hand-read and a genuine gloss. code_block_size moved zero rows. Five published figures moved and were corrected. No conclusion changed. AC #2's by-hand read produced COS-27 and COS-28; intermediate's 'when things are normal' was examined and is not a defect, since total_length already grades a soft cap softly.
<!-- SECTION:FINAL_SUMMARY:END -->
