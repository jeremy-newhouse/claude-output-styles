# Handover — Campaign 3, cell-free housekeeping (cursor: COS-24)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `da2deb4`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Active campaign: 3 (cell-free housekeeping). Cursor: COS-24 — stop the
CLI silently substituting defaults for malformed flags (harness/src/cli.mjs,
harness/src/usage.mjs), 10 ACs. Queue order for Campaign 3 (COS-23 -> COS-27
-> COS-22 -> COS-24 -> COS-26) was confirmed by the user on 2026-08-18; do not
re-ask. This is the last item before COS-26 — Campaign 3 empties after COS-26.

Campaign 2 is HELD, not abandoned: its own cursor is COS-16, which needs one
more clean measurement arm and is blocked by Claude Code's usage limits (both
the 5-hour window and a weekly cap hit on 2026-08-18). Do NOT take COS-16
instead of COS-24 unless the user explicitly asks you to check whether cell
budget is back. If you do check and it's available again, COS-16's full resume
state is in its own task notes (`backlog task view COS-16 --plain`) and the
tracker's "Campaign 2 (held at COS-16)" section — read those, not this
handover, before touching it.

COS-24 itself: read the task in full (`backlog task view COS-24 --plain`) —
it already names 11 verified failure modes with exact reproduction commands
(e.g. `run --modles=haiku` silently runs the full default default matrix
instead of narrowing it; `run --concurrency=abc` starts zero workers and dies
inside `summarize` with a null-property error naming neither the flag nor
concurrency; `run --no-judge=false` silently turns the judge off because the
string 'false' is truthy). Every one was verified at $0 by forcing zero cells
with `--cases=__none__` or calling the affected function directly — do not
re-derive them, and re-verify each against current `cli.mjs`/`usage.mjs`
before trusting the line numbers the task cites, since COS-14 already touched
this file once (fixed `improve --models` as the precedent, one flag on one
subcommand) and may have shifted lines.

The task's own note is the load-bearing constraint: nothing imports `cli.mjs`
— importing it runs it — so none of this is unit-testable directly. AC #10
requires exercising every case through the CLI itself, in the manner of
`harness/test/usage.test.mjs` (`execFileSync`, already shells out and asserts
`run --help` creates no results directory). AC #7 is the inverse guard: the
new validation must not break that `--help`/`-h` short-circuit — COS-5's
original regression was `run --help` launching the whole matrix, and the task
explicitly warns this could come back "inverted as `run --help` failing on a
flag it should never have parsed." Write the AC #7 regression test first or
run it after every validation change, not just once at the end.

This is the widest task Campaign 3 has taken — 10 ACs across `cli.mjs`'s
shared `pick`/`parseArgs` (used by `--styles`, `--variants`, `--cases`,
`--models`, `--repeats`, `--concurrency`, `--iterations`, `--no-judge`,
`--rows`) plus `improve.mjs`'s variant-list handling. Read the whole
description before planning — do not scope down to a subset of the 10 without
telling the user first, per the task-execution "Scope Changes" rule.

Locked decisions, unchanged: default branch `dev`; every issue merges via PR
(`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards into `main`;
docs/ edited outside lore-managed regions, `lore sync` then `lore check` exit 0
(`LORE_BACKLOG_TIMEOUT_MS=120000`); harness changes need matching tests; never
run `improve` on a style file. Step 9 of the per-issue lifecycle runs
`lore sync` on `dev` unconditionally right after every PR merge (before the
`main` fast-forward), gated on `lore check` exit 0 — see
`.claude/skills/backlog-handover/SKILL.md` step 9. It has now run cleanly on
three consecutive merges (COS-23, COS-27, COS-22) and every time regenerated
`lore_task_status` and the per-task status table from live task state — do not
hand-edit those fields, trust the CLI's recompute.

**A gotcha from this session, worth repeating**: after step 9's fast-forward,
if you then do R5 step 1 (archive the consumed handover) as a *separate*
commit, `dev` moves ahead of the already-pushed `main` again — you must push
`dev` and re-run the `main` fast-forward a second time, or `main` silently
falls one commit behind. This session caught it (`dev` at `da2deb4`, `main`
still at `00bacbd` after the first promotion) only by checking
`git log --oneline -1` on both branches before writing this handover.
Re-verify `dev`/`main` are at the *same* SHA as the very last step before
declaring a session done, even after the "unconditional" R5 step 3 push.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `da2deb4` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Active campaign | **3 (cell-free housekeeping)** — Campaign 2 held, not abandoned |
| Campaign 3 cursor | **COS-24**, item 4 of 5 (COS-23, COS-27, COS-22 resolved) |
| Campaign 2 cursor (held) | COS-16, item 9 of 21 — needs one clean Sonnet arm, blocked by usage limits |
| Test suite | 195/195 (`npm --prefix harness test`) |
| Gates | `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What happened this session (session 24)

Resolved COS-22 on `feature/COS-22`: hardened `harness/test/fixture.test.mjs`
against all 5 gaps a prior review found. `verdict()` now requires
`skipped===0`, `todo===0` and an actual `pass` count >=2 pulled from the same
`ℹ` summary lines `node --test` emits — closing the hole where a suite whose
tests were rewritten to `{ skip: true }` read as green (reproduced: `pass 0,
fail 0, skipped 2`, and the source-derived assertion count still counted 2).
The pinned-value scan now walks every file under `fixtures/repo` via
`readdirSync(dir, { recursive: true, withFileTypes: true })` instead of just
the test file — closing the gap that let commit `acadf1b` ship a `BUG:`
comment in `src/pricing.js` spelling out 850/849 with every guard green — and
switched from `.includes()` substring matching to a `\b850\b`/`\b849\b`
word-boundary regex so `8500`/`1850`/`$8.50` don't false-positive. The
`npm test` guard now runs through the same `verdict()` parsing and asserts
`result.error` is undefined, so a missing `npm` on `PATH` surfaces
`spawnSync npm ENOENT` instead of an opaque empty diff, and a
`"test": "true"` no-op script that exits 0 without running anything now fails
on `passedCount`. Qualified `docs/stories/make-the-measurements-trustworthy.md`'s
`reserve-agentic-session` difficulty claim: `src/pricing.js` still carries a
literal `BUG:` comment a single `grep -rn BUG` finds, deliberate for
`agentic-read-report` but meaning the case's remaining difficulty is search,
not comprehension.

Five new sabotage-verified regression tests, one per gap, each proving the
specific failure mode is caught (not just asserted away). Suite 190 → 195.

Merged as PR #22 (rebase, fast-forward since `dev` hadn't moved); `dev`/`main`
both pushed at `00bacbd` after step 9's `lore sync` (regenerated
`lore_task_status` and the per-task status table — no gap found this time,
unlike COS-23's and COS-27's sessions). Archiving the consumed handover then
advanced `dev` to `da2deb4` without `main` following — caught and fixed before
this handover was written; see the trap above.

## Next steps

1. Take COS-24 through the normal per-issue lifecycle: branch, plan,
   implement each of the 10 ACs (all in `harness/src/cli.mjs`,
   `harness/src/usage.mjs`, exercised through `harness/test/usage.test.mjs`
   per the task's own note that nothing imports `cli.mjs`), update the
   tracker on the branch (advance Campaign 3's cursor to COS-26, move COS-24
   to Resolved), commit, review, PR into `dev`, merge, sync (**including
   step 9's `lore sync` re-sync, gated on `lore check`**), fast-forward
   `main`, prune.
2. Then COS-26. Campaign 3 empties after COS-26 — the next `restore` after
   that should summarize the resolved table and suggest `init` for a fresh
   queue, or check with the user about resuming Campaign 2 at COS-16 first.
3. Periodically — or whenever the user says to check — try resuming COS-16
   per Campaign 2's held state. If a harness `run` completes without hitting
   a usage-limit error, Campaign 2 can resume properly; re-point the
   tracker's Cursor section back to `**Next issue: COS-16**` when that
   happens.

## Critical context / traps

- **After archiving a handover in R5 step 1, re-check whether `dev` and
  `main` still match.** If the archive commit lands after the promotion in
  step 9, `dev` moves ahead and `main` silently lags by one commit unless you
  push `dev` and fast-forward `main` again. This session hit it; see the
  paste-ready prompt above for the full account. Verify with
  `git log --oneline -1 dev` vs `git log --oneline -1 main` as the literal
  last check before ending a session.
- **Never round-trip a large Backlog doc through the Bash tool's captured
  stdout.** The tracker (now ~1430+ lines) exceeds the tool's display cap.
  Use `git show <sha>:"<path>" > /path/to/scratch/file` (a direct shell
  redirect) to get the full content, edit with exact string replacement, and
  verify with `wc -l`/`wc -c` or a `diff` against the git blob before calling
  `backlog doc update`. This session did this correctly throughout.
- Step 9 (`lore sync` on `dev` after every merge, gated on `lore check`) has
  now run cleanly three times in a row. It regenerates `lore_task_status` and
  the per-task status table in `docs/stories/*.md` from live task state —
  this is expected and correct, not something to hand-fix.
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

- **Don't treat R5 step 3's push as the last ground-truth check of a
  session.** If any commit (like the archive-handover commit) lands after
  the `main` promotion, verify `dev`/`main` converge again before finishing —
  don't just trust that "push dev" alone closed the gap.
- **Don't pipe a large `backlog doc view`/tool-truncated output through a
  second line-capped command (`sed -n`, `head`, etc.) and trust the result is
  complete.** Redirect straight to a file with `git show <sha>:<path> > file`
  instead, and verify size before writing back.
