# Handover — take COS-21, re-test the variant sweep the reinforcement ADR rests on (COS-21)

**Date**: 2026-08-27 | **Grounded against**: `dev` @ `f3f96b6`, clean apart from an untracked `system-prompt.md` that predates this session; `main` fast-forwarded to `f3f96b6` and pushed, level with `dev` | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-21 — re-test the five-variant sweep the "Reject harness-level
reinforcement" ADR rests on. Queue order confirmed by the user on 2026-08-17; do
not re-ask. COS-21 is the largest arm this campaign has ever sized: AC #1 wants
n>=146 per arm across five variants, AC #2 wants more than one style AND more
than one model, which multiplies to ~2900 cells minimum. Session 29 measured
beginner at ~10 cells a minute, so that floor is about five hours if every cell
is beginner and longer if not. PROBE FIRST with 2 cells, then measure your own
throughput on the actual style/variant mix before committing. AC #5 asks for
per-arm costs that COS-25 deliberately deleted from the harness — resolve that
with the user before running, not after.
```

## State

| Item | Status |
| --- | --- |
| COS-17 | **Done**, merged as PR #27 (rebase), `dev` and `main` both at `f3f96b6` and pushed. All five ACs checked. |
| Four-tier beginner row | **Current on every tier for the first time**, 150 non-errored cells a model. rules 95.8 / 97.4 / 99.2 / 99.3 and judge 48.2 / 60.9 / 66.1 / 65.2 on Haiku / Sonnet / Opus / Fable |
| Style files | **Unchanged.** `plain-english-beginner.md` still sha256 `86451ddb`; COS-17 measured, it did not author |
| Cursor | COS-21 (Campaign 2 item 12) |
| Queue remaining | 12 COS-21, 13 COS-19, 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| Branches / PRs | No `feature/*` branches, no open PRs |
| Gates as of `f3f96b6` | 219/219 harness tests, `audit` exit 0, `lore check` exit 0 (24 files) |
| Usage ceilings | Clear as of 2026-08-27. A 2-cell probe (`12-34-30`) confirmed it before 300 cells were committed |

## Next steps

1. Preflight, branch `feature/COS-21` off `dev`.
2. **Read COS-21's ACs before sizing anything, and read AC #5 twice.** It asks for
   "costs per arm" and quotes a 3.9x figure. COS-25 removed cost tracking from the
   harness, the published record and the tracker on the user's judgement that it
   was meaningless. **An AC cannot be satisfied by a field that no longer exists.**
   Decide with the user whether to satisfy it with wall-clock instead, or to amend
   the criterion. Do not quietly substitute a proxy.
3. Size the arm honestly and say the number out loud before running it. Five
   variants x >=146 cells x (>=2 styles) x (>=2 models) is **~2920 cells at the
   floor.** At session 29's measured 10 cells a minute that is roughly five hours,
   and only if every cell is beginner — advanced and intermediate write longer
   replies and their judge calls cost more (session 28 measured ~5/min on them).
4. AC #2 wants the style and model choice *argued*, not defaulted. The task itself
   makes the argument for beginner ("the style whose rules most nearly duplicate
   what a CLAUDE.md restatement would add"). Use it.
5. Probe with 2 cells first. It is 15 seconds and it has now paid off twice.

## Critical context / traps

- **Throughput is per style, and session 29 proved the point in both directions.**
  Beginner ran 9.5 and 10.3 cells a minute on 150-cell arms; session 28 measured
  ~5/min on intermediate and advanced and ~0.7/min on a reserve arm. The judge
  call is the wall clock and it scales with reply length. **Session 29 also got
  this wrong from memory** — it wrote "~1.6 cells a minute, ~95 minutes an arm"
  into the task before reading a clock, and was out by a factor of six. Read a
  clock. `date -u` and the run stamp are enough.
- **`interval` silently pools styles.** It pairs on `caseId|model` and ignores
  `styleId` (`harness/src/interval.mjs:33`). COS-21 sweeps more than one style by
  construction, so **this trap is live for this issue in a way it was not for
  COS-17.** Filter every rows file to one style before passing it. That is COS-30,
  still unfixed and still queued at item 23.
- **`interval` also ignores `variantId`**, which matters more here than the style
  bug: a five-variant sweep in one run directory produces one `rows.json` holding
  all five arms, and passing it whole averages the variants together. Filter to one
  variant per side as well.
- **"The five shared cases" is a convention nothing records.** `conv-status-auth`,
  `conv-explain-cache`, `agentic-read-report`, `conv-status-holdout`,
  `conv-followup-drift`. It is **not** the train split, which differs in two of
  five. Session 28 lost 125 cells to that assumption.
- **The `run` CLI runs all five variants when `--variants` is omitted**, which for
  COS-21 is what you want and for everything else is 5x the cells you meant. Say it
  explicitly either way.
- **Fable needs `--models='claude-fable-5[1m]'`, quoted** — the `[1m]` is a zsh
  glob and there is no bare alias.
- **Check exit codes unpiped.** `lore check --plain | tail` reports `tail`'s status.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase`
  rewrites every SHA baked into `docs/log.md`.
- **The ledger's running cell total is 82 short of a disk count**, flagged by
  session 29 and deliberately left open. Counting `rows.json` across
  `harness/results/` returns 6996 rows in 89 directories. If COS-21 needs to update
  the total, **count it, do not add to the recorded figure.**

## Do not repeat

- Do not re-run COS-17's arms. `2026-08-27T12-35-06` (Haiku) and `12-50-55`
  (Fable) are complete, 150 cells each, 0 errored, and their figures are in
  FINDINGS.md, the epic, the coverage story and the ledger.
- Do not re-derive the four-tier beginner row's comparability by reasoning about
  dates. It is checked and written down: `checks.mjs`, `contracts.json` and
  `cases.json` last changed 2026-08-17; `judge.mjs` and `run.mjs` 2026-08-18; all
  before run `2026-08-20T03-03-26`.
- **Do not assume a pre-`3370e4d` judge defect on the Haiku and Fable baselines.**
  Session 29's first draft did and it was backwards. The commit landed 13:14 UTC on
  2026-08-16; `22-59-53` and `23-48-45` ran at 22:59 and 23:48, nine hours after.
  Only `12-44-03` (12:44 UTC) predates it. Timestamps settle this in one command.
- Do not write a superlative into a document without checking it against the table
  on the same screen. Session 29's review caught two: "beginner's rules column is
  now the strongest of the three" (false on Haiku by 0.2) and "the largest measured
  change in the project" (unbackable — two rewrites and a contract fix are stacked
  in the gap and no arm separates them).
- Do not list per-model figures without checking the column order of the table you
  are putting them in. The epic runs Opus / Sonnet / Haiku / Fable; FINDINGS.md's
  four-tier table runs Haiku / Sonnet / Opus / Fable. Session 29 put two numbers
  against the wrong model that way.
- The `/code-review` agent did not return within ~30 minutes on session 28's diff.
  Session 29 self-reviewed and found three real defects. If it stalls again, review
  the diff yourself and say that is what you did.
