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
| `run.mjs` | one cell: multi-turn session via `resume`, collects visible text, tool calls and `elapsedMs`, bounded by the `maxCellSeconds` `AbortController`; `splitTurn` derives the two views of a turn; also the concurrency pool |
| `checks.mjs` | one function per style rule; pure, no model calls, unit-tested; each check declares which view it grades |
| `judge.mjs` | rubric grading against the style body, on the view the case names |
| `evaluate.mjs` | crosses the matrix, combines the two scores by `judgeWeight`, summarizes; calls back with the rows completed so far after every cell |
| `results.mjs` | writes a run directory — rows, summary, report, and the `run.json` completeness manifest — atomically, and reads the manifest back |
| `improve.mjs` | the optimizer loop, keep/revert rule, patience stop, reserve validation |
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
  validate a candidate it wants to adopt. `judgeOn` names which view of the turn
  the rubric grades, and every agentic case must state it — a test enforces that.
- `fixtures/repo/` — a small module with a real rounding bug and a test file
  whose comments contradict its assertions, copied into every workspace.

### Variants

A variant is a harness-level configuration tested independently of the style
text, so a failure can be attributed to the wording or to the plumbing. Each
maps to a switch in `workspace.mjs`: a tail reminder appended to the style body,
a `CLAUDE.md` written into the workspace, or
`CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` set in the child environment.

### Two views of a turn

A cell's saved row carries the last turn twice. `trace` is every assistant text
block joined by a blank line — the whole turn, narration included. `text` is the
final message: the blocks after the last tool call, or the last block said if the
turn ended on a tool call. On a conversational turn the two are the same string,
so the distinction only bites on agentic cells. `allTurns` and `allFinals` carry
the same pair for every turn of a multi-turn case.

Nothing picks between them implicitly. Each entry in `CHECKS` declares `reads`,
and each case declares `judgeOn` for its judge; both values appear on the saved
row, so a figure lifted out of `rows.json` says which string produced it. The
line follows the case rubrics: checks that measure how the answer is written read
`final`, and rules the style states as outright bans — narration, celebration,
emoji — read `trace`, because those are violations wherever they appear.

Before COS-10 there was one string, built by concatenating the blocks with no
separator, and it is not separable after the fact. `viewsOf` serves such a row's
`text` as both views and flags it; `score` reports how many rows and how many
agentic cells in a file predate the fix.

### Invariants worth preserving

**Nothing mutates a style file.** `improve` writes candidates under
`results/<stamp>/candidates/`; adopting one is a manual copy. The only
destructive operation in the project is that copy.

**Transcripts are the durable artifact.** `run` and `improve` both persist
`rows.json`, so any scoring change can be re-graded offline at no token cost via
`score`. This is why deterministic scores stay comparable across the project's
whole history while judge scores do not. An improve run's rows carry the
`iteration` that produced them, including the reverted ones, and the run's
reported cell count is derived from those rows rather than from a counter held
only in memory — so the loop's own numbers can be recomputed by anyone holding
the run directory.

**A measured cell is on disk before the next one starts.** `run` re-writes the
whole run directory after every completed cell, through a temp file and a rename,
so being killed — Ctrl-C, an OOM, a closed lid — loses at most the one cell in
flight rather than the entire arm. `improve` flushes on the same
writer but at its own granularity, once per measured split rather than per cell,
which is what it has done since COS-3; a killed improve loses the measurement in
flight, not the loop. `improve` claims `complete` only when every style finished:
a style that threw is caught and recorded, and its rows are the wreckage of an
aborted optimization rather than a result. The price of flushing at all is a
directory that can legitimately be incomplete, so `run.json` states it:
`complete` is false until the command finishes, `score` prints what the manifest
says on stdout above its tables, and a partial `report.md` opens with the same
sentence as a blockquote. `rows.json` stays a bare array,
because every saved run in the ledger is one and every offline re-derivation
reads it as one; the completeness flag lives beside it rather than inside it.

**A grader failure must not kill a run.** Judge errors return a neutral 0.5 with
the error on the row. An earlier version let the exception propagate and lost a
long multi-style run partway through.

**Checks are pure.** No model calls, no filesystem, no clock. That is what makes
them unit-testable and reproducible; `test/checks.test.mjs` covers all of them.

### Keeping a run bounded

`run.maxCellSeconds` bounds each cell on wall-clock time through an
`AbortController` — the only hard stop the SDK offers, since `maxTurns` bounds
tool rounds but not the time inside one. `run.maxTurns` bounds those rounds,
`run.concurrency` caps parallelism, and `--no-judge` drops the grader. Cell count
is `styles x variants x models x cases x repeats`. A cell that trips the timeout
returns `error: "error_timeout"` and is excluded from every mean, and every row
records `elapsedMs` so the ceiling can be tuned against measured durations.

The guard bounds a cell, not a run. The judge call and the optimizer's rewrite
call take no `abortController`, so either stalling still hangs the run; that gap
predates the guard and is COS-26.
