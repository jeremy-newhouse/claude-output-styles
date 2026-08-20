---
# yaml-language-server: $schema=../.lore/schemas/reference.schema.json
type: Reference
title: Documentation
summary: Entry point for the Plain English output styles and the harness that measures them
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:40:26.259Z
okf_version: "0.2"
---

# Documentation

Three Claude Code output styles that make it communicate in clear, jargon-free
language at three technical depths, and a harness that measures whether a model
actually obeys a style instead of leaving it to impression.

## Start here

**Using the styles.** [Install and switch an output style](runbooks/install-and-switch-an-output-style.md)
— including how to prove one loaded, which is not the same as configuring it.
[Style contracts by audience level](specs/style-contracts-by-audience-level.md)
states what each level commits to.

**Understanding the behaviour.** [Output style injection mechanics](reference/output-style-injection-mechanics.md)
covers how Claude Code resolves, loads, and places a style, verified against
2.1.233 — including two places the published documentation disagrees with
observed behaviour.

**Working on the harness.** [Harness architecture](reference/harness-architecture.md)
for the module map and invariants, [Measure and optimize an output style](runbooks/measure-and-optimize-an-output-style.md)
for the procedure.

**What has been measured.** [Experiment ledger](reference/experiment-ledger.md)
— every run, what it tested, what it established.

**Current state and open work.** [Plain English output styles](epics/plain-english-output-styles.md).

## What the measurement found

Opus was reported to be ignoring the styles. It was not. It obeys most of the
same rules Sonnet does and drops a different two, both landing on the first line
of a reply, which is what made it feel like disregard. A silent configuration
failure accounted for the rest.

Rule compliance is high across every style and **all four model tiers** — 90.9%
to 97.9%, holding across a tenfold cost range. Prose quality is not: beginner
sits 15 to 28 points below advanced depending on the model, on every tier, while
following its own rules at over 90%. That gap is the shape of the remaining work,
and no model tier closes it — the best beginner judge score any of them reaches
is 53.9%, against a 70% bar.

Those beginner figures are from before COS-4 rewrote the file. On COS-4's pass-1
text — what shipped until COS-16 — beginner scores rules **98.9 / 97.4 and judge
66.8 / 60.9** on Opus and Sonnet, over **150 cells a model** (COS-16, runs
`19-42-55` and `19-53-49`). Rule
compliance and reply length improved; the judge did not, and the bar is missed on
both models. COS-4 published 98.5 / 97.4 and 73.9 / 58.1 for the same bytes at 35
cells a model; the judge halves are superseded by the larger arm, which sits
inside COS-4's own interval of [66.0, 81.9] on Opus.

**COS-16 has since changed those bytes.** The shipped file is now the three-edit candidate (sha256 `86451ddb`). At the same 150 cells a model it reads rules **99.2 / 97.4** and judge **66.1 / 60.9** on the shared five (run `2026-08-20T03-03-26`), and every paired interval against `19-42-55` contains zero — the figures above stand as current within noise, but `19-42-55` measures the text COS-16 replaced, not the text that ships.

Three decisions came out of it, each measured rather than argued: styles are
scored by [deterministic checks plus a style-aware judge](adr/score-styles-with-deterministic-checks-plus-a-style-aware-judge.md);
[one file serves every model](adr/ship-one-style-file-for-every-model.md); and
[harness-level reinforcement is rejected](adr/reject-harness-level-reinforcement-of-style-rules.md)
because every added instruction layer measured worse than the bare style file.
A fourth came out of the optimizer being wrong twice:
[validate candidates on cases held out of every split](adr/validate-candidates-on-cases-held-out-of-every-split.md).

## Bundle

<!-- lore:index:begin -->
- [adr](adr/index.md)
- [epics](epics/index.md)
- [reference](reference/index.md)
- [runbooks](runbooks/index.md)
- [specs](specs/index.md)
- [stories](stories/index.md)
<!-- lore:index:end -->
