# Handover — continue COS-21, run leg 2 of 3 (COS-21)

**Date**: 2026-08-28 | **Grounded against**: `dev` @ `6f70183`, clean apart from an untracked `system-prompt.md` that predates this session; `main` fast-forwarded to `6f70183` and pushed, level with `dev` | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-21 — STILL IN PROGRESS, do not treat it as a fresh take.
Session 30 merged leg 1 of 3 as PR #28. Leg 2 is beginner x Haiku, leg 3 is
advanced x Opus; each is five variants x 150 cells (15 cases x 10 repeats).
The grid and the argument for it are in the task's plan — do not re-derive them.
Queue order confirmed by the user on 2026-08-17; the pacing rule (25% of any
5-hour window) on 2026-08-27. Budget ~75 minutes of cell running, probe two
cells first, run one variant at a time, stop at a variant boundary.
```

## State

| Item | Status |
| --- | --- |
| COS-21 | **In Progress.** Leg 1 of 3 done and merged as PR #28 (rebase). `dev` and `main` both at `6f70183` and pushed |
| Leg 1 result | beginner x Opus, 5 variants, 150 non-errored cells each, **0 errored**. baseline 83.07 composite; long-prompt 81.84, claude-md 81.36, tail-reminder 81.00, all-fixes 80.24 |
| Leg 1 intervals | Only **all-fixes** clears zero: composite −2.8 [−5.2, −0.5], judge −4.7 [−9.1, −0.4]. The other three all contain zero |
| Legs remaining | **leg 2 beginner x Haiku**, **leg 3 advanced x Opus** — 750 cells each |
| ADR / FINDINGS.md | **Untouched, deliberately.** Nothing is confirmed, narrowed or withdrawn until leg 3 runs |
| AC #5 | **Amended** with the user's approval to wall-clock + cell counts. ACs #1–#4 unchanged and unchecked |
| Cursor | **Still COS-21.** Not advanced — the issue is not done |
| Queue after COS-21 | 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| Branches / PRs | No `feature/*` branches, no open PRs |
| Gates as of `6f70183` | 219/219 harness tests, `lore check` exit 0 (24 files) |
| Usage | Monthly spend limit **bit at 15:16Z and had cleared by 21:10Z**. Probe before committing anything |

## Next steps

1. Preflight, branch `feature/COS-21` off `dev`. The task stays In Progress — do
   not re-plan it, the plan and the grid argument are already recorded.
2. **Probe 2 cells.** `node src/cli.mjs run --styles=plain-english-beginner
   --models=haiku --variants=baseline --cases=conv-status-auth --repeats=2
   --concurrency=2`. Fifteen seconds, and it has now paid off four sessions running.
3. Run leg 2 one variant at a time, 150 cells each:
   `node src/cli.mjs run --styles=plain-english-beginner --models=haiku
   --variants=<one of baseline|long-prompt|tail-reminder|claude-md|all-fixes>
   --repeats=10 --concurrency=4`. Expect ~14 minutes an arm.
4. After each arm: `node /tmp/arm.mjs <stamp>` if it survives, else re-derive
   rules/judge/composite/words from `rows.json` (fields are `rulesScore`,
   `judgeScore`, `total`, and words are counted off `text`). Then four
   `interval` calls against that leg's own baseline arm.
5. Record each arm in the task as it lands — stamp, wall clock, cells, errored,
   the four metrics, the four intervals. Do not batch it to the end of the session.
6. Stop at ~75 minutes of cell running, at a variant boundary. Five arms is
   about 74 minutes, so a clean leg fits one session exactly — with no slack for
   a retry, so if an arm is lost, hand over rather than pushing on.

## Critical context / traps

- **Two different ceilings, and only one of them is what you are pacing against.**
  Session 30 lost an arm to the **monthly spend limit** while sitting at 34
  minutes of a ~75-minute 5-hour-window budget. The user's pacing rule protects
  the window, not the month. The only cheap detector is the two-cell probe, and
  the tell in a running arm is the clock: **a 150-cell beginner arm that finishes
  in three minutes has mostly not run.**
- **Do not size an arm from a two-cell probe's wall clock.** Session 30's opening
  probe read ~30 seconds a cell, which would have sized leg 1 at three hours. The
  arm ran at **13.3 seconds a cell**. Node startup dominates a two-cell run.
  Beginner runs ~10 cells a minute on Opus, Haiku and Fable alike.
- **`interval` ignores both `styleId` and `variantId`** (`harness/src/interval.mjs:33`,
  COS-30, still unfixed and queued at item 23). Leg 1 stepped around it by giving
  every arm its own run directory — one style, one model, one variant per
  `rows.json`. **Keep doing that.** Never run several variants into one directory
  and then pass the whole file to `interval`.
- **Omitting `--variants` runs all five.** For a single-arm run that is 5x the
  cells you meant. Name it every time.
- **Check exit codes unpiped.** `lore check --plain | tail` reports `tail`'s
  status, and session 30 hit exactly that — it read exit 0 while `lore check` was
  reporting two errors.
- `lore sync` auto-commits `backlog/` changes as `chore(backlog): sync task
  changes`. Expect extra commits on the branch; they are fine.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge
  --rebase` rewrites every SHA baked into `docs/log.md`.
- **The ledger total is now counted, not accumulated: 7900 rows in 97
  directories, 7826 net of 74 improve-loop cells.** Session 30 resolved 70 of the
  82 cells session 29 flagged; a 12-cell gap remains and is left open. If you need
  the number, re-derive it — classify each directory by whether it carries
  `run.json`, `improve.json`, both, or neither. **A directory with an
  `improve.json` and no `run.json` is an improve-loop directory, not a
  pre-manifest one** — that misreading is what produced the 70.
- The five shared cases are a convention nothing records, but **COS-21 does not
  use them**: every leg runs all 15 cases at 10 repeats. Do not filter to five.
- Fable needs `--models='claude-fable-5[1m]'`, quoted. Not needed for legs 2 or 3.

## Do not repeat

- **Do not re-run leg 1.** Its five arms are complete and merged: `14-45-48`
  (baseline), `15-00-47` (long-prompt), `21-10-56` (tail-reminder), `21-25-00`
  (claude-md), `21-40-04` (all-fixes), all 2026-08-27, 150 cells, 0 errored.
  `15-15-54` is the lost tail-reminder arm — 121 errored, superseded by
  `21-10-56`, and no figure uses it.
- **Do not touch the ADR or FINDINGS.md until leg 3 is measured.** Leg 1 shows
  the ADR's direction reproducing and its magnitudes not, on the style where
  restatement was argued *most* likely to help. That is not enough to narrow a
  claim measured on advanced. Leg 3 is the ADR's own cell.
- Do not read leg 1's `claude-md` result as refuting the ADR. −1.7 [−4.5, +1.1]
  is a null on beginner x Opus, not evidence of no effect on advanced.
- **Do not state a non-errored cell count without checking what it excludes.**
  Session 30's self-review caught its own summary calling 29 survivors of a lost
  arm "usable-but-orphaned" and subtracting them from the non-errored total. They
  are non-errored and orphaned. 904 attempted / 783 non-errored / 121 errored.
- The `/code-review` agent is not used in this session's configuration; session
  30 self-reviewed the diff and found one real defect that way. Say plainly that
  is what you did.
