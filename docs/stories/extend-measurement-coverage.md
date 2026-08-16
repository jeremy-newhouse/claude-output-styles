---
type: Story
title: Extend measurement coverage
tags:
  - harness
  - models
summary: Measure all three styles on Haiku, the cheapest model and the strongest test of a style file
tasks:
  - cos-5
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: todo
---

# Extend measurement coverage

## Goal

`config/matrix.json` lists `haiku` as a target model. No style has ever been run
against it. Every measurement in this project covers Opus and Sonnet only.

That matters for a claim already made: that one style file serves every model.
It is verified for two models, and stated as though it were general.

Haiku is the strongest test available. It is the cheapest model and the most
likely to drop instructions under load, so a rule that survives there is a rule
the file is genuinely carrying rather than one the larger models satisfy by
disposition. Rules that Opus and Sonnet both score at 1.00 are invisible in the
current data — Haiku is the only way to tell which of them the style file is
actually enforcing.

Current coverage, standard case set, ten cells per pair:

| style | opus | sonnet | haiku |
|---|---|---|---|
| advanced | rules 97.8 / judge 73.9 | rules 96.8 / judge 66.0 | none |
| intermediate | rules 93.8 / judge 63.9 | rules 95.0 / judge 72.6 | none |
| beginner | rules 90.2 / judge 45.9 | rules 91.7 / judge 48.4 | none |

## Acceptance criteria

- All three styles measured on Haiku across the standard case set, both halves
  of the score reported.
- The per-model comparison in the findings covers Haiku alongside Opus and
  Sonnet.
- Any Haiku-specific failure mode is recorded, or its absence stated explicitly.
- The one-file-for-every-model decision is either confirmed for Haiku or
  amended.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-5](../../backlog/tasks/cos-5%20-%20Measure-the-styles-on-Haiku.md) | Measure the styles on Haiku | To Do |
<!-- lore:tasks:end -->

## Notes

Cheap to run: three styles, one model, five cases, two repeats is thirty cells.
Haiku cells cost well under the conversational average.

If Haiku exposes rules that the larger models satisfy without being told, those
rules are candidates for deletion from the style files under the removing-beats-
adding principle — but only after confirming the larger models still hold them
once the rule is gone.
