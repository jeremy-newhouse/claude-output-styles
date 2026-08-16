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

Rule compliance is high across every style and both models — 91.5% to 97.8%.
Prose quality is not, and beginner sits twenty points below advanced on both
models while following its own rules at over 90%. That gap is the shape of the
remaining work.

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
