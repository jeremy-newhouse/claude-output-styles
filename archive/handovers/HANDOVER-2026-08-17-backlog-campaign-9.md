# Handover — take COS-9, campaign 2 item 6 (cursor: COS-9)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `c37049d`, clean apart from an untracked `system-prompt.md` that is not ours; `dev`, `main`, `origin/dev` and `origin/main` all at that SHA | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-9 — make two_options_max see prose option sprawl. Queue order
for campaign 2 was confirmed by the user on 2026-08-17; do not re-ask. COS-9 is
item 6 of 19; items 1-5 are resolved.

This is a clean start. The previous two sessions were both out of band on COS-25,
which is merged; nothing is half-finished and no branch is left over.

COS-9 changes checks.mjs, which is the one file in this project that moves
published numbers. Its own description says so: re-score every saved run offline
with `node src/cli.mjs score --rows=...` and correct every figure the change
invalidates, in the same change. AC #3 is satisfied either by updating them or
by demonstrating the change moves none — demonstrating, not asserting.

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
| `dev` / `main` | both `c37049d`, level with their remotes, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| COS-25 | **Done and merged** — PR #15, rebase-merged as `c37049d` |
| COS-26 | **To Do**, created this session, queue item 19 |
| Cursor | **COS-9**, campaign 2 item 6 — untouched by two out-of-band sessions |
| Test suite | 131/131 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What COS-9 asks for

`two_options_max` counts only literal "option a/b/1/2" labels. A reply that walks
through three or four alternatives in prose and recommends one scores a perfect
1.0 — verified in the task, on a three-option reply naming an index, a cache and
a vendor.

The label-blindness is **deliberate** and the reasoning still holds: the comment
in `checks.mjs` records that scoring the literal label penalised the *better*
reply, the one that leads with its recommendation and names alternatives in
prose. AC #2 exists to protect exactly that. The gap is that nothing replaced it,
so the check rewards structure it cannot see, and sprawl is caught only when the
model happens to label its options.

It matters because COS-2 added `reserve-three-options`, a reserve case whose
whole purpose is to present three options and see whether the style narrows to
two. On that case the deterministic 70% of the score is blind to the failure,
leaving the judge alone to catch it, on the smallest split in the pool.

## Next steps

1. Read the check and its comment at `harness/src/checks.mjs` before designing
   anything. The existing behaviour is load-bearing, not an oversight.
2. Write the AC #2 case first — a reply that leads with one recommendation and
   names two alternatives in prose must still score 1.0. That is the regression
   the new detection has to survive, and writing it first stops the fix from
   being tuned to AC #1 alone.
3. Then AC #1: three or more distinct alternatives in prose must score below 1.0.
4. **AC #3 is the expensive one.** Re-score every saved run offline
   (`node src/cli.mjs score --rows=harness/results/<stamp>/rows.json`) on both
   the old and new code, diff the per-check and per-scope figures, and correct
   every published number the change moves — in `docs/`, `FINDINGS.md` and the
   ledger. There are 60+ saved runs under `harness/results/`. If nothing moves,
   show that rather than claiming it.
5. Gates, commit, `/code-review high`, **wait for it**, PR into `dev`,
   rebase-merge, sync `dev`, fast-forward `main`, push both, prune.
6. Re-arm: archive this handover, write the next one, advance the cursor to
   COS-20.

## Critical context / traps

- **`harness/results/` is gitignored.** The ledger (`docs/reference/experiment-ledger.md`)
  is the durable record. Re-scoring reads the results directory, which exists
  locally on this machine only.
- **A scoring change that moves a published figure without updating it is this
  project's known failure mode**, and COS-9 is the highest-risk instance of it
  in the queue. COS-10 and COS-11 both had to correct published conclusions.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, stripping the frontmatter
  first since the CLI re-adds it. The body is ~118KB and passes fine. Note that
  `backlog doc view --plain` piped into `grep -c` has returned truncated output
  at this size — verify against the file on disk, not the pipe.
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

- **Do not stop reviewing after one round.** COS-25 took four `/code-review high`
  passes and returned twenty findings. Rounds 1 and 2 found code defects; rounds
  3 and 4 found only documentation, and round 4's two mediums were mechanical
  damage from a search-and-replace sweep. The test suite, the contract audit and
  the link checker all read the branch as clean while a load-bearing table was
  rendering as literal pipe-delimited text. **Review until a round returns
  nothing structural, not until the first round returns.**
- **A fix applied where the reviewer pointed is not a fix applied everywhere the
  claim lives.** Round 2 corrected an invalid inference in `harness/README.md`;
  the identical sentence was still standing in three other files, and round 4
  found a fourth instance in a file that retracted the claim seventy lines
  earlier. Grep for the claim across every file, and **squeeze newlines out
  first** — the instance that survived three rounds did so because the phrase
  wrapped across a line break and a line-oriented grep cannot see it.
- **Do not mark a task Done before the review returns.** Session 15 did, and had
  to walk it back.
- **Do not take a review agent at face value, in either direction.** COS-25's
  finding 5 was disputed on two plausible arguments — the SDK's own documented
  grace window, and a measured teardown timing — and a two-minute probe showed
  the reviewer was right and both arguments were wrong. Measure instead.
- **A number in a comment, a doc or a commit message is a claim.** COS-25 shipped
  a comment saying to lower a ceiling "against measured cell durations" when
  nothing in the harness had ever recorded a duration.
- **A cost figure is not a size figure across model tiers.** Per-token prices
  differ by roughly the factor the per-cell costs did, so a cost ratio between
  tiers says nothing about tokens. Within one model it does convert, which is why
  the 4.8×, 1.4× and 3.9× ratios survived and the cross-tier ~10× did not.
- **A guard that has never been observed to fail is not evidence.** Every new
  test on COS-25 was sabotage-verified — the fix reverted, the suite run, and the
  failure confirmed to land on exactly the intended test.
- **Do not run `improve` on a style file.** Settled.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
**6 COS-9 — the cursor.**
7 COS-20 · 8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 · 12 COS-21 · 13 COS-19 ·
14 COS-4 · 15 COS-1 · 16 COS-22 · 17 COS-23 · 18 COS-24 · 19 COS-26.
COS-25 was out of band at the user's direction and is merged; COS-26 was opened
from its review and appended after item 18 rather than slotted into the
confirmed order.
