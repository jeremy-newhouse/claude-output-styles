# Handover — Campaign 3, cell-free housekeeping (cursor: COS-27)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `e222b64`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Active campaign: 3 (cell-free housekeeping). Cursor: COS-27 — FINDINGS.md's
paired confidence intervals have no recorded, reproducible computation method.
Queue order for Campaign 3 (COS-23 -> COS-27 -> COS-22 -> COS-24 -> COS-26) was
confirmed by the user on 2026-08-18; do not re-ask.

Campaign 2 is HELD, not abandoned: its own cursor is COS-16, which needs one
more clean measurement arm and is blocked by Claude Code's usage limits (both
the 5-hour window and a weekly cap hit on 2026-08-18). Do NOT take COS-16
instead of COS-27 unless the user explicitly asks you to check whether cell
budget is back. If you do check and it's available again, COS-16's full resume
state is in its own task notes (`backlog task view COS-16 --plain`) and the
tracker's "Campaign 2 (held at COS-16)" section — read those, not this
handover, before touching it.

COS-27 itself: FINDINGS.md publishes paired figures (e.g. rules +5.2 [+0.0,
+10.4] on the shared five, +7.7 [+5.3, +10.1] t=7.06 on the reserve six) with
no recorded method. The task's own description already tried the obvious
method — pair on style x model x case with repeats averaged, paired t interval
from a Student-t table — and it reproduces every ARM MEAN in the ledger exactly
(87.2/86.4, 98.0/97.7, 98.7/97.1, pooled 98.5/97.4, the -0.029 train delta on
14-48-09) but NOT the published intervals (+7.8 [+5.3, +10.2] t=7.02 vs
published +7.7 [+5.3, +10.1] t=7.06; +5.0 [-0.1, +10.0] vs published +5.2
[+0.0, +10.4]). Read that description in full before starting — the arm means
matching exactly is what makes this a method difference, not a data
difference, and whoever takes it needs to find which method detail (repeat
handling, degrees of freedom, which SD, rounding) produces the published
numbers exactly, or make a deliberate call to restate them and say why. AC #1
requires this land as harness code (callable from saved rows), not a one-off
script — likely a new function in `harness/src` alongside `rejudge.mjs`/
`results.mjs`, with its own test file per this project's convention (any
`harness/src/checks.mjs` change needs a matching `harness/test/checks.test.mjs`
case — the general pattern extends to any new src file). AC #3 wants this
reachable as a single command, so it likely wants a CLI subcommand or an
addition to `score`.

Locked decisions, unchanged: default branch `dev`; every issue merges via PR
(`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards into `main`;
docs/ edited outside lore-managed regions, `lore sync` then `lore check` exit 0
(`LORE_BACKLOG_TIMEOUT_MS=120000`); harness changes need matching tests; never
run `improve` on a style file. **New this session**: step 9 of the per-issue
lifecycle now runs `lore sync` on `dev` unconditionally right after every PR
merge (before the `main` fast-forward), gated on `lore check` exit 0 before
committing — see `.claude/skills/backlog-handover/SKILL.md` step 9 and the
"Critical context" section below for why.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `e222b64` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Active campaign | **3 (cell-free housekeeping)** — Campaign 2 held, not abandoned |
| Campaign 3 cursor | **COS-27**, item 2 of 5 (COS-23 resolved) |
| Campaign 2 cursor (held) | COS-16, item 9 of 21 — needs one clean Sonnet arm, blocked by usage limits |
| Test suite | 179/179 (`npm --prefix harness test`) |
| Gates | `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What happened this session (session 22)

Resolved COS-23 on `feature/COS-23`: `docs/log.md` was citing SHAs that
`gh pr merge --rebase` destroys. Swept every SHA in the file against
`origin/dev` and found 0/77 dead at the branch point — `lore sync` regenerates
the file from a live `git log` walk of the current HEAD, not an append-only
ledger, so a dead pre-rebase SHA a mid-branch sync records self-heals the next
time any later session's branch syncs again. Verified against the specific
SHAs COS-13 and COS-14 had diagnosed as dead: all four are gone from the file,
replaced under the same subject line by live SHAs. The defect is real but
bounded to a one-session-cycle window. Fix: `.claude/skills/backlog-handover/
SKILL.md` step 9 now runs `lore sync` on `dev` right after every PR merge,
before the `main` fast-forward, so the gap closes in the same session instead
of lagging into the next. `/code-review high` found one real issue (the new
step committed with no `lore check` gate, unlike step 3's explicit gate) —
fixed before merging. Merged as PR #20 (rebase); `dev`/`main` both pushed.

**A self-caught defect worth reading in full**: the first attempt to write the
updated tracker truncated it from 1361 lines to 399 — piping `backlog doc
view`'s large output through `sed -n '1,400p'` silently dropped the back half
of the document (the "Risk policy" and "Session log" sections, ~950 lines)
before it was committed. Caught by comparing the post-update file's line/byte
count against the pre-edit git blob rather than trusting the CLI's "Updated
document" success message; recovered via `git show <sha>:<path> > file` (a
direct redirect that bypasses the tool's output cap) and fixed in a follow-up
commit before the PR. See "Critical context" below — this is a trap the next
session doing ANY large tracker edit can walk straight into.

**A second slip, also caught and fixed**: `gh pr merge`'s first invocation
failed locally (dirty tree from an uncommitted task-notes edit) but had
already merged remotely; a second local-only commit made after that point
went to a branch GitHub had already merged, so it never reached `dev`. Caught
by grepping dev's task file for the review-finding text after the merge and
finding it absent. Fixed by cherry-picking the missing commit directly onto
`dev`. Lesson: after any `gh pr merge` that reports a local git error, verify
with `git log dev...HEAD` and a content check — do not assume "it failed" or
"it fully succeeded" from the error text alone.

## Next steps

1. Take COS-27 through the normal per-issue lifecycle: branch, plan, implement
   the interval method as harness code with tests, verify against every
   published FINDINGS.md figure, update the tracker on the branch (advance
   Campaign 3's cursor to COS-22, move COS-27 to Resolved), commit, review, PR
   into `dev`, merge, sync (**including the new step 9 `lore sync` re-sync,
   gated on `lore check`**), fast-forward `main`, prune.
2. Then COS-22, COS-24, COS-26 in order, one per session as usual.
3. Periodically — or whenever the user says to check — try resuming COS-16 per
   Campaign 2's held state. If a harness `run` completes without hitting a
   usage-limit error, Campaign 2 can resume properly; re-point the tracker's
   Cursor section back to `**Next issue: COS-16**` when that happens.

## Critical context / traps

- **Never round-trip a large Backlog doc through the Bash tool's captured
  stdout.** `backlog doc view doc-1 --plain` on this tracker (now ~1390 lines,
  ~150KB) exceeds the tool's display cap and gets saved to a persisted-output
  file with only a small preview shown inline. If you then pipe that saved
  file through anything with an implicit line/byte cap (`sed -n '1,400p'`,
  a second truncated tool read, etc.) before writing it back, you will
  silently drop content — exactly what happened this session. Instead:
  `git show <sha>:"<path>" > /path/to/scratch/file` (a direct shell redirect,
  which does NOT pass through the tool's output cap) to get the full content,
  make edits with exact string replacement (Python `str.replace(count=1)` or
  the Edit tool), then verify with `wc -l`/`wc -c` against the git blob before
  calling `backlog doc update`. Trust nothing here from the CLI's "Updated
  document" message alone — diff or count after every large tracker write.
- **After any `gh pr merge` that errors locally, verify what actually landed
  on `dev` before doing anything else.** The remote merge and the local git
  sync are two different operations; the first can succeed while the second
  fails, and re-committing locally afterward can produce a commit that never
  reaches `dev`. `git log dev...HEAD` from the feature branch, or a content
  grep on `dev` for what the missing commit should contain, catches this.
- **Step 9 is new as of this session** (`.claude/skills/backlog-handover/
  SKILL.md`): after syncing local `<default>`, run `lore sync` on it
  unconditionally; if it changes anything, `lore check` must exit 0 before
  committing directly (no branch/PR) and pushing; then promote to `main`.
  This session exercised it for the first time and it worked as designed —
  the resulting `docs/log.md` entry cited the live post-rebase SHA, not the
  dead pre-rebase one.
- **COS-27's published intervals do not reproduce under the obvious method**
  (see the paste-ready prompt above for the exact numbers). Whoever takes this
  needs to either find the exact method detail that closes the gap, or make
  and record a deliberate call to restate the published figures under a new,
  now-documented method.
- **`harness/results/` is gitignored, single-machine, still unaddressed** as a
  durability risk — not currently anyone's task, but worth raising with the
  user again if it comes up.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored, no git history. Flagged to the user in a prior session; no action
  taken pending their answer. Still present, still not ours to touch.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.**
  Use `backlog doc update doc-1 --content "$(cat file)"`, stripping
  frontmatter first, and verify size/line-count as noted above.
- **`lore sync` commits `backlog/` and rewrites `docs/log.md` on its own.**
  Expect a `chore(backlog): sync task changes` commit you did not author.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content
  into anything committed.

## Do not repeat

- **Don't pipe a large `backlog doc view`/tool-truncated output through a
  second line-capped command (`sed -n`, `head`, etc.) and trust the result is
  complete.** Redirect straight to a file with `git show <sha>:<path> > file`
  or an equivalent direct shell redirect instead, and verify size before
  writing back.
- **Don't treat a `gh pr merge` local error as "the merge failed."** Check
  what's actually on `dev` before re-committing or retrying — the remote side
  may have already succeeded.
