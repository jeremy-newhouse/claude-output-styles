---
id: COS-15
title: Make the contract audit express conditional caps
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 18:55'
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
- [ ] #1 The beginner code-block rule and the beginner gloss rule each either audit correctly or are restated so no conditional survives, with the choice argued rather than assumed
- [ ] #2 No style file states a permission its contract cannot express, verified by re-reading all three against the contract fields rather than by running audit alone
- [ ] #3 audit still exits 1 on a genuine disagreement, proved by breaking a contract on purpose and watching the suite go red
- [ ] #4 Any change to a style file is measured, since both cases touch rules that currently score
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
<!-- SECTION:NOTES:END -->
