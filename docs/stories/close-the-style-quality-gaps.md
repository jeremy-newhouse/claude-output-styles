---
type: Story
title: Close the style quality gaps
tags:
  - styles
summary: Add guidance and cases for the two scenarios every style handles badly, and lift beginner prose quality
tasks:
  - cos-1
  - cos-4
  - cos-8
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: todo
---

# Close the style quality gaps

## Goal

Two weaknesses survived every optimizer pass because neither is a wording
problem. Both need new content in the style files themselves.

**Scenario coverage.** `agentic-fix-verify` and `conv-decision-holdout` are the
two weakest cases in the pool. On the text that ships today they score, judge,
pooled across the three styles: 50.0 Opus / 40.0 Sonnet and 48.3 / 46.7
respectively (run `00-44-03`). No style file said how to report a session
containing a dozen tool calls, or how to handle a decision where neither option
is clearly right. The optimizer can only re-express rules that already exist, so
six rewrites across two rounds left this untouched.

**COS-1 wrote those rules by hand, and the gap stayed open.** All three style
files now state both, and the judge grades against them — it quotes the new
sections by name. The score did not follow: 46.2 / 42.0 / 51.2 / 54.7 against a
bar of 65 (run `00-48-49`). A second, more forceful pass scored *below* the
original text and was reverted (run `01-03-21`). What the judge's violations
show instead is that **reply length is the binding constraint** — 71–83% of cells
overrun their style's word cap in every arm — and that the agentic half of this
measurement is contaminated by the harness handing the judge the whole turn
rather than the final message. Both are recorded in `FINDINGS.md` under *A
content gap that new content did not close*.

**Beginner prose.** Beginner is the weakest style by a wide margin. Measured on
the standard case set, ten cells each, now across all four model tiers:

| style | rules (opus / sonnet / haiku / fable) | judge (opus / sonnet / haiku / fable) |
|---|---|---|
| advanced | 97.8 / 96.8 / 96.0 / 97.9 | 73.9 / 66.0 / 52.9 / 78.3 |
| intermediate | 94.2 / 95.6 / 94.3 / 93.1 | 63.9 / 72.6 / 62.2 / 67.7 |
| **beginner** | 91.5 / 92.3 / 90.9 / 91.4 | **45.9 / 48.4 / 37.5 / 53.9** |

It follows its own rules at over 90% and still reads worst. Judge complaints
centre on vague next-steps, restated ideas, and reverting to a helper-assistant
register on follow-up turns. Raising its `judgeWeight` to 0.5 did not let the
optimizer fix it — both cross-model rewrites raised train by roughly 6 points and
dropped holdout by roughly 8, so the keep rule rejected them and the loop
converged having changed nothing.

**Two tiers were added after this story was written, and neither rescued it.**
Beginner is last on the judge on every one of the four, and the best score any
model reaches is Fable's 53.9 — the most capable tier available, still 16 points
under the bar. A more capable model does not write better beginner prose from
this file, which is what would have to be true for the gap to be a model problem
rather than a content one. COS-7 also measured the mechanism directly: on the
five shared cases beginner averages 135 words on Opus, 132 on Fable, 113 on Haiku
and 103 on Sonnet, against a stated cap of 80, while every tier writes
comfortably *inside* the looser 120-word advanced cap. The caps are being read as
an audience signal, and the signal points the wrong way — "explain this simply"
is answered with more words, not fewer.

## Acceptance criteria

- Every style file states how to report a multi-tool session in one final
  message, and how to handle a decision where neither option is clearly better.
- New harness cases cover both scenarios so the gap stays measured.
- Judge score on the two weak cases exceeds 65% on both models.
- Beginner judge score exceeds 70% on both models with rules held at or above
  92%.
- Changes validated on cases held out of every optimizer split.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-1](../../backlog/tasks/cos-1%20-%20Close-the-multi-tool-session-and-open-ended-decision-quality-gap.md) | Close the multi-tool session and open-ended decision quality gap | To Do |
| [COS-4](../../backlog/tasks/cos-4%20-%20Raise-beginner-style-prose-quality.md) | Raise beginner style prose quality | To Do |
| [COS-8](../../backlog/tasks/cos-8%20-%20Decide-whether-lower-levels-need-tighter-sentence-caps.md) | Decide whether lower levels need tighter sentence caps | Done |
<!-- lore:tasks:end -->

## Notes

The composite scores in the table above are not comparable across styles: each
carries a different `judgeWeight`. The rules and judge columns are directly
comparable, and they are what this story is scored on.

**"On both models" above means Opus and Sonnet, and the tasks are where that
binds.** COS-1's AC #4 and COS-4's AC #1 name the two models explicitly, so
adding Haiku and Fable does not move either bar — beginner climbs to 70% from
45.9 and 48.4, not from Haiku's 37.5. This story's looser phrasing predates the
two extra tiers and is subordinate to the task text. Widening the bars to every
tier would be a scope change, and nobody has asked for one.

Beginner may need a different instrument rather than a different wording. Its
rules pass while its prose does not, which is the signature of a style whose
stated rules do not capture what makes it good.

COS-8 narrowed where to look. Sentence length is not the lever: tightening
beginner's stated cap to 12 words changed nothing measurable on either model
(+0.26 words, 95% CI [−0.77, +1.29]) and did not move the judge. Reply length is
the constraint that actually binds — beginner averages 119 words against its
stated 80, with half its replies over — and where the two can be told apart, the
judge tracks reply length far more strongly than sentence length. Any attempt at
COS-4 that works on sentence-level wording alone is likely to repeat the six
optimizer rewrites that already failed.
