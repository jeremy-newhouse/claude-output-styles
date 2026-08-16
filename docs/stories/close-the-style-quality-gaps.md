---
type: Story
title: Close the style quality gaps
tags:
  - styles
summary: Add guidance and cases for the two scenarios every style handles badly, and lift beginner prose quality
tasks:
  - cos-1
  - cos-4
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: todo
---

# Close the style quality gaps

## Goal

Two weaknesses survived every optimizer pass because neither is a wording
problem. Both need new content in the style files themselves.

**Scenario coverage.** `agentic-fix-verify` and `conv-decision-holdout` score
around 48% on the judge across every style, original and rewritten alike. No
style file says how to report a session containing a dozen tool calls, or how to
handle a decision where neither option is clearly right. The optimizer can only
re-express rules that already exist, so six rewrites across two rounds left this
untouched.

**Beginner prose.** Beginner is the weakest style by a wide margin. Measured on
the standard case set, both models, ten cells each:

| style | rules (opus / sonnet) | judge (opus / sonnet) |
|---|---|---|
| advanced | 97.8 / 96.8 | 73.9 / 66.0 |
| intermediate | 93.8 / 95.0 | 63.9 / 72.6 |
| **beginner** | 90.2 / 91.7 | **45.9 / 48.4** |

It follows its own rules at over 90% and still reads worst. Judge complaints
centre on vague next-steps, restated ideas, and reverting to a helper-assistant
register on follow-up turns. Raising its `judgeWeight` to 0.5 did not let the
optimizer fix it — both cross-model rewrites raised train by roughly 6 points and
dropped holdout by roughly 8, so the keep rule rejected them and the loop
converged having changed nothing.

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
<!-- lore:tasks:end -->

## Notes

The composite scores in the table above are not comparable across styles: each
carries a different `judgeWeight`. The rules and judge columns are directly
comparable, and they are what this story is scored on.

Beginner may need a different instrument rather than a different wording. Its
rules pass while its prose does not, which is the signature of a style whose
stated rules do not capture what makes it good.
