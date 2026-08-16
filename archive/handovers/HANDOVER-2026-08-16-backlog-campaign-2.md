# Handover — persist improve-run transcripts (COS-3), campaign 1/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `0631c04`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `0631c04` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-3 — persist improve-run transcripts so an optimization run
can be re-scored offline like a plain run can. Queue order confirmed by user on
2026-08-16 (COS-6 ✓, then COS-3, COS-2, COS-8, COS-5, COS-7, COS-1, COS-4); do
not re-ask. Risk policy: record-and-park.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ is owned by the lore CLI;
never hand-edit it, and note that merely changing a task's status puts the
owning story's managed block into drift, so `lore sync` then `lore check` is
part of finishing ANY task, not just doc tasks. Any change to
harness/src/checks.mjs needs a matching case in harness/test/checks.test.mjs.

COS-3 is the first code issue of the campaign and it costs money: AC #3 needs a
real improve run to have written something a later `score` can re-grade.
Budgeted ~$2. Keep the proving run to the smallest shape that exercises the
path (one style, iterations=1) — the AC is about persistence and offline
re-grading, not about the optimizer finding a better style.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `0631c04`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `0631c04` |
| Cursor issue | COS-3 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-3, 1 resolved, 7 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PR #1 (COS-6) merged and its branch deleted |
| Consumed handovers | `archive/handovers/HANDOVER-2026-08-16-backlog-campaign.md` (session 1's) |
| Campaign progress | 1 of 8 resolved. Next is session 2 |

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-3 dev`.
3. Read `backlog instructions task-execution`; mark COS-3 In Progress; record the plan.
4. The three criteria and where the code stands today:
   - **AC #1** — each improve iteration writes its train and holdout transcripts
     under the run directory. `harness/src/improve.mjs:136-137` measures train
     and holdout per iteration and throws the rows away; only
     `${style.id}.v${i}.md` (the candidate text, `:134`) and `improve.json`
     (`harness/src/cli.mjs`, written per style) survive. Compare with the `run`
     command at `harness/src/cli.mjs:74-76`, which writes `rows.json`,
     `summary.json`, and `report.md` — that is the shape to match, per iteration.
   - **AC #2** — total spend reported from persisted rows, not a counter. The
     counter is `spentUsd` in `improve.mjs:93/99/158-159`, accumulated from
     `r.summary.totalCostUsd`. Once rows are persisted, derive the total by
     summing them and drop the counter as the source of truth.
   - **AC #3** — `score` can re-grade an improve run offline with no spend.
     `harness/src/cli.mjs:103-117` resolves `--rows=` or `newestRows()`
     (`:23-28`, which globs `results/*/rows.json`). Decide deliberately whether
     improve rows live at a path that glob already finds, or whether `score`
     learns the improve layout — and say which in the task notes.
5. `npm --prefix harness test` must pass. No `checks.mjs` change is expected
   here, but if one happens, add a case to `harness/test/checks.test.mjs`.
6. Verification: AC #1 and #2 are provable from a real improve run's output
   directory. AC #3 is proved by running `node src/cli.mjs score --rows=<that
   run>` and showing it re-grades with zero token spend. Put the run's
   `results/<stamp>/` in the task notes — a claim about a number needs a run
   behind it.
7. Update `doc-1` on the branch (move COS-3 to Resolved, advance cursor to
   COS-2, append the session-log entry), commit with `Refs: COS-3`, review with
   `/code-review`, push, PR into `dev`, rebase-merge, sync, promote `main`,
   prune.

## Critical context / traps

- **`lore sync` is not optional for non-doc tasks.** Session 1 assumed a
  README-only change meant lore was out of scope. Moving COS-6 to Done put
  `docs/stories/make-the-install-path-safe.md` into `status-drift` and
  `managed-block-drift`, and `lore check` failed until `lore sync` ran. COS-3 is
  labelled `doc:stories/harden-the-optimizer-loop`, so the same will happen.
  Also: `lore sync` auto-commits the touched `backlog/` file — expect an extra
  `chore(backlog): sync task changes` commit on the branch and do not be
  surprised by it.
- **Review the change against the failure it claims to prevent.** Session 1's
  `/code-review high` found three real issues after every automated gate was
  green, and two of them were instances of the exact trap the change documented.
  Budget for a real review pass and expect it to find something.
- `.claude/handovers/` is gitignored on purpose — handovers may name machines or
  environments. Never copy handover content into anything committed.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- The improve loop is the most expensive thing in this project. Do not launch a
  full multi-style, multi-iteration run to prove a persistence change.

## Do not repeat

- Do not skip `lore sync` because the change looks code-only or README-only.
  Session 1 did, and `lore check` failed on the story's managed task block.
  Run `lore sync` after moving the task's status, then `lore check`, before
  committing.
- Do not write a placeholder into the tracker intending to fill it in later.
  Session 1 committed a literal `<PR_SHA>` in the resolved row; review caught it.
  Record what is true at commit time, and add the merge SHA in the post-merge
  housekeeping commit.
