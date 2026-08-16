# Handover — decide whether lower levels need tighter sentence caps (COS-8), campaign 3/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `2d4bcb4`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `2d4bcb4` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-8 — decide whether beginner and intermediate should state
tighter sentence and paragraph caps than advanced, and add a guard that catches
a style file disagreeing with its contract. Queue order confirmed by user on
2026-08-16 (COS-6 ✓, COS-3 ✓, COS-2 ✓, then COS-8, COS-5, COS-7, COS-1, COS-4);
do not re-ask. Risk policy: record-and-park.

COS-8 AC #1 is an AUDIENCE JUDGEMENT, not a measurement. The tracker's risk
section says to run the experiment, record a data-backed recommendation, and
surface it for the user to ratify rather than deciding unilaterally. Do the
measurement work and the guard (AC #4) first — those are yours. Bring #1 to the
user with numbers.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. `lore sync` auto-commits the
touched backlog/ file — expect an extra `chore(backlog): sync task changes`
commit on the branch. Any change to harness/src/checks.mjs needs a matching case
in harness/test/checks.test.mjs.

COS-8 costs money: AC #3 says any change is validated on BOTH models against the
current baseline. Budget ~$8. A cell is ~$0.037 on haiku and materially more on
opus/sonnet, so scope the matrix deliberately — see "Critical context" below.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `2d4bcb4`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `2d4bcb4` |
| Cursor issue | COS-8 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-8, 3 resolved, 5 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PR #1 (COS-6), #2 (COS-3), #3 (brief-comment fix), #4 (COS-2) merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1, 2 and 3 (`-3.md` is this session's predecessor) |
| Campaign progress | 3 of 8 resolved. Next is session 4 |
| Spend so far | $1.63 total ($0.75 session 2, $1.18 session 3) |
| Raised but NOT queued | COS-9 — `two_options_max` cannot see prose option sprawl. Queue order is the user's to change |
| Test suite | 34/34 (`npm --prefix harness test`) |

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-8 dev`.
3. Read `backlog instructions task-execution`; mark COS-8 In Progress; record the plan.
4. The four criteria and where things stand:
   - **AC #4 is the cheap, unambiguous one — do it first.** A style file states
     its caps in prose ("Keep sentences under 20 words"); `harness/config/contracts.json`
     states them as numbers (`maxSentenceWords`, `maxParagraphSentences`,
     `maxUpdateWords`, `maxCodeLines`). Nothing checks that the two agree, and
     they silently disagreed before — contracts graded beginner at 15 words and
     3 sentences against files that said 20 and 4. A test that parses the numbers
     out of each style file's prose and asserts they match the contract is worth
     more than the caps decision itself. Costs nothing.
   - **AC #1 is a judgement call, not a measurement.** Whether a non-technical
     reader *should* get shorter sentences than a technical leader cannot be
     settled by a harness run. Measure what you can — how long the sentences
     actually are per level today, whether the judge penalises long sentences
     differently by level — then bring a recommendation. Do not decide it alone.
   - **AC #2** is contingent on #1. If tightened, the style FILES change first
     and the contracts follow; the task description is explicit that contracts
     must never lead.
   - **AC #3** needs a real run on both models. Budget the matrix: the current
     pool is 13 cases, so a full 3-style × 3-model × 13-case × 2-repeat run is
     large. Scope with `--cases=` and `--styles=`.
5. Gates: `npm --prefix harness test` (34/34) must pass; `lore check` exit 0
   after `lore sync`; a real run behind any asserted number.
6. Update `doc-1` on the branch (move COS-8 to Resolved, advance cursor to COS-5,
   append the session-log entry), commit with `Refs: COS-8`, review with
   `/code-review high`, push, PR into `dev`, rebase-merge, sync, promote `main`,
   prune.

## Critical context / traps

- **The reserve split now exists and `--cases=` can silently defeat it.** COS-2
  added a third split (`reserve`, 4 cases) that `improve` validates its winner
  against. If a `--cases=` filter excludes them, an adopted candidate prints
  `reserve: NOT MEASURED — unvalidated`. That is not a pass. Any COS-8 run that
  uses `improve` and filters cases must keep reserve cases in the filter.
- **`BY SPLIT` is not readable on an improve run.** It pools every iteration, so
  train/holdout average the baseline with every discarded candidate while reserve
  holds only v0 and the winner. Read the by-iteration table. This was a review
  finding this session; the README now says so.
- **The case pool is 13, not 9.** Any figure in `docs/` or `FINDINGS.md` from a
  9-case run is not comparable with a new full-pool run. Historical ledger rows
  say which case count they used — keep it that way.
- **Adoption is stochastic, so budget for it.** The reserve pass only fires when
  the loop actually keeps a rewrite. Three of six runs this session reverted
  everything. Expect roughly one adopting run in two, and prefer a low-scoring
  style with headroom when you need one.
- Re-scoring saved rows is free:
  `node src/cli.mjs score --rows=results/<stamp>/rows.json`. Never re-run the
  loop to re-check a figure.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose — handovers may name machines or
  environments. Never copy handover content into anything committed.

## Do not repeat

- Do not skip `lore sync` because the change looks code-only. All three sessions
  so far needed it purely from moving a task's status.
- Do not write a placeholder into the tracker intending to fill it in later.
  Session 1 committed a literal `<PR_SHA>`; review caught it. This session wrote
  the merge SHA only in the post-merge housekeeping commit, which is the pattern
  to follow.
- Do not trust a rendered line you have not tested. COS-2's AC #3 said a
  regressing candidate must be *reported* as rejected; that would have been
  unverifiable while it lived in a `console.log`. It was extracted into
  `report.mjs` as `renderVerdict()` and unit-tested. Prefer this when a criterion
  is about what the harness says.
- Do not let a config knob default to `undefined` in a comparison. Review found
  `delta >= cfg.minReserveDelta` with no fallback: a config naming a reserve
  split but omitting the threshold would have rejected every candidate in every
  run while logging an ordinary-looking REJECT.
- Do not carry evidence across a code change. This session re-took the
  end-to-end evidence after the review fixes rather than reusing the earlier
  run's numbers, which cost $0.30 and produced strictly better evidence.

## Worth knowing: what the reserve caught on its first real outing

In `results/2026-08-16T20-57-54-086Z/` the optimizer produced a candidate that
improved train and beat holdout by 29.5 points (0.644 → 0.99), and was 17.7
points worse on the reserve (0.800 → 0.623). Offline re-scoring shows the exact
signature the ADR names: reserve rules roughly flat (92.6 → 89.6), judge
collapsed (67.5 → 35.0). The guard rejected it and `best.md` came out
byte-identical to the shipped style file.

The mechanism now works, but it is a floor and not a proof: the reserve is four
cases measured once per side, so at `repeats: 1` a single case moves its mean by
far more than the −0.02 bar the verdict turns on. `harness/README.md` says this
plainly. Do not quote an `ACCEPT` as "measured to be no worse".
