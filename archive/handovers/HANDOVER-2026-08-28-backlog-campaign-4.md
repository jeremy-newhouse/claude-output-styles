# Handover — take COS-19, the four-tier baseline re-measure (COS-19)

**Date**: 2026-08-28 | **Grounded against**: `dev` @ `0a4fb13`, clean apart from an untracked `system-prompt.md` that predates this session; `main` fast-forwarded to `0a4fb13` and pushed, level with `dev` | **Tracker**: doc-1

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-19 — fresh, not started. Campaign 2 item 13, last of the
measurement work. Queue order confirmed by the user on 2026-08-17; the pacing
rule (never exceed ~25% of any 5-hour window; probe 2 cells before committing
any arm) confirmed 2026-08-27, applies here too. Read the task's own
Description and plan it before running anything — it names a
pre-3370e4d contamination (AC #4) that COS-21's grid did not touch and that
must be retired, not just re-measured over.
```

## State

| Item | Status |
| --- | --- |
| COS-21 | **Done.** Merged as PR #31 (rebase), `dev`/`main` both at `0a4fb13`. All 5 ACs verified: 2250-cell grid, ADR narrowed in place, FINDINGS.md re-stated. See tracker Resolved row 12 and the task's own notes. |
| Cursor | **COS-19**, Campaign 2 item 13. Status `To Do` — nobody has planned it yet. |
| `dev` / `main` | Both `0a4fb13`, pushed, level. **No promotion needed at next preflight.** |
| Branches / PRs | No `feature/*` branches, no open PRs. |
| Gates as of `0a4fb13` | 219/219 harness tests (checked pre-merge), `lore check` exit 0 (24 files, checked post-merge after the rebase re-sync). |
| Queue after COS-19 | 14 COS-4, 15 COS-1, 21 COS-28, 22 COS-29, 23 COS-30, 24 COS-31, 25 COS-32, 26 COS-33 |
| COS-19's own ACs | #1 n>=146 non-errored per style x model on every judge cell in the four-tier table; #2 every judge figure carries an interval; #3 each current table conclusion re-checked (confirmed/withdrawn/restated as hypothesis); #4 pre-3370e4d contamination retired — some beginner/intermediate judge figures come from a run whose judge was told a sentence cap the style file never stated; #5 costs recorded per arm, ledger total corrected by counting `rows.json` on disk |

## Next steps

1. Preflight: `dev`/`main` already level at `0a4fb13` — verify with `git fetch` rather than assuming, then `backlog task view COS-19 --plain` and read the full description (it is long and specific about the contamination). Branch `feature/COS-19` off `dev`.
2. Plan the task in Backlog before running anything (`backlog task edit COS-19 -s "In Progress" --assign @claude`, then `--plan "..."`). COS-19 spans **four tiers x however many models/styles the four-tier table covers** — size the grid the way COS-21's plan did (legs argued from what each cell answers, not from convenience) before committing cells.
3. Identify which existing saved runs are contaminated by the pre-3370e4d judge-cap issue (AC #4) before re-running anything — re-running a contaminated cell without also fixing what made it contaminated wastes cells.
4. Probe 2 cells before committing the first arm, same as every session since 28.
5. Record wall-clock + non-errored cell count per arm **as it lands**, with `--append-notes` (not `--notes`, which replaces).

## Critical context / traps

- **`backlog task edit --notes` REPLACES the notes; it does not append.** Use **`--append-notes`**. Recovery: `git show HEAD:"backlog/tasks/<file>.md"`, pull the body between the `SECTION:NOTES` markers, restore with `--notes`, then re-add with `--append-notes`.
- **Do not round-trip the tracker through `backlog doc view doc-1 --plain`** — it silently truncates on this doc's size. **Read the file on disk, edit the copy, then pass it to `backlog doc update --content "$(cat file)"`** — do not hand-edit the file in place with a text-editing tool even though the content ends up identical; this session did that once, then had to route it through `doc update` anyway to keep the CLI's metadata (`updated_date`) consistent. Check line count before and after every `doc update` call.
- **Run the harness from `harness/`, with the path in the same command**, and **prefix every backgrounded run with `cd /Volumes/_repos/claude-output-styles/harness &&`** — backgrounded commands do not inherit a prior `cd`.
- **A background arm that "completes" in seconds has not run.** Check the tail of its output file for the `wrote results/<stamp>` line before scoring anything.
- **`run.json` carries no timestamps.** Wall clock comes from the stamp (UTC) vs `stat -f '%Sm' results/<stamp>/rows.json` (**local time — add 5 hours to compare**). This session got the elapsed time wrong once by quoting the per-cell mean instead of the arm's actual wall clock — caught in self-review, corrected in a follow-up commit rather than silently.
- **`interval` ignores both `styleId` and `variantId`** (`harness/src/interval.mjs:33`, COS-30, still unfixed, queued at item 23). Filter `--before`/`--after` to one style, one model, one variant per side.
- **Omitting `--variants` runs all five.** Name it every time.
- **Check exit codes unpiped.** Redirect to a file, then read `$?`.
- `lore sync` on `dev` after a rebase-merge is not optional — `gh pr merge --rebase` rewrites every SHA baked into `docs/log.md`. Ran clean this session (`docs/log.md` and `docs/stories/make-the-measurements-trustworthy.md` both regenerated), `lore check` exited 0 across 24 files.
- **Archive name collisions are routine now.** `archive/handovers/` holds three same-day (2026-08-28) handovers already (`-2`, this session's now-archived `-3`). A fourth same-day handover needs `-4`.
- The five shared cases are a convention nothing records in `cases.json`, but check per-task whether it applies before assuming it — COS-21 used all 15 cases per arm, not the shared five.
- Fable needs `--models='claude-fable-5[1m]'`, quoted.

## Do not repeat

- **COS-21's 15 arms are all resolved and must not be re-run.** Full list of load-bearing stamps is in the task notes and the tracker's Resolved row 12 / session-33 log entry. Leg 1 (beginner x Opus): `14-45-48`, `15-00-47`, `21-10-56`, `21-25-00`, `21-40-04`. Leg 2 (beginner x Haiku): `22-24-10`, `22-41-46`, `22-59-12`, `23-15-05`, `2026-08-28T00-33-04`. Leg 3 (advanced x Opus): `2026-08-28T00-49-16`, `01-08-39`, `01-27-19`, `02-02-08`, `02-20-08`.
- **Do not read the ADR's status as "Accepted" without qualification** — it is now "Accepted, narrowed by re-test." Its 9.4- and 4.5-point magnitude claims are withdrawn; do not cite them anywhere new.
- **Do not size an arm from a two-cell probe's wall clock alone** — node startup dominates a short probe. Advanced x Opus measured 7.9 cells/min across full arms; a two-cell probe's per-cell time was not representative of that.
- **Do not state a non-errored cell count without checking what it excludes.** COS-21's leg 2 was 750 attempted / 748 non-errored / 2 errored — always disk-count via `rows.json`, never sum from memory (this is COS-19's own AC #5's point too).
- The `/code-review` agent was not used this session; self-review of `git diff dev...HEAD` caught the wall-clock imprecision noted above. Keep doing that — every session since 30 has caught at least one real defect this way.
