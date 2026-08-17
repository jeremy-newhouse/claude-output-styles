---
id: COS-13
title: Fix the agentic fixture's contradictory assertion
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 13:35'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies:
  - COS-10
references:
  - harness/fixtures/repo/test/pricing.test.mjs
  - harness/fixtures/repo
documentation:
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`harness/fixtures/repo/test/pricing.test.mjs` asserts that `applyDiscount(999, 15)` is 850 while its own comment computes 849.

Every agentic case asks the model to work in this repo, and several ask it to fix the rounding bug and run the tests. A model that correctly replaces `Math.floor` with rounding then breaks a currently-passing test, and has to decide unaided whether the test or the code is wrong. Some models edit the assertion, some report the failure, some revert their own fix. That is scoring noise on every agentic case, including the two now sitting on `improve`'s reserve adoption gate.

It is pre-existing and was raised rather than patched under COS-1 because fixing it moves published agentic numbers. The follow-up measurement work re-derives those numbers anyway, so the reason to defer has gone.

Decide which of the two is right and make the fixture say so once. Then check the rest of the fixture for the same class of problem — this one was found by reading a transcript, not by a check, so there is no reason to believe it is the only one.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The fixture states one arithmetic answer, and the assertion and its comment agree
- [x] #2 The intended bug is still present and still discoverable — the fix must not accidentally remove what the agentic cases exist to find
- [x] #3 The whole fixture is checked for further self-contradictions and the result is recorded either way
- [x] #4 Agentic figures published in docs/ and FINDINGS.md are re-derived after the change, or marked as measured on the contradictory fixture
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Establish ground truth by running the pristine fixture suite, not by reading it. Done first: `node --test test/pricing.test.mjs` on a clean tree gives 2 pass, 1 FAIL — `priceOrder` expects 966, actual 965. The suite is red on arrival, which the task description does not mention and which is a second, independent defect.

2. Settle AC #1. Three candidate answers for the 999/15 assertion: (a) assert 849, the intended post-fix value; (b) assert 850, the current truncating value, with an honest name and comment; (c) drop the assertion. Choose against one invariant — after a correct fix the suite must be green, because a suite that breaks when the model does the right thing is precisely the adjudication noise COS-13 exists to remove. (b) fails that invariant. (a) and (c) both satisfy it, so decide between them on AC #2.

3. Settle AC #2 on the same decision. (a) makes the suite red on arrival with a failure that names the file and the expected value, which hands `reserve-agentic-session` — the one case that deliberately withholds bug and file — its answer from one command, and re-creates for `reserve-agentic-write` exactly the unrelated-red-test noise that defect 3 causes today. (c) keeps the suite green before and after, so no case's difficulty moves and discovery stays where it belongs, in the code. Take (c). Verify no coverage is lost: `applyDiscount` is still exercised by the 1000/33 case, whose value is identical under floor and round.

4. Fix the two remaining self-contradictions found by reading every line of both fixture files (AC #3): the `applyDiscount` comment says a 33% discount 'yields 670 instead of 670' — a number differing from itself, and the cited case does not exhibit the bug at all since 1000*0.33 is exactly 330 — and the `priceOrder` assertion is simply arithmetically wrong. Rewrite the comment onto a case that does exhibit the bug, keeping the 'BUG:' marker so discoverability is unchanged. Correct the assertion to 965 and show the arithmetic inline so it cannot drift again.

5. Check the rest of the fixture and record the result either way, as AC #3 requires: `lineTotal`, `withTax`, `priceOrder` composition, the module header comment, and the two surviving assertions.

6. Settle AC #4 by labelling, not re-deriving. Re-running agentic cells now would measure twice, which is the one thing the user's confirmed campaign order exists to avoid — items 12 and 13 (COS-21, COS-19) rebuild the published record. Extend the label COS-10 already established in FINDINGS.md, docs/reference/experiment-ledger.md and harness/README.md rather than writing a second, differently-worded one beside it.

7. Gates: `npm --prefix harness test`; `node src/cli.mjs audit` exit 0; `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync` then `lore check` exit 0. Re-run the fixture suite to prove it is green on arrival.

8. Tracker doc-1 on the branch (COS-13 to Resolved, cursor to COS-14, session log), commit with Refs: COS-13, /code-review high, push, PR into dev, rebase-merge, sync, promote main, prune.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## What was found

The reported defect was one of three of the same shape, and it was not the worst one.

**1. The suite was red on a clean checkout.** `priceOrder applies discount then tax` asserted 966; the code returns 965. Verified before touching anything: `node --test test/pricing.test.mjs` in `harness/fixtures/repo` gave `tests 3 / pass 2 / fail 1`, `AssertionError 965 !== 966` at `test/pricing.test.mjs:15`. 966 is exactly what you get taxing *before* discounting (confirmed: `applyDiscount(withTax(1000,'US'),10)` = 966), so the number contradicted the test's own name — the same defect shape as 850-vs-849, one line down. `workspace.mjs` copies this fixture into every workspace and three of the four agentic cases ask the model to run the tests (`agentic-fix-verify`, `reserve-agentic-write`, `reserve-agentic-session`), so every model that ran them met a failure it had not caused and that had nothing to do with the rounding bug. The task description does not mention this; it was found by running the fixture rather than reading it.

**2. The reported 850-vs-849 contradiction**, as described.

**3. The source comment was self-contradicting and cited a non-example.** `// BUG: ... a 33% discount on 1000 cents yields 670 instead of 670` says a number differs from itself, and 1000*0.33 is exactly 330, so floor and round agree there and the cited case does not exhibit the bug at all. This is the comment that tells the model what the bug *is* — it is what `agentic-read-report` reads.

**4. The module header** claimed 'cents everywhere except the public API' while every exported function takes and returns cents.

## The decision behind AC #1 and AC #2

Three candidates for the 999/15 assertion: assert 849 (the fixed value), assert 850 (the current value, with an honest name and comment), or drop it. Decided against one invariant: **after a correct fix the suite must be green**, because a suite that breaks when the model does the right thing is exactly the adjudication noise this task exists to remove. That kills 'assert 850'.

Between 'assert 849' and 'drop it', AC #2 decides. Asserting 849 makes the suite red on arrival with a failure naming both the file and the expected value — which hands `reserve-agentic-session` its answer from one command, and that case exists to withhold both (its own note in cases.json: 'withholds both, which forces search, read, run, edit and re-run'). It would also re-create for `reserve-agentic-write` the same unrelated-red-test noise that defect 1 causes today. So: drop the assertion. No coverage is lost — `applyDiscount` is still exercised by the 1000/33 case, whose value is identical under floor and round.

Result: green before *and* after a correct fix, and the bug discoverable only by reading the code, which is where the agentic cases put it.

## Verification

- Pristine fixture: `pass 2 / fail 0`.
- Same fixture with `Math.floor` -> `Math.round` applied in a temp copy: `pass 2 / fail 0`. The bug is still present and still behavioural: pristine `applyDiscount(999,15)` = 850, fixed = 849.
- Full sweep of every function, comment and assertion (AC #3), each recomputed independently: `lineTotal` (2 cases), `applyDiscount` (3, including both comment claims), `withTax` (US/UK/DE/unknown-country), `priceOrder` (composition order, defaults), and both surviving assertions. All OK. The composition check also proved the test name is discriminating: discount-then-tax = 965, tax-then-discount = 966.
- `npm --prefix harness test` 112 -> **116**; `node src/cli.mjs audit` exit 0; `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync` then `lore check` exit 0 (24 files).

## The new guard, and two defects in it

Added `harness/test/fixture.test.mjs` — the task notes this defect 'was found by reading a transcript, not by a check', and nothing in the suite executed the fixture. Four assertions: green on arrival, green after a reference fix, the bug still present, and no assertion pinning 850/849.

It was written wrong twice, and both were caught by deliberately breaking the fixture rather than by the tests passing.

- **It could not fail.** `node --test` sets `NODE_TEST_CONTEXT=child-v8`; the child inherited it, reported over a serializer channel instead of exiting non-zero, and `execFileSync` never threw. Reintroducing the 966 assertion left all 116 green. Fixed by scrubbing the variable and using `spawnSync` with an explicit status check.
- **An empty suite counted as green.** `node --test` reports a file containing no tests as `pass 1`, so a 'pass count > 0' liveness check accepted a fixture whose tests had been deleted. Fixed by comparing reported passes against the number of `test(` declarations in the file.

Falsification sweep after both fixes — each scenario applied to the real fixture, full suite run, then reverted: reintroduce 966 -> 2 failures; reintroduce the 850 assertion -> 2 failures; 'fix' the bug in the fixture itself -> 2 failures; delete the fixture's tests -> 2 failures; restored -> 116/116.

## AC #4 — labelled, not re-derived

Re-running agentic cells now would measure twice, which is the one thing the user's confirmed campaign order exists to avoid: items 12 and 13 (COS-21, COS-19) rebuild the published record. So the figures are labelled, extending the wording COS-10 established for the glued turn rather than inventing a second one beside it. Four places, each next to the existing glued-turn label:

- `FINDINGS.md` — 'Every agentic figure in this document is **also** measured on a fixture whose test suite failed on arrival.'
- `harness/README.md` — same, scoped to 'saved before COS-13'.
- `docs/reference/experiment-ledger.md` — 'A second caveat with the same shape'.
- `docs/stories/extend-measurement-coverage.md` — the story carrying the affected agentic figures.

`docs/stories/make-the-measurements-trustworthy.md` (the owning story) was rewritten to past tense with all three defects and the reasoning behind the choice.

The caveat is deliberately stated as **weaker than the glued turn**: it changes what the model met, not what the scorer read. So `agentic-read-report` (never needs the tests) and every conversational figure are unaffected, and that is said explicitly in each place rather than left for the reader to infer. Like the glued turn it is irreversible — no re-score can undo a fixture that shaped the model's session — so replacing an affected figure costs a re-run.

## Self-review before the branch review — an overclaim copied across caveats

Re-reading the four labels caught a defect in this session's own prose, of the exact class the project keeps hitting. The COS-10 glued-turn label ends by ruling checks out: `leads_with_conclusion`, `total_length` and the abort counts were unaffected, because the seam was a *scoring* artifact and could be traced to the checks that re-segment. I reused that shape for the fixture caveat and wrote that the same checks were unaffected here too.

That does not hold. The fixture changed what the model *wrote*, not how the text was parsed, so on a cell that met the failure any check can move, the judge included — a model that meets an unexplained red test writes differently, which is precisely why the caveat is worth recording at all. The correct bound is **reach, not check**: conversational cases never involve the repo and are genuinely untouched, and `agentic-read-report` is the least exposed of the four because it asks for a reading rather than a test run — but a model that ran the suite unprompted still met the failure, so it is not exempt either. The earlier wording had called it a figure 'the fixture cannot reach'.

Corrected in all four places, each now stating explicitly why the two caveats cannot be reasoned about the same way. Gates re-run after the correction: `lore check` exit 0, 116/116.

## A second self-review finding: the fix leaked what the decision refused to leak

The first version of the corrected fixture carried explanatory comments — a header saying 'Nothing below pins the fractional-cent behaviour: no assertion covers it', and a note on the `priceOrder` case reading 'Do not "correct" it to 966'. Both were written to stop a future maintainer reintroducing the defect. Both were in the file **the model reads**.

That contradicts the decision they were protecting. AC #2 was settled by refusing to assert 849 because a red test naming the file and the expected value hands `reserve-agentic-session` its answer; a comment announcing that fractional cents are uncovered points at the same place just as plainly, and 'do not correct it to 966' advertises that the number is contested. The leak was moved, not removed.

Fixed by putting every protective statement in `harness/test/fixture.test.mjs`, which the model never sees, and leaving the fixture with only the arithmetic a real repo would carry (`// 500 * 2 = 1000, less 10% = 900, plus 7.25% tax = 965.25`). That still prevents the 966 error recurring — it was made by not showing the work — without telling the reader anything about the bug. The `BUG:` marker in `src/pricing.js` is unchanged in kind: the original already named the 15%-on-999 case, so making its arithmetic correct does not increase what is given away, which keeps the cases comparable with published runs.

Falsification sweep re-run after the change, all four scenarios still caught: reintroduce 966, pin 850, fix the bug in the fixture, delete the fixture's tests — 2 failures each; restored 116/116.

## Branch review (/code-review high) — 6 findings, all real, all resolved

The review ran against `58f6cff`, before this session's last three commits, so its finding #1 (the fixture leaking its own protective reasoning) had already been fixed in `23ed4c6` — the session had caught that one independently. The other five were live and are fixed on the branch.

**#2 (medium) — the corrected BUG comment sharpened a leak.** The rewrite read 'a 15% discount on 999 cents keeps 850 where rounding to the nearest cent keeps 849': the file, the repro case and both values, which is the exact payload the guard's own fourth test forbids in the test file on leak grounds. The original conveyed 'truncates instead of rounding' and 'off-by-one appears at 15% on 999' but **not** the two values, so the rewrite had added information rather than only removing a contradiction. Trimmed to the original's content minus the contradiction: `// BUG: truncates instead of rounding, so an off-by-one appears at 15% on 999.` Removing the marker entirely was rejected — it is what `agentic-read-report` reads, and dropping it would move case difficulty away from every published run.

**#3 (medium) — the guard's verdict was reporter-dependent.** `reported` was parsed from `/^ℹ pass (\\d+)$/m`, which only the spec reporter emits, while `env` scrubbed `NODE_TEST_CONTEXT` but not `NODE_OPTIONS`. Reproduced: `NODE_OPTIONS=--test-reporter=tap npm --prefix harness test` reported **fail 2** against a perfectly green fixture, accusing it of the defect COS-13 had just fixed. Fixed by pinning `--test-reporter=spec` on the command line and deleting `NODE_OPTIONS` from the child environment. Verified: same command now reports `# fail 0`.

**#4 (medium) — `npm test` never worked in a workspace, and still did not after the fix.** The fixture is copied to the workspace *root*, so it has no `package.json` above it the way it does in this repo; it had none of its own. Reproduced: `npm test` in a workspace copy exits with `npm error code ENOENT ... Could not read package.json`. This is the same class of defect as the reported one — an unexplained failure the model did not cause, on the most natural reading of 'run the tests' — sitting one command to the left of it, and `node --test` alone never sees it. Added `harness/fixtures/repo/package.json` (`private`, `type: module`, `test: node --test`) and a fifth guard assertion that runs `npm test` in a workspace-shaped copy. Verified: `tests 2 / pass 2 / fail 0`.

**#5 (low) — the liveness count could fail open-loop.** `/^test\\(/gm` matches only at column 0, so indenting the cases inside `describe()` or switching to `it(` would drop the count to zero and fail a green fixture with the misleading 'does not run clean' message. Replaced with a count of `assert.` calls plus an explicit `fail 0` check. Verified both directions: renaming `test(` to `it(` and wrapping everything in a `describe()` both keep the suite green, while deleting the fixture's tests still fails it.

**#6 (low) — raw filesystem path used as an ESM specifier.** Now `pathToFileURL(...).href`. The review's predicted repro did not reproduce here — Node 24 imported a space-containing path fine — so this is correctness rather than an observed break, and it still matters on Windows and for `#`/`%` paths.

Falsification sweep re-run after all fixes, each scenario applied to the real fixture and reverted: reintroduce 966 -> 3 failures; pin 850 -> 2; 'fix' the bug in the fixture -> 2; delete the fixture's tests -> 2; **delete the fixture's package.json -> 1**; rename `test(` to `it(` -> 0; wrap in `describe()` -> 0; restored -> 117/117.

The `npm test` defect is recorded in all five caveat locations alongside the other two, since every published agentic figure met it.

Gates after the review pass: `npm --prefix harness test` **117**; `audit` exit 0; `lore check` exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The reported contradiction was one of three of the same shape, and not the worst. Running the pristine fixture before reading it showed the test suite was **red on a clean checkout**: `priceOrder` asserted 966 where the code returns 965 (`tests 3 / pass 2 / fail 1`). 966 is the tax-before-discount value, so that number contradicted the test's own name — the same defect as the reported 850-vs-849 pair one line above. Three of the four agentic cases ask the model to run these tests, so every model that did met a failure it had not caused. The `BUG:` comment was a third instance ("yields 670 instead of 670", citing a case where floor and round agree), and the module header a fourth.

Fixed so the suite is green **both before and after a correct fix** — the invariant that removes the adjudication noise. That ruled out pinning the buggy value; AC #2 then chose dropping the assertion over asserting the corrected one, because a red test naming the file and expected value would hand `reserve-agentic-session` the answer it exists to withhold. No coverage lost: `applyDiscount` is still exercised by the 1000/33 case, identical under floor and round.

Verified by execution, not inspection: pristine `pass 2 / fail 0`; a temp copy with `Math.floor` -> `Math.round` also `pass 2 / fail 0`, bug still behavioural (850 -> 849). AC #3 was a full sweep of every function, comment and assertion, each recomputed independently — all OK. AC #4 labels rather than re-derives (items 12/13 rebuild the record; re-running now would measure twice), extending COS-10's glued-turn wording in FINDINGS.md, harness/README.md, the ledger and two story docs, and stating the caveat as deliberately weaker than the glued turn.

Added `harness/test/fixture.test.mjs`, since nothing in the suite executed the fixture. It was wrong twice and both were caught by breaking the fixture on purpose: it could not fail at all (inherited `NODE_TEST_CONTEXT` suppresses the child's exit code), then it accepted a fixture with every test deleted (`node --test` scores an empty file as `pass 1`). Falsification sweep now shows all four break-scenarios failing and the restored state green.

`npm --prefix harness test` 112 -> 116; `audit` exit 0; `lore check` exit 0. Spend $0.
<!-- SECTION:FINAL_SUMMARY:END -->
