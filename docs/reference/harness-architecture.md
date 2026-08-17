---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Harness architecture
tags:
  - harness
  - architecture
summary: 'How the measurement harness is put together: module map, data flow, and where configuration lives'
generated:
  by: lore/0.2.0
  at: 2026-08-16T13:05:00.000Z
---

# Harness architecture

Node ESM, no build step, one dependency: `@anthropic-ai/claude-agent-sdk`. Run
from `harness/` via `node src/cli.mjs <run|improve|score>`.

## Details

### Data flow

```
cases.json + contracts.json + matrix.json
        |
        v
   cli.mjs  ── builds the cell list: styles x variants x models x cases x repeats
        |
        v
  evaluate.mjs ── bounded-concurrency pool over cells
        |
        +--> run.mjs ──> workspace.mjs ──> a throwaway .claude/ workspace
        |                                   + one Claude Code session per turn
        |                                   returns the last turn's visible text
        |
        +--> checks.mjs ──> deterministic rule scores + quoted evidence
        |
        +--> judge.mjs  ──> rubric score + violations (own system prompt, no tools)
        |
        v
   summarize() ── grouped tables + a ranked failure list
        |
        v
  report.mjs ──> console tables and results/<stamp>/report.md
```

`improve.mjs` sits above `evaluate.mjs`, calling it repeatedly: measure, brief an
author model from the failures, rewrite, re-measure, keep or revert.

### Module map

| module | responsibility |
|---|---|
| `cli.mjs` | argument parsing, cell-list construction, output paths, the three commands |
| `workspace.mjs` | builds a throwaway workspace with the style file, settings, and fixture repo; encodes the verified SDK loading recipe and the variant switches |
| `style.mjs` | frontmatter parse and render, so a rewritten body can be re-emitted with the original metadata |
| `run.mjs` | one cell: multi-turn session via `resume`, collects visible text, tool calls, cost; also the concurrency pool |
| `checks.mjs` | one function per style rule; pure, no model calls, unit-tested |
| `judge.mjs` | rubric grading against the style body |
| `evaluate.mjs` | crosses the matrix, combines the two scores by `judgeWeight`, summarizes; calls back with the rows completed so far after every cell |
| `results.mjs` | writes a run directory — rows, summary, report, and the `run.json` completeness manifest — atomically, and reads the manifest back |
| `improve.mjs` | the optimizer loop, keep/revert rule, patience stop, reserve validation, spend tracking |
| `report.mjs` | console and Markdown rendering |

### Configuration

- `config/contracts.json` — per-style numeric caps, ban lists, check lists,
  rule weights, `judgeWeight`, and the path to the style file. Adding a style to
  the harness means adding a contract entry.
- `config/matrix.json` — models, styles, variants, and the `run` and `improve`
  parameter blocks.
- `cases/cases.json` — prompts with a split, a check list, and a judge rubric.
  `multiTurn` replaces `prompt` for drift cases; `agentic: true` marks cases that
  need the fixture repo. The split is one of `train`, `holdout`, or `reserve`;
  `improve` selects the first two by name and measures the third only to
  validate a candidate it wants to adopt.
- `fixtures/repo/` — a small module with a real rounding bug and a test file
  whose comments contradict its assertions, copied into every workspace.

### Variants

A variant is a harness-level configuration tested independently of the style
text, so a failure can be attributed to the wording or to the plumbing. Each
maps to a switch in `workspace.mjs`: a tail reminder appended to the style body,
a `CLAUDE.md` written into the workspace, or
`CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` set in the child environment.

### Invariants worth preserving

**Nothing mutates a style file.** `improve` writes candidates under
`results/<stamp>/candidates/`; adopting one is a manual copy. The only
destructive operation in the project is that copy.

**Transcripts are the durable artifact.** `run` and `improve` both persist
`rows.json`, so any scoring change can be re-graded offline at no token cost via
`score`. This is why deterministic scores stay comparable across the project's
whole history while judge scores do not. An improve run's rows carry the
`iteration` that produced them, including the reverted ones, and the run's
reported spend is the sum of those rows rather than a counter held only in
memory — so the loop's own numbers can be recomputed by anyone holding the run
directory.

**A cell that has been paid for is on disk before the next one starts.** Both
commands re-write the whole run directory after every completed cell, through a
temp file and a rename, so being killed — Ctrl-C, an OOM, a closed lid — costs at
most the one cell in flight rather than the entire arm. The price of that is a
directory that can legitimately be incomplete, so `run.json` states it:
`complete` is false until the command finishes, and `score` prints what the
manifest says before it prints a single figure. `rows.json` stays a bare array,
because every saved run in the ledger is one and every offline re-derivation
reads it as one; the completeness flag lives beside it rather than inside it.

**A grader failure must not kill a run.** Judge errors return a neutral 0.5 with
the error on the row. An earlier version let the exception propagate and lost a
paid multi-style run partway through.

**Checks are pure.** No model calls, no filesystem, no clock. That is what makes
them unit-testable and reproducible; `test/checks.test.mjs` covers all of them.

### Cost control

`run.maxBudgetUsd` caps each cell, `run.concurrency` caps parallelism, and
`--no-judge` drops the grader. Cell count is
`styles x variants x models x cases x repeats`.
