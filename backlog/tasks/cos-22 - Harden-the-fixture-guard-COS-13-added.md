---
id: COS-22
title: Harden the fixture guard COS-13 added
status: To Do
assignee: []
created_date: '2026-08-17 13:41'
updated_date: '2026-08-17 14:16'
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
