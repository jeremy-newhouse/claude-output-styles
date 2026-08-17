---
id: COS-11
title: Stop errored cells from biasing every score the project quotes
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:44'
updated_date: '2026-08-17 12:52'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/evaluate.mjs
  - harness/src/report.mjs
documentation:
  - docs/reference/experiment-ledger.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A cell that returns no text at all still lands in every mean, and it biases the two halves of the score in opposite directions, so they do not cancel.

- Rules: an empty reply scores 0.0 on every deterministic check. Documented under COS-5, where pooling six aborted Haiku cells understated that model's rule compliance by about 10 points.
- Judge: `evaluate.mjs` skips the judge call on an errored row and substitutes `{ score: 1 }`, so the same cell contributes a free 100% to the judge mean. This half is not documented anywhere outside the ledger. One turn-limit abort in run `01-03-21` moved that run's `agentic-fix-verify`-on-Opus judge from 33.0 to 44.2.

`summarize()` pools errored rows into every figure it produces, which is where report.md, summary.json and every quoted arm mean come from. One consumer was fixed under COS-1 — `improve`'s reserve adoption gate now pairs by case id and drops any case that errored on either side — but that fix was deliberately narrow and the general case is untouched.

The current workaround is a discipline: filter `!row.error` before quoting anything. Three sessions have had to remember it and one published four wrong figures by forgetting an equivalent rule. A discipline that must be remembered is a defect that has not been fixed yet.

This matters more now than it did: the follow-up measurement work deliberately runs large arms on abort-prone agentic cases, where errors are not rare. `reserve-agentic-session` aborts 3 of 6 on Haiku.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 summarize() reports error-excluded means as the default, and reports the errored-cell count alongside every figure so a reader cannot mistake a partial arm for a full one
- [x] #2 An arm where every cell errored reports as unmeasured rather than as a score
- [x] #3 report.md and summary.json distinguish cells that produced a reply from cells that did not, at every level they aggregate
- [x] #4 Tests cover both biases in one run — an errored cell must not raise a judge mean and must not lower a rules mean
- [x] #5 Re-scoring a saved run with a known abort (22-59-53, six aborted cells) reproduces the corrected figures, and any published number that changes is updated
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. One predicate, one home: add `producedReply(row)` to checks.mjs beside viewsOf() — a cell counts as having replied iff no error flag AND a non-empty turn (trace, falling back to text for legacy rows). This deliberately covers the wider case the task description omits: a cell that returns nothing WITHOUT the SDK setting an error flag currently scores ~0.93 on rules and a free 1.0 on the judge. A predicate keyed only on row.error would leave that bias untouched.

2. Apply it at the scoring seam (evaluate.mjs): replace the `run.error && !run.text` guard and the `!run.error` judge condition with !producedReply / producedReply. A no-reply cell then carries checks: [] and never pollutes summary.failures (the optimizer brief).

3. Apply the same predicate on the offline score path (cli.mjs), which today branches on `r.text` alone. Live and offline scoring must agree or AC #5's re-derivation is not a re-derivation.

4. summarize(): means over replying rows only; null (not 0) when a group has none. Every group gains n = replying cells (the sample behind the figures), noReply = cells that did not, cells = the arm as requested. costUsd stays over ALL rows — an aborted cell was still paid for. Same three counts at the top level beside overall. failures skips no-reply rows explicitly rather than relying on checks: [].

5. Enumerate the consumers before claiming what moved (the COS-10 lesson). summarize() has five: evaluate() itself, results.mjs (summary.json + report.md), cli.mjs run, cli.mjs score, and improve.mjs — which reads summary.overall to decide KEEP/REVERT. A null flowing into `null - 0.65` reads as 0 and would score an unmeasurable arm as a regression or a win by accident. Guard improve.mjs: compare only when both sides are measured, never keep on an unmeasured arm, and log it. Extend comparableRows() to drop a case that produced no reply on either side, not just one that errored.

6. Renderers (report.mjs): pct(null) currently renders 0.0%, a silent lie. Render unmeasured as such in both renderers, print the replied/no-reply split in the console table, the markdown table and the OVERALL line. renderVerdict prints unmeasured train/holdout honestly.

7. Tests: one run holding an errored cell, a silently-empty cell and good cells, asserting the judge mean is not raised AND the rules mean is not lowered by the same run (AC #4); the all-errored arm reporting unmeasured (AC #2); the renderers not printing 0.0% for it (AC #3); producedReply's cases in checks.test.mjs (project rule: any checks.mjs change needs one).

8. AC #5: re-score results/2026-08-16T22-59-53-852Z (six aborted Haiku cells) before and after, diff the figures, and update any published number that moves in docs/ and FINDINGS.md. Free — no new spend.

9. Gates: npm --prefix harness test; node src/cli.mjs audit exit 0; LORE_BACKLOG_TIMEOUT_MS=120000 lore sync then lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Verification evidence

All figures below are re-derived this session from saved rows. No new spend: $0.

**The defect, reproduced before the fix** (`node src/cli.mjs score --rows=results/2026-08-16T22-59-53-852Z/rows.json`, the run AC #5 names — 78 Haiku cells, 6 aborted on the 12-turn limit):

| level | before (pooled) | after (replying cells only) |
|---|---|---|
| overall | 69.2% | 71.9% |
| haiku rules | 84.2% | **91.2%** |
| haiku judge | 47.0% | **42.6%** |
| `agentic-fix-verify` rules | 10.3% | **62.1%** (n=1/6) |
| `agentic-fix-verify` judge | 85.8% | **15.0%** (n=1/6) |
| advanced @ haiku | 83.5 rules / 46.3 judge | 94.4 / 39.3 |
| holdout split | 76.1 rules / 58.8 judge | 96.1 / 47.9 |

Both biases, one run, opposite directions, and they do not cancel — which is AC #4's claim, now pinned by a test rather than by this table.

**Every saved run was swept**, not just the one the AC names. Five of 41 hold a silent cell: `14-48-09` (1/18), `22-59-53` (6/78), `01-03-21` (1/24), `01-33-41` (3/6), `06-21-53` (1/2). **In all five the SDK set the error flag** — the wider no-flag case the fix also covers has still never appeared in a saved run, so it changes no published figure today and is closed before the large abort-prone arms are bought.

**Published figures checked one at a time against the runs behind them:**
- `22-59-53` ledger row and the four-tier FINDINGS table: unchanged. Both quote the five shared conversational cases, where nothing errored — FINDINGS states "No cell in any column errored" and that holds.
- Ledger's `94.2 → 83.4 on advanced`: reproduces exactly from the saved rulesScore. Unchanged.
- `01-03-21` ledger row: already quoted "43.6 **with the errored cell excluded** (45.9 if it is pooled)". Both reproduce exactly. The tool now reports 43.6 by default, so the row needed no correction — it was written by a session that remembered the discipline.
- `01-33-41`, `06-21-53`: quote abort counts and tool-call counts, not means. Unchanged.
- **`14-48-09` is the one published conclusion that moves.** Its ledger row read "On holdout the rewrite showed the usual signature — rules 70.8 → 83.3, judge 72.5 → 21.2". One of the four v0 holdout cells is an `agentic-fix-verify` abort scored 0 rules / 1.0 judge. Excluded, v0 holdout is rules **94.3**, judge **63.3** — so rules fell 94.3 → 83.3 as well and "the usual signature" was an artifact of that one cell. The holdout delta is −0.265, not the −0.193 the loop recorded. The REVERT verdict itself is unchanged. Corrected in place with the pooled figures kept, since they are what the loop actually decided on.

**Consumers enumerated before claiming what moved** (the COS-10 lesson). `summarize()` has five callers: `evaluate()`, `results.mjs` (summary.json + report.md), `cli.mjs run`, `cli.mjs score`, and `improve.mjs`. The fifth is the one that mattered — it reads `summary.overall` for KEEP/REVERT, and `null - 0.65` is `-0.65` in JS, so an unmeasurable arm would have scored as a regression or a win by accident. Guarded: an incomparable side is always a REVERT, never a KEEP, and the baseline warns once if it is unmeasured.

**Two things deliberately left alone**, both stated in comments at the code:
- `costUsd` still pools every cell. An aborted cell was paid for and its spend belongs against the arm that bought it.
- A cell that narrated and then ended on a tool call has an empty *final message* but a real turn. `producedReply` reads the turn, so that cell stays in the mean — it produced measurable behaviour. Empty-final-with-trace is a different question and not this task's.

**Gates:** `npm --prefix harness test` 104/104 (was 94; 9 added, 1 pre-existing fixture set corrected — three tests built rows with no text at all, which the new predicate correctly reads as silent). `node src/cli.mjs audit` exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
One predicate, `producedReply(row)` in `checks.mjs`, now decides both whether a cell may be scored and whether it may be pooled into a mean. `summarize()` averages only the cells that produced a reply, reports `null` rather than 0 when none did, and states `n` / `noReply` / `cells` beside every figure it emits; both renderers print `n/a` for an unmeasured arm. `costUsd` still pools every cell, because an aborted cell was paid for.

The predicate reads the turn rather than the SDK error flag, which closes the wider version of the same bias: a cell that goes silent without the flag scored 0.931 on rules for beginner on `agentic-fix-verify` plus a free judge 1.0.

Verified by re-scoring saved rows — $0 spend. On `22-59-53` (78 Haiku cells, 6 turn-limit aborts) haiku rules move 84.2 → 91.2 while haiku judge moves 47.0 → 42.6; on `agentic-fix-verify` alone, rules 10.3 → 62.1 and judge 85.8 → 15.0. Both biases, one run, opposite directions, pinned by a test asserting both at once. All 41 saved runs were swept: five hold a silent cell, all five with the flag set. Each published figure was checked against the run behind it; one moved and was corrected — `14-48-09`'s ledger row read "rules 70.8 → 83.3, judge 72.5 → 21.2" on holdout, and excluding its one aborted v0 cell gives rules 94.3 and judge 63.3, so both halves fell on both splits and the holdout delta is −0.265, not −0.193. The REVERT verdict is unchanged.

All five consumers of `summarize()` were enumerated first. `improve.mjs` reads `summary.overall` for KEEP/REVERT and `null - 0.65` is `-0.65` in JS, so an incomparable side is now always a REVERT; `cli.mjs score` branched on `r.text` where the live path branched on `error && !text`, and both now use the one predicate, which is what makes offline re-derivation a re-derivation.

`npm --prefix harness test` 94 → 104, `node src/cli.mjs audit` exit 0, `lore check` exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
