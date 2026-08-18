# Handover — Campaign 3, cell-free housekeeping (cursor: COS-22)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `d3022be`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Active campaign: 3 (cell-free housekeeping). Cursor: COS-22 — harden
the fixture guard COS-13 added (harness/test/fixture.test.mjs), 4 gaps found
by a review + 1 doc-accuracy point. Queue order for Campaign 3 (COS-23 ->
COS-27 -> COS-22 -> COS-24 -> COS-26) was confirmed by the user on 2026-08-18;
do not re-ask.

Campaign 2 is HELD, not abandoned: its own cursor is COS-16, which needs one
more clean measurement arm and is blocked by Claude Code's usage limits (both
the 5-hour window and a weekly cap hit on 2026-08-18). Do NOT take COS-16
instead of COS-22 unless the user explicitly asks you to check whether cell
budget is back. If you do check and it's available again, COS-16's full resume
state is in its own task notes (`backlog task view COS-16 --plain`) and the
tracker's "Campaign 2 (held at COS-16)" section — read those, not this
handover, before touching it.

COS-22 itself: read the task in full (`backlog task view COS-22 --plain`) —
it already names five specific gaps with reproduction steps, don't re-derive
them. Four are in `harness/test/fixture.test.mjs`'s guard logic (AC #1-#4:
skipped tests reading as green, the pinned-value scan only covering the test
file not the source `harness/fixtures/repo/src/pricing.js`, `npm test`
spawn-error handling, and a naive substring match on 850/849 that a number
like 8500 or 1850 would false-positive on). The fifth (AC #5) is a docs
accuracy point in `docs/stories/make-the-measurements-trustworthy.md` — that
file is lore-managed under `docs/`, so any edit needs `lore sync` then
`lore check` exit 0 before committing (this session's new step 9 gate, see
below, applies the same rule to any docs/ change the branch itself makes,
not just the post-merge sync). Every AC names its own falsification method
("demonstrated by making the change and observing the failure") — this is a
guard-hardening task, so the tests should be sabotage-verified: prove each
gap fires today (red), fix it, prove it's caught (green), the way COS-13's
own fixture.test.mjs work already did for the fixture itself.

Locked decisions, unchanged: default branch `dev`; every issue merges via PR
(`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards into `main`;
docs/ edited outside lore-managed regions, `lore sync` then `lore check` exit 0
(`LORE_BACKLOG_TIMEOUT_MS=120000`); harness changes need matching tests; never
run `improve` on a style file. Step 9 of the per-issue lifecycle runs
`lore sync` on `dev` unconditionally right after every PR merge (before the
`main` fast-forward), gated on `lore check` exit 0 before committing — see
`.claude/skills/backlog-handover/SKILL.md` step 9. This has now run cleanly
twice (after COS-23's and COS-27's merges) and both times found and closed a
real gap (a trailing doc-log commit that hadn't been recorded yet) — expect
it to do the same after COS-22 merges.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `d3022be` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Active campaign | **3 (cell-free housekeeping)** — Campaign 2 held, not abandoned |
| Campaign 3 cursor | **COS-22**, item 3 of 5 (COS-23, COS-27 resolved) |
| Campaign 2 cursor (held) | COS-16, item 9 of 21 — needs one clean Sonnet arm, blocked by usage limits |
| Test suite | 190/190 (`npm --prefix harness test`) |
| Gates | `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What happened this session (session 23)

Resolved COS-27 on `feature/COS-27`: FINDINGS.md's paired confidence
intervals had no recorded, reproducible computation method. Reverse-engineered
it against the raw saved rows behind the published COS-4 figures — pair by
(case, model), average repeats, sample-SD (n-1) paired-t interval — confirmed
first against the reserve arm (no repeat-averaging ambiguity), which matched
the published rules figure to the last digit on the first attempt. The
shared-five arm needed one more insight: its after-side pools a second,
larger run the ledger already named as a judge-noise fix, and pooling it in
reproduced all four of that column's metrics exactly. 7 of 8 published cells
now reproduce exactly; reserve reply-words did not (~1-word gap, no cause
found) and was restated in FINDINGS.md's footnote with the original value and
the investigation recorded, per the task's own "reproduce or restate" branch.

Implemented as `harness/src/interval.mjs` (`pairedInterval`, `tCritical95`,
`METRICS`) plus `node src/cli.mjs interval --before=<rows> --after=<rows>
--metric=rules|words|composite|judge`, with comma-separated `--before`/
`--after` for the pooling case. 10 new tests including a real-data regression
anchored to the reserve-arm rules figure so a future change to the method
can't silently drift from what FINDINGS.md quotes. Suite 179 → 190.

**A self-review (not the `/code-review` skill — see trap below) caught one
real issue before merging**: `METRICS.words` counted raw text where the
codebase's one existing word-counting convention (`checks.mjs`'s
`total_length` check) strips code blocks first. Fixed to match; didn't move
any published figure since neither COS-4 arm's replies contain a code block.

Merged as PR #21 (rebase); `dev`/`main` both pushed at `8af7b50`, then the
post-merge `lore sync` step found and recorded one more trailing commit,
pushed as `d3022be` after both were fast-forwarded again.

## Next steps

1. Take COS-22 through the normal per-issue lifecycle: branch, plan,
   implement each of the five gaps with sabotage-verified tests, update the
   tracker on the branch (advance Campaign 3's cursor to COS-24, move COS-22
   to Resolved), commit, review, PR into `dev`, merge, sync (**including
   step 9's `lore sync` re-sync, gated on `lore check`**), fast-forward
   `main`, prune.
2. Then COS-24, COS-26 in order, one per session as usual. Campaign 3 empties
   after COS-26 — the next `restore` after that should summarize the
   resolved table and suggest `init` for a fresh queue, or check with the
   user about resuming Campaign 2 at COS-16 first.
3. Periodically — or whenever the user says to check — try resuming COS-16
   per Campaign 2's held state. If a harness `run` completes without hitting
   a usage-limit error, Campaign 2 can resume properly; re-point the
   tracker's Cursor section back to `**Next issue: COS-16**` when that
   happens.

## Critical context / traps

- **This session's `/code-review high` invocation got tangled with a
  cross-session name collision and never produced findings.** The forked
  review agent's 8 sub-finder agents went silent for ~40 minutes (against a
  ~6-10 minute baseline from an earlier review this session), and a liveness
  ping accidentally resolved to a different Claude session's identically-named
  agent working an unrelated task, producing a stale, wrong-diff finding. The
  review agent did catch one real, useful issue on its own initial read before
  delegating (the `METRICS.words`/`stripCode` gap, fixed) but never completed
  a compiled review. Rather than keep debugging the delegation, the session
  fell back to reading the full `git diff dev...HEAD` directly and reviewing
  it by hand — which is a legitimate substitute per this skill's own
  instructions ("This project has `/code-review`; use it" is a should, not a
  must; "review the full branch diff... with fresh eyes" is the actual
  requirement). If `/code-review` hangs again next session, don't sink another
  40+ minutes into it — try once, and if the finder agents haven't reported
  within roughly the same window a prior invocation took, pivot straight to a
  direct self-review instead of repeatedly pinging.
- **Never round-trip a large Backlog doc through the Bash tool's captured
  stdout.** `backlog doc view doc-1 --plain` on this tracker (now ~1400+
  lines) exceeds the tool's display cap. Use `git show <sha>:"<path>" >
  /path/to/scratch/file` (a direct shell redirect) to get the full content,
  edit with exact string replacement, and verify with `wc -l`/`wc -c` or a
  `diff` against the git blob before calling `backlog doc update`. This
  session did this correctly throughout (learned the hard way in session 22).
- Step 9 (`lore sync` on `dev` after every merge, gated on `lore check`) is
  now proven across two real merges. Follow it exactly as written in
  `.claude/skills/backlog-handover/SKILL.md`.
- **`harness/results/` is gitignored, single-machine, still unaddressed** as
  a durability risk — not currently anyone's task, but worth raising with the
  user again if it comes up.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored, no git history. Flagged to the user across multiple prior
  sessions; no action taken pending their answer. Still present.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.**
  Use `backlog doc update doc-1 --content "$(cat file)"`, stripping
  frontmatter first, and verify size/line-count as noted above.
- **`lore sync` commits `backlog/` and rewrites `docs/log.md` on its own.**
  Expect a `chore(backlog): sync task changes` commit you did not author.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content
  into anything committed.

## Do not repeat

- **Don't sink extended time into a wedged `/code-review` delegation.** One
  status ping is reasonable; if the finder agents haven't reported within
  roughly the time a prior invocation this session took, pivot to a direct
  self-review of `git diff <default>...HEAD` instead of repeatedly pinging or
  waiting longer.
- **Don't pipe a large `backlog doc view`/tool-truncated output through a
  second line-capped command (`sed -n`, `head`, etc.) and trust the result is
  complete.** Redirect straight to a file with `git show <sha>:<path> > file`
  instead, and verify size before writing back.
