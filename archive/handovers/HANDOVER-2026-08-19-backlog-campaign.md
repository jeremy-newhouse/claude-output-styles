# Handover — take COS-18, the first of Campaign 2's four measurement items (COS-18)

**Date**: 2026-08-19 | **Grounded against**: `dev` @ `f9e162d`, clean apart from an untracked `system-prompt.md` that predates this session, in sync with `origin/dev`; `main` fast-forwarded to the same SHA and pushed | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-18 — do intermediate and advanced carry the four structural
defects COS-4 found in beginner? Nobody has looked. Queue order confirmed by the
user on 2026-08-17; do not re-ask. COS-18 costs cells: its AC #2 cannot be met by
reading the files, it needs judge violations from a real arm, and AC #3/#5 need
146+ cells a model per style changed. Session 27 measured 31 cells a minute at
concurrency 12 with zero errored cells in 600 — size against 31, not against
session 20's older 26.5 estimate. The usage window is open; the stand-down that
held this campaign through 2026-08-18 is over.
```

## State

| Item | Status |
| --- | --- |
| COS-16 | **Done**, merged as PR #25, rebase-merged to `dev`, promoted to `main`. All six ACs checked. |
| Shipped style text | `plain-english-beginner.md` is now the three-edit candidate, sha256 `86451ddb16b273426eca5318d20169b6bfa1b0f6dd304872c3b9625da7a167c3` |
| Cursor | COS-18 (Campaign 2 item 10) |
| Queue remaining | 10 COS-18, 11 COS-17, 12 COS-21, 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29 |
| Branches / PRs | No `feature/*` branches, no open PRs |
| Gates as of `f9e162d` | `audit` exit 0, 219/219 harness tests, `lore check` exit 0 (24 files) |
| Opened this session | **COS-29** — E3's precedence sentence has a dangling antecedent; queue item 22 |

## Next steps

1. Preflight, branch `feature/COS-18` off `dev`.
2. Read all three style files against the four defect patterns in COS-18's description, quoting file and line for every instance (AC #1). Advanced is the likely negative control — it states its cap as a universal at the end of the file.
3. **AC #2 needs an arm, not a reading.** It asks which patterns each file carries "supported by judge violations from a real arm rather than by reading alone". Plan the arm before authoring anything: the shared five, intermediate and advanced, opus+sonnet, 30 repeats is 600 cells per style, ~20 minutes each at 31 cells/min.
4. Only then decide whether either file needs a text change. If one does, AC #3 measures it at 146+ cells a model against the *current* text, and AC #5 adds a reserve arm.
5. A file found clean is a result and gets recorded as one (AC #4) — do not leave it unmentioned.

## Critical context / traps

- **`19-42-55` and `19-53-49` no longer measure the shipped beginner file.** They measure COS-4's pass-1 text. Session 27 corrected five documents and the ledger for exactly this; do not re-introduce "the shipped text" phrasing when citing them. The current beginner baseline is `2026-08-20T03-03-26` (shared five) and `03-13-05` (reserve six).
- **Measure each edit alone, never a bundle.** COS-16 found an Opus reply-length regression of +1.71 [+0.27, +3.16] in a four-edit bundle that none of its four edits showed by itself; dropping the one edit that *added* a rule removed it. COS-1 and COS-4 both failed by adopting bundles they could not decompose, and in every case the culprit added a rule rather than removing or bounding one.
- **Do not round twice.** Session 27's review caught an Opus judge figure published as 66.2 for a true 66.1, propagated to eight documents, because a 2-dp intermediate was rounded again to 1 dp. Take figures from `node src/cli.mjs score` output, which rounds once.
- **Do not write a cell count you have not counted.** The same review caught two invented figures in the tracker (3000 cells / 1244 lost, for a counted 4500 / 1183). Every number in a doc, commit or task must come from a run in the session or a cited stamp.
- **Check exit codes unpiped.** `node src/cli.mjs audit | tail` reports the pipe's status, not the audit's. Session 27 briefly recorded a masked exit code before catching it.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase` rewrites every SHA the branch baked into `docs/log.md`.
- Nothing about the beginner file may change without an arm. That is why COS-29 exists instead of a one-line edit.

## Do not repeat

- Do not re-run the beginner baselines `19-42-55` or `19-53-49`. They are complete at 150 cells a model with zero errors and COS-16 already compared against them.
- Do not re-author COS-16's candidate. It is merged.
- Do not try to satisfy COS-18's AC #2 by reading the files. The criterion explicitly rules that out; a reading-only pass will have to be redone.
- Sessions 20 and 26 both lost arms to Claude Code's 5-hour usage window (1127 cells, then 56). Session 27 lost none across 600. If cells start returning usage-limit errors mid-arm, stop and park rather than burning the rest of the arm — the rows are kept, not erased, but a partial arm is not comparable to a full one.
