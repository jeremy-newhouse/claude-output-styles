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
- [Make the measurements trustworthy](../stories/make-the-measurements-trustworthy.md) —
  four defects in the scorer, and every figure that rests on a ten-cell arm
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

**The beginner row is a snapshot of a file that has since been rewritten, and its
Opus and Sonnet judge figures carry a known defect.** They were graded with the
judge told a 15-word sentence cap the file never stated — the same drift
`3370e4d` fixed in the rules column, which could be re-graded offline for free
where the judge could not. COS-4 then rewrote the file. On COS-4's pass-1 text —
what shipped until COS-16 — over **150 cells a model**, beginner reads **rules
98.9 / 97.4 and judge 66.8 / 60.9** on Opus and Sonnet (COS-16, run `19-42-55`). COS-4's own figures for the same
bytes — 98.5 / 97.4 and 73.9 / 58.1 at 35 cells a model — are superseded on the
judge halves by that larger arm. Its Haiku and Fable columns have not been
re-measured since the rewrite. Read the row as history; `FINDINGS.md` carries the
current numbers.

**COS-16 has since changed those bytes.** The shipped file is now the three-edit candidate (sha256 `86451ddb`). At the same 150 cells a model it reads rules **99.2 / 97.4** and judge **66.1 / 60.9** on the shared five (run `2026-08-20T03-03-26`), and every paired interval against `19-42-55` contains zero — the figures above stand as current within noise, but `19-42-55` measures the text COS-16 replaced, not the text that ships.

The four tiers span the whole released range, from the smallest model to the
largest — and rule compliance holds across all of it, 90.9 to 97.9. Prose quality
does not: the judge ranges 37.5 to 78.3 over the same twelve cells. That is the
epic's central result. The style files carry their rules everywhere; what a tier
changes is how well it writes, not how well it complies.

The top tier is not a clean win. Fable leads the judge on advanced and beginner
but is last of four on intermediate rules, and Sonnet — two tiers down — still
writes the best intermediate. Nor does a larger model buy cap adherence: word-cap
overrun does not track tier, and the model that keeps best to the cap is Sonnet.

Advanced is the only style the optimizer improved. Its rewrite gained 6.9 points
on Opus and 5.9 on Sonnet, is 32 words shorter than the original, and ends with a
countable word cap. Intermediate is unchanged from first release: six rewrites
were generated across intermediate and beginner and every one was rejected,
either by the keep rule or by out-of-sample testing. Beginner has since been
rewritten **by hand**, by COS-1 and then COS-4 — the only route that has ever
changed it.

Rule compliance is high everywhere and prose quality is not. That is the shape of
the remaining work: the styles are followed, and beginner in particular is not
asking for the right things.

COS-4 tested the strongest available version of that last sentence and got a
split answer. Beginner's rules genuinely were not asking for the right things —
three of them contradicted each other and the file never said which of its shapes
a reply should take — and fixing that took rule compliance to 98.5 / 97.4 and cut
mean reply length from 103 words to 61, the first movement on reply length the
project has recorded. The judge did not follow: +1.3 [−15.0, +17.6] paired across
ten case × model cells. So the remaining gap is real, it is not length, it is not
rule coverage, and it does not yet have a name.

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
