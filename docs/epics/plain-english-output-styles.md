---
# yaml-language-server: $schema=../../.lore/schemas/epic.schema.json
type: Epic
title: Plain English output styles
tags:
  - styles
  - measurement
summary: Three ASD-STE100 output styles for Claude Code, and the harness that measures whether models actually obey them
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:46:27.796Z
---

# Plain English output styles

## Goal

Three Claude Code output styles that make it communicate in clear, jargon-free
language, pitched at three technical depths, and a harness that answers whether a
given model actually obeys a given style rather than leaving it to impression.

The second half is the point. The project began from a report that Opus was
ignoring the styles while Sonnet followed them. That turned out to be partly a
silent configuration failure, partly two specific rule violations landing on the
first line of every reply, and not at all a general disregard for the styles.

## Scope

**In scope.** The three style files. The measurement harness under `harness/`,
covering deterministic rule checks, a style-aware rubric judge, a cross-model
matrix, and a rewrite loop. Findings about how Claude Code loads and places a
style.

**Out of scope.** Changing Claude Code itself, styles for non-English audiences,
and per-model style variants — ruled out by measurement, see the one-file
decision.

## Stories

- [Close the style quality gaps](../stories/close-the-style-quality-gaps.md) —
  the two scenarios every style handles badly, and beginner's prose
- [Harden the optimizer loop](../stories/harden-the-optimizer-loop.md) —
  a reserve split and auditable improve runs
- [Extend measurement coverage](../stories/extend-measurement-coverage.md) —
  Haiku and Fable, the two ends of the model range
- [Make the install path safe](../stories/make-the-install-path-safe.md) —
  stop the silent name-resolution failure

## Where things stand

Five shared cases, ten cells per pair, **all four model tiers**, no errored cells
in any column. Rules and judge are directly comparable across styles; the
composite is not, because each style carries a different `judgeWeight`.

| style | rules (opus / sonnet / haiku / fable) | judge (opus / sonnet / haiku / fable) |
|---|---|---|
| advanced | 97.8 / 96.8 / 96.0 / 97.9 | 73.9 / 66.0 / 52.9 / 78.3 |
| intermediate | 94.2 / 95.6 / 94.3 / 93.1 | 63.9 / 72.6 / 62.2 / 67.7 |
| beginner | 91.5 / 92.3 / 90.9 / 91.4 | 45.9 / 48.4 / 37.5 / 53.9 |

The four tiers span a tenfold cost range — $0.0232 to $0.2345 per cell, measured
— and rule compliance holds across all of it, 90.9 to 97.9. Prose quality does
not: the judge ranges 37.5 to 78.3 over the same twelve cells. That is the epic's
central result. The style files carry their rules everywhere; what a tier changes
is how well it writes, not how well it complies.

The top tier is not a clean win. Fable leads the judge on advanced and beginner
but is last of four on intermediate rules, and Sonnet — two tiers down and 2.3×
cheaper per cell — still writes the best intermediate. Nor does paying more buy
cap adherence: word-cap overrun does not track tier, and the model that keeps
best to the cap is Sonnet.

Advanced is the only style the optimizer improved. Its rewrite gained 6.9 points
on Opus and 5.9 on Sonnet, is 32 words shorter than the original, and ends with a
countable word cap. Beginner and intermediate are unchanged from first release —
six rewrites were generated for them and every one was rejected, either by the
keep rule or by out-of-sample testing.

Rule compliance is high everywhere and prose quality is not. That is the shape of
the remaining work: the styles are followed, and beginner in particular is not
asking for the right things.

## Decisions

- [Score styles with deterministic checks plus a style-aware judge](../adr/score-styles-with-deterministic-checks-plus-a-style-aware-judge.md)
- [Ship one style file for every model](../adr/ship-one-style-file-for-every-model.md)
- [Reject harness-level reinforcement of style rules](../adr/reject-harness-level-reinforcement-of-style-rules.md)
- [Validate candidates on cases held out of every split](../adr/validate-candidates-on-cases-held-out-of-every-split.md)

## Specification

- [Style contracts by audience level](../specs/style-contracts-by-audience-level.md) —
  what each level commits to, and the numbers the harness enforces

## References

- [Output style injection mechanics](../reference/output-style-injection-mechanics.md) —
  how Claude Code resolves, loads, and places a style
- [Harness architecture](../reference/harness-architecture.md) —
  module map, data flow, and the invariants worth preserving
- [Experiment ledger](../reference/experiment-ledger.md) —
  every run, what it tested, what it established

## Runbooks

- [Install and switch an output style](../runbooks/install-and-switch-an-output-style.md)
- [Measure and optimize an output style](../runbooks/measure-and-optimize-an-output-style.md)
