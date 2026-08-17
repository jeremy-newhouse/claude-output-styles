# Handover — campaign 2, item 3: stop errored cells biasing every quoted score (COS-11)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `0708ded`, tree clean, one commit ahead of `origin/dev` at write time (R5 pushes it); `main` at `2a354d3`, level with `origin/main` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-11 — an errored cell scores 0 on every rule and a free 1.0 on
the judge, and summarize() pools it into every figure the project quotes. Queue
order for campaign 2 confirmed by user on 2026-08-17 ("Fix tools first, then
everything"); do not re-ask. Risk policy: record-and-park.

COS-11 is cheaper than COS-10 and needs no new spend: AC #5 names 22-59-53, a
saved run with six aborted cells, and re-scoring is free. But read the note below
about the non-errored empty cell first — COS-10's review found a second, wider
version of this bug that the task description does not mention, and COS-11 is its
owner.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. `lore sync` needs
LORE_BACKLOG_TIMEOUT_MS=120000 — the default 30s now times out on this repo's
task count. Any change to harness/src/*.mjs needs matching tests; any change to a
style file or contracts.json must leave `node src/cli.mjs audit` at exit 0.

Campaign 2 has NO BUDGET CEILING (user, 2026-08-17: "we have to get everything
tested - no budget"). Measurement issues require n >= 146 non-errored cells per
model. COS-11 should cost $0.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `0708ded`, one commit ahead of `origin/dev` at write time |
| Push state | `main` and `origin/main` at `2a354d3`; R5 pushes `dev` and re-promotes `main` |
| Cursor issue | COS-11 — To Do, unassigned, no plan recorded, 5 ACs |
| Tracker | `doc-1`, cursor armed at COS-11, campaign 2 at 2 of 15 resolved |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#11 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–10 (today's third is `-3` suffixed) |
| Campaign 1 spend | **$53.00** across eight sessions |
| Campaign 2 spend | **$0.5955** — COS-12 $0.1812, COS-10 $0.4143 |
| Test suite | 94/94 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |

## Read this before planning COS-11

**The task description understates the bug.** It describes the *errored* cell.
COS-10's review found the wider case and it is unowned anywhere else:

- `evaluate.mjs`'s guard is `run.error && !run.text`. Only an **errored** empty
  reply is zeroed on rules.
- A cell that returns no text **without** the SDK setting an error flag scores
  **0.931** on rules for beginner on `agentic-fix-verify` — verified — because
  every "no X found" check finds no X. `judge` also early-returns 1.0 on empty
  text. So that cell lands at ~0.95 for saying nothing.
- It has not been seen in a saved run, and the guard is byte-identical on `dev`
  going back — this is not something COS-10 introduced. It was left alone on
  purpose, because COS-11 owns the bias. `harness/README.md` now states both
  cases; the old wording ("a cell that returns no text scores 0 on every rule")
  was true only because of the guard, and was corrected.

Treat AC #1 as covering both, or say explicitly why not.

## What COS-10 left you

- **A row now carries two views of the last turn.** `text` is the final message
  (blocks after the last tool call), `trace` is the whole turn. `allTurns` is
  per-turn trace, `allFinals` per-turn final. A row with no `trace` key predates
  the fix and carries the glued turn in `text`.
- **`viewsOf(row)` in `checks.mjs` is the only way to build the pair**, and it
  flags `legacy: true` for pre-COS-10 rows. `scoreDeterministic` takes
  `{final, trace}` and **throws a TypeError on a bare string** — if you add a
  caller, use `viewsOf`.
- **Each check declares `reads`, each agentic case declares `judgeOn`**, and both
  land on the saved row (`checks[].reads`, `judgeReads`). `judgeReads` is `null`
  when the judge did not run — useful to COS-11: it is now possible to tell a
  `--no-judge` row from a judged 1.0.
- **`score` no longer crashes on rows whose styleId has no contract.** Those
  rows keep their saved scores and the skipped ids are named. This matters
  because AC #5's re-scoring workflow hits it on `22-27-15` and `22-18-53`.
- **`summarize()` is untouched.** It still pools errored rows into every figure.
  That is exactly COS-11's subject.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-11 dev`.
3. Read `backlog instructions task-execution`; mark COS-11 In Progress; record the plan.
4. `harness/src/evaluate.mjs:77-140` is `summarize()`. `by()` computes every
   grouped figure; `errors: rs.filter(r => r.error).length` is already counted
   per group but nothing excludes those rows from the means above it.
5. AC #2 (an all-errored arm reports unmeasured) needs a decision about what
   `score`/`rules`/`judge` become — `null` is more honest than 0 or 1, but every
   renderer in `report.mjs` calls `pct()` on them. Check both renderers.
6. AC #3 touches `report.mjs`'s `table()` and `md()`, which share the same row
   shape. `improve.mjs`'s reserve gate already does the right thing per case
   (COS-1) — read it before inventing a second convention.
7. AC #5 is free: `node src/cli.mjs score --rows=results/2026-08-16T22-59-53-852Z/rows.json`.
   That run has six aborted Haiku cells and is the one the AC names.
8. Gates: `npm --prefix harness test` (94 now); `audit` exit 0;
   `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync` then `lore check` exit 0.
9. Update `doc-1` on the branch (COS-11 → Resolved, cursor → COS-13, session
   log), commit with `Refs: COS-11`, review with `/code-review high`, push, PR
   into `dev`, rebase-merge, sync, promote `main`, prune.

## Critical context / traps

- **`lore sync` times out at the default 30s.** Use
  `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync`. It failed twice this session before
  that; the first failure left the managed block half-reconciled and `lore check`
  still reported drift.
- **`lore sync` auto-commits under `backlog/`.** Expect a `chore(backlog): sync
  task changes` commit on the branch; never `git add` files under
  `backlog/tasks/` yourself.
- **Changing a task's status puts the owning story's managed block into drift.**
  Every session so far has needed `lore sync` for that reason alone.
- **The ledger's runs table forbids improve rows** — improve runs go in the
  optimizer table below it.
- **Every agentic figure in `docs/` and `FINDINGS.md` is now labelled as measured
  on the glued turn.** If COS-11 changes an agentic mean, check whether the label
  still reads correctly beside the new number.
- **The ledger total is now 640 cells / $83.84 and re-sums exactly** from its own
  rows table. If you add a run, re-sum rather than adding to the stated total.
- **`results/` is gitignored.** The ledger is the durable record.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **When a change alters a shared primitive, list every consumer before claiming
  what moved.** This session changed `sentences()` and re-derived only
  `sentence_length`, then published "at most 1.07 points, all of it in
  `sentence_length`" in the ledger. `sentences()` has three consumers:
  `paragraph_length` and `active_voice` re-segment too, the real ceiling is 1.50,
  and one of them had a latent bug the change activated. The review caught it,
  not any gate. `summarize()` has at least four consumers — enumerate them first.
- **State a criterion and then apply it.** The check-view rationale said "bans
  read the trace" and three ban checks were left on `final`, including the two
  most heavily weighted beginner checks. Written and violated in the same file.
- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. Settled; both remaining style tasks say so.
- **Do not quote a judge figure from a ten-cell arm as a position.** Session 8
  reported "Sonnet already clears the bar" from n=10 and withdrew it at n=35.
- **Reproduce a published figure before quoting its replacement.** Every one of
  this session's ~25 corrections was checked against the old code first; that is
  the only reason the deltas are trustworthy, and it is what caught the one
  conclusion that needed restating.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · **3 COS-11** · 4 COS-13 · 5 COS-14 · 6 COS-9 —
repair the instrument, no arm-sized spend.
7 COS-20 — characterise the judge; may lower the 146-cell figure everything else
is priced on.
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 — the style text.
12 COS-21 · 13 COS-19 — rebuild the published record.
14 COS-4 · 15 COS-1 — the two parked bars, achievability still unproven.
