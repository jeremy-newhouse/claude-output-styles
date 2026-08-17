---
id: COS-11
title: Stop errored cells from biasing every score the project quotes
status: To Do
assignee: []
created_date: '2026-08-17 03:44'
updated_date: '2026-08-17 03:51'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/evaluate.mjs
  - harness/src/report.mjs
documentation:
  - docs/reference/experiment-ledger.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A cell that returns no text at all still lands in every mean, and it biases the two halves of the score in opposite directions, so they do not cancel.

- Rules: an empty reply scores 0.0 on every deterministic check. Documented under COS-5, where pooling six aborted Haiku cells understated that model's rule compliance by about 10 points.
- Judge: `evaluate.mjs` skips the judge call on an errored row and substitutes `{ score: 1 }`, so the same cell contributes a free 100% to the judge mean. This half is not documented anywhere outside the ledger. One turn-limit abort in run `01-03-21` moved that run's `agentic-fix-verify`-on-Opus judge from 33.0 to 44.2.

`summarize()` pools errored rows into every figure it produces, which is where report.md, summary.json and every quoted arm mean come from. One consumer was fixed under COS-1 — `improve`'s reserve adoption gate now pairs by case id and drops any case that errored on either side — but that fix was deliberately narrow and the general case is untouched.

The current workaround is a discipline: filter `!row.error` before quoting anything. Three sessions have had to remember it and one published four wrong figures by forgetting an equivalent rule. A discipline that must be remembered is a defect that has not been fixed yet.

This matters more now than it did: the follow-up measurement work deliberately runs large arms on abort-prone agentic cases, where errors are not rare. `reserve-agentic-session` aborts 3 of 6 on Haiku.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 summarize() reports error-excluded means as the default, and reports the errored-cell count alongside every figure so a reader cannot mistake a partial arm for a full one
- [ ] #2 An arm where every cell errored reports as unmeasured rather than as a score
- [ ] #3 report.md and summary.json distinguish cells that produced a reply from cells that did not, at every level they aggregate
- [ ] #4 Tests cover both biases in one run — an errored cell must not raise a judge mean and must not lower a rules mean
- [ ] #5 Re-scoring a saved run with a known abort (22-59-53, six aborted cells) reproduces the corrected figures, and any published number that changes is updated
<!-- AC:END -->
