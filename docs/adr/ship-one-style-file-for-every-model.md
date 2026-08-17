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

The small end is now tested and the decision held. COS-5 measured all three
styles on Haiku (`22-59-53`): rule compliance came in at 90.9–96.0 on the shared
five cases, never more than 1.8 points behind the better of Opus and Sonnet, and
ahead of Opus on intermediate. One file does serve the third tier.

What Haiku loses is prose quality, not rule-following — judge 37.5–62.2, last on
all three styles. Per-model files would not address that: the *rules* ranking is
advanced > intermediate > beginner on every model measured, so no model needs a
different set of rules. It also exposed one failure no style file can reach:
Haiku exhausts the 12-turn limit on fix-then-test work and returns nothing at
all, on all three styles alike.

**The top of the range is now tested too, and the decision held there.** COS-7
measured all three styles on Fable (`23-48-45`, 30 cells, no errors): rule
compliance 91.4–97.9, never more than 2.5 points behind the best of the other
three. Fable drops the same subsets the others do rather than different ones —
`total_length` 75.0, `leads_with_conclusion` 83.3, `sentence_length` 90.6 and
`no_process_narration` 91.7. Those four are exactly the rules the other tiers
drop; the **remaining eight score 96.7–100.0 on all four tiers at once.** No rule
is one tier's requirement and another's exception, which is this decision's
actual test, and it now holds across a tenfold cost range.

One earlier sentence here overstated the evidence and is corrected. It said the
ranking of styles is identical on every model. That is true of the rules ranking
and true of beginner placing last on the judge, but the judge's top two swap:
Haiku and Sonnet rank intermediate above advanced, Opus and Fable rank advanced
above intermediate. The swap was already visible in the three-model data. It does
not argue for per-model files — it is about which audience level reads best, not
about which rules a model needs — but the claim has to say what was measured.

"Every model" is now verified for four tiers of four.
