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
- Time. An agentic cell takes substantially longer than a conversational one, and
  cell count is `styles x variants x models x cases x repeats`, which multiplies
  fast. `run.maxCellSeconds` bounds any single cell that wedges.

## Steps

### Measure

```bash
node src/cli.mjs run --styles=plain-english-advanced --models=opus,sonnet
```

Writes `results/<stamp>/rows.json`, `summary.json`, `report.md`, and `run.json`.
Read the `WORST RULES` block first — it names the broken rule, the model, and
quotes the offending text.

**Check the `dropped` count before quoting any figure.** Every table states `n`
(the cells behind the score) separately from `cells` (the arm you asked for). A
cell that aborted or said nothing is excluded from the means automatically, so
the two differ whenever a case failed — usually the agentic ones on the smaller
models, where the 12-turn limit bites. A wide gap does not invalidate the score;
it narrows what the score is about, from "how the style performs" to "how it
performs on the cells that finished". An arm where nothing replied prints `n/a`,
not `0.0%`.

Useful flags: `--variants`, `--cases`, `--repeats`, `--concurrency`,
`--no-judge`.

**Killing a run is safe.** All four files are re-written after every completed
cell, so Ctrl-C loses the cell in flight and nothing else. `run.json` carries
`complete: false` until the command finishes; a directory holding that flag is a
real run that stopped early, not a corrupt one. Re-score it exactly as you would
a finished run — `score` names the shortfall before it prints anything.

### Re-grade without re-running

After changing a check, re-score the saved transcripts offline:

```bash
node src/cli.mjs score            # newest run
node src/cli.mjs score --rows=results/<stamp>/rows.json
```

Costs nothing. Do this before assuming a score moved because the style changed.

### Re-judge without re-running

`score` re-runs the deterministic checks. It cannot re-run the judge, because a
judge score is a model call. `judge` is that path:

```bash
node src/cli.mjs judge --rows=results/<stamp>/rows.json \
  --judges=sonnet,opus,haiku --judge-repeats=3
```

It runs no cell. It re-grades each saved reply once per judge model per repeat
and writes `judgements.json`, `analysis.json`, `report.md` and a `judge.json`
manifest. Use it for two questions: how much of a score is the judge rather than
the reply, and whether another model tier would rank the same replies the same
way.

The report splits the per-cell SD into a judge half and a reply half, reports
each other judge's agreement with the reference judge paired per reply, and sizes
arms from the split. Records carry an `ok` flag; a call that failed or returned
unparseable JSON substitutes 0.5, and 0.5 sits inside the range real scores
occupy, so those records are excluded from every figure rather than pooled.

Killing it is safe on the same terms as `run`. The plan is ordered by sweep —
every judge over every reply once, then again — so a kill leaves whole balanced
passes rather than a few replies judged many times.

### Size the arm

Judge each cell **once**, and buy precision with cells rather than repeats. The
crossover is measured, not assumed.

Variance of an arm mean is `(varReply + varJudge / k) / n` for `n` cells at `k`
judge calls each, so repeat-judging shrinks only the judge's share. Going from
`k` to `k+1` beats spending the same budget on cells only when one cell costs
fewer than `(k+1)(varReply + varJudge/k)/varJudge − k` judge calls — **10.9 at
k=1**, 14.3 at k=2. Measured on Sonnet: a conversational cell 9.6s mean over
four cases (5.4s to 15.1s), a judge call 6.1s median and 13.9s mean over 180.
That puts a cell between 0.7 and 1.6 judge calls whichever statistic you pick —
nowhere near eleven.

Cells per model for a 95% half-width, from the components COS-20 measured on
**beginner under the Sonnet judge** — the pairing COS-4's 24.6-point SD came
from:

| half-width | k=1 | k=2 | k=3 | floor (k→∞) |
|---|---|---|---|---|
| ±10 | 24 | 22 | 21 | 20 |
| ±7 | 49 | 45 | 43 | 40 |
| ±5 | 95 | 87 | 84 | 79 |
| ±4 | 148 | 135 | 131 | **123** |

Double for a difference *between* two arms. The floor column is the point of the
table: 83% of the variance is the reply, so no number of judge calls per cell
takes a ±4 arm below 123.

**Size on the style you are measuring, not on this table.** The same run puts
intermediate at 169 cells for ±4 and advanced at 207, because a judge that
spreads replies further needs more of them to place the mean. The tool sizes per
style for that reason, and pools only when no single style has the repeats to
decompose — a pooled basis buries the gap *between* styles in the reply
component and asks for 208 cells where beginner needs 148.

The one place the answer flips is a cell that is genuinely expensive against the
judge. An agentic cell that runs to the `maxCellSeconds` cap, graded by a fast
judge, is far past 10.9 — but that is a ratio to measure on the arm in hand, not
one to assume.

Two more results from the same run are worth carrying into a judge choice.
`matrix.run.judgeModel` is `sonnet`, and Sonnet is the **least repeatable** of
the four tiers tested — judge SD 10.17 points against Opus's 5.49. And Haiku,
the cheapest, took 59.5s per call against Opus's 7.6s and returned unparseable
output on 6 of 180 calls, so it is neither the fast option nor the reliable one.

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

The run also writes `rows.json`, `summary.json`, `report.md` and `run.json` at
`results/<stamp>/`, exactly as a `run` does, with every cell tagged by the
iteration that produced it. An improve `run.json` carries no expected cell count,
because how many iterations the loop buys is not known until it stops. Re-score them later with
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
node src/cli.mjs audit --styles=<style>          # must pass before the next line
cp ../<style>.md ~/.claude/output-styles/<style>.md
```

**The audit step is not optional here, and it will fire sooner or later.** The
rewriter is told to delete instructions the measurements show are already
satisfied, and `sentence_length` and `paragraph_length` sit near 1.0 — so a
candidate that drops or rephrases "Keep sentences under 20 words" is a normal
optimizer output, not a malfunction. Adopting it puts the file and
`contracts.json` out of agreement and turns `npm test` red on a rewrite that
legitimately won. When that happens, decide which side is right — if the cap
still applies, restore the line to the adopted body; if the rewrite genuinely
retired it, change `contracts.json` to match and re-run the numbers, because the
old ones were graded against a rule the style no longer states.

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
