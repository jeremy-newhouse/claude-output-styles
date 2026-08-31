# Handover — take COS-30, guard interval against a multi-style rows.json (COS-30)

**Date**: 2026-08-31 | **Grounded against**: `dev`/`main` @ `a375f76`, clean, both remotes level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-30 — Campaign 2 item 23, status To Do, no dependencies, no
assignee. Queue order confirmed by the user on 2026-08-17; do not re-ask
before taking it. It runs no cells — a pure code fix plus a regression test
in harness/src/interval.mjs, verified against COS-18's own saved rows. Read
the task's own Description and ACs before authoring anything.
```

## State

| Item | Status |
| --- | --- |
| COS-29 | **Resolved this session (38).** Moved the router's dangling precedence sentence under its four bullets (pure reorder, zero words changed). 300-cell arm vs baseline `2026-08-20T03-03-26`: paired interval showed no significant rules or word-length regression. `/code-review high` found two findings — a stale COS-31 cross-reference and an AC #3 checkoff not reconciled against its literal wording — both fixed pre-merge. See tracker Queue row 22 and the session-38 log entry. |
| Cursor | **COS-30**, Campaign 2 item 23. Status `To Do`, no dependencies, no assignee. |
| `dev` / `main` | Both `a375f76`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs (verify with `gh pr list` regardless). |
| Gates as of `a375f76` | 231/231 harness tests (**`FORCE_COLOR=0` required on this host** — see trap below), `audit` exit 0, `lore check` 24 files 0 errors/warnings. |
| Queue after COS-30 | 24 COS-31, 25 COS-32, 26 COS-33, 27 COS-34 |

## Next steps

1. Preflight: `dev`/`main` already level at `a375f76` — verify with `git fetch` rather than assuming.
2. `backlog task view COS-30 --plain` and read the whole thing. Branch `feature/COS-30` off `dev`.
3. The fix: `pairedInterval` in `harness/src/interval.mjs` keys pairs on `caseId|model` (`defaultKey`, line ~33) with no styleId check. Add a guard that throws when either side's rows span more than one distinct `styleId`, naming the styles found, and telling the caller to filter (AC #1, #2) — the same class of guard the function already applies to mismatched key sets (`interval.mjs:59-62`).
4. Add a `harness/test/checks.test.mjs` case covering a multi-style before file and a multi-style after file separately (AC #3). Confirm existing single-style interval cases still pass unchanged (AC #4).
5. **Reproduce COS-18's own published numbers as the real-world check (AC #5)**: filtering the before file to one style should still reproduce `rules +3.0 [+0.1, +5.8]`, `words -24.6 [-46.4, -2.8]` — the task description names the exact run stamps and both the wrong (unfiltered) and right (filtered) figures.
6. This task runs no cells — no arm, no probing, pure code + test. `FORCE_COLOR=0 npm --prefix harness test` for the full suite.
7. **Read COS-31 before taking it next** — its task description was just corrected this session to point at COS-29's *resolved* placement rather than the bug; nothing else in the queue references COS-30's fix, so no other cross-reference is stale from this session's work.

## Critical context / traps

- **`FORCE_COLOR=0` is required for `npm --prefix harness test` on this host.** This shell exports `FORCE_COLOR=3`; `harness/test/fixture.test.mjs`'s `cleanEnv()` doesn't strip it, so Node's spec reporter wraps summary lines in ANSI codes the fixture's `^ℹ` regex can't parse, and 3 of 231 tests report false failures (`NaN` parsed from the colored line). Not fixed — out of scope for content tasks. Always run tests as `FORCE_COLOR=0 npm --prefix harness test`.
- **`lore` was not on PATH this session either.** Use `/Volumes/_repos/lore-cli/dist/lore` directly. Confirm it's still needed at the start of the next session.
- **`backlog task edit --description` REPLACES the whole description**, same trap as `--notes`/`--append-notes`. There is no append-description flag — to edit one paragraph, read the full description via `--plain`, reconstruct it verbatim except the target paragraph, and pass the whole thing back. Verify with a second `--plain` read after.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates. Read/edit `backlog/docs/doc-1 - Backlog-campaign-tracker.md` on disk directly, then push with `backlog doc update doc-1 --content "$(cat file)"`. Check line count before and after every update.
- **This tracker doc is now ~1900 lines with very long single-line table cells** — the `Read` tool can fail with a token-limit error even on a small `limit` because of line length, not line count. Use `sed -n 'START,ENDp'` via Bash instead when you need to inspect a specific region, and `grep -n` to locate section headers first.
- **Cost is not a constraint in this project** — it runs on a Claude subscription. Arms are sized by statistical power alone. COS-30 itself runs no cells, but this still applies to any future arm.
- **Always probe 2 cells before committing any arm** (not applicable to COS-30 itself, but the standing rule for the queue items after it — COS-31 in particular costs a 300-cell arm per style plus reserve).
- **A raw single-arm mean landing on the wrong side of a stated AC bar is not automatically a regression.** COS-29 hit exactly this: raw rules/words missed the stated figures on both models, but the paired-interval test (this project's established gate — see COS-16/19/28 precedent) found no statistically significant difference from baseline. If a future arm's raw means look off, run `interval` before concluding anything, and document the reconciliation explicitly in the task notes rather than silently checking the AC — that transparency gap is exactly what this session's review caught.
- **A `/code-review high` pass can find real, fixable issues even on a small change.** COS-29 was a one-line prose reorder plus tracker/task bookkeeping; the review still found two genuine gaps (a stale cross-reference in a sibling task, an AC checked off without reconciling its literal wording). Budget time for a real review-and-fix loop, not just a pass/fail gate.
- **Raised but not fixed in an earlier session, still needs awareness**: `harness/src/contract-audit.mjs`'s `capSegments` splits cap sentences on a bare newline. A style file that hard-wraps mid-sentence inside a cap statement would silently defeat the basis check and the pre-existing `ON_REQUEST` condition check. No shipped file wraps that way today; latent risk only.
- **This project's repeated finding on hard style-judge tasks stands**: additions to a style file test null or negative far more often than they help. COS-30 is pure code, not style prose, so this doesn't apply directly — but COS-31/32/33 downstream in the queue are style-text tasks where it does.

## Do not repeat

- **Do not trust `npm --prefix harness test`'s raw output on this host without `FORCE_COLOR=0`.**
- **Do not assume `lore` is on PATH** — check, and fall back to `/Volumes/_repos/lore-cli/dist/lore` if not.
- **Do not use `backlog task edit --description` to append** — it replaces the whole field. Read, reconstruct, verify.
- **Do not check an acceptance criterion whose literal wording the evidence doesn't satisfy without documenting the substitution explicitly** — even when the substitution is the project's established, defensible practice (e.g. paired interval standing in for a literal raw-mean bar), a silent checkoff reads as a bug to the next reviewer. Say so in the task notes.
- **Do not let an Edit tool call with a truncated `old_string` silently corrupt an existing table row** in the tracker — verify the full line after any edit that targets only the start of a long line.
