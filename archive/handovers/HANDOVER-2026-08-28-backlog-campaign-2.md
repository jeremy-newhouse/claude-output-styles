# Handover — continue COS-21: finish leg 2, start leg 3 (COS-21)

**Date**: 2026-08-28 | **Grounded against**: `dev` @ `b87dfc5`, clean apart from an untracked `system-prompt.md` that predates this session; `main` at `8c72838` and pushed (the archive commit `b87dfc5` is newer and still needs promoting) | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-21 — STILL IN PROGRESS, do not treat it as a fresh take.
Leg 1 (beginner x Opus) is complete and merged as PR #28. Leg 2 (beginner x
Haiku) ran four of five arms and merged as PR #29; only `all-fixes` is left,
about 16 minutes. Then leg 3, advanced x Opus, which is the ADR's own cell.
The grid and the argument for it are in the task's plan — do not re-derive them.
Queue order confirmed by the user on 2026-08-17; the pacing rule (25% of any
5-hour window) on 2026-08-27. Budget ~75 minutes of cell running, probe two
cells first, run one variant at a time, stop at a variant boundary.
```

## State

| Item | Status |
| --- | --- |
| COS-21 | **In Progress.** Leg 1 merged as PR #28; leg 2's first four arms merged as PR #29 (rebase) |
| `dev` / `main` | `dev` @ `b87dfc5`, `main` @ `8c72838`. **Promote `main` first thing** — R5's archive commit landed after the step-9 promotion |
| Leg 1 result | beginner x Opus, 5 arms, 150 cells each, 0 errored. baseline 83.07 composite; long-prompt 81.84, claude-md 81.36, tail-reminder 81.00, all-fixes 80.24 |
| Leg 1 intervals | Only **all-fixes** clears zero: composite −2.8 [−5.2, −0.5], judge −4.7 [−9.1, −0.4]. The other three are nulls |
| Leg 2 result | beginner x Haiku, 4 arms, 600 attempted / **598 non-errored / 2 errored**. baseline 68.69; long-prompt 73.73, tail-reminder 71.83, claude-md 70.70 |
| Leg 2 intervals | long-prompt **+5.2 [+2.1, +8.2]** composite, **+9.7 [+3.9, +15.6]** judge; tail-reminder **+3.3 [+1.1, +5.4]** and **+6.0 [+1.7, +10.3]** — both clear zero **upward**. claude-md is a score null (+2.0 [−1.6, +5.6]) but cuts words **−15.9 [−22.4, −9.3]** |
| Work remaining | **leg 2 arm 5 (`all-fixes`, beginner x Haiku, ~16 min)**, then **leg 3 (advanced x Opus, 5 arms)**, then the analysis session |
| ADR / FINDINGS.md | **Untouched, deliberately.** Nothing is confirmed, narrowed or withdrawn until leg 3 runs |
| AC #5 | **Amended** with the user's approval to wall-clock + cell counts. ACs #1–#4 unchanged and unchecked |
| Cursor | **Still COS-21.** Not advanced — the issue is not done |
| Queue after COS-21 | 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| Branches / PRs | No `feature/*` branches, no open PRs |
| Gates as of `b87dfc5` | 219/219 harness tests, `lore check` exit 0 (24 files) |
| Usage | No ceiling hit this session. 65m40s of cell running, 598 of 600 cells clean |

## Next steps

1. Preflight. **`git checkout main && git merge dev --ff-only && git push origin main && git checkout dev`** before anything else — `main` is one commit behind. Then branch `feature/COS-21` off `dev`. The task stays In Progress; do not re-plan it.
2. **Probe 2 cells.** `node src/cli.mjs run --styles=plain-english-beginner --models=haiku --variants=baseline --cases=conv-status-auth --repeats=2 --concurrency=2`. Twelve seconds, and it has now paid off five sessions running.
3. **Finish leg 2**: `node src/cli.mjs run --styles=plain-english-beginner --models=haiku --variants=all-fixes --repeats=10 --concurrency=4`. ~16 minutes. Then four `interval` calls against leg 2's baseline arm `results/2026-08-27T22-24-10-642Z/rows.json`.
4. **Start leg 3**: same command shape with `--styles=plain-english-advanced --models=opus`. Advanced runs far slower than beginner — session 28 measured ~5 cells a minute and reserve arms much worse. **Measure the first arm's real rate before sizing the rest**; at 5/min one arm is 30 minutes and only two fit a session.
5. After each arm: `node /tmp/arm.mjs <stamp>` (also copied to this session's scratchpad) or re-derive from `rows.json` — fields are `rulesScore`, `judgeScore`, `total`, words counted off `text`.
6. Record each arm in the task **as it lands**, with `--append-notes`. Do not batch to the end.
7. Stop at ~75 minutes of cell running, at a variant boundary.

## Critical context / traps

- **`backlog task edit --notes` REPLACES the notes; it does not append.** It wiped session 30's seven sections on this session's first write and printed only `Updated task COS-21`. Use **`--append-notes`**. Same trap on `--plan` and `--final-summary`. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between the `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`.** This session did, and one dump came back **294 lines of a 1669-line document** with no error; writing it back truncated the tracker to 302 lines. Recovered from `git show HEAD:`. **Read the file on disk instead** — `sed -n '/^# Backlog campaign tracker/,$p' "backlog/docs/doc-1 - Backlog-campaign-tracker.md"` — edit that, and pass it to `backlog doc update --content`. Reading the file is fine; only *editing* it directly is forbidden. **Always check the line count after a `doc update`.**
- **Run the harness from `harness/`, with the path in the same command.** A `backlog ...` earlier in the session left the shell at the repo root, and the next backgrounded `node src/cli.mjs run` died on `MODULE_NOT_FOUND` in under a second. It cost no cells but it looked like a completed arm in the notification. **Prefix every run with `cd /Volumes/_repos/claude-output-styles/harness &&`.**
- **A background arm that "completes" in seconds has not run.** Check the tail of its output file for the `wrote results/<stamp>` line before scoring anything.
- **`harness/results/` is gitignored.** Evidence lives in the task notes and the tracker, never in the diff. Do not try to commit a results directory.
- **`interval` ignores both `styleId` and `variantId`** (`harness/src/interval.mjs:33`, COS-30, still unfixed and queued at item 23). Give every arm its own run directory — one style, one model, one variant per `rows.json`. Never run several variants into one directory and pass the whole file to `interval`.
- **Omitting `--variants` runs all five.** Name it every time.
- **Check exit codes unpiped.** `lore check --plain | tail` reports `tail`'s status. Redirect to a file, then read `$?`.
- `lore sync` auto-commits `backlog/` changes as `chore(backlog): sync task changes`. Extra commits on the branch are fine.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase` rewrites every SHA baked into `docs/log.md`.
- The ledger total was 7900 rows in 97 directories / 7826 net of improve-loop cells at session 30, with a 12-cell gap left open. This session added 6 directories (1 probe + 4 arms + 1 dead 2-cell probe run). **Re-derive rather than adding** — classify each directory by whether it carries `run.json`, `improve.json`, both, or neither; a directory with an `improve.json` and no `run.json` is an improve-loop directory, not a pre-manifest one.
- The five shared cases are a convention nothing records, but **COS-21 does not use them**: every leg runs all 15 cases at 10 repeats. Do not filter to five.
- Fable needs `--models='claude-fable-5[1m]'`, quoted. Not needed for legs 2 or 3.

## Do not repeat

- **Do not re-run leg 1 or leg 2's first four arms.** Leg 1: `14-45-48` (baseline), `15-00-47` (long-prompt), `21-10-56` (tail-reminder), `21-25-00` (claude-md), `21-40-04` (all-fixes), all 2026-08-27, 150 cells, 0 errored. `15-15-54` is a lost tail-reminder arm — 121 errored, superseded, no figure uses it. Leg 2: `22-24-10` (baseline, 150/0), `22-41-46` (long-prompt, 149/1), `22-59-12` (tail-reminder, 149/1), `23-15-05` (claude-md, 150/0).
- **Do not touch the ADR or FINDINGS.md until leg 3 is measured.** Two legs now point in opposite directions on beginner. Neither is the ADR's cell. Leg 3 is.
- **Do not write that reinforcement "costs" a complying model.** This session's self-review caught exactly that overclaim and fixed it in `167085e`. Three of leg 1's four variants were **nulls** — only `all-fixes` cleared zero. Three nulls are not three measured costs.
- **Do not read leg 2's positives as evidence about advanced.** They are beginner x Haiku. The ADR was measured on advanced x Opus.
- **Do not size an arm from a two-cell probe's wall clock.** Node startup dominates a two-cell run. Session 30's probe read ~30s a cell against an arm that ran at 13.3s.
- **Do not state a non-errored cell count without checking what it excludes.** Leg 2 is 600 attempted / 598 non-errored / 2 errored.
- The `/code-review` agent is not used in this session's configuration; sessions 30 and 31 both self-reviewed the diff and each found one real defect that way. Say plainly that is what you did.
