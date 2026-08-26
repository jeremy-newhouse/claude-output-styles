---
id: COS-30
title: Make interval refuse a before/after file whose rows span several styles
status: To Do
assignee: []
created_date: '2026-08-20 12:40'
updated_date: '2026-08-26 13:26'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/interval.mjs
  - harness/test/checks.test.mjs
type: bug
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`pairedInterval` keys pairs on `caseId|model` (`harness/src/interval.mjs:33`, `defaultKey`). The style is not part of the key.

A `rows.json` holding more than one style is a normal artefact — `run --styles=a,b` writes exactly that. Passing one to `interval --before=` averages every style's rows together on that side of each pair. It raises no error, because both sides still match on case and model, and returns an interval that looks ordinary.

COS-18 hit this live. Comparing a two-style baseline against a one-style candidate reported:

  rules  +1.4 [-0.3, +3.0]     words  -14.8 [-30.9, +1.3]

Filtering the before file to the one style under test, the same two comparisons are:

  rules  +3.0 [+0.1, +5.8]     words  -24.6 [-46.4, -2.8]

Both cross from straddling zero to excluding it. The unfiltered form says the edit did nothing; the correct form establishes two effects. Either number could have been published — nothing in the output distinguishes them.

The tool already refuses mismatched key sets in both directions (`interval.mjs:59-62` throws on an unpaired key on either side). This is the same class of guard and is missing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pairedInterval throws when either side's rows contain more than one distinct styleId, naming the styles found
- [ ] #2 The message tells the caller to filter, rather than only reporting the problem
- [ ] #3 A case in harness/test/checks.test.mjs covers a multi-style before file and a multi-style after file separately
- [ ] #4 Single-style behaviour is unchanged, shown by the existing interval cases still passing
- [ ] #5 COS-18's two published intervals reproduce exactly from the filtered rows after the change
<!-- AC:END -->
