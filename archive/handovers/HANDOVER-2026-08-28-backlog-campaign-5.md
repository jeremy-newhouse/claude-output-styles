# Handover — take COS-4, beginner judge > 70% on Opus and Sonnet (COS-4)

**Date**: 2026-08-28 | **Grounded against**: `dev`/`main` @ `f25d755`, clean apart from an untracked `system-prompt.md` that predates this campaign; both branches pushed and level | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-4 — Campaign 2 item 14, status To Do, dependencies COS-16
and COS-20 both Done. Queue order confirmed by the user on 2026-08-17; do not
re-ask before taking it. READ THE FULL TASK FIRST — its Implementation Plan,
Notes and Final Summary describe a session-9 attempt (AC #1 missed, task
parked) against a beginner file that COS-16 has since rewritten (sha256
86451ddb). Do not resume that old plan or trust its checked AC #2/#3 boxes
without re-verifying against the current file — see "Critical context" below.
Current beginner judge baseline (n=150, COS-16/17): Opus 66.1, Sonnet 60.9,
Haiku 48.2, Fable 65.2 — still under the 70% bar on both Opus and Sonnet.
```

## State

| Item | Status |
| --- | --- |
| COS-19 | **Done.** Merged as PR #32 (rebase), `dev`/`main` both at `f25d755`. AC #1 unchecked (advanced/intermediate x Fable stuck at n=10 after session-limit errors; user-approved follow-up is COS-34); ACs #2-#5 checked. Review caught and fixed a real pseudo-replication bug in the new interval tool before merge. See tracker Resolved row 13 and the task's own final summary. |
| COS-34 | **Opened, appended as queue item 27** (not next — stays behind items 14-26). Raises advanced/intermediate x Fable to COS-19's sample size. Status To Do. |
| Cursor | **COS-4**, Campaign 2 item 14. Status `To Do`, assignee already `@claude` from its original 2026-08-17 attempt. Dependencies COS-16 and COS-20 are both Done. |
| `dev` / `main` | Both `f25d755`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs. |
| Gates as of `f25d755` | 225/225 harness tests, `lore check` exit 0 (24 files). |
| Queue after COS-4 | 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33, 27 COS-34 |
| COS-4's own ACs | #1 (unchecked) beginner judge > 70% on both Opus and Sonnet; #2 (checked, stale — see below) rules >= 92%; #3 (checked, stale — see below) validated on cases held out of every optimizer split |

## Next steps

1. Preflight: `dev`/`main` already level at `f25d755` — verify with `git fetch` rather than assuming. `backlog task view COS-4 --plain` and read the whole thing (description, the full implementation plan, all notes, the final summary) — it is long and almost all of it describes the session-9 attempt. Branch `feature/COS-4` off `dev`.
2. **Do not plan from the old implementation plan.** Re-derive the plan from the current system: read `plain-english-beginner.md` as it ships today (sha256 `86451ddb`, COS-16's three-edit candidate), not the file the session-9 notes describe. Re-check AC #2 and AC #3 against *today's* file before trusting their checked state — COS-19's baseline table shows current beginner rules at 95.8-99.3 across all four models (n=150), which is well over the 92% AC #2 asks, but that figure was never re-verified against AC #2's own specific wording after COS-16 shipped; do not assume the checkbox is still honestly earned without looking.
3. Current judge baseline to design against (COS-19, n=150, 95% CIs are wide — see FINDINGS.md's per-cell table, not narrow ones): Opus 66.1, Sonnet 60.9, Haiku 48.2, Fable 65.2. AC #1 needs Opus and Sonnet both over 70 — Opus is 3.9 points short, Sonnet 9.1.
4. The session-9 attempt's own transferable finding still applies: no sample size moves a point estimate, only a real text change does. Read the "sample-size claim confused precision with score" correction in COS-4's notes before proposing anything that just re-measures.
5. Probe 2 cells before committing any arm (pacing rule, still in force per the tracker's Cursor section). Record wall-clock + non-errored cell count per arm as it lands via `--append-notes`.

## Critical context / traps

- **COS-4's Implementation Plan, Notes, and Final Summary are from 2026-08-17 (session 9) and describe a file COS-16 has since replaced.** AC #2 and AC #3 show checked in Backlog from that attempt. Verify both against the current shipped file before relying on them — do not carry them forward on trust.
- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use **`--append-notes`**. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between the `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates on this doc's size. **Read the file on disk, edit the copy, then pass it to `backlog doc update --content "$(cat file)"`** — do not hand-edit the file in place with a text-editing tool even though the content ends up identical (this session did that twice and had to route both through `doc update` afterward). Check line count before and after every `doc update` call.
- **This project's single-sample interval tool (`interval --rows=`, added by COS-19) is sized on case count, not cell count.** `n` will read 5 (the shared cases) on every arm regardless of repeat count — that is correct, not a bug. If COS-4's work needs to show a real judge-score improvement is real (not noise), use `pairedInterval` (before file vs after file, paired by case) the way COS-1/COS-16/COS-17/COS-18 always have — that is the tool that actually gains precision from more repeats.
- **A properly paired cross-style/cross-arm comparison had never been run for some of this project's oldest claims until COS-19 checked one.** The published "clean split" (which models rank intermediate above advanced) turned out to hold on **no** model once paired by case, including two halves this project had called "confirmed" on arm-mean subtraction alone. If COS-4's own before/after claim only rests on subtracting two arm means, pair it properly before publishing a verdict.
- **Run the harness from `harness/`, with the path in the same command**, and **prefix every backgrounded run with `cd /Volumes/_repos/claude-output-styles/harness &&`** — backgrounded commands do not inherit a prior `cd`.
- **A background arm that "completes" in seconds has not run.** Check `results/<stamp>/run.json` for `"complete": true` and the actual `rows.json` length before scoring anything. Also: launching a long-running command via the harness's own `run_in_background: true` while ALSO backgrounding it with a shell `&` double-backgrounds it — the tool reports "completed" the instant the shell returns, not when the process finishes. This session hit that trap; use `nohup ... & echo PID` directly (not wrapped in `run_in_background: true`), then a separate `run_in_background` polling loop (`until ! ps -p <PID> ...`) to get a real completion notification.
- **`run.json` carries no timestamps.** Wall clock comes from the stamp (UTC) vs `stat -f '%Sm' results/<stamp>/rows.json` (**local time — add 5 hours to compare**).
- Fable needs `--models='claude-fable-5[1m]'`, quoted — but COS-4 does not appear to need a Fable arm; check the task's own AC wording before assuming otherwise.
- The five shared cases are `agentic-read-report`, `conv-explain-cache`, `conv-followup-drift`, `conv-status-auth`, `conv-status-holdout` — confirmed from actual saved rows, not assumed.
- **Fable's session-limit errors are a live, unresolved risk** (COS-34 exists because of them) — if COS-4's plan touches Fable at all, probe extra carefully and be ready to stop rather than re-hit the limit, per the user's 2026-08-28 direction.

## Do not repeat

- **Do not treat `singleSampleInterval`'s wide bands (n=5, case-clustered) as "the interval didn't improve, so more cells were wasted."** They answer a different, harder question (does this generalize past these 5 cases) than a paired comparison does (did this specific change move the mean) — more repeats genuinely narrow the paired kind, not the single-sample kind. Conflating the two was a real bug this session shipped and then had to fix after `/code-review high` caught it.
- **Do not compare two arms' means directly and call a direction "confirmed" without a paired interval.** This project's own headline "clean split" claim did exactly that for over a week before COS-19 checked it properly and found nothing survives.
- **Do not size an arm from a two-cell probe's wall clock alone** — node startup dominates a short probe.
- **Do not state a non-errored cell count without checking what it excludes.** Always disk-count via `rows.json`, never sum from memory.
- The `/code-review high` skill was used this session and caught a real, would-have-shipped statistical bug (not a style nit) — keep using it on every branch before opening a PR, not just for large measurement sessions.
