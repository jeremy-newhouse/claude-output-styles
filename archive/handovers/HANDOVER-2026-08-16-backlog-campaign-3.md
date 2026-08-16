# Handover — hold a case pool out of every optimizer split (COS-2), campaign 2/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `cdfd153`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `cdfd153` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-2 — hold a case pool out of every optimizer split, so a
candidate is validated against cases the loop never saw before it is called a
winner. Queue order confirmed by user on 2026-08-16 (COS-6 ✓, COS-3 ✓, then
COS-2, COS-8, COS-5, COS-7, COS-1, COS-4); do not re-ask. Risk policy:
record-and-park.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. `lore sync` auto-commits the
touched backlog/ file — expect an extra `chore(backlog): sync task changes`
commit on the branch. Any change to harness/src/checks.mjs needs a matching case
in harness/test/checks.test.mjs.

COS-2 costs money: AC #2 and #3 need a real improve run whose candidate is
actually scored against the reserve split. Budget ~$3. Thanks to COS-3 the run
now persists rows.json, so score it offline rather than re-running to check a
number.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `cdfd153`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `cdfd153` |
| Cursor issue | COS-2 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-2, 2 resolved, 6 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PR #1 (COS-6), #2 (COS-3), #3 (brief-comment fix) merged, all branches deleted |
| Consumed handovers | `archive/handovers/HANDOVER-2026-08-16-backlog-campaign.md` (session 1's) and `-2.md` (session 2's) |
| Campaign progress | 2 of 8 resolved. Next is session 3 |
| Spend so far | $0.75 total, all in session 2 |

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-2 dev`.
3. Read `backlog instructions task-execution`; mark COS-2 In Progress; record the plan.
4. The four criteria and where the code stands today:
   - **AC #1** — a third split `improve` never selects. `harness/cases/cases.json`
     has 9 cases, 5 `train` and 4 `holdout`, and nothing else.
     `harness/src/improve.mjs:88-89` filters on `cfg.trainSplit` / `cfg.holdoutSplit`
     from `matrix.json` → `improve`. A `reserve` split needs cases written for it —
     they cannot be carved out of the existing 9 without shrinking the training
     signal, and the four never-seen cases used in the `23-36-59` run are the
     obvious source. Check `harness/rejected/README.md` and the ADR
     `docs/adr/validate-candidates-on-cases-held-out-of-every-split.md` first: the
     ADR is the decision this task implements, so it likely already names them.
   - **AC #2** — `improveStyle` scores the winner against the reserve. The loop
     returns `{ styleId, best, history, spentUsd, rows }` from
     `harness/src/improve.mjs`. Add a final measurement after the loop exits and
     report it alongside `best.train` / `best.holdout`. Use the existing `measure`
     helper so the reserve rows land in the same persisted set — pass an
     `iteration` that reads unambiguously in the `BY ITERATION` table.
   - **AC #3** — a candidate that regresses on the reserve is reported as rejected.
     Note the wording: *reported as rejected*, not silently reverted. The console
     block at `harness/src/cli.mjs:106-109` prints the winner per style; that is
     where a rejection has to be visible.
   - **AC #4** — `harness/README.md` documents the three-way split and why two is
     not enough. The measured evidence is already written up in
     `docs/stories/harden-the-optimizer-loop.md` (the advanced candidate 6.8 points
     worse out of sample) — cite it, do not re-derive it.
5. Gates: `npm --prefix harness test` (currently 24/24) must pass; `lore check`
   exit 0 after `lore sync`; and a real improve run behind any asserted number.
6. Update `doc-1` on the branch (move COS-2 to Resolved, advance cursor to COS-8,
   append the session-log entry), commit with `Refs: COS-2`, review with
   `/code-review high`, push, PR into `dev`, rebase-merge, sync, promote `main`,
   prune.

## Critical context / traps

- **A number in a file shaped like a scorecard will be quoted as one.** Session 2's
  worst finding: an improve run's `report.md` headlined 63.0%, the mean of the
  baseline and every rejected candidate, in a file the experiment ledger compares
  across runs. COS-2 adds a *third* number per style. Whatever it writes, make sure
  a reader cannot mistake the reserve score for the style's score or vice versa —
  the labelling conventions now exist (`summary.kind`, the "Optimizer trace" title,
  the per-style `BY ITERATION` key), so extend them rather than inventing a new one.
- **Grep the docs for what the change makes false, before committing.** Both
  sessions so far hit this. Session 2 invalidated three standing statements that
  `improve` persists nothing; no automated gate noticed. `docs/reference/`,
  `harness/README.md`, and `FINDINGS.md` are where such claims live.
- Re-scoring saved rows is free: `node src/cli.mjs score --rows=results/<stamp>/rows.json`.
  As of COS-3 that works on improve runs too, so never re-run the loop to re-check
  a figure.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not fast-forward
  means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose — handovers may name machines or
  environments. Never copy handover content into anything committed.

## Do not repeat

- Do not skip `lore sync` because the change looks code-only. Sessions 1 and 2 both
  needed it purely from moving a task's status.
- Do not write a placeholder into the tracker intending to fill it in later.
  Session 1 committed a literal `<PR_SHA>`; review caught it. Record what is true
  at commit time and add the merge SHA in the post-merge housekeeping commit.
- Do not carry evidence forward across a code change. Session 2's first proving run
  ($0.61) predated a review fix, so the evidence was re-taken on the final code
  rather than reused. Cheap re-runs (one style, one model, `--cases=` two cases)
  make this affordable — that one cost $0.09.

## Settled after the campaign session (PR #3, `cdfd153`)

The comment/code disagreement session 2's review surfaced is closed. The user
asked for the documentation to be corrected, not the code. Verified behaviour:
after a revert the loop briefs the next iteration from the **incumbent**, because
the author is handed `best.body` to rewrite and evidence from a discarded
candidate would describe text it is not editing. The stale claims in
`harness/src/improve.mjs` and `harness/README.md` step 4 now say that, and a test
("a reverted iteration briefs from the incumbent, not the failed candidate") pins
it. Suite is 24/24, not 23/23. No behaviour changed — do not treat this as a
change to what the optimizer sees.
