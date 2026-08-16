---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Ship one style file for every model
tags:
  - styles
  - models
summary: Models drop different subsets of the same rules, and outputStyle is a single string read once at session start
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:46:28.024Z
---

# Ship one style file for every model

## Status

Accepted

## Context

Opus appeared to ignore the output styles while Sonnet appeared to follow them,
which suggested per-model style files — `Plain English - Advanced (Opus)` and so
on. Measurement did not support that reading.

Both models obey most of the same rules. They drop *different subsets*:

| rule | Opus | Sonnet |
|---|---|---|
| `total_length` | **0.63** | 0.85 |
| `leads_with_conclusion` | **0.89** | 1.00 |
| `sentence_length` | 0.90 | **0.70** |
| `three_question_structure` | 1.00 | **0.83** |
| `two_options_max` | 1.00 | **0.85** |
| the other eight rules | 1.00 | 1.00 |

No rule is one model's requirement and the other's exception. Eight of thirteen
are satisfied perfectly by both. A per-model file would duplicate eleven rules to
differentiate two.

A style rewritten from Opus-only failures then improved *both* models — Opus by
6.9 points and Sonnet by 5.9 — and narrowed the gap between them from 3.1 points
to 2.1. Fixing the rule one model drops does not cost the model that already
follows it.

The mechanics rule it out independently. `outputStyle` is a single string with no
per-model key, and the style is read once at session start, so switching model
mid-session does not reload it. A per-model scheme would silently run the wrong
file until the next `/clear`.

## Decision

One style file per audience level, shared by every model. State every rule
enforceably rather than tuning wording per model. When a rule is measured as
weak on one model, strengthen it in the shared file and verify the other model
does not regress.

## Consequences

Every candidate must be scored on more than one model before it can be adopted.
A single-model fitness function produces files that trade one model's quality for
another's — two rewrites optimized against Opus alone were later rejected because
they degraded on Sonnet.

The style files carry rules that a given model may already satisfy by
disposition. That redundancy is accepted: it costs a few tokens and protects
against model updates that change which rules get dropped.

Cheap models are untested. Haiku is listed as a target but has never been
measured, so the claim that one file serves every model is verified for Opus and
Sonnet only.
