# Handover — campaign 2, item 2: score the final message, not the whole turn (COS-10)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `1c0c65e` + one uncommitted tracker/log edit and the archived handover, one commit ahead of `origin/dev` at write time (R5 pushes it); `main` at `b735501`, level with `origin/main` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-10 — assistant text blocks are concatenated with no
separator, so every check and the judge score the wrong string on agentic
cells. Queue order for campaign 2 confirmed by user on 2026-08-17 ("Fix tools
first, then everything"); do not re-ask. Risk policy: record-and-park.

COS-10 is the campaign's highest-leverage repair and the widest blast radius so
far: it moves agentic figures that are already published in docs/ and
FINDINGS.md, and AC #5 makes correcting them part of the task. Budget time for
the grep, not just the code.

The trap the task itself names: the fix is NOT "take the last text block".
agentic-read-report's rubric is "no narration of the search process", which
needs the narration visible. Preserve both the final message and the full
trace on the row, and let each check and the judge state which one it reads.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to harness/src/*.mjs
needs matching tests; any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.

Campaign 2 has NO BUDGET CEILING (user, 2026-08-17: "we have to get everything
tested - no budget"). Measurement issues require n >= 146 non-errored cells per
model. COS-10 needs no new arm: AC #5 is satisfiable by re-scoring saved rows
offline, which is free. Do that before running anything.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `1c0c65e`, one commit ahead of `origin/dev` at write time |
| Push state | `main` and `origin/main` at `b735501`; R5 pushes `dev` and re-promotes `main` |
| Cursor issue | COS-10 — To Do, unassigned, no plan recorded, 5 ACs |
| Tracker | `doc-1`, cursor armed at COS-10, campaign 2 at 1 of 15 resolved |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#10 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–9 (today's second is `-2` suffixed) |
| Campaign 1 spend | **$53.00** across eight sessions |
| Campaign 2 spend | **$0.1812**, all of it COS-12 |
| Test suite | 79/79 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |

## What COS-12 left you (read this before touching the harness)

`run` now flushes the whole results directory after every completed cell. Three
things follow that matter for COS-10:

- **`harness/src/results.mjs` is the only writer.** Do not add `writeFileSync`
  calls to `cli.mjs`; go through `writeResults`. Every file is written via a
  temp file and `rename(2)`, and the `run.json` manifest is written last so it
  can only ever undercount what is on disk.
- **`evaluate()` takes `deps.runCell`.** COS-10 changes what a row carries, and
  this is how you test that without spending: `harness/test/results.test.mjs`
  already stubs `runCell` and asserts the flush contract.
- **A results directory can now be legitimately partial.** `run.json` says so,
  `score` prints it on stdout above the tables, and a partial `report.md` opens
  with the same sentence. If COS-10 changes the row shape, check that a
  pre-COS-10 `rows.json` still re-scores — the whole ledger depends on it.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-10 dev`.
3. Read `backlog instructions task-execution`; mark COS-10 In Progress; record the plan.
4. `harness/src/run.mjs:29-33` is the seam — `if (b.type === 'text') text += b.text`
   inside the message loop, with `tool_use` blocks pushed to `toolCalls` between
   them. The row already carries `allTurns`; the new thing is per-block structure
   *within* a turn.
5. `harness/src/checks.mjs` — `sentences()` and `paragraphs()`. AC #3 (split on a
   single newline) is independent of the seam and is the cheapest slice; do it
   first and watch what it moves.
6. AC #2 wants the choice stated per check, not implied. Whatever shape you pick
   has to be readable in `contracts.json` or in each check's own definition.
7. AC #5 is the expensive one and needs **no new spend**: `node src/cli.mjs score
   --rows=results/<stamp>/rows.json` re-derives any published figure for free.
   `results/` is gitignored but the runs are still on this machine — `12-44-03`,
   `22-59-53`, `23-48-45`, `23-53-02` are the ones agentic figures come from.
8. Gates: `npm --prefix harness test` (79 now); `audit` exit 0; `lore sync` then
   `lore check` exit 0.
9. Update `doc-1` on the branch (COS-10 → Resolved, cursor → COS-11, session
   log), commit with `Refs: COS-10`, review with `/code-review high`, push, PR
   into `dev`, rebase-merge, sync, promote `main`, prune.

## Critical context / traps

- **`lore sync` auto-commits under `backlog/`.** Expect a `chore(backlog): sync
  task changes` commit on the branch; never `git add` files under
  `backlog/tasks/` yourself.
- **Moving a task's status puts the owning story's managed block into drift.**
  Every session so far has needed `lore sync` for that reason alone. COS-10 is
  linked to `stories/make-the-measurements-trustworthy`.
- **AC #5 is where this task will bite.** COS-10 changes numbers that are already
  written down. `FINDINGS.md`, `docs/reference/experiment-ledger.md` and the
  story doc all quote agentic figures. Grep for every one before claiming the AC.
- **`results/` is gitignored.** The ledger is the durable record.
- **Filter `!row.error` before quoting any mean.** An errored cell scores 0 on
  every rule *and* 1.0 on the judge. COS-11 (next after this) owns the real fix.
- **Compute a rate with the code that defines it.** Import `checks.mjs`; two
  sessions have published wrong numbers by hand-rolling `words()`.
- **The ledger's runs table forbids improve rows** — improve runs go in the
  optimizer table below it. This session's first ledger edit broke that rule and
  the review caught it.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. Settled; both remaining style tasks say so.
- **Do not quote a judge figure from a ten-cell arm as a position.** Session 8
  reported "Sonnet already clears the bar" from n=10 and withdrew it at n=35.
- **Do not claim a doc change without re-reading what the code now does.** This
  session's first docs pass said both `run` and `improve` flush per cell. Only
  `run` does — `improve` never got the `onRows` hook and still flushes per
  measured split. Caught by re-reading, not by any gate.
- **When a change makes a new state representable, ask which existing readers
  have never had to consider it.** Two of the review's four findings were
  hazards this session created: a partial `report.md` had never been possible
  before, and a bare `score` had never been able to resolve to a partial run.
  Both passed every automated check.
- **Do not assert an invariant in a module and then break it one file over.**
  `results.mjs` documents "manifest last"; the improve flush wrote
  `improve.json` after it. Review found that too.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · **2 COS-10** · 3 COS-11 · 4 COS-13 · 5 COS-14 · 6 COS-9 — repair
the instrument, no arm-sized spend.
7 COS-20 — characterise the judge; may lower the 146-cell figure everything else
is priced on.
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 — the style text.
12 COS-21 · 13 COS-19 — rebuild the published record.
14 COS-4 · 15 COS-1 — the two parked bars, achievability still unproven.
