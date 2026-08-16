---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Validate candidates on cases held out of every split
tags:
  - harness
  - method
summary: A train/holdout split from one case pool did not prevent overfitting; only never-seen cases caught it
generated:
  by: lore/0.2.0
  at: 2026-08-16T13:05:00.000Z
---

# Validate candidates on cases held out of every split

## Status

Accepted

## Context

The optimizer loop keeps a candidate only when train improves and holdout does
not regress. That rule works — it rejected both beginner rewrites, which raised
train by roughly 6 points while dropping holdout by roughly 8.

It is not sufficient. Train and holdout are drawn from the same small case pool,
written by the same author, in the same session. A rewrite can satisfy both and
still degrade on prompts of a shape neither split contains.

Two candidates that won both in-loop splits were then run on four cases the
optimizer had seen in no split:

| style | loop train | loop holdout | never-seen cases |
|---|---|---|---|
| advanced | 0.888 → 0.914 | 0.905 → 0.957 | **90.8 → 84.0** |
| intermediate | 0.810 → 0.849 | 0.861 → 0.904 | 79.6 → 80.2 |

The advanced candidate improved on both of the loop's own splits and was 6.8
points worse out of sample. Its deterministic rules stayed flat while its judge
score collapsed from 79.5/68.8 to 55.0/47.5.

That is the signature every rejected candidate in this project shares: rules up
or level, judge down. The optimizer can see the deterministic checks and optimize
against them directly. The judge is harder to game, and a case shape the
optimizer never trained on is harder still.

## Decision

A candidate is not adopted on the loop's verdict. Treat train and holdout as
tuning signals, and require a separate pass on cases held out of every split
before adopting.

Score the two halves separately when reading that pass. A candidate whose rule
score rises while its judge score falls is gaming the checks, regardless of what
the composite says.

Rejected candidates are archived under `harness/rejected/` with the numbers that
rejected them, so the same rewrite is not attempted again.

## Consequences

Adopting a rewrite costs an extra measurement pass beyond the loop. That is the
price of the loop having been wrong twice out of three times it declared a
winner.

The harness enforces this as of COS-2. `cases.json` carries a third split,
`reserve`, that the loop never selects for train or holdout, and `improveStyle`
measures the incumbent and the candidate on it — same cases, same run — before
presenting a winner. A candidate that comes in below the incumbent by more than
`minReserveDelta` is rejected and rolled back to v0 rather than annotated: the
`best.md` a reader diffs and copies holds what survived. The pass runs only when
a rewrite was actually kept, so a run that reverts everything pays nothing for
it.

The one surviving rewrite, adopted into `plain-english-advanced.md`, predates
this decision. It was validated by a same-run comparison on both models and then
independently confirmed on four never-seen cases at 90.8 against the candidate
that tried to replace it — so it satisfies this rule retroactively.

Case-set size is now load-bearing. Rather than carve three splits out of the
original nine cases — which would have cut train to three and holdout to two —
COS-2 wrote four new cases for the reserve, taking the pool to thirteen. They
are deliberately shapes no existing split contains: a forward-looking scope
question, a decision offering three options rather than two, a turn where the
user overrides the recommendation, and an agentic case that writes new code.
Shape, not wording, is what the rejected candidates overfitted to. Growing the
case set further remains a prerequisite for trusting narrow margins.
