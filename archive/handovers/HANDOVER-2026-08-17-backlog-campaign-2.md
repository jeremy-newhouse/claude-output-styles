# Handover — campaign 2, item 1: flush run rows incrementally (COS-12)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `7c269a1`, tree clean except the tracker edit committed by `lore sync` during init, level with `origin/dev`; `main` and `origin/main` also at `7c269a1` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-12 — flush run rows incrementally so a killed run keeps the
cells it paid for. Queue order for campaign 2 confirmed by user on 2026-08-17
("Fix tools first, then everything"); do not re-ask. Risk policy: record-and-park,
unchanged from campaign 1.

COS-12 spends nothing. It is first because it is insurance for the fourteen
sessions after it: `run` writes rows.json only after the entire matrix completes,
and campaign 2's arms are an order of magnitude larger than anything run so far.
`improve` already persists after every style, so the pattern exists in the
codebase — apply it to the path that spends the most.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to harness/src/*.mjs
needs matching tests, and any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.

Campaign 2 has NO BUDGET CEILING (user, 2026-08-17: "we have to get everything
tested - no budget"). Measurement issues require n >= 146 non-errored cells per
model. COS-12 itself needs no paid run beyond one small killed run to prove the
behaviour.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `7c269a1`, clean |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `7c269a1` |
| Cursor issue | COS-12 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-12, campaign 1 closed (6 resolved / 2 parked), campaign 2 queue of 15 confirmed |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#9 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–8 |
| Campaign 1 spend | **$53.00** across eight sessions |
| Campaign 2 spend | $0 so far. Items 1–6 spend nothing; spend starts at item 8 |
| Test suite | 64/64 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |

## What campaign 2 is, in one paragraph

Campaign 1 shipped six issues and parked two against judge bars. Closing it out
produced a harder finding than either bar: **per-cell judge SD is 24.6, so the
ten-cell arms behind almost every published judge figure in this project carry
95% intervals about 30 points wide.** Beginner on Sonnet read 70.7, 65.8, 74.1
and 55.0 across four arms of the same five cases with the same style text. A
paired delta of +7.1 that agreed across two disjoint case sets became +1.3 once
the arm went from two cells per pair to seven. Campaign 2 fixes four defects in
the scorer, characterises the judge, finishes the style text, and then
re-establishes the published record at a sample size that supports it. The user
removed the budget constraint to make that possible.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-12 dev`.
3. Read `backlog instructions task-execution`; mark COS-12 In Progress; record the plan.
4. `backlog task view COS-12 --plain` — four acceptance criteria, and the fourth
   is the one that bites: *proved by killing a real run partway and re-scoring
   what survived, not by unit test alone.*
5. Read `harness/src/improve.mjs` first. It already persists per style, so the
   question is what shape to reuse, not what to invent.
6. `harness/src/run.mjs` and `harness/src/cli.mjs` are where `rows.json` is
   written — `cli.mjs` does `writeFileSync(join(outDir, 'rows.json'), …)` after
   `evaluate()` returns.
7. A partial file must be readable and visibly partial: `score --rows=` has to
   work on it, and it must not look complete. `cli.mjs` prints the expected cell
   count at run start (`cells: N styles x …`), which is a natural thing to record.
8. Gates: `npm --prefix harness test` (64/64 now, expect more); `audit` exit 0;
   `lore sync` then `lore check` exit 0.
9. Update `doc-1` on the branch (COS-12 → Resolved, cursor → COS-10, session log),
   commit with `Refs: COS-12`, review with `/code-review high`, push, PR into
   `dev`, rebase-merge, sync, promote `main`, prune.

## Critical context / traps

- **`lore sync` auto-commits under `backlog/`.** It committed the tracker edit
  during init. Expect a `chore(backlog): sync task changes` commit on the branch
  and do not fight it — never `git add` files under `backlog/tasks/` yourself.
- **Moving a task's status puts the owning story's managed block into drift.**
  All eight campaign-1 sessions needed `lore sync` for this reason alone, even
  when the change looked code-only. COS-12 is linked to
  `stories/make-the-measurements-trustworthy`.
- **`results/` is gitignored.** The experiment ledger is the durable record.
- **Filter `!row.error` before quoting any mean.** An errored cell scores 0 on
  every rule *and* 1.0 on the judge, and the biases do not cancel. COS-11 owns
  the real fix; until it lands this is a discipline.
- **Compute a rate with the code that defines it.** Two sessions have published
  wrong numbers by hand-rolling what `checks.mjs` already computes — session 8
  counted over-cap replies with `text.split(/\s+/)` where the harness uses
  `words(stripCode(text))`. Import the scorer.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. The loop optimises rules, and the rules already pass; it
  cannot see what is wrong. This is settled and both remaining style tasks say so.
- **Do not quote a judge figure from a ten-cell arm as a position.** Session 8
  reported "Sonnet already clears the bar" from n=10 and had to withdraw it at
  n=35. Report the interval or report nothing.
- **Do not measure on the current scorer and expect the number to survive.**
  COS-10 and COS-11 will move agentic figures and every mean that pools an
  errored cell. That is why items 1–6 come before any arm.
- **A change that adds a case to a split changes every gate that reads that
  split.** Session 7 put an abort-prone case inside `improve`'s adoption gate
  without noticing. Ask what consumes a config change, not just what produces it.
- **When you change a headline result, grep for every document that states the
  old one.** This found real defects in all eight campaign-1 sessions.

## Campaign 2 order, for context (do not re-ask)

1 COS-12 · 2 COS-10 · 3 COS-11 · 4 COS-13 · 5 COS-14 · 6 COS-9 — repair the
instrument, no spend.
7 COS-20 — characterise the judge; may lower the 146-cell figure everything else
is priced on.
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 — the style text.
12 COS-21 · 13 COS-19 — rebuild the published record.
14 COS-4 · 15 COS-1 — the two parked bars, achievability still unproven.
