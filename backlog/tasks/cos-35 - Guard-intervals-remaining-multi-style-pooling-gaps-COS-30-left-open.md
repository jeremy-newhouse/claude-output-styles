---
id: COS-35
title: Guard interval's remaining multi-style pooling gaps COS-30 left open
status: To Do
assignee: []
created_date: '2026-08-31 20:05'
labels: []
dependencies: []
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-30 (resolved this session) added a guard so pairedInterval throws when either side's rows contain more than one styleId — the within-side pooling bug COS-18 hit live. Its own branch review found two more reachable gaps in the same failure class that COS-30's acceptance criteria never asked about:

1. pairedInterval verifies each side individually is single-style, but never checks the two sides' styles match each other. Comparing a single-style intermediate run against a single-style advanced run (e.g. a fat-fingered --before/--after path) passes assertSingleStyle on both sides, and defaultKey (caseId|model) has no style term, so it silently pairs and diffs two unrelated styles and prints a normal-looking interval.

2. singleSampleInterval (harness/src/interval.mjs, the function COS-19 added for single-run judge-figure intervals) has the identical unguarded-pooling defect pairedInterval was just patched for. It groups by caseId only, so a multi-style rows.json (a normal run --styles=a,b artefact) gets its styles silently averaged into one group instead of raising an error — the CLI path (interval --rows=... --metric=...) reaches it directly.

Both are the same reachable-in-normal-use failure class COS-30 exists to prevent, just in the two places COS-30's own scope didn't reach. Not folded into COS-30 because its acceptance criteria are specific to pairedInterval's within-side check; this is intentionally separate follow-up rather than a silently expanded task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 pairedInterval throws when beforeRows' and afterRows' single styleId values differ from each other, naming both
- [ ] #2 singleSampleInterval throws when its rows span more than one distinct styleId, naming the styles found, in the same style as pairedInterval's guard
- [ ] #3 Both error messages tell the caller to filter, matching COS-30's precedent
- [ ] #4 Tests in harness/test/interval.test.mjs cover both new guards and confirm existing single-style/matched-style behaviour is unchanged
- [ ] #5 node src/cli.mjs audit and the full harness test suite still pass
<!-- AC:END -->
