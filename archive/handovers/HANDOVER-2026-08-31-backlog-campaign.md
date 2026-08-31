# Handover — take COS-29, fix the dangling antecedent COS-16's router precedence sentence introduced (COS-29)

**Date**: 2026-08-31 | **Grounded against**: `dev`/`main` @ `fe88e73`, clean, both remotes level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-29 — Campaign 2 item 22, status To Do, no dependencies, no
assignee. Queue order confirmed by the user on 2026-08-17; do not re-ask
before taking it. It needs one real 300-cell arm (150/model) on beginner's
five shared cases against baseline 2026-08-20T03-03-26 — read the task's own
Description and ACs (especially AC #4's checksum requirement) before
authoring anything.
```

## State

| Item | Status |
| --- | --- |
| COS-28 | **Resolved this session (37).** Advanced's word-cap prose claimed code counted toward the 120-word cap; `total_length` excludes it. Fixed the prose, extended `contract-audit.mjs` with a basis check (caught and fixed two real gaps in `/code-review high`), paired 22-cell confirmatory arm found no regression. See tracker Campaign 2 Resolved row 14 and the session-37 log entry for full evidence. |
| Cursor | **COS-29**, Campaign 2 item 22. Status `To Do`, no dependencies, no assignee. |
| `dev` / `main` | Both `fe88e73`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs (verify with `gh pr list` regardless). |
| Gates as of `fe88e73` | 231/231 harness tests (**`FORCE_COLOR=0` required on this host** — see trap below), `audit` exit 0, `lore check` 24 files 0 errors/warnings. |
| Queue after COS-29 | 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33, 27 COS-34 |

## Next steps

1. Preflight: `dev`/`main` already level at `fe88e73` — verify with `git fetch` rather than assuming.
2. `backlog task view COS-29 --plain` and read the whole thing. Branch `feature/COS-29` off `dev`.
3. The fix is one of two one-line edits to `plain-english-beginner.md`: make the precedence sentence's referent explicit ("When two of the shapes above match…") or move it directly under the router's four bullets, above the "shape changes / size never does" line. Pick one, argue why if it matters.
4. **Do not ship it unmeasured.** Run one arm on the five shared cases (150 cells/model, 300 total) against baseline `2026-08-20T03-03-26`. AC #3's bar: rules at or above 99.16/97.38, mean reply length not above 62.87/58.69 words — the figures COS-16 shipped. AC #4: `node src/cli.mjs audit` exit 0 and the shipped file byte-identical (sha256) to the measured text — do not touch the file again after the arm that validates it.
5. **Bundling note from the task**: if another beginner-style edit is queued when you take this, measure them as separate arms, not one bundle — COS-16 found an Opus regression in a four-edit bundle none of the four edits showed alone.
6. `FORCE_COLOR=0 npm --prefix harness test` — see trap below, do not trust raw output on this host.

## Critical context / traps

- **`FORCE_COLOR=0` is required for `npm --prefix harness test` on this host.** This shell exports `FORCE_COLOR=3`; `harness/test/fixture.test.mjs`'s `cleanEnv()` doesn't strip it, so Node's spec reporter wraps summary lines in ANSI codes the fixture's `^ℹ` regex can't parse, and 3 of 231 tests report false failures (`NaN` parsed from the colored line). Not fixed — out of scope for content tasks. Always run tests as `FORCE_COLOR=0 npm --prefix harness test`.
- **`lore` was not on PATH this session either.** Use `/Volumes/_repos/lore-cli/dist/lore` directly. Confirm it's still needed at the start of the next session.
- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use `--append-notes`. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates. Read/edit `backlog/docs/doc-1 - Backlog-campaign-tracker.md` on disk directly, then push with `backlog doc update doc-1 --content "$(cat file)"`. Check line count before and after every update — this session's edit tool once truncated a table row mid-edit (recovered immediately by restoring the exact original text before appending); re-read the row after any edit near an existing one.
- **Cost is not a constraint in this project** — it runs on a Claude subscription. Arms are sized by statistical power alone.
- **Always probe 2 cells before committing any arm.**
- **A background arm that "completes" in seconds has not run.** Check `results/<stamp>/run.json` for `"complete": true` and the actual row count in `rows.json`.
- **A "changed on disk since you last read it" note during a `/code-review` pass is very likely the review subagent's own file activity (it may check out the branch to test functions directly), not a second live session.** This session got that warning twice mid-review and the review's own closing note claimed "another live session appears to be actively committing COS-28 work" — a full ground-truth re-check (git log on both branches, `git status`, branch list) found no divergence and no duplicate branch: it was this session's own subagent. Still worth a `ListAgents` + `git log`/`git status` check before trusting either claim, per the standing rule below, but don't assume a collision without verifying first.
- **A `/code-review high` pass can find real, fixable issues even on a small change.** COS-28 was a one-line prose fix plus ~40 lines of new audit code; the review still found two genuine gaps (too-narrow regex list, duplicated scaffolding) worth fixing before merge. Budget time for a real review-and-fix loop, not just a pass/fail gate.
- **Raised but not fixed, needs a future task or at least awareness**: `harness/src/contract-audit.mjs`'s `capSegments` splits cap sentences on a bare newline. A style file that hard-wraps mid-sentence inside a cap statement (its own or a lifted-condition one) would silently defeat both COS-28's new basis check and the pre-existing `ON_REQUEST` condition check. No shipped file wraps that way today; this is a latent shared-code risk, not a COS-28 defect, and was not opened as a task (no user approval sought this session — raise it if convenient, don't silently fix it without measuring the blast radius on `ON_REQUEST` too).
- **This project's repeated finding on hard style-judge tasks stands**: additions to a style file test null or negative far more often than they help. A worked example (not another rule) is the one lever that's worked when it has (COS-4 pass 1, COS-16). COS-29 is a one-line disambiguation, not new content — closer to COS-28's shape than to a hard judge-bar task, but still needs its arm per AC #2.

## Do not repeat

- **Do not trust `npm --prefix harness test`'s raw output on this host without `FORCE_COLOR=0`.**
- **Do not assume `lore` is on PATH** — check, and fall back to `/Volumes/_repos/lore-cli/dist/lore` if not.
- **Do not treat a "file changed on disk" note as proof of a concurrent session without checking `git log`/`git status` first** — this session nearly escalated on exactly that, and it was a false alarm from its own review subagent.
- **Do not let an Edit tool call with a truncated `old_string` silently corrupt an existing table row** — verify the full line after any edit that targets only the start of a long line, especially in the tracker's wide markdown tables.
