# Handover — take COS-1, close the multi-tool-session and open-ended-decision judge gap (COS-1)

**Date**: 2026-08-28 | **Grounded against**: `dev`/`main` @ `2f7810a`, clean, both remotes level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-1 — Campaign 2 item 15, status To Do, dependencies COS-10,
COS-11, COS-13, COS-16 all Done. Queue order confirmed by the user on
2026-08-17; do not re-ask before taking it. AC #1-#3 are already checked from
session 6 (multi-tool-session and neither-option-wins sections shipped in all
three style files, two reserve cases added); only AC #4 (judge > 65% on both
agentic-fix-verify and conv-decision-holdout, on both opus and sonnet) is
open. Read the task's own Implementation Notes for session 6's before/after
numbers before planning anything — do not re-author the sections that already
shipped, this is a measurement-and-maybe-narrow-fix task, not a rewrite.
COS-4 was just retaken and parked a second time (session 35) with a genuinely
new, well-tested lever that still came back null — see its notes for the
methodology (diagnose from actual judgeViolations text, probe small before
committing n=150) since COS-1 is the same shape of task.
```

## State

| Item | Status |
| --- | --- |
| COS-4 | **Parked again, session 35.** AC #1 still not met (Opus 66.1, Sonnet 60.9 vs a 70 bar). Tested a new, well-motivated candidate (a worked "explaining a mechanism" example) at full n=150/model; null on every metric. Style file reverted and sha256-verified back to `86451ddb`. PR #33 merged via rebase; `/code-review high` caught 3 record defects (stray figure, truncated sha256, a tally that dropped one category), all fixed in a follow-up commit before merge. |
| Cursor | **COS-1**, Campaign 2 item 15. Status `To Do`. AC #1-#3 already checked (session 6); only AC #4 is open. Dependencies COS-10, COS-11, COS-13, COS-16 all Done. |
| `dev` / `main` | Both `2f7810a`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs. |
| Gates as of `2f7810a` | 225/225 harness tests (**with `FORCE_COLOR=0`** — see trap below), `audit` exit 0. `lore check` not re-run this session (see trap below); last known clean at `f25d755`, 24 files. |
| Queue after COS-1 | 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33, 27 COS-34 |

## Next steps

1. Preflight: `dev`/`main` already level at `2f7810a` — verify with `git fetch` rather than assuming. `backlog task view COS-1 --plain` and read the whole thing; AC #1-#3 are checked from session 6, so do not re-author the multi-tool-session or neither-option-wins sections that already shipped in all three style files.
2. **Only AC #4 is open**: judge > 65% on `agentic-fix-verify` and `conv-decision-holdout`, on both opus and sonnet. Read session 6's before/after numbers in the task's Implementation Notes before planning a new measurement arm — there may already be a clean after-arm to compare against or extend rather than starting over.
3. **`FORCE_COLOR=0` is required for `npm --prefix harness test` on this host.** This shell exports `FORCE_COLOR=3`; `harness/test/fixture.test.mjs`'s `cleanEnv()` doesn't strip it, so Node 26's spec reporter wraps summary lines in ANSI codes the fixture's `^ℹ` regex can't parse, and 3 of 225 tests report false failures (`NaN` parsed from the colored line). Reproduces identically on unmodified `dev`. Not fixed — out of scope for content tasks — but worth its own quick issue against `cleanEnv()`. Always run tests as `FORCE_COLOR=0 npm --prefix harness test`.
4. **`lore` was not on PATH in this session's environment** (a background job), so `lore sync`/`lore check` were not run despite the lifecycle calling for them unconditionally at merge time. No `docs/` files changed this session, and the last known state was clean (`f25d755`, 24 files, 0 errors/warnings), so the risk is low — but **verify `lore` is reachable and run `lore check` at the start of the next session** before trusting docs/ is still clean, and catch up any gap this left.
5. COS-4's session 35 established a reusable method for a task this shape (a hard-to-move judge bar): diagnose the actual `judgeViolations` text from the current baseline's saved rows rather than reasoning from memory, probe a cheap diagnostic arm (n=10 repeats) before committing to n=150, and expect small-sample signals to be noise until they survive full precision — COS-1's own weak cases (`agentic-fix-verify`, `conv-decision-holdout`) have had no fresh violation-text diagnosis since the description was written.

## Critical context / traps

- **`FORCE_COLOR=0` before every `npm --prefix harness test` invocation on this host**, or 3 false failures appear. See Next steps #3 for the root cause. This is environment-specific (Node 26 + `FORCE_COLOR=3` in the shell), not a regression to chase in the harness code — unless you're the one opening the follow-up issue for it.
- **`lore` was unreachable in this session's environment** (background job) — could not run `lore sync`/`lore check`. Confirm it's on PATH before trusting `docs/` is current, and if it was never run since `f25d755`, run it and commit any drift before doing anything else docs-related.
- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use `--append-notes` to add, or extract-fix-replace (read the full current notes, fix in place, pass the whole corrected text to `--notes`) for a targeted correction — that's how this session fixed `/code-review`'s findings in COS-4's notes without losing session-9's history.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates on this doc's size (1801 lines as of this session). Read/edit the file on disk (`backlog/docs/doc-1 - Backlog-campaign-tracker.md`) directly, then push with `backlog doc update doc-1 --content "$(cat file)"`. Check line count before and after.
- **Cost is not a constraint in this project** — it runs on a Claude subscription, not billed API calls (COS-25 removed all cost tracking). Arms are sized by statistical power alone (146+ non-errored cells per model is the working floor), not by a dollar budget. Older task descriptions quoting a `$` budget (COS-1's own plan, item 8) predate that and should be read as historical, not binding.
- **Always probe 2 cells before committing any arm** — usage ceilings (5-hour window, monthly spend limit, Fable session-limit errors) have hit this campaign repeatedly and a probe is nearly free.
- **A background arm that "completes" in seconds has not run.** Check `results/<stamp>/run.json` for `"complete": true` and the actual cell count in `rows.json` before scoring anything.
- **This project's own repeated finding on hard style-judge tasks: additions to a style file test null far more often than they help, but a genuinely new, well-diagnosed lever is still worth one clean test at full n before parking again** — see COS-16's E1-E4 history and COS-4 session 35 for what "genuinely new" looked like there (a worked example, not another rule).

## Do not repeat

- **Do not skip the small-diagnostic-arm-then-scale pattern.** COS-4 session 35's 10-repeat diagnostic showed a same-sign-on-every-case Sonnet signal that read as a real effect; it dissolved to null once pooled to n=150. Trust full-precision numbers over small-sample ones even when the small sample looks unusually clean.
- **Do not treat a null result on a well-motivated, well-measured candidate as an incomplete session.** Per the tracker's risk policy ("record and park"), a clean null at adequate n is a legitimate, informative outcome — record it and move the cursor, don't keep re-authoring in the same session hoping for a different result.
- **Do not trust `npm --prefix harness test`'s raw output on this host without `FORCE_COLOR=0`** — you will see 3 false failures and may waste time debugging fixture code that isn't broken.
