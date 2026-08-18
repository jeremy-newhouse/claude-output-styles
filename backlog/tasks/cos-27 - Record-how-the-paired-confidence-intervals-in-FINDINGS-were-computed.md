---
id: COS-27
title: Record how the paired confidence intervals in FINDINGS were computed
status: In Progress
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-17 18:57'
updated_date: '2026-08-18 13:45'
labels: []
dependencies: []
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FINDINGS.md's COS-4 table publishes paired figures — rules +5.2 [+0.0, +10.4] on the shared five and +7.7 [+5.3, +10.1] t=7.06 on the reserve six — and nothing in the repo says how they were computed. COS-15 needed to know, because its gloss fix moves the arms underneath them.

Recomputing from the saved rows under a stated method (pair on style x model x case with repeats averaged, paired t interval from a Student-t table) reproduces every ARM MEAN in the ledger exactly — 87.2/86.4, 98.0/97.7, 98.7/97.1, pooled 98.5/97.4, and the -0.029 train delta on 14-48-09 — but not the paired intervals: it gives +7.8 [+5.3, +10.2] t=7.02 against the published +7.7 [+5.3, +10.1] t=7.06, and +5.0 [-0.1, +10.0] against +5.2 [+0.0, +10.4]. The arm means matching to the last digit is what makes the interval mismatch a method difference rather than a data difference.

So the published intervals cannot be updated when a scorer change moves the arms under them, and COS-15 left them in place with a footnote rather than silently substituting a second method. Every future scoring change hits the same wall.

Pick one method, implement it in the harness so it is not hand-rolled per session, and either reproduce the published figures or restate them with the new method and say so.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The method behind every paired figure in FINDINGS.md is implemented in the harness and callable from saved rows, not hand-rolled in a session script
- [ ] #2 Each published paired figure is either reproduced exactly by that method, or restated under it with the old value and the reason recorded
- [ ] #3 A scoring change can re-derive every paired figure from saved rows with one command
<!-- AC:END -->
