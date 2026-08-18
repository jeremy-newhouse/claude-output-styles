# Handover — Campaign 3, cell-free housekeeping (cursor: COS-26)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `ece23e6`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Active campaign: 3 (cell-free housekeeping). Cursor: COS-26 — bound the
judge and rewrite calls so a stalled grader cannot hang a run, 6 ACs. Queue
order for Campaign 3 (COS-23 -> COS-27 -> COS-22 -> COS-24 -> COS-26) was
confirmed by the user on 2026-08-18; do not re-ask. This is Campaign 3's LAST
item — the campaign empties once COS-26 resolves.

Campaign 2 is HELD, not abandoned: its own cursor is COS-16, which needs one
more clean measurement arm and is blocked by Claude Code's usage limits (both
the 5-hour window and a weekly cap hit on 2026-08-18). Do NOT take COS-16
instead of COS-26 unless the user explicitly asks you to check whether cell
budget is back. If you do check and it's available again, COS-16's full resume
state is in its own task notes (`backlog task view COS-16 --plain`) and the
tracker's "Campaign 2 (held at COS-16)" section — read those, not this
handover, before touching it.

COS-26 itself: read the task in full (`backlog task view COS-26 --plain`).
COS-25 replaced the old cost ceiling with `run.maxCellSeconds`, a wall-clock
AbortController guard around each cell in `runCell` (harness/src/run.mjs —
see `cellLimitMs`, ~line 126, and the AbortController wiring ~line 167). That
guard bounds a cell and nothing else. Two model calls remain unbounded:
`judge.mjs:66`'s `query()` call (no abortController, no timeout) and
`improve.mjs:215`'s `rewrite()` call (same). Either stalling mid-stream hangs
the process indefinitely — `runCell`'s guard has already returned and cleared
its timer by the time the judge runs. Re-verify these line numbers against
current `judge.mjs`/`improve.mjs` before trusting them; COS-24 touched
neither file but several sessions have landed since the task was written.

judge.mjs already catches a thrown query error and returns a neutral 0.5 with
the failure recorded on the row (AC #1 leans on this existing landing place —
the new work is making the call actually abort and throw on timeout, not
building a new failure path). improve.mjs's rewrite() has no equivalent
today; AC #2 requires deciding what a timed-out rewrite means for the
iteration (most likely: treat it as a failed candidate, same shape as any
other rewrite that "returned nothing usable" per improve.mjs's existing
`log(...iteration...: author returned nothing usable...)` path — read that
path before inventing a new one).

AC #3 requires the timeouts live in matrix.json (not hard-coded), with the
same fail-loud-at-startup discipline `cellLimitMs` already established for
`maxCellSeconds` (throws naming the bad value, checked once at CLI startup
via `cellLimitMs`'s own call site in cli.mjs, not per-cell). AC #4 is the
hard one: "sabotage-verified" per this campaign's own recurring standard
means write a test that drives a genuinely wedged query to a real abort and
confirms the timeout actually fires — not a mocked timer, an executed one
(see harness/test/run.test.mjs's existing wedge-then-throw /
wedge-then-quiet-end pattern for `runCell`'s own guard, COS-25's precedent
for exactly this kind of test). AC #5 requires editing matrix.json's
`//run`/`//improve` comment blocks (which currently explicitly say these two
calls are unbounded — COS-25 wrote that wording on purpose, citing this task
by number, so this task now has to un-say it), harness/README.md, and
docs/reference/harness-architecture.md — the doc edit goes through `lore
sync`/`lore check` per the usual gate (`LORE_BACKLOG_TIMEOUT_MS=120000`).

Locked decisions, unchanged: default branch `dev`; every issue merges via PR
(`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards into `main`;
docs/ edited outside lore-managed regions, `lore sync` then `lore check` exit 0;
harness changes need matching tests; never run `improve` on a style file.
Step 9 of the per-issue lifecycle runs `lore sync` on `dev` unconditionally
right after every PR merge (before the `main` fast-forward) — see
`.claude/skills/backlog-handover/SKILL.md` step 9. It has now run cleanly on
five consecutive merges (COS-23, COS-27, COS-22, COS-24's two-round merge)
and regenerates `lore_task_status`/the per-task status table from live task
state every time — do not hand-edit those fields, trust the CLI's recompute.

**Re-confirmed this session**: after archiving the consumed handover in R5
step 1, `dev` moves one commit ahead of the already-pushed `main` again — you
must push `dev` and re-run the `main` fast-forward a SECOND time, or `main`
silently falls one commit behind. This is not new (flagged in the prior
handover too) but it recurred exactly as predicted this session, was caught
before finishing, and is worth treating as a standing, permanent step rather
than something to remember to check for — always diff `main..dev` as the
literal last command before ending a session, even after "pushed dev" and
"promoted main" both already happened once.

**Also from this session**: a `/code-review high` pass on COS-24's branch
found real issues in the first implementation pass that were not surface-
level — an empty-string flag value (`--repeats=`) bypassed validation because
neither the bare-flag check nor `Number('')` caught it, and a flag allowlist
accidentally dropped previously-working functionality (`judge --concurrency`).
Both were subtle enough to survive 204 passing tests before the review found
them. Budget time for a real review pass on COS-26 too, not just a read-
through — this campaign's own two worst near-misses (this one and COS-22's
fixture guard) were both review-found, not self-found.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `ece23e6` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Active campaign | **3 (cell-free housekeeping)** — Campaign 2 held, not abandoned |
| Campaign 3 cursor | **COS-26**, item 5 of 5 (COS-23, COS-27, COS-22, COS-24 resolved) — **last item, campaign empties after this** |
| Campaign 2 cursor (held) | COS-16, item 9 of 21 — needs one clean Sonnet arm, blocked by usage limits |
| Test suite | 214/214 (`npm --prefix harness test`) |
| Gates | `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What happened this session (session 25)

Resolved COS-24 on `feature/COS-24`, in two commits. First commit implemented
all 10 ACs: `harness/src/cli.mjs` gained `validateFlags`/`num`/`matchList`,
run right after the existing `--help` guard, rejecting an unrecognised flag,
a value-taking flag with no value, a boolean flag given one
(`--no-judge=false`), a non-numeric repeats/concurrency/iterations/
judge-repeats, and an unmatched `--variants`/`--cases` entry — all before any
cell is measured. `improve` now rejects an explicit `--variants` naming more
than one, while keeping the pre-existing no-flag default (README's and
`npm run improve`'s documented invocation) unchanged — a bare length check
would have broken both, caught by grepping for other bare `improve`
invocations across the repo before locking in the check's condition.

A `/code-review high` pass over the full branch diff then found 10 issues, 6
real. Fixed: an empty-string flag value (`--repeats=`, `--styles=`, etc.)
bypassed every check because `Number('')` is `0`, a finite number — closed by
having `validateFlags` reject `val === ''` the same as the bare-flag
`val === true` case, uniformly, which also closed the same gap for
`--rows=`/`--judgements=`/`--models=` for free; `FLAGS.judge` had dropped
`--concurrency` even though `judge` has always read `opts.concurrency` to
size its call pool — a real regression, restored; matching `--variants`/
`--cases` against live config ran even for an unrecognised subcommand, so
`node cli.mjs rnu --variants=typo` reported "matches nothing" instead of ever
naming `rnu` as the actual mistake — fixed by moving the unknown-command
check ahead of flag validation. Also collapsed a four-way flag-type table
into a single `BOOLEAN_FLAGS` set (the other three types only ever meant
"not boolean") and extracted the whole validation layer into a new
`harness/src/args.mjs`, mirroring `usage.mjs`'s own reason for existing
(importable and testable without executing the CLI) — the review's last
finding was that testing pure validation logic by spawning ~16 subprocesses
was needless overhead once it no longer had to live inline in `cli.mjs`.
New `harness/test/args.test.mjs` carries the exhaustive per-case coverage
in-process; `harness/test/usage.test.mjs` kept a small set of true
end-to-end checks. Suite 195 → 204 → 214, all green; test wall-clock actually
dropped despite more tests.

Four review findings were considered and declined, with reasoning recorded in
the task notes: `--styles=typo` still throws later with a different message
shape than `--variants=typo` (pre-existing behaviour, not introduced by this
diff, and AC4 explicitly scopes strict matching to `--variants`/`--cases`
only — extending it to `--styles` would make `audit`'s deliberately
non-throwing missing-contract reporting throw instead); `--models` and
`--judges` stay open-ended (free-form SDK ids / judge model names, not a
fixed enum, matching matrix.json's own documented Fable-id example).

Merged as PR #23 (rebase; `dev` had not moved, so it fast-forwarded cleanly).
Step 9's `lore sync` on `dev` regenerated `docs/log.md` and the
`make-the-measurements-trustworthy` story's status table (no gap found this
time). `dev`/`main` both pushed at `3f2513e`, then the handover-archive
commit moved `dev` to `ece23e6` — re-promoted `main` a second time,
per the standing trap below, before ending the session.

**One disclosed incident**: while manually verifying that `improve`'s
no-`--variants`-flag default still works (it does — variants defaults to
every configured variant, and improve has always silently used only the
first, which is the documented behaviour this session deliberately
preserved), a live `improve --styles=plain-english-advanced` was
backgrounded and killed ~2 seconds in, after its first measurement log line
had already printed — meaning at least one real, paid API call was likely in
flight when it was killed. Small and very likely partial/aborted before
completing, but real. Flagged here for visibility; no further action taken.

## Next steps

1. Take COS-26 through the normal per-issue lifecycle: branch, plan,
   implement all 6 ACs (`harness/src/judge.mjs`, `harness/src/improve.mjs`,
   `matrix.json`'s new timeout config, sabotage-verified abort tests per
   AC #4), update the tracker on the branch — this is Campaign 3's last item,
   so the tracker update should note the campaign emptying, not just advance
   a cursor — commit, **review with real scrutiny, not a read-through** (see
   the paste-ready prompt's closing note), PR into `dev`, merge, sync
   (including step 9's `lore sync`, gated on `lore check`), fast-forward
   `main`, prune.
2. Once COS-26 resolves, Campaign 3 is empty. The next `restore` should
   summarize the Campaign 3 resolved table, archive the final handover, and
   either suggest `init` for a fresh queue or check with the user about
   resuming Campaign 2 at COS-16 first (cell budget may or may not be back by
   then — ask, don't assume).
3. Periodically — or whenever the user says to check — try resuming COS-16
   per Campaign 2's held state. If a harness `run` completes without hitting
   a usage-limit error, Campaign 2 can resume properly; re-point the
   tracker's Cursor section back to `**Next issue: COS-16**` when that
   happens.

## Critical context / traps

- **After archiving a handover in R5 step 1, always re-check whether `dev`
  and `main` still match, and treat it as a standing step, not a
  remember-to-check one.** This has now recurred across at least two
  consecutive sessions. Verify with `git log --oneline -1 dev` vs
  `git log --oneline -1 main` (or `git log --oneline main..dev`) as the
  literal last command before ending a session, even after "push dev" and
  "promote main" both already ran once.
- **Budget a real review pass, not a read-through, on every issue.** COS-24's
  own review found subtle validation gaps (empty-string bypass) and a real
  functionality regression (`judge --concurrency`) that 204 passing tests did
  not catch. COS-22's fixture-guard hardening (session 24) was the same
  pattern. Both of Campaign 3's most substantive corrections this far came
  from the review step, not from self-checking.
- **Never round-trip a large Backlog doc through the Bash tool's captured
  stdout.** The tracker exceeds the tool's display cap. Use
  `git show <sha>:"<path>" > /path/to/scratch/file` (a direct shell
  redirect) to get the full content, edit with exact string replacement, and
  verify with `wc -l`/`wc -c` before calling `backlog doc update`.
- Step 9 (`lore sync` on `dev` after every merge, gated on `lore check`) has
  now run cleanly on every merge this campaign. It regenerates
  `lore_task_status` and the per-task status table in `docs/stories/*.md`
  from live task state — this is expected and correct, not something to
  hand-fix.
- **`harness/results/` is gitignored, single-machine, still unaddressed** as
  a durability risk — not currently anyone's task, but worth raising with the
  user again if it comes up.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored, no git history. Flagged to the user across multiple prior
  sessions; no action taken pending their answer. Still present.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.**
  Use `backlog doc update doc-1 --content "$(cat file)"`, stripping
  frontmatter first, and verify size/line-count as noted above.
- **`lore sync` commits `backlog/` and rewrites `docs/log.md` on its own**
  when it touches `backlog/` — expect a `chore(backlog): sync task changes`
  commit you did not author. This session it changed only `docs/`, so no
  auto-commit happened and the sync had to be committed manually — both
  outcomes are normal, check `git status` after running it either way.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content
  into anything committed.

## Do not repeat

- **Don't let "pushed dev" or "promoted main" stand as the last ground-truth
  check of a session** if any commit lands after — like the archive-handover
  commit reliably does. Diff `main..dev` as the literal final step.
- **Don't pipe a large `backlog doc view`/tool-truncated output through a
  second line-capped command (`sed -n`, `head`, etc.) and trust the result is
  complete.** Redirect straight to a file with `git show <sha>:<path> > file`
  instead, and verify size before writing back.
- **Don't manually verify a paid-command's default-invocation behavior by
  backgrounding it and sleeping before killing it.** Kill the instant the
  first proof-of-control-flow log line appears; a multi-second sleep can let
  a real measurement call start. If zero cost is required, find a way to
  prove the claim from code/tests instead of a live process.
