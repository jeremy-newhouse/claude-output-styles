---
type: Story
title: Harden the optimizer loop
tags:
  - harness
summary: A reserve split the optimizer never sees, and persisted transcripts so improve runs are auditable
tasks:
  - cos-2
  - cos-3
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: todo
---

# Harden the optimizer loop

## Goal

The loop produced seven candidate rewrites across three styles. One survived.
Two of the rejections were caught only by accident, and the loop's own spend was
invisible until late. Both are fixable properties of the harness.

**Two splits are not enough.** Train and holdout are drawn from the same small
case pool, so a rewrite can satisfy both and still degrade on genuinely unseen
prompts. This was measured, not theorised. Two candidates the loop kept on its
own splits were then tested on four cases it had never seen in any split:

| style | loop train | loop holdout | unseen cases |
|---|---|---|---|
| advanced | 0.888 → 0.914 | 0.905 → 0.957 | **90.8 → 84.0** |
| intermediate | 0.810 → 0.849 | 0.861 → 0.904 | 79.6 → 80.2 |

The advanced candidate improved on both of the loop's own splits and was 6.8
points worse out of sample. Rules stayed flat while the judge collapsed — the
signature every rejected candidate shares.

**Improve runs leave no evidence.** `run` persists rows, summary, and a report
per invocation. `improve` persists none of that, despite spending most of the
money in this project. Its cells cannot be re-graded offline after a check is
fixed, cannot be audited, and did not appear in any spend total until a
`spentUsd` counter was added late.

## Acceptance criteria

- Cases support a third split that `improve` never selects for train or holdout.
- The winning candidate is scored against that reserve split and reported
  alongside train and holdout.
- A candidate that regresses on the reserve split is reported as rejected, not
  presented as the winner.
- Each improve iteration persists its transcripts under the run directory.
- `score` can re-grade a completed improve run offline with no token spend.
- Spend for an improve run is derived from persisted rows, not a side counter.
- `harness/README.md` documents the three-way split and why two is not enough.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-2](../../backlog/tasks/cos-2%20-%20Hold-a-case-pool-out-of-every-optimizer-split.md) | Hold a case pool out of every optimizer split | To Do |
| [COS-3](../../backlog/tasks/cos-3%20-%20Persist-transcripts-from-improve-runs.md) | Persist transcripts from improve runs | Done |
<!-- lore:tasks:end -->

## Notes

The keep rule already blocks the simpler failure — a rewrite that trades holdout
for train is rejected, and that fired correctly on beginner twice. The gap is
narrower than it looks: it only admits rewrites that improve *both* in-loop
splits while degrading elsewhere.

Related crash worth not repeating: the judge and author calls ran at
`maxTurns: 1` and were unwrapped, so one exhausted turn killed a paid
multi-style run partway through. Fixed, but it is the reason the first
cross-model run has results for only one style.
