# Handover — take COS-17, re-measure beginner on Haiku and Fable (COS-17)

**Date**: 2026-08-26 | **Grounded against**: `dev` @ `a68bcc4`, clean apart from an untracked `system-prompt.md` that predates this session; `main` fast-forwarded to `2dfe318` and pushed, one commit behind `dev` pending this session's own archive commit | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-17 — re-measure beginner on Haiku and Fable after the COS-4
and COS-16 rewrites. Queue order confirmed by the user on 2026-08-17; do not
re-ask. COS-17 costs cells and the sizing figure everyone has been using is
dead: session 28 measured throughput at ~5 cells a minute on its 600-cell arm
and watched it degrade to ~0.7 before it stopped a reserve arm outright.
Session 27's 31 cells a minute was measured on beginner's short replies and is
not a planning number for anything else. Size in hours. The user has flagged
usage limits twice; probe with 2 cells before committing 300.
```

## State

| Item | Status |
| --- | --- |
| COS-18 | **Done**, merged as PR #26 (rebase), `dev` and `main` both pushed. All five ACs checked. |
| Style files | **Unchanged.** `plain-english-intermediate.md` still sha256 `bd326da7`; COS-18 shipped its diagnosis, not its fix |
| Cursor | COS-17 (Campaign 2 item 11) |
| Queue remaining | 11 COS-17, 12 COS-21, 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| Branches / PRs | No `feature/*` branches, no open PRs |
| Gates as of `a68bcc4` | 219/219 harness tests, `audit` exit 0, `lore check` exit 0 (24 files) |
| Opened this session | **COS-30** (`interval` pools styles), **COS-31** (the router both files carry), **COS-32** (intermediate's D2/D4), **COS-33** (ship COS-18's measured E1) |

## Next steps

1. Preflight, branch `feature/COS-17` off `dev`.
2. Read COS-17's ACs before sizing anything. It re-measures **beginner** on Haiku and Fable against the current shipped text (sha256 `86451ddb`, the COS-16 three-edit candidate), so the comparison targets are `2026-08-20T03-03-26` (shared five) and `03-13-05` (reserve six).
3. **Size in hours, not minutes.** See the traps below. A Haiku+Fable arm on the shared five at 30 repeats is 300 cells; at session 28's rates that is anywhere from 1 to 7 hours.
4. Haiku aborts on turn limits — `22-59-53` lost 6 of 78 cells and `01-33-41` aborted 3 of 6 on `reserve-agentic-session`. Expect errored cells on Haiku and size against cells that *answer*.

## Critical context / traps

- **Throughput is not 31 cells a minute.** Session 28 measured ~5/min on 600 cells of intermediate and advanced, and ~0.7/min on a reserve arm before stopping it. The judge call, not the cell, is the bottleneck, and `reserve-agentic-session` costs ~45s a cell before its judge call. Measure your own early enough to abandon cheaply.
- **Two different usage ceilings exist and they behave differently.** Session 27 hit the 5-hour window. Session 28 hit the **monthly spend limit**, which took 163 of 300 cells and all 150 Sonnet cells in one arm and did not clear by waiting hours. It had cleared six days later. **Probe with 2 cells before committing 300** — session 28 did (`2026-08-26T13-20-50`) and it cost nothing.
- **`interval` silently pools styles.** It pairs on `caseId|model` and ignores `styleId` (`harness/src/interval.mjs:33`). A `run --styles=a,b` rows file passed as `--before` averages both styles into every pair and raises no error. On COS-18's own comparison it reported "the edit did nothing" (rules +1.4 [−0.3, +3.0]) where the filtered figures are +3.0 [+0.1, +5.8]. **Filter the before file to one style.** That is COS-30, unfixed.
- **"The five shared cases" is a convention nothing records.** It is `conv-status-auth`, `conv-status-holdout`, `conv-explain-cache`, `conv-followup-drift`, `agentic-read-report` — 22 of the 24 five-case runs on disk. It is **not** the train split, which differs in two of five. Session 28 lost 125 cells to that assumption.
- **Do not quote a figure produced by a script you cannot re-run.** Session 28 published two figures that had to be withdrawn — an "update cap" share and an over-length share — both from a classifier that was lost with `/private/tmp` before anyone re-derived from it. The second one did not even reproduce. Re-derive from saved rows, and write the derivation down.
- **Do not write a cell count you have not counted.** Session 28's own tally put six runs at five and 1468 rows at 1166, and briefly wrote a wrong project total into the ledger.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase` rewrites every SHA baked into `docs/log.md`.
- **Check exit codes unpiped.** `lore check --plain | tail` reports `tail`'s status. Session 28 briefly read exit 0 from a `lore check` that was actually exit 6.

## Do not repeat

- Do not re-run COS-18's arms. `2026-08-20T12-12-10` (600 cells) and `2026-08-20T12-30-35` (300 cells) are complete, 0 errored, and their figures are in the ledger and the task.
- Do not re-run E1's shared-five arm when taking COS-33. It is done. Only the reserve pair is outstanding there, and it is roughly four hours a side.
- Do not re-derive COS-18's verdict by reading the style files. The arm overturned the reading twice — on which file looks worse for over-length, and on which contradiction bites harder.
- Do not restore E1 onto a branch without finishing its reserve validation. It was reverted deliberately; the reserve split is where two earlier candidate rewrites failed after passing everything else.
- The `/code-review` agent did not return within ~30 minutes on this session's diff. Self-review was used as the gate and found two real defects. If it stalls again, do not block on it indefinitely — review the diff yourself and say so.
