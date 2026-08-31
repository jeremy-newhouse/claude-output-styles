# Handover — take COS-28, reconcile advanced's stated word-count basis with total_length's (COS-28)

**Date**: 2026-08-28 | **Grounded against**: `dev`/`main` @ `d828129`, clean, both remotes level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-28 — Campaign 2 item 21, status To Do, no dependencies, no
assignee. Queue order confirmed by the user on 2026-08-17; do not re-ask
before taking it. It is a small, cell-cheap task by the tracker's own
description (a basis-disagreement fix, not a full authoring pass) — read the
task's own Description and ACs before assuming it needs a 200+-cell arm; #3
(teach audit to compare basis, not just number) may be free.
```

## State

| Item | Status |
| --- | --- |
| COS-1 | **Retaken and parked again, this session.** AC #4 half-resolved: `agentic-fix-verify` now clears 65% on both models (86.5 opus / 92.7 sonnet, n=6) purely from COS-10's scoring-seam fix, no authoring needed. `conv-decision-holdout` remains below bar (54.5 / 47.0), a third measurement agreeing with session 6's two failed authoring passes. No new lever tried. See the task's notes/final-summary and tracker queue row 15. |
| Cursor | **COS-28**, Campaign 2 item 21. Status `To Do`, no dependencies, no assignee. |
| `dev` / `main` | Both `d828129`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs (verify with `gh pr list` regardless). |
| Gates as of `d828129` | 225/225 harness tests (**`FORCE_COLOR=0` required on this host** — see trap below), `audit` exit 0, `lore check` 24 files 0 errors/warnings. |
| Queue after COS-28 | 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33, 27 COS-34 |

## Next steps

1. Preflight: `dev`/`main` already level at `d828129` — verify with `git fetch` rather than assuming. **A concurrent session raced this exact restore once already this session (see traps below) — check `ListAgents` for other live sessions on this repo before assuming you're the only one acting on it, and re-verify ground truth (git log, task status, tracker cursor) immediately before any mutating action, not just at session start.**
2. `backlog task view COS-28 --plain` and read the whole thing — it's short. Branch `feature/COS-28` off `dev`.
3. Decide the fix direction per AC #1 (argue, don't assume): change `plain-english-advanced.md` line 79's stated basis to match what `total_length` actually counts (`words(stripCode(text))`, code excluded), or change `total_length` to count code too. The task's own description flags the second option as expensive — it moves every published `total_length` figure on all three styles and needs every saved row re-scored. The first (prose edit) needs one measured arm on advanced specifically, the most expensive of the three styles at ~207 cells for ±4 points precision — but this is a wording clarification, not new content, so a much smaller confirmatory arm may be enough to show no regression (advanced's own cap enforcement doesn't change, only its stated basis).
4. AC #3 (teach `audit` to compare basis, not just the number) may be doable with no cells at all — read `node src/cli.mjs audit`'s implementation (likely `src/contract-audit.mjs` or similar) before assuming it needs measurement.
5. `FORCE_COLOR=0 npm --prefix harness test` — see trap below, do not trust raw output on this host.

## Critical context / traps

- **A concurrent session (name unknown — `ListAgents` showed peers `harness-dd`/`harness-ba` that started seconds after this session began) raced this exact `/backlog-handover restore` on the same working directory during this session's COS-4 ground-truth check.** It fully resolved and merged COS-4's park-again cycle while this session was still verifying state; branch switched out from under this session (`feature/COS-4` → `dev`) and an uncommitted edit briefly appeared and vanished. No data was lost — this session re-verified state and restarted cleanly on the new cursor (COS-1) — but if it happens again, **stop, check `ListAgents`, and re-verify ground truth before any mutating git or backlog command**, per this file's own R2 step. The user was informed and said this session should be treated as authoritative; they did not say what the other sessions are.
- **`FORCE_COLOR=0` is required for `npm --prefix harness test` on this host.** This shell exports `FORCE_COLOR=3`; `harness/test/fixture.test.mjs`'s `cleanEnv()` doesn't strip it, so Node's spec reporter wraps summary lines in ANSI codes the fixture's `^ℹ` regex can't parse, and 3 of 225 tests report false failures (`NaN` parsed from the colored line). Not fixed — out of scope for content tasks, worth its own follow-up issue against `cleanEnv()`. Always run tests as `FORCE_COLOR=0 npm --prefix harness test`.
- **`lore` was not on PATH in the last two sessions' shells.** The binary exists at `/Volumes/_repos/lore-cli/dist/lore` — use that path directly if `lore` isn't found, rather than skipping `lore sync`/`lore check`. This session ran it that way and found real drift in `docs/log.md` and five story files from prior sessions' merges; synced and committed it (`d828129`'s parent commit). Confirm it's still needed at the start of the next session — if `lore` is genuinely on PATH by then, drop the explicit path.
- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use `--append-notes`. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates (1842 lines as of this session). Read/edit `backlog/docs/doc-1 - Backlog-campaign-tracker.md` on disk directly, then push with `backlog doc update doc-1 --content "$(cat file)"`. Check line count before and after every update.
- **Cost is not a constraint in this project** — it runs on a Claude subscription (COS-25 removed cost tracking). Arms are sized by statistical power alone; 146+ non-errored cells per model is the working floor for a full-precision judge arm, not a dollar budget.
- **Always probe 2 cells before committing any arm.**
- **A background arm that "completes" in seconds has not run.** Check `results/<stamp>/run.json` for `"complete": true` and the actual row count in `rows.json`.
- **Agentic cells are slow — much slower than conversational ones.** This session's 24-cell probe (half agentic, half conversational) took roughly 90 minutes at concurrency 4, far below the ~9-10 cells/min this project's non-agentic throughput figures assume. Size any arm involving an agentic case on measured throughput, not on the conversational-case figures already in the tracker.
- **This project's repeated finding on hard style-judge tasks stands**: additions to a style file test null or negative far more often than they help. A worked example (not another rule) is the one lever that's worked when it has (COS-4 pass 1, COS-16). COS-28 is a basis-reconciliation task, not one of these hard judge-bar tasks — don't over-apply this caution to what may be a much smaller, mostly-mechanical fix.

## Do not repeat

- **Do not skip the `ListAgents` check at the start of a session in this repo going forward** — this session found a live collision only by accident (an unexplained file diff), not by checking first. Checking first is cheap; discovering a collision mid-edit is not.
- **Do not treat a null or mixed result on a well-measured AC as an incomplete session.** COS-1's `conv-decision-holdout` half stayed below bar after three independent measurements including two dedicated authoring passes — recording that and moving the cursor is the correct, established outcome, not a reason to keep re-authoring in the same session.
- **Do not trust `npm --prefix harness test`'s raw output on this host without `FORCE_COLOR=0`.**
- **Do not assume `lore` is on PATH** — check, and fall back to `/Volumes/_repos/lore-cli/dist/lore` if not, rather than skipping sync/check.
