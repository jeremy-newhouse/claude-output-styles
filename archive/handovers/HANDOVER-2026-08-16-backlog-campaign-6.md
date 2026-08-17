# Handover — measure the styles on Fable (COS-7), campaign 5/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `14d72ea`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `14d72ea` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-7 — measure all three styles on Fable, extend FINDINGS.md's
per-model comparison to a fourth tier, and answer whether word-cap overrun
tracks model tier. Queue order confirmed by user on 2026-08-16 (COS-6 ✓,
COS-3 ✓, COS-2 ✓, COS-8 ✓, COS-5 ✓, then COS-7, COS-1, COS-4); do not re-ask.
Risk policy: record-and-park.

COS-7 is the most expensive item in the queue (~$20 budgeted). Fable's SDK id is
`claude-fable-5[1m]` — there is NO bare `fable` alias, and it is not currently in
matrix.json's models list. SCOPE THE CASE SET BEFORE RUNNING: the story doc says
so explicitly, and COS-5's measured per-cell costs make the arithmetic concrete
(haiku $0.024, sonnet $0.101, opus $0.149 — Fable is above all three). The full
13-case pool at 3 styles x 2 repeats is 78 cells; on the five shared cases it is
30. Read "How to make COS-7's table comparable" below before choosing.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to
harness/src/checks.mjs needs a matching case in harness/test/checks.test.mjs,
and any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `14d72ea`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `14d72ea` |
| Cursor issue | COS-7 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-7, 5 resolved, 3 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#6 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–5 (`-5.md` is this session's predecessor) |
| Campaign progress | 5 of 8 resolved. Next is session 6 |
| Spend so far | $5.93 total ($0.75 s2, $1.18 s3, $2.42 s4, $1.88 s5) — see the caveats below |
| Test suite | 52/52 (`npm --prefix harness test`), was 47 |
| Raised but NOT queued | COS-9 (`two_options_max` blind to prose option sprawl); the `sentences()` newline artifact; the `code_block_size` conditional-rule gap; `run` not flushing rows incrementally (new, below) |

### Two spend caveats, both real

- Cells that abort on the turn limit record `costUsd: 0` — the SDK result message
  carries no cost on a max-turns abort — so `22-59-53`'s six failed cells burned
  tokens no row records. Any run with errors understates its own spend.
- One aborted invocation this session has **no artifact at all**: `run --help`
  launched the full paid matrix (now fixed, see below), ran ~2 minutes at
  concurrency 4, and was killed before `run` wrote `rows.json`. Its spend is real
  and unquantified. The $5.93 excludes it.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-7 dev`.
3. Read `backlog instructions task-execution`; mark COS-7 In Progress; record the plan.
4. Add Fable to `config/matrix.json`'s `models` as `claude-fable-5[1m]`, or pass
   it via `--models=`. Confirm the SDK accepts the id with ONE cheap cell before
   launching the matrix — a wrong model id would burn the whole run.
5. Choose the case set deliberately and say why (see below).
6. Extend FINDINGS.md's per-model table to a fourth column, and the epic snapshot
   and story coverage table with it. All three now carry three tiers.
7. Answer the story's open question: does word-cap overrun track model tier?
   `total_length` is the relevant check; COS-5's figures for the other three
   tiers are in FINDINGS.md's reply-length table.
8. Gates: `npm --prefix harness test` 52/52; `node src/cli.mjs audit` exit 0;
   `lore check` exit 0 after `lore sync`; add the run to the experiment ledger.
9. Update `doc-1` on the branch (COS-7 → Resolved, cursor → COS-1, session log),
   commit with `Refs: COS-7`, review with `/code-review high`, push, PR into `dev`,
   rebase-merge, sync, promote `main`, prune.

## How to make COS-7's table comparable — read before choosing a case set

COS-5 hit this exact problem and the solution is reusable. The Opus/Sonnet
baseline (`12-44-03`) used **5 cases**; Haiku was run on all **13**. The
cross-model table was made like-for-like by *slicing the larger run down to the
five shared case ids*, after verifying in git that the case definitions, style
files, `checks.mjs` and `contracts.json` were all unchanged between runs.
Re-scoring `12-44-03` offline first (free) reproduced its twelve published
figures exactly, which is what made reuse defensible rather than lazy.

So the cheapest defensible COS-7 is: **run Fable on the five shared cases**
(3 styles × 5 cases × 2 repeats = 30 cells), which drops straight into the
existing table with no slicing needed. If budget allows the full 13, run it — but
report the shared-5 slice in the cross-model table and the full-pool figures
separately, labelled, as COS-5 did. A figure must always carry its case count.

**Verify the reuse preconditions again before quoting `12-44-03` or `22-59-53`.**
Do not assume; the check is a few `git log` calls and it is what makes the table
honest.

## Critical context / traps

- **A cell that never answered is not a badly-styled cell.** COS-5's central
  methodological finding. Haiku hit the 12-turn limit on 6 of 78 cells and
  returned nothing; `scoreDeterministic` grades empty text as 0.0 on every rule,
  which read as a ten-point collapse in rule compliance when the real event was
  a total failure to finish. FINDINGS.md now reports "replies only" and
  "counting no-reply as 0" in separate columns. **Fable is the tier meant for the
  longest agentic runs, so build this distinction into the four-tier table from
  the start rather than discovering it again.** Check `rows.filter(r => r.error)`
  before computing any mean.
- **The turn limit is `matrix.run.maxTurns: 12`.** If Fable also aborts, that
  number is the first thing to question — but changing it makes the run
  non-comparable with the other three tiers. Prefer reporting the abort rate at
  12 turns, as COS-5 did, and note separately what a higher limit would cost.
- **Use `checks.mjs`'s own `words()` for any hand-computed sentence figure.**
  This was COS-5's critical review finding. A plain `split(/\s+/)` counts em
  dashes and bullet glyphs and inflates every number; `words()` keeps only tokens
  containing an alphanumeric, and it is what `sentence_length` actually scores
  with. The bug caused a *correction* to be published that wrongly branded three
  correct prior figures unreproducible.
- **Re-scoring saved rows is free**:
  `node src/cli.mjs score --rows=results/<stamp>/rows.json`. Never re-run the
  loop to re-check a figure. This is also how you re-measure a probe's baseline.
- **`node src/cli.mjs audit` is a gate.** Touch a style file or `contracts.json`
  and the prose and the numbers must agree or `npm test` goes red.
- **`--help` now works on every subcommand** (new `src/usage.mjs`). It did not
  before, and `run --help` launched the full paid matrix. An unknown command
  exits 2.
- `results/` is gitignored. The experiment ledger is the durable record — add
  COS-7's run to it.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **A correction is a claim too, and needs the same verification as the thing it
  corrects.** COS-5's worst defect was not the original error — it was the fix.
  Measuring with a convenient re-implementation instead of the project's own
  instrument produced a confident retraction of three figures that were right all
  along. Compute with the code that scores, not with something that looks
  equivalent.
- **Do not build an explanation on a probe's baseline arm without re-measuring
  it.** Session 4's $0.18 probe reported Haiku at 16.6-word sentences; the real
  baseline is 12.1–12.2, and the "effect" a 12-word cap appeared to have was the
  distance between one small sample and the configuration's own range. Two
  rounds of mechanism were written for it across four documents. The check was
  free and available at the time.
- **When you change a headline result, grep for every document that states the
  old one.** COS-5's review found four: the story's own Goal (contradicting a
  table twenty lines below it), the one-style-file ADR, `harness/README.md`, and
  the epic status snapshot. All four passed every automated gate.
- **Do not pad a comparison's denominator.** "Opus 0 aborts in 21 agentic cells"
  sounds stronger than "0 in 6" but 15 of those 21 are the read-only case where
  Haiku is also clean. Quote the cells that discriminate.
- **Five sessions running, the defect no automated gate catches is a plausible
  prose number.** This session wrote three that failed checking (a "monotonic"
  ranking that was not, a 20-point gap that was 15–28, a 1.4-point deficit that
  was 1.8) plus the tokenizer error. Re-derive every number in your own draft
  before committing it.
- Do not skip `lore sync` because the change looks code-only. All five sessions
  needed it purely from moving a task's status.
- Do not write a placeholder into the tracker intending to fill it in later.
  Session 1 committed a literal `<PR_SHA>`. Write the merge SHA in the
  post-merge housekeeping commit.

## Raised, not done — needs the user's call before anyone starts them

- **COS-9**: `two_options_max` counts only literal option labels, so it cannot
  see prose option sprawl. From session 3's review.
- **`run` does not flush rows incrementally.** New this session. `improve`
  persists after every style; `run` writes `rows.json` only after the entire
  matrix completes, so a killed or crashed run loses every cell it already paid
  for — which is exactly why this session's aborted invocation left no artifact.
  Fixing it is a change to `run`'s semantics rather than a guard on an accident,
  so it was deliberately not taken as COS-5 scope. Cheap and high-value before
  COS-7, which is the most expensive run in the campaign.
- **`sentences()` merges a list header into its first item.** It does not split
  on a single newline, so "Here's why:\nYou're paying twice." scores as one long
  sentence. Measured at 12.2% of over-cap sentences. Fixing it moves numbers
  already published in `docs/` and `FINDINGS.md`.
- **The audit compares numbers, not conditions.** Beginner's file says "never
  show code *unless they ask*"; `maxCodeLines: 0` cannot express the condition.
  Documented in `harness/README.md` as a limit of the instrument.

## Worth knowing: what COS-5 settled beyond its own ACs

The one-style-file ADR had recorded "cheap models are untested" as an open
limitation. COS-5 closed it: rules hold at the third tier within 1.8 points, and
the ranking of styles is identical on every model, so per-model files would not
help. The ADR is updated. **Only Fable is now missing** — COS-7 is the last piece
of that claim, which is worth saying explicitly in its final summary.

The other reusable piece is the like-for-like slice described above. It turned a
"$19.5 re-run or a caveat" choice into neither: a table that is genuinely
comparable on cases, for $0, with the one remaining difference (separate
invocations) stated in the caption.
