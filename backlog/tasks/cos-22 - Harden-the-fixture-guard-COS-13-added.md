---
id: COS-22
title: Harden the fixture guard COS-13 added
status: In Progress
assignee:
  - '@jeremy'
created_date: '2026-08-17 13:41'
updated_date: '2026-08-18 14:50'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies:
  - COS-13
references:
  - harness/test/fixture.test.mjs
  - harness/fixtures/repo/src/pricing.js
documentation:
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-13 added \`harness/test/fixture.test.mjs\` because the agentic fixture had shipped a red test suite for the whole project and nothing in the harness suite executed it. The guard works, but a review of the merged branch found it is weaker than the invariants it claims to enforce, and one of its gaps had already fired unnoticed on the branch that introduced it.

Four gaps, all in the guard rather than in the fixture:

1. **A skipped suite reads as green.** `verdict()` gates on exit status 0, zero failures, and an assertion count taken from source text. A suite whose tests are all `{ skip: true }` reports `fail 0`, exits 0, and still counts its assertions from the file, so every guard passes. This is the same silent hole the guard's own header comment says it exists to close ("An empty suite is not a green suite"). Reproduced during review: replacing the fixture's two tests with skipped bodies asserting 999999 left all guards green.

2. **The pinned-value scan covers only the test file, not the source.** The guard asserts that neither 850 nor 849 appears where the model reads, but scans `test/pricing.test.mjs` only. `src/pricing.js` is read by every agentic case, and commit `acadf1b` — the commit that added this guard — shipped a `BUG:` comment in that file spelling out both values, with all guards green. It was caught by hand in a later review pass, not by the check. The leak itself was fixed before merge; the gap that let it through was not.

3. **The `npm test` spawn swallows its own failure mode.** It asserts only `r.status === 0`. When `npm` is not on PATH, `spawnSync` returns `status: null` with `stdout`/`stderr` null and the cause on `r.error`, so the assertion fails with an empty message and points a maintainer at the fixture instead of the environment. It also does not go through `verdict()`, so an `npm test` that exits 0 without running anything passes.

4. **The pinned-value check is a naive substring match** over the whole file including comments, so `8500`, `1850` and `849` inside unrelated arithmetic all trip a guard whose failure text accuses the fixture of leaking the bug's location.

A fifth, separate point the same review raised: `docs/stories/make-the-measurements-trustworthy.md` states flatly that the fix "preserves the difficulty of `reserve-agentic-session`, the case that withholds both the bug and the file on purpose". The source still carries a literal `BUG:` marker naming the function, the defect and the reproducing input, so `grep -rn BUG` hands that case its answer in one command. The marker is deliberate — `agentic-read-report` asks whether the file has a bug — but the difficulty claim should be qualified rather than stated flat, since it is the same failure mode that asserting 849 was rejected for.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A fixture whose tests are all skipped or todo fails the guard, demonstrated by making the change and observing the failure
- [ ] #2 The pinned-value scan covers every file the model reads under fixtures/repo, not just the test file, and reintroducing the acadf1b BUG comment fails the guard
- [ ] #3 The npm test guard surfaces spawn errors in its failure message and verifies that tests actually ran
- [ ] #4 The pinned-value match cannot be tripped by an unrelated number that merely contains 850 or 849
- [ ] #5 The reserve-agentic-session difficulty claim in docs/stories/make-the-measurements-trustworthy.md is qualified to account for the BUG marker, or the claim is withdrawn
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. verdict() in harness/test/fixture.test.mjs: parse the `pass`/`skipped`/`todo` counts from the `ℹ` summary lines (already emitted by node --test) and require skipped===0, todo===0, pass>=2 alongside the existing checks, so a suite whose tests are all skip/todo fails the guard (AC1).
2. Replace the pinned-value test's single-file scan with a recursive walk of every file under fixtures/repo (readdirSync recursive), and switch the 850/849 match from .includes() substring to a \b850\b / \b849\b word-boundary regex so 8500/1850 don't false-positive while src/pricing.js is covered (AC2, AC4).
3. Fix the npm-test guard test: run the same verdict() parsing against npm test's output (not just r.status===0), and surface r.error?.message in the assertion failure when spawnSync itself fails (AC3).
4. Add sabotage-verified regression tests, one per gap, proving each is caught: all-skipped fixture copy, a reintroduced acadf1b-style BUG comment naming 850/849 in src/pricing.js, an unrelated 8500/1850 number that must NOT trip the guard, a missing-npm spawn error surfaced in the message, and an npm test script that exits 0 without running anything.
5. Edit docs/stories/make-the-measurements-trustworthy.md (outside lore-managed regions) to qualify the reserve-agentic-session difficulty claim: src/pricing.js still carries a literal BUG: comment locatable by one `grep -rn BUG`, so the remaining difficulty is search, not comprehension - deliberate for agentic-read-report, but overstated for reserve-agentic-session. Then `lore sync` and `lore check` must exit 0.
6. Run npm --prefix harness test, confirm the full suite is green with the new cases counted.
7. Verify each of the 5 ACs against objective evidence (test output, grep) and check them off; record the final summary.
<!-- SECTION:PLAN:END -->
