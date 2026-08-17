# Handover — take COS-20, campaign 2 item 7 (cursor: COS-20)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `4847e72`, clean apart from an untracked `system-prompt.md` that is not ours; `dev` and `main` both at `35f053a` on their remotes, with `4847e72` (this session's archive commit) local-only until R5 pushes it | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-20 — validate the judge as an instrument. Queue order for
campaign 2 was confirmed by the user on 2026-08-17; do not re-ask. COS-20 is
item 7 of 19; items 1-6 are resolved.

Clean start. COS-9 merged as 35f053a via PR #16; nothing half-finished, no
branch litter, no open PRs.

COS-20 is DIFFERENT IN KIND from the six items before it. Those re-scored saved
rows for free. COS-20 needs real API calls — its whole method is re-judging
saved replies repeatedly and with other model tiers — and there is NO CLI path
for that today. `score` re-scores deterministic checks only; `judge()` in
harness/src/judge.mjs is called from evaluate.mjs per cell and takes {views,
caseDef, contract, model, styleBody}. Building the re-judge path is the first
half of the task, not a detour from it. Budget for that before touching AC #1.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required). `lore sync` needs LORE_BACKLOG_TIMEOUT_MS=120000. Any change to
harness/src/*.mjs needs matching tests; any change to a style file or
contracts.json must leave `node src/cli.mjs audit` at exit 0. Never run
`improve` on a style file — six optimizer rewrites across three styles have
failed and that is settled.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `35f053a` on origin; local `dev` at `4847e72` (archive commit, unpushed) |
| Feature branches | none, local or remote |
| Open PRs | none |
| COS-9 | **Done and merged** — PR #16, rebase-merged as `35f053a` |
| Cursor | **COS-20**, campaign 2 item 7 |
| Test suite | 135/135 (`npm --prefix harness test`) — was 131 |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What COS-20 asks for

Every judge figure in the project comes from one model (Sonnet), called once per
cell, with no measurement of how much of a score is the reply and how much is
the judge. Five acceptance criteria: separate judge-call variance from reply
variance; have two other tiers judge the same saved arm and report agreement per
style and per case; recompute the ledger's noise-floor sample sizes against
whichever component dominates; state the crossover between repeat-judging and
adding cells; and name any disagreement large enough to move a published
conclusion.

## Next steps

1. **Read `harness/src/judge.mjs` and `harness/src/evaluate.mjs` first, and
   decide how re-judging saved rows gets a CLI entry point.** This is the
   blocker, not a preliminary: nothing today re-judges a saved row. A
   `judge --rows=<path> --models=... --repeats=N` subcommand is the obvious
   shape, and it needs `src/usage.mjs` wiring plus tests like every other
   subcommand.
2. `matrix.json` sets `judgeModel: "sonnet"`. `contracts.json` sets per-style
   `judgeWeight` (0.5 beginner, 0.4 intermediate). AC #2's agreement figures
   have to be reported per style, and the weights differ per style — do not
   pool them.
3. AC #1 anchors on COS-4's per-cell SD of **24.6**. Find where that is stated
   before quoting it; it is an upper bound containing both variances.
4. AC #3 touches the ledger's noise-floor section. That section quotes sample
   sizes; if the arithmetic changes, every dependent figure changes with it.
5. Gates, commit, review, PR into `dev`, rebase-merge, sync `dev`,
   fast-forward `main`, push both, prune.
6. Re-arm: archive this handover, write the next one, advance the cursor to
   COS-15.

## Critical context / traps

- **This task spends real money.** Every prior campaign-2 item was free
  (re-scoring saved rows). COS-20 is the first that is not. The task's own note
  says judging is cheap *relative to generation*, not free.
- **`gh pr merge` failed this session with HTTP 503 on GitHub's GraphQL API**,
  twice. The REST API was healthy throughout. The working equivalent is
  `gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=rebase`,
  then `gh api -X DELETE repos/<owner>/<repo>/git/refs/heads/feature/<KEY>` for
  the branch. Same rebase semantics, no GraphQL. Worth reaching for immediately
  rather than retrying `gh pr merge`.
- **Both `/code-review` subagents in round 3 died without reporting.** The first
  round-2 agent returned six real findings; the two after it vanished from
  `ListAgents` with no result. If it happens again, do not keep respawning —
  probe the change by hand instead, and say in the handover that the round was
  not independent.
- **`harness/results/` is gitignored.** The ledger
  (`docs/reference/experiment-ledger.md`) is the durable record. 62 saved runs
  exist locally on this machine only, and COS-20 needs them as its input.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, stripping the frontmatter
  first since the CLI re-adds it. The body is ~123KB and passes fine. Write the
  patch script to a *file* rather than inlining it in `node -e` — nested quotes
  in the replacement strings break the shell, which cost a cycle this session.
- **`lore sync` rewrites `docs/log.md`** and only records commits that already
  exist, so a branch's last commits are always missing and the SHAs it does
  record are destroyed by the rebase-merge. That is COS-23, queue item 17.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored. Stage files explicitly; never `git add -A`.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **A green sabotage run proves nothing until the sabotage is confirmed to have
  landed.** Two sabotage runs came back 135/135 this session and both were
  wrong: once a `perl -0pi` substitution silently failed to match, once the
  fixture was too weak to trip the threshold it was testing. Print the mutated
  line, or diff the file, before believing a green result.
- **Audit a new detector against the saved corpus before shipping it.** Half of
  COS-9's first implementation — connective pivots on "alternatively" and "or
  you could" — matched **zero** of the 96 re-scorable rows while penalising a
  compliant reply at 0.70. It rebuilt the exact defect the check had been fixed
  for twice already. "Never fires" and "fires on the wrong thing" are both
  invisible in a diff and both obvious in the rows.
- **"Saved score vs current code" and "old code vs new code" answer different
  questions.** The first flagged a sonnet run at 0.80 → 0.90 that looked like an
  unreported regression; re-running it against `dev` reproduced it exactly, so
  it was a historical fix, not the change under review. Only the second is
  evidence about your change.
- **Settle "does a published figure move" by the corpus, not by provenance.**
  Chasing the ADR's `two_options_max` 1.00/0.85 row to a source run failed —
  the obvious candidate does not carry the check at all, and no saved run
  reproduces 0.85. Splitting the per-row diff by model settled it in one
  command: 0 of 34 Opus rows and 0 of 32 Sonnet rows moved, and the figure is an
  Opus/Sonnet number.
- **Write the regression fixture before the fix, and confirm it passes on the
  unmodified code.** That is what makes it a guard rather than a restatement of
  what you just wrote.
- **Do not mark a task Done before the review returns.** Session 15 did and had
  to walk it back.
- **Do not stop reviewing after one round.** COS-25 took four; COS-9 took three
  and the third still found two defects.
- **A number in a comment, a doc or a commit message is a claim**, and a phrase
  in quotation marks must be verbatim. This session shipped "you have three
  paths" for a reply that says "You need it faster and have three paths" and had
  to correct it.
- **Do not run `improve` on a style file.** Settled.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
6 ~~COS-9~~ · **7 COS-20 — the cursor.**
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 · 12 COS-21 · 13 COS-19 ·
14 COS-4 · 15 COS-1 · 16 COS-22 · 17 COS-23 · 18 COS-24 · 19 COS-26.
COS-25 was out of band at the user's direction and is merged; COS-26 was opened
from its review and appended after item 18 rather than slotted into the
confirmed order.
