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

Accepted

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

An existing project `CLAUDE.md` that restates tone rules is a liability, not a
help. Deleting those sections is an improvement.

The harness keeps these variants defined in `config/matrix.json` so the finding
can be re-tested quickly when Claude Code changes how it assembles the prompt.
The conclusion is tied to 2.1.233 and should not be assumed permanent.

The tail-reminder variant lost only 0.7 points, inside the noise band for five
cases. It is rejected as unnecessary rather than as clearly harmful — the same
effect is available for free by ordering the style body correctly.
