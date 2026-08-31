---
id: COS-30
title: Make interval refuse a before/after file whose rows span several styles
status: Done
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-20 12:40'
updated_date: '2026-08-31 20:00'
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
- [x] #1 pairedInterval throws when either side's rows contain more than one distinct styleId, naming the styles found
- [x] #2 The message tells the caller to filter, rather than only reporting the problem
- [x] #3 A case in harness/test/checks.test.mjs covers a multi-style before file and a multi-style after file separately
- [x] #4 Single-style behaviour is unchanged, shown by the existing interval cases still passing
- [x] #5 COS-18's two published intervals reproduce exactly from the filtered rows after the change
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add assertSingleStyle guard to pairedInterval in harness/src/interval.mjs: throws when either side's rows span >1 distinct styleId, naming the styles, telling the caller to filter.
2. Add checks.test.mjs cases: multi-style before file throws, multi-style after file throws, existing single-style cases still pass.
3. Verify AC #5 by reproducing COS-18's published rules/words figures from the filtered rows.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fix: added assertSingleStyle(rows, side) to harness/src/interval.mjs, called at the top of pairedInterval for both beforeRows and afterRows. Throws naming the styles found and telling the caller to filter (AC #1, #2). Rows with no styleId field at all (every pre-existing hand-computable test fixture) resolve to a Set of one undefined value and do not trip the guard, so single-style behaviour is unchanged (AC #4).

Tests added to harness/test/interval.test.mjs (not checks.test.mjs, which the task description named — pairedInterval is defined and tested entirely in interval.mjs/interval.test.mjs; checks.test.mjs has no interval import at all. Flagging this explicitly rather than silently writing tests in the wrong file to satisfy AC #3's literal wording): a multi-style-before throw test, a multi-style-after throw test, a no-styleId-field pass-through test, and a real-data regression anchored to COS-18's own saved rows.

AC #5, verified against real data: results/2026-08-20T12-12-10-010Z/rows.json (600 rows, styles plain-english-intermediate + plain-english-advanced) passed unfiltered as beforeRows throws 'beforeRows span multiple styles (plain-english-advanced, plain-english-intermediate)'. Filtered to plain-english-intermediate and paired against results/2026-08-20T12-30-35-376Z/rows.json (300 rows, intermediate only): rules +3.0 [+0.1, +5.8], words -24.6 [-46.4, -2.8] -- exact match to COS-18's published filtered figures. Per-case/model means hardcoded into the new test as COS18_BEFORE_FILTERED/COS18_AFTER since harness/results/ is git-ignored.

FORCE_COLOR=0 npm --prefix harness test: 235/235 pass (231 -> 235, 4 new). node src/cli.mjs audit: exit 0, 12/12 checks agree. lore check: 24 files, 0 errors, 0 warnings (docs/ untouched by this task; ran per lifecycle gate).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
pairedInterval in harness/src/interval.mjs now throws when either side's rows span more than one styleId, naming the styles and telling the caller to filter — the same class of guard it already applies to mismatched key sets. Verified against the real COS-18 run pair (2026-08-20T12-12-10-010Z / 12-30-35-376Z): the unfiltered two-style before file now throws instead of silently pooling styles, and the filtered comparison reproduces COS-18's published rules +3.0 [+0.1,+5.8] and words -24.6 [-46.4,-2.8] exactly. 4 new tests in harness/test/interval.test.mjs (checks.test.mjs, named in the task's AC #3, has no interval coverage at all -- flagged in the notes rather than silently redirected). 235/235 harness tests, audit exit 0, lore check clean.
<!-- SECTION:FINAL_SUMMARY:END -->
