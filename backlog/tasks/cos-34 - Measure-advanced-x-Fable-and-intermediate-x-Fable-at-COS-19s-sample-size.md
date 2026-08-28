---
id: COS-34
title: Measure advanced x Fable and intermediate x Fable at COS-19's sample size
status: To Do
assignee: []
created_date: '2026-08-28 13:53'
updated_date: '2026-08-28 14:00'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/config/matrix.json
  - FINDINGS.md
  - docs/reference/experiment-ledger.md
documentation:
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-19 raised every cell in the four-tier table to n>=146 non-errored except advanced x Fable and intermediate x Fable, which stay at the original n=10 (2026-08-16T23-48-45, clean of the pre-3370e4d judge-cap contamination, just underpowered). Both attempts this session (2026-08-28) to raise them to 150 cells hit repeated session-limit errors on claude-fable-5[1m] -- one arm (advanced x Fable, run 2026-08-28T03-13-14-527Z) got 105 of 150 non-errored before the user directed stopping further attempts rather than keep re-hitting the limit. Re-attempt when Fable's session-limit behavior allows a full 150-cell arm to complete, or size the arm to whatever it can sustain and document the resulting n.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 advanced x Fable measured at the shared five cases, 30 repeats (or the largest sustainable repeat count), n>=146 non-errored, 0 excluded silently
- [ ] #2 intermediate x Fable measured the same way
- [ ] #3 FINDINGS.md's four-tier table and docs/reference/experiment-ledger.md updated with the new arms and their 95% intervals, replacing the n=10 figures
- [ ] #4 If n=146 cannot be reached even after retries, the table states the achieved n and why, rather than silently publishing an underpowered figure as if it met the same bar as the rest of the row
<!-- AC:END -->
