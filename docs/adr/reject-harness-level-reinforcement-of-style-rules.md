---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Reject harness-level reinforcement of style rules
tags:
  - styles
  - claude-code
summary: Restating style rules in CLAUDE.md or forcing the long system prompt both measured worse than the bare style file
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:46:28.024Z
---

# Reject harness-level reinforcement of style rules

## Status

Accepted, narrowed by re-test (COS-21, 2026-08-28)

## Context

The style sits mid-prompt rather than at the end, and no per-turn reminder
reinforces it. Both facts suggest adding reinforcement outside the style file.
Three candidate layers were tested independently, each against the bare style
file as control.

Advanced style, Opus, five cases per variant:

| variant | score | rules | judge |
|---|---|---|---|
| **baseline — style file only** | **90.2%** | 93.7% | 82.2% |
| tail reminder appended to the style body | 89.5% | 92.5% | 82.6% |
| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=0` | 85.7% | 90.4% | 74.6% |
| all three together | 81.5% | 89.2% | 63.4% |
| rules restated in `CLAUDE.md` | 80.8% | 90.3% | 58.4% |

Every added layer measured worse. Restating the rules in `CLAUDE.md` was the most
damaging at 9.4 points, despite `CLAUDE.md` carrying the strongest wrapper in the
system — an explicit instruction that it overrides default behaviour. Forcing the
long system prompt, the fix most commonly recommended online for Opus verbosity,
cost 4.5 points.

The direction replicated on both models in a separate run: the combined variant
lost ground on Opus (84.6 to 81.0) and Sonnet (87.0 to 84.8).

This matches Anthropic's published guidance for Opus 5. Instructions stack on top
of what the model already does, so redundant guardrails cost tokens and output
length without improving adherence. Removing beats adding.

## Decision

Fix adherence inside the style file. Do not restate style rules in `CLAUDE.md`,
do not set `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`, and do not append reinforcement
outside the style body.

Where a rule must survive to the end of a long reply, place it as the last line
of the style file rather than adding a second copy elsewhere.

## Consequences

**Withdrawn by the re-test:** an existing project `CLAUDE.md` that restates
tone rules is *not* shown to be a liability, and deleting those sections is
*not* shown to be an improvement — the claim rested on the 9.4-point figure
above, which did not reproduce at 30x its sample size on this ADR's own cell.
On beginner x Haiku, keeping the restatement was a score-neutral null that
also cut reply length by 15.9 words. Treat a `CLAUDE.md` restatement as
unproven rather than as confirmed harm; do not recommend deleting one on the
strength of this ADR alone.

The harness keeps these variants defined in `config/matrix.json` so the finding
can be re-tested quickly when Claude Code changes how it assembles the prompt.
The conclusion is tied to 2.1.233 and should not be assumed permanent.

The tail-reminder variant lost only 0.7 points, inside the noise band for five
cases. It is rejected as unnecessary rather than as clearly harmful — the same
effect is available for free by ordering the style body correctly.

## Re-test (COS-21, 2026-08-28)

The table above is five cells per arm — half the size COS-4 showed carries a
95% interval about 30 points wide — and predates a rewrite of the advanced
style text. COS-21 re-ran all five variants at 150 non-errored cells per arm
(30x the n), with a paired 95% interval against baseline for every figure, on
three (style, model) legs: beginner x Opus, beginner x Haiku, and advanced x
Opus — this ADR's own cell, on current style text.

**Advanced x Opus (this ADR's own cell), baseline 88.40 composite:**

| variant | composite | vs baseline (95% CI) | judge (95% CI) | clears zero |
|---|---|---|---|---|
| long-prompt | 87.67 | −0.7 [−2.6, +1.1] | −2.2 [−7.3, +2.9] | no |
| tail-reminder | 87.69 | −0.7 [−3.1, +1.7] | −2.3 [−9.2, +4.6] | no |
| claude-md | 87.55 | −0.9 [−3.6, +1.9] | −2.8 [−10.2, +4.6] | no |
| all-fixes | 86.71 | −1.7 [−4.1, +0.8] | −3.8 [−10.1, +2.5] | no |

**Every variant is a null on the ADR's own cell.** Not one composite or judge
interval excludes zero. All four point estimates are negative and cluster in
a narrow band (−0.7 to −1.7 composite) — consistent with a small cost that
150 cells still cannot distinguish from noise, not with the 4.5- to 9.4-point
gaps this ADR's evidence table reports off five cells.

Two more legs bound how far that generalizes. Beginner x Opus (baseline
83.07) reproduces the same shape: three of four variants are nulls, and only
`all-fixes` clears zero — downward, −2.8 [−5.2, −0.5] — the single confirmed
harmful result across all 15 arms measured. Beginner x Haiku (baseline
68.69) reverses it: `long-prompt` +5.2 [+2.1, +8.2] and `tail-reminder` +3.3
[+1.1, +5.4] clear zero **upward**, `all-fixes` +4.1 [+1.9, +6.3] also clears
upward, and `claude-md` is a score null that cuts word count by −15.9
[−22.4, −9.3]. On a model that is failing baseline far more often (rules
93.31%, judge 44.08% vs Opus's 98.34% / 67.81%), the same reinforcement
layers that cost Opus nothing measurable also do not cost Haiku anything —
three of the four measurably help.

**Per claim:**

- *"Restating rules in `CLAUDE.md` was the most damaging at 9.4 points"* —
  **withdrawn.** On this ADR's own cell the measured effect is −0.9
  [−3.6, +1.9], a tenth the size and not distinguishable from zero. It is a
  null on all three legs tested; no cell shows a statistically supported
  harmful effect.
- *"Forcing the long system prompt... cost 4.5 points"* — **withdrawn.** Null
  on both Opus legs (−0.7 and −1.2). On beginner x Haiku the effect is
  **+5.2 [+2.1, +8.2], the opposite sign and clearly measurable.** The claim
  does not generalize past the one cell it was measured on.
- *"Every added layer measured worse"* — **withdrawn as a general claim.** On
  advanced x Opus no layer clears zero in either direction. On beginner x
  Haiku three of four clear zero upward. The sole confirmed-worse result in
  15 arms is `all-fixes` on beginner x Opus.
- *Tail-reminder "lost only 0.7 points, inside the noise band... rejected as
  unnecessary rather than clearly harmful"* — **confirmed.** The re-test
  measures −0.7 [−3.1, +1.7] on the same cell, matching almost exactly.
- *The two-model combined-variant replication (Opus 84.6→81.0, Sonnet
  87.0→84.8)* — **out of scope.** COS-21's grid does not include a Sonnet
  leg; this claim is neither confirmed nor withdrawn by the re-test.

## Decision (narrowed)

For a model already complying with the style at baseline — advanced x Opus,
this ADR's own cell, and beginner x Opus — no reinforcement layer measured a
statistically supported benefit, so the original decision to fix adherence
inside the style file rather than add reinforcement stands **for that
regime**, but on evidence of "no measured benefit," not "measurably
damaging." Only one variant (`all-fixes` on beginner x Opus) cleared zero,
and it did so downward.

For a model failing the style more often at baseline — beginner x Haiku —
the decision does **not** generalize: three of four reinforcement layers
measurably helped. Do not extend "reject reinforcement" to a weaker model or
a style the model is struggling with without measuring that cell directly.

The original decision's specific prohibitions (no `CLAUDE.md` restatement, no
`CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`, no appended reinforcement) remain the
default for this project, since its production traffic is Opus-tier. Treat
them as a default for compliant models, not a universal rule.
