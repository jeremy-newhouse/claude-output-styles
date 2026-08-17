---
id: COS-13
title: Fix the agentic fixture's contradictory assertion
status: To Do
assignee: []
created_date: '2026-08-17 03:45'
labels: []
dependencies:
  - COS-10
references:
  - harness/fixtures/repo/test/pricing.test.mjs
  - harness/fixtures/repo
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
