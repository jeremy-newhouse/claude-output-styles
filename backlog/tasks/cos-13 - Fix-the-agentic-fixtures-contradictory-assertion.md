---
id: COS-13
title: Fix the agentic fixture's contradictory assertion
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 13:16'
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
- [ ] #1 The fixture states one arithmetic answer, and the assertion and its comment agree
- [ ] #2 The intended bug is still present and still discoverable — the fix must not accidentally remove what the agentic cases exist to find
- [ ] #3 The whole fixture is checked for further self-contradictions and the result is recorded either way
- [ ] #4 Agentic figures published in docs/ and FINDINGS.md are re-derived after the change, or marked as measured on the contradictory fixture
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
