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

Five shared cases, **all four model tiers**, no errored cells in any column.
Ten of twelve style x model cells are now at 150 non-errored cells; advanced x
Fable and intermediate x Fable still rest on ten (COS-34). Rules and judge are
directly comparable across styles; the composite is not, because each style
carries a different `judgeWeight`. Every judge figure below carries a 95%
interval (COS-19 AC #2) — see `FINDINGS.md`'s four-tier table for the full
per-cell breakdown; this table states point estimates only.

| style | rules (opus / sonnet / haiku / fable) | judge (opus / sonnet / haiku / fable) |
|---|---|---|
| advanced | 99.4 / 97.3 / 96.6 / 97.9 | 74.3 / 68.1 / 57.1 / 78.3 |
| intermediate | 95.6 / 94.7 / 95.5 / 93.1 | 69.5 / 72.7 / 58.7 / 67.7 |
| beginner | **99.2 / 97.4 / 95.8 / 99.3** | **66.1 / 60.9 / 48.2 / 65.2** |

**Ten of twelve cells are now current at n=150; only the two Fable cells
(marked with their original n=10 above) are not.** Beginner reached 150 across
every tier first (COS-16/COS-17). Advanced and intermediate's Opus and Sonnet
halves followed at `2026-08-20T12-12-10` (COS-18); their Haiku halves followed
at `2026-08-28T02-58-38-491Z` and `2026-08-28T13-31-38-172Z` (COS-19). Fable's
halves are the one gap: COS-19 tried to raise them and lost 45 of 150 cells to
repeated session-limit errors on `claude-fable-5[1m]`, so they remain at the
original ten-cell figures, which are clean of the contamination described below
but not yet at the sample size the rest of the table has. COS-34 owns raising
them.

**The figures every current cell replaced were 91.5 / 92.3 / 90.9 / 91.4 and
45.9 / 48.4 / 37.5 / 53.9 on beginner**, gone from the table rather than
footnoted beside it, because they measured style text that two hand rewrites
have replaced and because their Opus and Sonnet judge cells were graded with
the judge told a 15-word sentence cap the file never stated. That drift is the
same one `3370e4d` fixed in the rules column, which could be re-graded offline
for free where the judge could not. **COS-19 confirmed the drift no longer
touches any cell this table currently carries**, Fable's included — every cell
above comes from a run measured after `3370e4d` landed on 2026-08-16.

**What the completed cells show.** Beginner's rules column reads at parity with
advanced now, not ahead of it — the "three tiers of four" reading depended on
advanced's old ten-cell Sonnet and Opus figures and does not survive their
150-cell replacements (COS-19 withdraws it; see `FINDINGS.md` for the per-model
breakdown). Beginner's judge column rose 20.2 / 12.5 / 10.7 / 11.3 points in
Opus / Sonnet / Haiku / Fable order over its own history, and it is still last
of the three styles on every tier. The Opus and Sonnet halves of that rise are
inflated by the cap defect above; the Haiku and Fable halves are not, because
both of the baselines they replace ran after `3370e4d` landed. Rule compliance
was never the problem, and fixing it did not fix the prose.

The four tiers span the whole released range, from the smallest model to the
largest — and rule compliance holds across all of it, 93.1 to 99.3. Prose quality
does not: the judge ranges 48.2 to 78.3 over the same twelve cells. That is the
epic's central result. The style files carry their rules everywhere; what a tier
changes is how well it writes, not how well it complies.

The top tier is not a clean win. Fable leads the judge on advanced but is last of
four on intermediate rules, Opus edges it on beginner, and Sonnet — two tiers
down — still writes the best intermediate. Nor does a larger model buy cap
adherence: word-cap overrun does not track tier, and the model that keeps best to
the cap is Sonnet, on both the pre-rewrite text and the shipped one.

Advanced is the only style the optimizer improved. Its rewrite gained 6.9 points
on Opus and 5.9 on Sonnet, is 32 words shorter than the original, and ends with a
countable word cap. Intermediate is unchanged from first release: six rewrites
were generated across intermediate and beginner and every one was rejected,
either by the keep rule or by out-of-sample testing. Beginner has since been
rewritten **by hand**, by COS-1 and then COS-4 — the only route that has ever
changed it. COS-17 measured what that bought on all four tiers: reply length fell
from 1.28×–1.69× the 80-word cap to 0.73×–0.90×, under it on every model, and all
ten of its case × model cells fell.

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
