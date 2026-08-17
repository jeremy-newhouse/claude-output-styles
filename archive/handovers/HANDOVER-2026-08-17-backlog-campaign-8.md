# Handover — finish COS-25's review fixes, then merge (COS-25, cursor still COS-9)

**Date**: 2026-08-17 | **Grounded against**: `feature/COS-25` @ `ae6db0f`, 6 commits ahead of `dev`, **unpushed**, no PR. Working tree has one modified file (`backlog/tasks/cos-25...md`, from post-sync task edits) plus the untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. You are NOT starting a new issue. Resume COS-25 on the existing
feature/COS-25 branch: the work is committed but a /code-review high returned
five findings and none are fixed. Fix them, then push, PR into dev,
rebase-merge, promote main, prune.

COS-25 was taken out of band at the user's direction, ahead of the cursor. The
cursor is still COS-9 and must not move for COS-25.

The one that must be fixed: run.mjs:151. `turns` is declared inside the try, so
the catch returns empty arrays and a multi-turn cell that wedges on turn 3
loses turns 1 and 2 — while the quiet-abort path keeps them. Hoist
`const turns = []` above the try.

Finding 5 is disputed on evidence and needs one command before you act on it.
The review says wsp.cleanup() orphans subprocesses into deleted workspaces. The
SDK's spawnClaudeCodeProcess doc says the signal "aborts only AFTER the SDK's
stdin-EOF + ~2 s grace window", and the real-SDK probe returned at 5.0s for a 3s
limit — 3s plus exactly that window — so the iterator appears to stay open
through shutdown. Verify before changing anything.

Finding 2 needs a scope decision from the user, not from you.

All five findings, with which are confirmed and which are not, are in COS-25's
implementation notes. Read those before the diff.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required). `lore sync` needs LORE_BACKLOG_TIMEOUT_MS=120000. Any change to
harness/src/*.mjs needs matching tests; any change to a style file or
contracts.json must leave `node src/cli.mjs audit` at exit 0.
```

## State

| Item | Status |
|---|---|
| Branch | `feature/COS-25` @ `ae6db0f`, 6 commits ahead of `dev`, **not pushed** |
| `dev` / `main` | both at `e1119c9`, level with their remotes, untouched this session |
| COS-25 | **In Progress** (moved back from Done when the review landed) |
| Cursor | **still COS-9** — COS-25 was out of band and must not move it |
| PR | none opened. `gh pr list` returned HTTP 503 at check time — re-verify |
| Feature branches | `feature/COS-25` local only, no remote copy |
| Test suite | 126/126 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |
| Review | `/code-review high` complete, **5 findings, 0 fixed** |

## What COS-25 did, and why

The user asked why the project tracked cost at all, and three answers settled it.
The dollar figures came from the Agent SDK's `total_cost_usd`, which is a
list-price valuation of tokens the SDK emits whether the caller is on per-token
billing or a subscription. Cost never entered a style's score — `checks.mjs` plus
the judge do that. And `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` are both
unset here, so the SDK falls back to Claude Code's stored OAuth credentials.
**Stated at the time and still true: a live run's auth handshake was never
observed, so that last point is inference from the credential chain, not a
measurement.**

The one piece doing real work was `matrix.json`'s `run.maxBudgetUsd`, passed live
to the SDK and hard-stopping a runaway cell. Of the three bounds the SDK exposes,
only `abortController` is a hard stop: `maxTurns` bounds tool rounds but not the
time inside one, and `taskBudget` only tells the model its remaining tokens and
asks it to pace itself. The replacement is `run.maxCellSeconds: 600` on an
`AbortController` covering the whole cell.

Six commits: the guard, the instrumentation removal, the docs sweep, one
generated-log commit, and two `lore sync` auto-commits.

## Next steps

1. **Fix run.mjs:151** — hoist `const turns = []` above the `try`. This is the
   only finding that blocks the merge. Add a test: a two-turn case where turn 2
   throws on abort must keep turn 1's transcript, which currently it does not.
2. **Settle finding 5 before touching cleanup.** Count `claude` processes and
   `/var/folders/*/*/T/osh-*` workspaces before and after a 3s-limit probe, and
   check for any process holding a deleted cwd. The probe script is at
   `scratchpad/probe.mjs` (takes seconds as argv[1]).
3. **Finding 3** — either record `elapsedMs` on the row, or soften two claims
   that nothing supports: `matrix.json`'s "Lower it only against measured cell
   durations" and `harness/README.md`'s "sized well above any cell observed
   here". Recording it is the better fix: this change deleted `costUsd`, which
   was the only per-cell size proxy the project had.
4. **Finding 4** — validate `maxCellSeconds` at `cli.mjs:78` where `opts` is
   built, keeping the `runCell` check as a backstop for direct callers.
5. **Finding 2** — narrow the "runaway guard" wording in `matrix.json`,
   `harness/README.md` and `docs/reference/harness-architecture.md` so it claims
   a bounded *cell*, not a bounded *run*. **Ask the user** before also bounding
   `judge.mjs` and `improve.mjs`'s `rewrite()`; that is real scope growth and the
   gap is pre-existing.
6. Re-run gates, commit, **push**, PR into `dev`, rebase-merge, sync `dev`,
   fast-forward `main`, push both, prune.
7. Re-arm: archive this handover, write the next one, and **leave the cursor at
   COS-9**.

## Critical context / traps

- **COS-25 was out of band.** The cursor is COS-9 and has not moved. `doc-1`
  records COS-25 as a `—` row in both the queue and Resolved tables, and the
  Cursor section says explicitly that session 15 did not advance it.
- **`doc-1` already claims COS-25 is resolved.** That claim is now ahead of
  reality — the branch is unmerged and the task is back In Progress. Fix the
  tracker in the same commit that finishes the work, or it ships a lie.
- **The task file is modified and uncommitted.** `lore sync` auto-commits under
  `backlog/`; run it rather than `git add`-ing it by hand.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, stripping the frontmatter
  first since the CLI re-adds it. The body is ~107KB and passes fine.
- **`lore sync` rewrites `docs/log.md`** and only records commits that already
  exist, so the last commits of a branch are always missing and the SHAs it does
  record are destroyed by the rebase-merge. That is COS-23, queue item 17.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored. Stage files explicitly; never `git add -A`. The review flagged it too.
- **`results/` is gitignored.** The ledger is the durable record.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Do not mark a task Done before the review returns.** This session did, and
  had to walk it back when finding 1 landed. The status was wrong for the whole
  window in between.
- **Do not let the PR merge while the review is still running.** Session 13 did.
  This session waited (~5 minutes) — that part worked and is why finding 1 was
  caught before the merge rather than after.
- **A guard that has never been observed to fail is not evidence.** The
  `maxCellSeconds` tests were sabotage-verified: dropping the `timedOut`
  authority reds exactly the quiet-abort test, replacing the config validation
  with a silent default reds exactly the config test. Keep that discipline on any
  new test added for finding 1.
- **A type declaration is not an observation.** `sdk.d.ts` saying
  `abortController?: AbortController` did not prove the SDK honours it; a
  controlled pair on one real Haiku cell did — 3s limit gave `error_timeout` with
  no reply at 5.0s elapsed, 600s limit gave a 480-char reply at 6.6s.
- **Do not take a review agent at face value.** Finding 5 contradicts both the
  SDK's own documentation and this session's measured teardown timing. Four of
  the five findings are real; that one needs checking.
- **A comment that carries a number is carrying a claim.** Finding 3 is exactly
  that mistake, made in this session, in the same file as the fix.
- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. Settled.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
**6 COS-9 — still the cursor.**
7 COS-20 · 8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 · 12 COS-21 · 13 COS-19 ·
14 COS-4 · 15 COS-1 · 16 COS-22 · 17 COS-23 · 18 COS-24.
COS-25 is not in the queue — out of band, at the user's direction.
