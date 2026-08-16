---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Measure and optimize an output style
tags:
  - harness
  - howto
summary: How to run the harness, read its output, and drive the rewrite loop without shipping an overfitted style
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:46:28.024Z
---

# Measure and optimize an output style

## Purpose

Get a number for how well a model obeys a style file, and improve that file from
the measured failures without shipping a rewrite that games the checks.

## Prerequisites

- `cd harness && npm install`
- An authenticated Claude Code install. The harness spawns real sessions.
- A style file with frontmatter `name:` and a contract entry in
  `harness/config/contracts.json` giving its numeric caps and check list.
- Budget. A conversational cell costs roughly $0.10 to $0.15 and an agentic one
  more. Cell count is `styles x variants x models x cases x repeats`, which
  multiplies fast.

## Steps

### Measure

```bash
node src/cli.mjs run --styles=plain-english-advanced --models=opus,sonnet
```

Writes `results/<stamp>/rows.json`, `summary.json`, and `report.md`. Read the
`WORST RULES` block first — it names the broken rule, the model, and quotes the
offending text.

Useful flags: `--variants`, `--cases`, `--repeats`, `--concurrency`,
`--no-judge`.

### Re-grade without spending

After changing a check, re-score the saved transcripts offline:

```bash
node src/cli.mjs score            # newest run
node src/cli.mjs score --rows=results/<stamp>/rows.json
```

Costs nothing. Do this before assuming a score moved because the style changed.

### Optimize

```bash
node src/cli.mjs improve --styles=plain-english-advanced --models=opus,sonnet
```

Each iteration measures the current file, briefs an author model with the failing
rules plus quoted evidence, rewrites the body, and re-measures. A candidate is
kept only if train improves and holdout does not regress past `minHoldoutDelta`.
Two consecutive rejected rewrites stop the loop.

Always pass more than one model. A single-model fitness function produces files
that trade one model's quality for another's.

Candidates land in `results/<stamp>/candidates/`. Nothing is written back to the
real style files — that is a deliberate manual step.

The run also writes `rows.json`, `summary.json`, and `report.md` at
`results/<stamp>/`, exactly as a `run` does, with every cell tagged by the
iteration that produced it. Re-score them later with
`node src/cli.mjs score --rows=results/<stamp>/rows.json`; the `BY ITERATION`
table is the loop's trace, and the reverted iterations are in there too.

Read that table, not the headline. An improve `report.md` pools the baseline with
every rejected candidate, so its overall figure describes no style — it opens
with a warning saying as much. The style's real numbers are the `v0` rows, or the
kept iteration if one survived.

### Read the reserve verdict

The loop's own holdout is a tuning signal, not a verdict. Both splits come from
the same case pool, so a rewrite can satisfy both and still degrade on genuinely
unseen prompts — this has happened twice.

The loop now checks this itself. When a rewrite is kept, `improve` measures the
incumbent and the winner on the `reserve` split — cases it never selects for
train or holdout — and prints the verdict on the style's headline line:

```
plain-english-advanced: v3 REJECTED on reserve — keeping v0  (train 0.888 holdout 0.905)
  reserve: v3 0.840 vs v0 0.908 (-0.068) over 4 cases
```

The train and holdout figures on a rejected line are **v0's**, not the rejected
candidate's — the rollback has already happened by the time the line is printed.
v3's own numbers, the ones that won it the loop, are in the by-iteration rows
below it.

A rejection is a rollback, not a warning label: `<style>.best.md` holds the
incumbent, and the rejected rewrite stays at `<style>.v<N>.md`. So the file you
copy in the next step is already the one that survived — there is no separate
validation command to run.

Two things still need your eyes:

- **Watch the two halves separately** in the `BY SPLIT` and by-iteration tables.
  A candidate whose rules rise while its judge score falls is gaming the checks,
  and every rejected candidate in this project has that signature. The composite
  can clear the reserve bar while that trade is happening underneath it.
- **`reserve: NOT MEASURED`** on an adopted candidate means there were no
  reserve cases in the run — often because `--cases=` filtered them out. That is
  an unvalidated adoption, not a pass. Re-run with reserve cases included before
  adopting.

The reserve is a floor, not a promise. Cross-model confirmation is still worth
buying for a rewrite you intend to ship:

```bash
node src/cli.mjs run --styles=<current>,<candidate> --models=opus,sonnet --repeats=2
```

### Adopt

```bash
cp results/<stamp>/candidates/<style>.best.md ../<style>.md
cp ../<style>.md ~/.claude/output-styles/<style>.md
```

Takes effect on the next session or after `/clear`. Confirm it actually loaded
rather than merely being configured — see the injection-mechanics reference.

Move rejected candidates to `harness/rejected/` with their numbers, so the same
rewrite is not attempted again.

## Rollback

Style files are plain Markdown under version control. Revert the file, copy it
back to `~/.claude/output-styles/`, and start a new session.

Nothing in the harness mutates a style file, settings, or the installed styles.
The only destructive step is the manual `cp` in the adopt step.

If a run is killed partway, saved transcripts from completed cells remain under
`results/<stamp>/` and are still valid input to `score`.
