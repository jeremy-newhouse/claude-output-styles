# Handover — finish COS-21 leg 3, then the analysis session (COS-21)

**Date**: 2026-08-28 | **Grounded against**: `dev` @ `db8605e`, clean apart from an untracked `system-prompt.md` that predates this session; `main` fast-forwarded to `db8605e` and pushed, level with `dev` | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-21 — STILL IN PROGRESS, do not treat it as a fresh take.
Legs 1 and 2 are complete (beginner x Opus, beginner x Haiku). Leg 3
(advanced x Opus, the ADR's own cell) has 3 of 5 arms: baseline, long-prompt,
tail-reminder. Only `claude-md` and `all-fixes` remain, ~19 minutes each —
both fit one session with room to start the analysis. `claude-md` carries the
ADR's largest claim (a 9.4-point restatement gap), so run it FIRST. The grid
and the argument for it are in the task's plan — do not re-derive them.
Queue order confirmed by the user on 2026-08-17; the pacing rule (25% of any
5-hour window) on 2026-08-27. Budget ~75 minutes of cell running, probe two
cells first, run one variant at a time, stop at a variant boundary.
```

## State

| Item | Status |
| --- | --- |
| COS-21 | **In Progress.** Leg 1 merged as PR #28, leg 2 across PRs #29 and #30, leg 3's first three arms in PR #30 |
| `dev` / `main` | `dev` and `main` both @ `db8605e`, both pushed and level. **No promotion needed at preflight this time** |
| Leg 1 (beginner x Opus) | 5 arms, 750 cells, 0 errored. baseline 83.07; long-prompt 81.84, claude-md 81.36, tail-reminder 81.00, all-fixes 80.24. Only **all-fixes** clears zero: composite −2.8 [−5.2, −0.5], judge −4.7 [−9.1, −0.4]. Other three are nulls |
| Leg 2 (beginner x Haiku) | **Complete.** 5 arms, 750 attempted / **748 non-errored / 2 errored**. baseline 68.69; long-prompt 73.73, all-fixes 72.77, tail-reminder 71.83, claude-md 70.70 |
| Leg 2 intervals | long-prompt **+5.2 [+2.1, +8.2]** composite / **+9.7 [+3.9, +15.6]** judge; all-fixes **+4.1 [+1.9, +6.3]** / **+6.9 [+2.6, +11.2]**; tail-reminder **+3.3 [+1.1, +5.4]** / **+6.0 [+1.7, +10.3]** — all three clear zero **upward**. claude-md is a score null (+2.0 [−1.6, +5.6]) that cuts words **−15.9 [−22.4, −9.3]** |
| Leg 3 (advanced x Opus) | **3 of 5 arms.** baseline `2026-08-28T00-49-16-410Z` composite 88.40 (rules 98.34, judge 65.22, 109.7 words); long-prompt `01-08-39` 87.67; tail-reminder `01-27-19` 87.69 |
| Leg 3 intervals | **Both reinforcement arms are nulls.** long-prompt −0.7 [−2.6, +1.1] composite, −2.2 [−7.3, +2.9] judge; tail-reminder −0.7 [−3.1, +1.7], −2.3 [−9.2, +4.6]. Rules and words flat on both |
| Work remaining | **leg 3 `claude-md` and `all-fixes` (~19 min each)**, then the analysis session: intervals for all four leg-3 variants, then confirm / narrow / withdraw each ADR claim and re-state FINDINGS.md |
| ADR / FINDINGS.md | **Untouched, deliberately.** The ADR's headline 9.4-point claude-md gap has not been measured yet |
| AC #5 | Amended with the user's approval to wall-clock + cell counts. **ACs #1–#5 all unchecked** |
| Cursor | **Still COS-21.** Not advanced — the issue is not done |
| Queue after COS-21 | 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| Branches / PRs | No `feature/*` branches, no open PRs. PR #30 merged by rebase |
| Gates as of `db8605e` | 219/219 harness tests, `lore check` exit 0 (24 files) |
| Usage | No ceiling hit. 68m47s of cell running, **600 of 600 cells clean** — the campaign's cleanest session |

## Next steps

1. Preflight. `main` and `dev` are already level at `db8605e` — verify that with `git fetch` rather than assuming it, then branch `feature/COS-21` off `dev`. The task stays In Progress; do not re-plan it.
2. **Probe 2 cells.** `cd /Volumes/_repos/claude-output-styles/harness && node src/cli.mjs run --styles=plain-english-advanced --models=opus --variants=baseline --cases=conv-status-auth --repeats=2 --concurrency=2`. Twelve seconds, and it has now paid off six sessions running.
3. **Run `claude-md` first** — it carries the ADR's largest claim: `node src/cli.mjs run --styles=plain-english-advanced --models=opus --variants=claude-md --repeats=10 --concurrency=4`. ~19 minutes.
4. **Then `all-fixes`**, same shape. That completes leg 3 and the whole 2250-cell grid at ~38 minutes, well inside the 75-minute budget.
5. After each arm: `node /private/tmp/.../scratchpad/arm.mjs <stamp>` (a copy is at `/tmp/arm.mjs`) then four `interval` calls against the leg 3 baseline `results/2026-08-28T00-49-16-410Z/rows.json`, one per metric.
6. Record each arm in the task **as it lands**, with `--append-notes`. Do not batch to the end.
7. **With budget left after both arms, start the analysis.** Every ADR claim gets confirmed, narrowed or withdrawn against a leg-3 interval (AC #3), then the ADR is updated or superseded and FINDINGS.md's "delete CLAUDE.md tone rules" recommendation is re-stated to match (AC #4). Only then can any AC be checked.

## Critical context / traps

- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use **`--append-notes`**. Same trap on `--plan` and `--final-summary`. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between the `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`.** Session 31 did and got 294 lines of a 1669-line document back with no error. **Read the file on disk instead** and pass the edited body to `backlog doc update --content`. Reading the file is fine; only *editing* it directly is forbidden. **Always check the line count before and after a `doc update`** — session 32 tracked 1680 → 1703 → 1703 and confirmed no truncation.
- **Run the harness from `harness/`, with the path in the same command.** Backgrounded commands do NOT inherit a prior `cd` — the tool says so explicitly. **Prefix every backgrounded run with `cd /Volumes/_repos/claude-output-styles/harness &&`.** Session 32 got away with an unprefixed run only because the foreground shell happened to still be there.
- **A background arm that "completes" in seconds has not run.** Check the tail of its output file for the `wrote results/<stamp>` line before scoring anything. Session 32 checked each arm ~20s after launch and confirmed the `cells: ... = 150` header.
- **`run.json` carries no timestamps** — its keys are `kind, stamp, complete, completed, expected`. Wall clock comes from the stamp (UTC) vs `stat -f '%Sm' results/<stamp>/rows.json` (**local time — add 5 hours to compare**).
- **`harness/results/` is gitignored.** Evidence lives in the task notes and the tracker, never in the diff.
- **`interval` ignores both `styleId` and `variantId`** (`harness/src/interval.mjs:33`, COS-30, still unfixed and queued at item 23). One style, one model, one variant per `rows.json`.
- **Omitting `--variants` runs all five.** Name it every time.
- **Check exit codes unpiped.** Redirect to a file, then read `$?`. Session 32 did this for both `lore sync` and `lore check`.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase` rewrites every SHA baked into `docs/log.md`. It changed `docs/log.md` this session and `lore check` exited 0 across 24 files.
- **Archive name collisions are now live.** `archive/handovers/` holds both `HANDOVER-2026-08-28-backlog-campaign.md` and `-2`. A third same-day handover needs `-3`.
- The five shared cases are a convention nothing records, but **COS-21 does not use them**: every leg runs all 15 cases at 10 repeats.
- Fable needs `--models='claude-fable-5[1m]'`, quoted. Not needed for leg 3.

## Do not repeat

- **Do not re-run legs 1 or 2, or leg 3's first three arms.** Leg 1: `14-45-48`, `15-00-47`, `21-10-56`, `21-25-00`, `21-40-04`, all 2026-08-27, 150 cells, 0 errored. `15-15-54` is a lost tail-reminder arm — 121 errored, superseded, no figure uses it. Leg 2: `22-24-10` (150/0), `22-41-46` (149/1), `22-59-12` (149/1), `23-15-05` (150/0) on 2026-08-27, and `2026-08-28T00-33-04-943Z` (150/0). Leg 3: `2026-08-28T00-49-16-410Z`, `01-08-39-105Z`, `01-27-19-042Z`, all 150/0.
- **Do not touch the ADR or FINDINGS.md until `claude-md` and `all-fixes` are measured.** Two leg-3 nulls do not settle a document whose headline number is the unmeasured arm.
- **Do not write that leg 3's nulls "confirm" the ADR.** They do the opposite for the one claim tested: the ADR asserts 4.5 points for long-prompt off five cells and the measured effect is −0.7 [−2.6, +1.1]. The direction survives; the size does not. Say that precisely.
- **Do not write that reinforcement "costs" a complying model.** Session 30's self-review caught exactly that overclaim. Nulls are not measured costs.
- **Do not read leg 2's positives as evidence about advanced.** They are beginner x Haiku.
- **Do not size an arm from a two-cell probe's wall clock.** Node startup dominates. The plan's ~5 cells/min for advanced was also wrong — measured at **7.9/min** across three arms.
- **Do not state a non-errored cell count without checking what it excludes.** Leg 2 is 750 attempted / 748 non-errored / 2 errored.
- The `/code-review` agent is not used in this session's configuration; sessions 30, 31 and 32 each self-reviewed the branch diff and each found one real defect that way. Session 32's was a stale "leg 2, 4 of 5 arms" label in the tracker contradicting the cursor section two paragraphs above it. Say plainly that is what you did.
