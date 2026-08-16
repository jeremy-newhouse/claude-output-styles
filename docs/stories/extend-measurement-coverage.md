---
type: Story
title: Extend measurement coverage
tags:
  - harness
  - models
summary: Measure all three styles at both ends of the model range — Haiku and Fable — not just the two tiers in the middle
tasks:
  - cos-5
  - cos-7
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: todo
---

# Extend measurement coverage

## Goal

This story opened with every measurement in the project covering Opus and Sonnet
only: `config/matrix.json` listed `haiku` as a target that no style had ever been
run against, and Fable, the top tier, was not in the matrix at all.

That matters for a claim already made: that one style file serves every model. It
was verified for two adjacent tiers and stated as though it were general.

**Haiku has since been measured** under COS-5 (run `22-59-53`) and the table below
now spans three tiers. Fable remains untested and is COS-7's job, so the claim is
still short of the full range.

The two untested ends answer different questions.

**Haiku** is the cheapest model and the most likely to drop instructions under
load, so a rule that survives there is a rule the file is genuinely carrying
rather than one the larger models satisfy by disposition. Rules that Opus and
Sonnet both score at 1.00 are invisible in the current data — Haiku is the only
way to tell which of them the style file is actually enforcing.

**Fable** is the most capable tier and the one used for the longest-running
agentic work, which is where the styles are weakest: `agentic-fix-verify` scores
around 48% on the judge across every style and both measured models. It also
tests a suspicion the current data raises but cannot settle. Opus overruns word
caps roughly twice as often as Sonnet, which may be a property of that model or a
property of the tier. Three points on the curve would tell them apart.

Current coverage, five shared cases, ten cells per pair. Haiku landed under COS-5
(run `22-59-53`); Fable is still unmeasured and is COS-7's job.

| style | haiku | sonnet | opus | fable |
|---|---|---|---|---|
| advanced | rules 96.0 / judge 52.9 | rules 96.8 / judge 66.0 | rules 97.8 / judge 73.9 | none |
| intermediate | rules 94.3 / judge 62.2 | rules 95.6 / judge 72.6 | rules 94.2 / judge 63.9 | none |
| beginner | rules 90.9 / judge 37.5 | rules 92.3 / judge 48.4 | rules 91.5 / judge 45.9 | none |

Haiku was additionally run across the full 13-case pool (78 cells, $1.88), which
the two middle tiers have never had. Two results from that wider run shape what
COS-7 should do:

- **Reserve a column for "no reply".** Six of Haiku's 78 cells hit the 12-turn
  limit and returned nothing, all on cases that edit a file and then run tests.
  Averaging those in as zeros costs Haiku about 10 points of apparent rule score.
  Fable is the tier used for the longest agentic work, so this distinction has to
  exist in the four-tier table, not be discovered again.
- **Do not carry a probe's number into a conclusion.** The claim that Haiku
  writes long sentences came from four cells and did not survive a larger sample
  of the same configuration; see the experiment ledger.

## Acceptance criteria

- All three styles measured on Haiku and on Fable across the standard case set,
  rules and judge reported separately.
- The per-model comparison in the findings spans all four tiers.
- Any model-specific failure mode is recorded, or its absence stated explicitly.
- Whether word-cap overrun tracks model tier is answered from the four-tier
  figures.
- The one-file-for-every-model decision is confirmed across the range or amended.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-5](../../backlog/tasks/cos-5%20-%20Measure-the-styles-on-Haiku.md) | Measure the styles on Haiku | Done |
| [COS-7](../../backlog/tasks/cos-7%20-%20Measure-the-styles-on-Fable.md) | Measure the styles on Fable | To Do |
<!-- lore:tasks:end -->

## Notes

Cost is asymmetric. Three styles, one model, five cases, two repeats is thirty
cells; Haiku cells run well under the conversational average and Fable well over
it. Scope the Fable case set before running rather than reusing the full matrix.

SDK model values: `haiku` and `claude-fable-5[1m]`. There is no bare `fable`
alias in the model list.

If Haiku exposes rules that the larger models satisfy without being told, those
rules are candidates for deletion under the removing-beats-adding principle — but
only after confirming the larger models still hold them once the rule is gone.
