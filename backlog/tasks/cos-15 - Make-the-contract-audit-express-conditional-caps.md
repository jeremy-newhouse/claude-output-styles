---
id: COS-15
title: Make the contract audit express conditional caps
status: To Do
assignee: []
created_date: '2026-08-17 03:45'
labels: []
dependencies: []
references:
  - harness/src/contract-audit.mjs
  - harness/config/contracts.json
  - harness/src/checks.mjs
documentation:
  - docs/specs/style-contracts-by-audience-level.md
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
