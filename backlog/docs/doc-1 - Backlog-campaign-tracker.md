---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-28 14:19'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-4 — NOT YET STARTED.** Campaign 2 item 14. Queue order was
confirmed by the user on 2026-08-17 (see the Campaign 2 section below). Do not
re-ask before taking it.

**COS-19 resolved in session 34, faster than expected — one session, not
several.** Raised advanced x haiku and intermediate x haiku to n=150 (joining
beginner's full row and advanced/intermediate x opus/sonnet from COS-16/17/18):
10 of 12 four-tier cells now carry n>=146. Advanced x Fable and intermediate x
Fable stayed at n=10 — two attempts hit repeated session-limit errors on
`claude-fable-5[1m]`, the user directed stopping rather than keep re-hitting it,
and the two cells moved to COS-34 (appended, item 27) with the user's explicit
approval. AC #1 is unchecked on COS-19 for that reason; ACs #2-#5 are checked.
See Resolved, row 13, and the task's own final summary for the two conclusions
AC #3's re-check withdrew. **COS-34 is not queued next** — it stays appended at
the end behind items 14-26; take it in order like any other appended item, and
probe Fable's session-limit behavior again before committing a full arm, same
as COS-19 did.

**Throughput depends on the style, and beginner is the cheap one.** Session 29
measured its own on both arms rather than assuming: the Haiku arm ran 150 cells in
15m51s (**9.5 a minute**) and the Fable arm 150 in 14m35s (**10.3 a minute**), at
concurrency 4, with per-cell `elapsedMs` around 8 seconds. Session 32-33 measured
advanced × Opus at **7.9 cells/min** (~19 minutes for 150 cells) — nothing like
session 28's ~5 and ~0.7 on intermediate and advanced under different conditions.
**The judge call is the wall clock, and it scales with reply length**, so a
beginner arm is minutes where an intermediate/advanced reserve arm can be hours.
Size on the style actually being measured, and measure early enough to abandon
cheaply.

**Two usage ceilings were hit in this campaign**, and they are different. Session
27's was the 5-hour window. Session 28 hit the **monthly spend limit** — 163 of
300 cells in one arm, taking all 150 Sonnet cells — which does not clear by
waiting a few hours. **Always probe 2 cells before committing an arm**; it has
now paid off across sessions 28 through 33.

## Campaign 3 (cell-free housekeeping) — COMPLETE as of session 26

Confirmed by the user on 2026-08-18, from an AI-proposed order: COS-23 first
because `docs/log.md`'s SHA problem affects the campaign's own record for
every session including COS-16's eventual resumption; then COS-27
(reproducibility); then COS-22, COS-24, COS-26 by increasing code complexity.
Ran interleaved with Campaign 2. All five issues are Resolved (session log and
the per-issue table below); this section's cursor was the tracker's active
cursor from session 22 through session 26.

| # | Issue | Type | One-line note |
|---|---|---|---|
| 1 | COS-23 | protocol | **Resolved, session 22.** `docs/log.md` cites SHAs `gh pr merge --rebase` destroys — systemic across the campaign. See Resolved. |
| 2 | COS-27 | measurement/harness | **Resolved, session 23.** FINDINGS.md's paired confidence intervals have no recorded, reproducible method. See Resolved. |
| 3 | COS-22 | harness | **Resolved, session 24.** Harden the fixture guard COS-13 added — 4 gaps, one already fired unnoticed. See Resolved. |
| 4 | COS-24 | harness | **Resolved, session 25.** CLI silently substitutes defaults for malformed flags — 10 ACs. See Resolved. |
| 5 | COS-26 | harness | **Resolved, session 26.** Bound the judge/rewrite calls so a stalled grader cannot hang a run — 6 ACs. See Resolved. **Campaign 3 is now empty.** |

## Campaign 2 (resumed — cursor at item 10, COS-18)

**Item 9, COS-16, is Resolved (session 27); the cursor is now COS-18.** The
heading below is kept for the confirmation it records. Queue order for campaign 2
confirmed by the user on
2026-08-17, who chose the "Fix tools first, then everything" option from a
presented comparison over a shorter path that went straight to the two missed
bars: "15 sessions. Repairs the measuring tools before spending on any test,
then re-establishes every published number. Slowest to the headline goal, but
nothing gets measured twice." The user separately confirmed keeping COS-17 as
its own session rather than folding it into COS-19, because "it answers sooner
and cheaper, and COS-19 can reuse its data."

Do not re-ask before taking the next item.

Campaign 2 items 1 to 8 (COS-12, COS-10, COS-11, COS-13, COS-14, COS-9, COS-20,
COS-15) are resolved; the cursor has advanced to item 9.

**Session 15 took COS-25, not the cursor item, at the user's direction.** The
user judged that the project's cost and budget tracking was meaningless — the
harness runs on a Claude subscription, so the SDK's `total_cost_usd` was a
list-price valuation of tokens nobody was charged — and asked for it removed from
the harness, the docs and this tracker, including the `maxBudgetUsd` runaway
guard. COS-25 was created in that session. **The cursor did not move: COS-9 was
armed before session 15 and was taken, in order, by session 17.**

**Session 16 finished COS-25 and also took no queue item.** Session 15 marked it
Done, then `/code-review high` returned five findings and the status was walked
back to In Progress; the branch was left committed, unpushed and unmerged.
Session 16 resolved all five — one code defect fixed, one measured and found
real but inert, one closed by recording the measurement the docs were asserting
without, one moved to startup validation, and one referred to the user, who chose
to narrow the overclaimed wording and file the fix as COS-26 rather than widen
COS-25 past its acceptance criteria. **The cursor stayed COS-9**: two
consecutive out-of-band sessions left it untouched, and session 17 took it.

**Session 13 took no queue item.** It restored onto a `feature/COS-13` branch
that session 12 had finished and reviewed but never published, carried the
lifecycle from the review gate through the PR merge, and opened COS-22 and
COS-23 from the review's remaining findings. The cursor did not move: COS-14 was
armed before session 13 started, and session 14 took it.

Campaign 1 is closed. Its cursor ran COS-6 -> COS-3 -> COS-2 -> COS-8 -> COS-5
-> COS-7 -> COS-1 -> COS-4; six resolved, two parked. Those two are now items 14
and 15 of campaign 2, because the blockers under them have owners.

**COS-16 is finished. Session 20 took it and could not finish it; session 27
resumed it and did, without re-authoring a byte.** The candidate session 20
recorded rebuilt to the same sha256 (`86451ddb`) from the recipe in the task, and
the two arms it was missing ran clean — `2026-08-20T03-03-26` on the shared five
and `03-13-05` on reserve, 150 cells a model each, 0 errored. All twenty paired
intervals contain zero, and dropping E4 removes the four-edit bundle's Opus word
regression on a full Sonnet arm rather than on Opus alone. The paragraph below is
session 20's account, kept because it is what a resuming session read.

**Session 20's account.**
COS-16's own acceptance criteria demand each surviving edit be measured on its
own (AC #3) rather than as an unresolvable bundle, which is the defect it
exists to fix in COS-4. That ablation ran into Claude Code's 5-hour usage
window twice — once losing 1127 of 1200 single-edit cells, once losing 56 of
150 cells on a follow-up three-edit candidate's Sonnet half — and the user
chose to park rather than wait it out a third time. What is proven and merged:
the style file ships no prose changes (reverted to shipped bytes, sha256
`96fdbea4`); the two baselines and the four-edit bundle are fully measured (the
bundle is a null result on the judge, but shows a real Opus word regression);
all four single-edit arms are now fully measured with zero individual harm;
and a three-edit candidate dropping the regression's likely source (E4, the
one edit that adds rather than removes or bounds a rule) is clean on Opus and
still needs Sonnet. The rebuild recipe, every sha256, and the exact next steps
are recorded in the task's implementation notes — a resuming session does not
need to re-derive any of it, only re-run the one blocked arm.

## Queue (confirmed order)

**Campaign 1: complete.**

| # | Issue | Type | Outcome |
|---|---|---|---|
| 1-6 | COS-6, COS-3, COS-2, COS-8, COS-5, COS-7 | mixed | Resolved, merged, all acceptance criteria met |
| 7 | COS-1 | styles | ACs #1-#3 merged; AC #4 missed and parked |
| 8 | COS-4 | styles | ACs #2-#3 met and merged; AC #1 missed and parked |

**Campaign 2: 18 issues.** Items 1-15 are the order the user confirmed on
2026-08-17. Items 16 to 18 were opened later, by the sessions that found them —
16 and 17 by session 13 from a review that landed after COS-13 had already
merged, 18 by session 14 from the COS-14 review plus its own probing. All three
are **appended, not inserted**, because the order above is the user's and a
session does not get to rewrite it quietly. Read the note under the phase list
before taking one.

| # | Issue | Type | One-line note |
|---|---|---|---|
| 1 | COS-12 | harness | **Resolved, session 9.** Flush rows so a killed run keeps what it measured. Insurance before any large arm. Proving it needed a real run killed, not a unit test. |
| 2 | COS-10 | harness | **Resolved, session 10.** Score the final message, not the whole turn. Three real cells proved the seam end-to-end. The fix does not reach backwards: saved agentic figures are labelled, not corrected. |
| 3 | COS-11 | harness | **Resolved, session 11.** Errored cells scored 0 on rules and 1.0 on the judge. Both biases, one fix, at the one place every figure comes from. Every criterion was satisfiable by re-scoring saved rows. Corrected one published conclusion (`14-48-09`). |
| 4 | COS-13 | fixture | **Resolved, session 12.** The reported contradiction was one of three; the fixture's test suite was red on a clean checkout. Settled by running the fixture. |
| 5 | COS-14 | config | **Resolved, session 14.** `improve` now runs `matrix.improve.models`; `run`'s list is no longer reachable from that path. Needed no optimizer run. |
| 6 | COS-9 | checks | **Resolved, session 17.** Restored the option cap for replies that never write a label, without re-breaking the reply the label-blindness was written to protect. Re-scored all 62 saved runs: one row of 96 moved, no published figure. |
| 7 | COS-20 | judge | **Resolved, session 18.** Built the missing re-judge path, then spent 720 judge calls on 60 saved replies and no cells. The judge is 17% of the per-cell variance, the reply 83%, so the sample sizes did not fall — they were confirmed to within two cells and given a floor. Sonnet is the least repeatable of the four judge tiers, and a change of judge moves three published conclusions. |
| 8 | COS-15 | contracts | **Resolved, session 19.** The contract language was extended and no style file changed, so it measured nothing new: the gloss condition is on the reply and became a check, the "unless they ask" condition is on the request and became `codeOnRequest` + `requestsCode`. Re-scoring 63 saved runs old-code against new moved 6 of 651 rows, all genuine glosses, and five published rules figures by under a point. Opened COS-27 and COS-28. |
| 9 | COS-16 | styles | **Resolved, sessions 20 and 27.** The five contradictions COS-4 left, each edit measured on its own. Three shipped (E1, E2, E3); two retained with recorded reasons, one of them (E4) retained-not-shipped because the bundle carrying it showed an Opus word regression that none of its parts showed and dropping it removed. Cost 4500 cells across both sessions — the two baselines, the four-edit bundle's two arms, the interrupted ablation, the retried ablation, the first E1+E2+E3 attempt and the two clean arms that shipped it — of which 1183 were lost to the usage window (1127 in the interrupted ablation, 56 in `02-43-48`'s Sonnet half). |
| 10 | COS-18 | styles | **Resolved, session 28.** Intermediate carries all four defects; advanced carries the router and, weakly, the contradiction. Diagnosis shipped, fix did not — its reserve validation was destroyed by the monthly spend limit and its retry stopped for slowness, so the measured edit moved to COS-33. See Resolved. |
| 11 | COS-17 | measurement | **Resolved, session 29.** Beginner on Haiku and Fable, 150 non-errored cells a model, 0 errored on either arm. The four-tier beginner row is now current on every tier. See Resolved. |
| 12 | COS-21 | measurement | **Resolved, sessions 30-33.** All four ADR magnitude claims withdrawn or narrowed at 30x n; ADR and FINDINGS.md updated. See Resolved. |
| 13 | COS-19 | measurement | **Resolved, session 34.** Raised 10 of 12 four-tier cells to n=150; advanced/intermediate x Fable stayed at n=10 after repeated Fable session-limit errors, moved to COS-34 with user approval. AC #2's single-sample interval tool (review caught and fixed a pseudo-replication bug pre-merge), AC #3's bigger-than-expected finding — a proper paired-by-case re-test finds the published "clean split" holds on **no** model, including the two (Sonnet, Opus) this project had called confirmed — plus the beginner-vs-advanced rules parity withdrawal, AC #4 confirmed already-clean. See Resolved. |
| 14 | COS-4 | styles | Beginner judge > 70% on Opus and Sonnet. Currently 73.9 / 58.1. Achievability unproven. |
| 15 | COS-1 | styles | Judge > 65% on the two weak cases. Achievability unproven, and its arms were never sized. |
| 16 | COS-22 | harness | **Moved to Campaign 3, item 3, 2026-08-18; resolved session 24.** Harden the fixture guard COS-13 added. Four gaps, one of which already fired unnoticed on the branch that introduced the guard. Runs no cells. |
| 17 | COS-23 | protocol | **Moved to Campaign 3 item 1, 2026-08-18; resolved session 22.** `docs/log.md` cites SHAs that `gh pr merge --rebase` destroys. Systemic across the campaign, not a COS-13 defect. Runs no cells. |
| — | COS-25 | harness | **Resolved out of band, sessions 15 and 16.** Not a queue item: taken at the user's direction ahead of the cursor. Removed cost and budget tracking from the harness, the published record and this tracker, and replaced `maxBudgetUsd` with a wall-clock runaway guard. Session 15 implemented and reviewed it; session 16 fixed the review's findings and merged. Runs no cells. |
| 18 | COS-24 | harness | **Moved to Campaign 3, item 4, 2026-08-18.** The CLI silently substitutes defaults for malformed flags: an unknown flag (`--modles=haiku`) runs the full default matrix, `--concurrency=abc` measures nothing, `--no-judge=false` turns the judge off. Opened by session 14; COS-14 fixed one flag on one subcommand and this is the widening. Runs no cells. |
| 19 | COS-26 | harness | **Moved to Campaign 3, item 5, 2026-08-18.** The judge call in `judge.mjs` and the optimizer's `rewrite()` in `improve.mjs` take no `abortController` and no timeout, so either stalling hangs a run that has already bought hours of cells. `maxCellSeconds` bounds a cell, not a run, and `maxBudgetUsd` never covered these two either — the gap predates both guards. Opened by session 16 from COS-25's review; **appended after item 18 rather than slotted into the order the user confirmed.** Runs no cells. |
| 20 | COS-27 | measurement | **Moved to Campaign 3 item 2, 2026-08-18; resolved session 23.** The paired confidence intervals in `FINDINGS.md` have no recorded computation and cannot be reproduced to the last digit, so a scoring change cannot update them. Opened by session 19; **appended**. Runs no cells. |
| 22 | COS-29 | styles | **Opened by session 27** from COS-16's branch review, and **appended** rather than slotted in. E3's precedence sentence sits after the router section's closing line, so 'When two of these match' has that line as its nearest plural antecedent instead of the four bullets — an ambiguity introduced by the one edit whose job was to remove one. COS-16 could not fix it: the shipped bytes are the measured bytes, so rewording breaks its AC #6 and ships unmeasured style text. Costs one 300-cell arm against `2026-08-20T03-03-26`. |
| 21 | COS-28 | styles | Advanced states "under 120, headers and code included" while `total_length` counts `stripCode(text)`. A basis mismatch, not a conditional, so COS-15 could not reach it. Opened by session 19; **appended**. Costs a run or a re-score, depending on which side moves. |
| 23 | COS-30 | harness | **Opened by session 28**, and **appended**. `interval` keys pairs on `caseId|model` and ignores the style, so a two-style before file silently averages both styles into each pair and raises no error. It reported rules +1.4 [−0.3, +3.0] and words −14.8 [−30.9, +1.3] on COS-18's own comparison — "the edit did nothing" — where the filtered figures are +3.0 [+0.1, +5.8] and −24.6 [−46.4, −2.8]. Runs no cells. |
| 24 | COS-31 | styles | **Opened by session 28**, and **appended**. Both intermediate and advanced lack a reply-shape router. All 138 shape violations in COS-18's arm fall on non-status cases and none on a status update. Costs one 300-cell arm per style plus reserve. Read COS-29 first — copying beginner's router copies its dangling antecedent. |
| 25 | COS-32 | styles | **Opened by session 28**, and **appended**. Intermediate's unrationed comparison rule (`:28`) and its skip-the-internals contradiction (`:27` against `:33`). Two edits, measured separately. Also carries the decision on advanced's own weak contradiction (`:23` against `:43`). |
| 26 | COS-33 | styles | **Opened by session 28**, and **appended**. Ship COS-18's measured E1 — the re-scoped intermediate cap. **Its shared-five arm is complete and must not be re-run**: rules +3.0 [+0.1, +5.8], words −24.6 [−46.4, −2.8], 300 cells, 0 errored. Only the reserve pair is outstanding, and that is roughly four hours a side at session 28's measured throughput. |
| 27 | COS-34 | measurement | **Opened by session 34**, and **appended**. Advanced x Fable and intermediate x Fable are the two four-tier cells COS-19 could not raise to n>=146 — repeated session-limit errors on `claude-fable-5[1m]` stopped it twice, the second attempt landing 105 of 150. Re-attempt when Fable's session-limit behavior allows a full arm, or size to whatever it can sustain and say so. |

The order is a valid topological sort of the recorded dependencies, and every
phase boundary is a real constraint rather than a preference:

- **1-6, repair the instrument.** No measurement runs. COS-12 is first because
  it is insurance for everything after it. Buying precision on a scorer that
  reads the wrong string, pools errored rows and grades against a
  self-contradicting fixture is a large run spent on nothing.
- **7, characterise the instrument.** COS-20 before the large arms, because it
  may lower the 146-cell figure the rest of the campaign is sized on.
- **8-11, the style text.** Every file change lands before the record is rebuilt,
  so nothing is measured twice.
- **12-13, rebuild the published record.** COS-19 last of these: it re-measures
  the headline table, and it must measure final text.
- **14-15, the two parked bars**, each of which depends on work above it.

**On items 16 to 18.** By nature all three belong in the repair phase — they are
small, they run no cells, and COS-22 and COS-24 are literally tool repair. They
sit at the end anyway because nothing downstream depends on any of them: COS-22
hardens a guard that already enforces the invariant it was written for, COS-23 is
a provenance defect in a generated log rather than in any measurement, and COS-24
changes how the CLI rejects input, not what a correct invocation measures. None
blocks a single item from 6 to 15. A session that wants to promote them into the
repair phase should say so to the user rather than assume, since that reorders a
sequence the user chose from a presented comparison.

COS-24 has the strongest case of the three for being promoted, and the argument
is worth stating rather than leaving implicit: every item from 7 onwards runs a
matrix through this CLI, and the defect's headline case is a mistyped flag that
runs the full default matrix instead of the narrowed arm the operator asked for —
hours of wall-clock producing an arm nobody asked for, and a `--concurrency=abc`
that measures nothing at all. It is a wasted-run risk on work that has not
happened yet, not a defect in work already done. That is a decision for the user,
not for a session.

Both came from the COS-13 branch review, which finished **after** the PR had
merged — the review agent watched `dev..HEAD` go empty underneath it and
re-reviewed the merged tree. That is a protocol hole worth naming: the skill
treats review as a pre-merge gate, and this session ran it in the background and
let the merge proceed. Run the review to completion before opening the PR.

**Cost is not tracked and is not a constraint.** The project runs on a Claude
subscription: the harness's old `costUsd` telemetry was the SDK's list-price
valuation of tokens, not money anyone was charged, and it never entered a style's
score. COS-25 removed it from the harness, the docs and this tracker. Arms are
sized by statistical power alone — an arm at the required **146 non-errored cells
per model** is the working figure, and COS-20 may lower it. Size on cells that
answer rather than cells launched: `reserve-agentic-session` aborts 3 of 6 on
Haiku, and an errored cell contributes nothing to an interval.

What does bound a run is wall-clock. A write-then-verify agentic cell on the top
tier runs roughly 4.8x a conversational one, the `long-prompt` variant about 3.9x
the baseline variant, and `run.maxCellSeconds` (600) aborts any single cell that
wedges. Items 1-6 run no arms at all; the arm-sized sessions start at item 8, and
the largest is COS-19.

Two completeness caveats recorded under COS-5, both about work the record cannot
see. Cells that abort on the turn limit leave a row with no usable reply, so
`22-59-53`'s six failed cells measured real turns that no figure reflects. And one
aborted invocation — `node src/cli.mjs run --help`, which the CLI then treated as
`run` — ran about two minutes at concurrency 4 across the full matrix before being
killed, and wrote no `rows.json` at all. A third under COS-7: a model-id probe
that omitted `--variants` ran five cells instead of one.

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-6 | Task Done — 2026-08-16, session 1 | README-only. All 3 ACs checked against quoted README lines: name resolution from frontmatter `name:` with filename fallback, a "Confirm it loaded" section giving the behavioural check and the canary, and the silent-fallback statement. Scripted checks: all three frontmatter names appear verbatim in the README (3/3); both new doc links resolve. `npm --prefix harness test` 11/11; `lore check` 0 errors after `lore sync`. Review found 3 issues, all fixed on the branch. Merged as `0631c04`. |
| 2 | COS-3 | Task Done — 2026-08-16, session 2 | All 3 ACs proved against a real improve run on the reviewed code, `results/2026-08-16T15-04-22-436Z/` (beginner, Haiku, 2 cases, 1 iteration, 4 cells), after an earlier 18-cell run at `14-48-09` established the same three identities on the first implementation. AC #1: all four per-iteration transcript files present including the reverted v1, and `rows.json` groups 1/1/1/1 across v0 and v1. AC #2: rows sum = `summary.json` totalCostUsd = `improve.json`'s own figure, the side counter deleted in favour of deriving it from the rows. AC #3: `score --rows` reproduced the loop's logged 0.8 / 0.9 / 0.669 / 0.85 exactly, exit 0 with the API pointed at a dead socket and no new results directory; no-arg `score` finds an improve run unaided. Plain-run path unchanged (12-44-03 still 81.0%). `npm --prefix harness test` 23/23 (12 new); `lore check` 0 errors. `/code-review high` found five issues, all real and all fixed on the branch. Merged as `1daff4d`. |
| 3 | COS-2 | Task Done — 2026-08-16, session 3 | All 4 ACs proved on real improve runs against the committed code, not unit tests alone. Six real improve runs. The decisive one is `results/2026-08-16T20-57-54-086Z/` (beginner, Haiku, 1 train + 1 holdout + 2 reserve, 3 iterations, 12 cells): the real optimizer produced a candidate that won train and beat holdout by 29.5 points (0.644 -> 0.99), and was **17.7 points worse on the reserve** (0.623 vs 0.800). The guard rejected it and rolled back — `best.md` came out byte-identical to the shipped `plain-english-beginner.md` (`diff -q`), with the rejected rewrite preserved at `v2.md`. Offline re-scoring shows the ADR's signature exactly: reserve rules flat 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. AC #1 checked by scripted search of persisted rows — 0 reserve case ids in any train or holdout row, reserve files written for v0 and the winner only. AC #2's accept path proved in `20-50-12` (v1 0.582 vs v0 0.591, -0.009, ACCEPT); the no-adoption skip path in `20-47-28` and `20-55-37`. Case pool 9 -> 13 (5/4/4), new cases rather than carved out. `npm --prefix harness test` 34/34 (11 new); `lore check` 0 errors. `/code-review high` found six issues, all real: five fixed on the branch — including a config footgun where a missing `minReserveDelta` would have silently rolled back every run — and the sixth raised as COS-9. Merged via PR #4 (rebase) as `2d4bcb4`. |
| 4 | COS-8 | Task Done — 2026-08-16, session 4 | All 4 ACs verified; the caps question was settled by trying the change and measuring it, not by argument. AC #4 first and free: new `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`, exposed as `node src/cli.mjs audit` (exit 1 on disagreement) and 11 test cases; suite 34 -> 45. Proved by re-creating the divergence that actually shipped (contracts back to beginner 15/3, intermediate 18): 3 FAILs, CLI exit 1, `npm test` 43/45. AC #1: measured `results/2026-08-16T12-44-03-883Z/` — all three levels already write the same sentence length (beginner 12.3, intermediate 12.4, advanced 11.5 words), so the lower levels are not being served shorter sentences today; paragraph caps settled offline for free as inert (1.4-1.8 sentences against a cap of 4; re-scoring at cap 3 moves the check 0.000-0.017). An 8-cell Haiku probe (`22-18-53`) said a 12-word cap works — 16.6 -> 12.3 words, over-cap 30% -> 11% — and the user ratified tightening on it, conditional on both-model validation. AC #3 killed it: paired opus+sonnet run over 6 cases spanning all three splits (`22-27-15`, 24 cells) moved mean sentence length **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter, judge 0.557 -> 0.532, reply length 105 -> 114. Reverted; `git status` clean on both files. AC #2 is checked but vacuous — nothing shipped tightened; the mechanism was exercised (file first, contracts second, audit caught the in-flight mismatch) before the revert. `/code-review high` found seven issues, all real and all fixed on the branch — including a fourth-consecutive-session prose-number defect (the spec quoted Haiku's over-20-word rate against an over-12-word metric) and the guard not being wired into the optimizer runbook's adopt step, where it would predictably have turned `npm test` red on a legitimately-won rewrite. Suite 34 -> 47. Merged via PR #5 (rebase) as `ac1a161`. |
| 5 | COS-5 | Task Done — 2026-08-16, session 5 | All 3 ACs verified against `results/2026-08-16T22-59-53-852Z` (3 styles x haiku x baseline x **13 cases** x 2 repeats = 78 cells). AC #1 ran the full pool, not the 5 cases the old baseline used. AC #2 was satisfied **without re-running opus/sonnet** (which would have meant a fresh 156-cell arm): the new haiku rows were sliced to the same 5 case ids `12-44-03` used, after verifying in git that those 5 case definitions are byte-identical across 444b221/8a76f13/49fd1fa/HEAD and that the style files, `checks.mjs` and `contracts.json` are unchanged between the runs; re-scoring `12-44-03` offline reproduced its 12 published FINDINGS figures to the tenth of a point. Zero errored cells in that slice on any model. Result: rules survive the drop to the smallest tier (haiku 90.9–96.0, never more than 1.8 points behind the better of opus/sonnet, and ahead of opus on intermediate); judge does not (37.5–62.2, last on all three styles) — which also closed the one-style-file ADR's open item that the smallest tier was untested. AC #3's failure mode is **turn-limit exhaustion, not wording**: 6 of 78 cells returned no reply at all, every one a 12-turn abort on a case that edits a file then runs tests. Like-for-like on `agentic-fix-verify`, the one such case all three models have run: haiku 5 aborts in 6 cells, opus 0 in 6, sonnet 0 in 6. It hit all three styles, so no rewrite fixes it. Because an empty reply scores 0.0 on every rule, pooling those cells understates haiku's rule compliance ~10 points — FINDINGS.md now reports "replies only" and "counting no-reply as 0" separately. **The predicted failure mode was refuted**: measured with `checks.mjs`'s own `words()`, haiku averages 11.8w on the shared 5 and 12.0w on the full pool, and **sonnet** is the long-sentence model at 13.5w. The probe's arms re-derive exactly, but its 16.6 is not haiku's baseline — the same configuration measures 12.1w at 8 cells and 12.2w at 25. Decisively, the probe's case was a 12-word cap cutting the over-12 share 60.0% → 40.5%; haiku's *untightened* share is 38.4–43.0%, so 40.5% sits inside its own range. Stated as "the evidence for an effect is gone", not "there is no effect", since the tightened arm is also n=4. COS-8's revert stands and is strengthened; its mechanism is corrected in the ledger, the audience-level spec and `harness/README.md`. Also fixed rather than only documented: `run --help` launched the full matrix (new `src/usage.mjs` guard, unknown command now exits 2). `npm test` 47 → 52; `audit` exit 0; `lore check` exit 0. `/code-review high` raised 10 findings, all real and all addressed. Merged via PR #6 (rebase) as `14d72ea`. |
| 6 | COS-7 | Task Done — 2026-08-16, session 6 | All 4 ACs verified. Three real runs — the campaign's largest session and its last measurement task. `23-47-08` (5 cells) confirmed the SDK accepts `claude-fable-5[1m]` before the matrix launched. `23-48-45` (30 cells, **0 errors**) is the Fable baseline on the same five case ids, style text, scorer and variant as `12-44-03`. `23-53-02` (6 cells, 0 errors) added `agentic-fix-verify`, the one case that discriminated the tiers. Reuse of `12-44-03`/`22-59-53` as the other three columns was re-verified, not assumed: the five case definitions are byte-identical across 444b221/3370e4d/8a76f13/49fd1fa/HEAD, `checks.mjs` and all three style files are byte-identical 444b221→HEAD, and because `contracts.json` did change once (3370e4d, after `12-44-03`) the question was settled by re-scoring both runs offline — all twelve published figures reproduced exactly. **AC #1**: advanced 97.9/78.3, intermediate 93.1/67.7, beginner 91.4/53.9. The top tier does not sweep — last of four on intermediate rules, behind Sonnet on intermediate judge. **AC #2**: FINDINGS.md's per-model table, the epic snapshot and the story's coverage table all carry four columns. **AC #3 — word-cap overrun does not track tier.** Mean reply words ÷ that style's own cap, counted with `checks.mjs`'s own `words()`: Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300; in tier order the sequence turns twice. Paired over the 15 (style × case) cells, the smallest model overruns significantly MORE than the second smallest (+0.127, 95% CI [+0.034, +0.219]) and the top two tiers are indistinguishable (+0.070, CI [−0.118, +0.259]). Sonnet is the outlier that keeps to the cap; there is no gradient. The doc's "roughly twice as often" is from a run whose style text has since been replaced — on the shipped files it is 1.44×. **AC #4 — one-file decision confirmed** at the top of the range: Fable drops the same rule subsets the others do, never more than 2.5 points behind the best of the other three, the eight rules it does not drop scoring 96.7–100.0 on all four tiers at once. One ADR overstatement corrected while confirming it (the ranking is identical for rules, but the judge's top two swap: Haiku/Sonnet rank intermediate above advanced, Opus/Fable the reverse — already present in the three-model data). Beyond the ACs: Fable aborts **0 of 6** on `agentic-fix-verify` where Haiku aborts 5 of 6, on the project's largest cells, but its own compliance falls 94.1/66.6 → 79.5/41.2 there with `leads_with_conclusion` at 16.7 — on `agentic-read-report`, the one agentic case all four tiers ran under the current style text, `leads_with_conclusion` is sonnet 100.0, opus 50.0, haiku 16.7, **fable 16.7** — the top tier level with the smallest and both far behind the middle two, which makes pre-tool narration a Claude Code habit rather than an Opus trait. Reading those transcripts found a harness defect, raised not patched (see below). Fable deliberately kept OUT of `matrix.json`'s `models`, which is `improve`'s default too. `npm test` **52 → 56** (new `harness/test/config.test.mjs`); `audit` exit 0; `lore check` exit 0. `/code-review high` raised 9 findings, all real and all addressed — the serious one being statistical over-claiming in my own word-cap section, where six paired comparisons on the same 15 units were run without multiplicity adjustment and three bolded as significant; under Bonferroni only one survives, and the units are 3 styles x the SAME 5 cases so the intervals were too narrow besides. The section was rewritten to rest on the point estimates instead, which need no inference and give the same answer. Merged via PR #7 (rebase) as `0747cc8`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. |

**Campaign 2.**

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-12 | Task Done — 2026-08-17, session 9 | All 4 ACs verified, and AC #4 required a real kill rather than a unit test. Two real Haiku runs. `results/2026-08-17T05-29-31-663Z` (beginner, Haiku, baseline, 4 conversational cases, repeats 1, concurrency 1, judge on) was SIGKILLed — `kill -9`, no handler, no graceful shutdown — the moment `run.json` read `completed=2`. Both survivors came back fully scored: `conv-status-auth` rules 0.985 / judge 0.62 / total 0.802, `conv-decision-db` rules 1.0 / judge 0.58 / total 0.79. The killed process never printed its `wrote` line, so nothing but the per-cell flush put those files on disk (**AC #1**). `run.json` read `complete: false, completed: 2, expected: 4` (**AC #2**), and `score --rows=` exited 0 printing `PARTIAL run — 2 cells of 4 expected (2 never ran)` above every table (**AC #3**). `results/2026-08-17T05-31-40-879Z`, the same configuration allowed to finish, writes `complete: true` and `score` says `complete run — 1 cell`. Design: `rows.json` stays a bare array — every run in the ledger is one and every offline re-derivation reads it as one — so completeness lives in a sibling `run.json`, and every file is written through a temp file and `rename(2)` so a kill mid-write cannot truncate the measured data. The manifest is written last on purpose: it can then only ever undercount what is on disk. New `harness/src/results.mjs` owns the directory; `evaluate()` gained `onRows` (per completed cell, indexed by cell so a partial file is ordered like the complete one it would have become) and an injectable `runCell`; `improve` uses the same writer. Regression check: re-scoring `12-44-03` still returns 81.0%, so the flush moved no published figure. `/code-review high` raised four findings, all real and all fixed on the branch: a partial `report.md` was indistinguishable from a complete one (it now opens with the manifest sentence as a blockquote, the same device `report.mjs` already used for optimizer traces); the PARTIAL line went to stderr while every figure went to stdout, so `score > figures.txt` dropped it — and that was a *new* exposure, because a bare `score` resolves to the newest run and only now can the newest run be a partial one; `improve` stamped `complete: true` even when every style threw; and `improve.json` was written after the manifest, contradicting the manifest-last invariant this change itself asserts. `npm --prefix harness test` **64 → 79**; `audit` exit 0; `lore check` exit 0. Completeness caveat now recorded in the ledger: the cell in flight when the kill lands has spent tokens no row will ever carry, so flushing recovers completed cells, not the interrupted one. Merged via PR #10 (rebase) as `b735501`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. |
| 2 | COS-10 | Task Done — 2026-08-17, session 10 | All 5 ACs verified. Three real Haiku/Opus/Sonnet cells. `run.mjs` no longer does `text += b.text`: it keeps the assistant's blocks in order and `splitTurn` derives `trace` (all text blocks joined by a blank line) and `final` (the blocks after the last tool call, falling back to the last block said if the turn ended on one — `''` would score 1.0 on every "no X found" check). The row carries `text` = final, `trace`, `allTurns` (per-turn trace) and `allFinals`. **AC #1 was measured, not read**: run `06-21-53` (2 cells) caught an Opus cell making 8 tool calls and opening *"I'll look at the file first."* — `trace` 642 chars, `text` 612, the difference being exactly that narration. Segmented with the project's own `sentences()`, the glued string the old code would have saved reads one **22-word** opening sentence, over beginner's 20-word cap; `final` reads it at **17 words**, under it; `trace` reads the narration as its own 6-word sentence. One check changes answer on one cell — the whole defect in miniature. The Sonnet cell aborted on the turn limit and wrote `trace: ''`, exercising the error path; `06-21-03` (1 cell, Haiku) made a tool call with *no* pre-tool text and returned the two views byte-identical, which is the case the fix has to leave alone. **AC #2**: every entry in `CHECKS` declares `reads: 'final' | 'trace'` and the value is copied onto each saved check row, so a figure lifted from `rows.json` says which string produced it. The line comes from the case rubrics, not taste — three of the four agentic rubrics say "the final message ... in style", so checks measuring how the answer is written read `final`; rules the style states as outright bans (narration, celebration, emoji) read `trace`, because those are violations wherever they appear. The judge reads `caseDef.judgeOn`: `agentic-read-report` → `trace` (its rubric grades narration of the search), the other three agentic cases → `final`. Both are enforced by tests, and the chosen judge view is saved as `judgeReads`. `scoreDeterministic` now throws a TypeError on a bare string so no caller could be missed silently. **AC #3/#4**: `sentences()` splits on a single newline; against HEAD's code the new tests move "Here's why:\nYou're paying twice." from 1 sentence to 2, a two-item list from 2 to 3, and `sentence_length` at an 8-word cap from 0.0 to 1.0 — and `splitTurn`/`viewsOf`/`VIEWS` do not exist on HEAD at all, so the whole new block fails to link against it. **AC #5 is the one that took the session.** All 61 saved runs were re-scored on both codebases and compared per run, per scope and per check. The seam half **cannot be applied backwards** — gluing is lossy — so every published agentic figure was re-scored to confirm the applicable half leaves it unchanged (`paragraph_length` on `agentic-read-report` 100.0/100.0/100.0/95.8 by tier; Fable `agentic-fix-verify` `paragraph_length` 16.7, `leads_with_conclusion` 16.7, rules 79.5; `leads_with_conclusion` on `agentic-read-report` 50.0/100.0/16.7/16.7) and then **explicitly labelled as measured on the glued turn** in `FINDINGS.md`, the ledger, `harness/README.md` and both story docs. The newline half *is* re-derivable and was: rule totals move at most +1.07 points on any run and scope, and 0.00–0.34 on every run behind a published four-tier figure — inside the noise floor — but segmentation figures move more and were corrected in place (FINDINGS' per-model table Opus 10.6→10.2w/7.9→6.3%, Fable 11.1→10.7/9.6→8.8%, Haiku 11.3→10.1/10.0→8.1%, Sonnet 13.4→12.9/20.3→19.5%, Haiku full-pool 11.5→9.6/10.6→7.0%; the ledger's probe table 16.6→15.5, 12.1→10.8, 12.2→10.4 words and 60.0→56.3%, 43.0→35.2%, 38.4→30.2%). **Every pre-fix figure reproduced exactly before its replacement was quoted**, which is what makes the deltas trustworthy. One published conclusion needed restating: the ledger argued the 12-word cap did nothing because the tightened arm's 40.5% over-12 share sat *inside* the untightened range 38.4–43.0%; re-segmented it reads 38.5% against 30.2–35.2%, i.e. **above** the range, and the paired CI moved from [0.06, 8.07] to [−0.17, 8.03] — from barely excluding zero to including it. The conclusion holds and is firmer; it was restated rather than left standing. `/code-review high` raised six findings, all real; five fixed on the branch. Two were ways a cell could earn free credit — `paragraph_length`'s list exemption saw only a paragraph's first character, so once bullets became sentences a five-item list failed a cap of four; and `code_block_size`/`no_jargon` read the final message despite being ban lists, so a 30-line diff dumped before the last tool call scored clean on the two heaviest beginner checks. A third, an unrecognised `judgeOn`, handed over the whole judge weight silently. The review also caught this session's own ledger sentence claiming the re-segmentation moved 'at most 1.07 points, all of it in `sentence_length`' — wrong on both counts, since `paragraph_length` and `active_voice` re-segment too. The sixth finding (a non-errored empty cell scoring 0.931 on rules) is pre-existing and byte-identical on `dev`; recorded for COS-11, and the README claim it contradicted was corrected here. `npm --prefix harness test` **79 → 94**; `audit` exit 0; `lore check` exit 0. |
| 3 | COS-11 | Task Done — 2026-08-17, session 11 | All 5 ACs verified, **no new cells** — every criterion was satisfiable from saved rows. One predicate, `producedReply(row)` in `checks.mjs`, now decides both whether a cell may be scored and whether it may be pooled into a mean. It is keyed on the turn, not on the SDK error flag, which closes the wider version of the same bias COS-10's review found: a cell that goes silent *without* the flag scored 0.931 on rules for beginner on `agentic-fix-verify` — every "no X found" check finds no X — plus the free judge 1.0, landing near 0.95 for saying nothing. **AC #1/#4, the two biases in one run**: re-scoring `22-59-53` (78 Haiku cells, 6 turn-limit aborts, the run the AC names) moves haiku rules **84.2 → 91.2** and haiku judge **47.0 → 42.6** — up and down, same run, no cancellation. On the case that actually aborts, `agentic-fix-verify`, rules go 10.3 → 62.1 and judge 85.8 → 15.0 at n=1/6. Pinned by a test that asserts both directions at once rather than by that table. **AC #2**: a group with no replying cell reports `null`, not 0 — zero is a score, the worst one, and would publish "we could not measure this" as "it failed every rule". Seen live on `01-33-41`, where advanced @ haiku aborted 2 of 2 and now prints `unmeasured / n/a`. **AC #3**: every group in `summary.json` carries `n` (cells behind the figure), `noReply` and `cells`; `report.md` renders all three as columns and a **Measured over:** header; the console tables print `no reply=k/N`. **AC #5**: all 41 saved runs were swept, not just the one named. Five hold a silent cell (`14-48-09` 1/18, `22-59-53` 6/78, `01-03-21` 1/24, `01-33-41` 3/6, `06-21-53` 1/2) and in **all five the flag was set**, so the no-flag case still has never appeared in a saved run and changes no published figure today. Each published figure was then checked against the run behind it: the `22-59-53` ledger row and FINDINGS' four-tier table are unchanged (both quote the five shared conversational cases, where nothing errored); the ledger's `94.2 → 83.4 on advanced` reproduces exactly; `01-03-21`'s row already quoted "43.6 with the errored cell excluded (45.9 if it is pooled)" and needed no correction — it was written by a session that remembered the discipline. **One published conclusion moved**: `14-48-09`'s ledger row read "On holdout the rewrite showed the usual signature — rules 70.8 → 83.3, judge 72.5 → 21.2". One of its four v0 holdout cells was an `agentic-fix-verify` abort; excluded, v0 holdout is rules **94.3** and judge **63.3**, so rules fell too and both halves fell on both splits. The holdout delta is −0.265, not the −0.193 the loop recorded. The REVERT verdict is unchanged. Corrected in place, with the pooled figures kept, because they are what the loop actually decided on. The five consumers of `summarize()` were enumerated before anything was claimed (the COS-10 lesson): `evaluate()`, `results.mjs`, `cli.mjs run`, `cli.mjs score` and `improve.mjs` — the last reads `summary.overall` for KEEP/REVERT, and `null - 0.65` is `-0.65` in JS, so an unmeasurable arm would have read as a regression or a win by accident; an incomparable side is now always a REVERT. `cli.mjs score` branched on `r.text` where the live path branched on `error && !text`, so the two disagreed on a cell that errored while emitting text — both now use the one predicate, which is what makes AC #5's re-derivation a re-derivation. `npm --prefix harness test` **94 → 104**; `audit` exit 0; `lore check` exit 0. |
| 4 | COS-13 | Task Done — 2026-08-17, session 12 | All 4 ACs verified, **no new cells** — every criterion was settled by running the fixture. The reported defect (an assertion of 850 beside a comment computing 849) was one of **three of the same shape, and not the worst**. Found by running the pristine fixture before touching it: `node --test test/pricing.test.mjs` gave `tests 3 / pass 2 / fail 1` — `priceOrder` asserted **966 where the code returns 965**, so **the suite was red on a clean checkout**. 966 is exactly what you get taxing *before* discounting (`applyDiscount(withTax(1000,'US'),10)` = 966), so that number contradicted the test's own name, one line below the contradiction that was reported. `workspace.mjs` copies this fixture into every workspace and three of the four agentic cases ask the model to run the tests, so every model that did met a failure it had not caused and that had nothing to do with the rounding bug — the more thoroughly it worked, the more of this it met. Third defect: the `BUG:` comment read "yields 670 instead of 670", a number differing from itself, and cited a case that does not exhibit the bug at all (1000*0.33 = 330 exactly, so floor and round agree). Fourth: the module header claimed cents "everywhere except the public API" while every export takes and returns cents. **AC #1/#2 turn on one decision.** Three candidates for the 999/15 assertion: assert 849 (the fixed value), assert 850 (the current value, honestly labelled), or drop it. Settled against one invariant — *after a correct fix the suite must be green*, because a suite that breaks when the model does the right thing is precisely the adjudication noise this task exists to remove. That kills "assert 850". Between the other two, AC #2 decides: asserting 849 makes the suite **red on arrival with a failure naming both the file and the expected value**, which hands `reserve-agentic-session` its answer from one command — the case whose own note says it "withholds both, which forces search, read, run, edit and re-run" — and re-creates for `reserve-agentic-write` the same unrelated-red-test noise defect 1 was causing. So the assertion was dropped. No coverage lost: `applyDiscount` is still exercised by the 1000/33 case, whose value is identical under floor and round. Verified both directions: pristine `pass 2 / fail 0`, and a temp copy with `Math.floor` → `Math.round` also `pass 2 / fail 0`, with the bug still behavioural (850 pristine, 849 fixed). **AC #3** was a full sweep, not a spot check: `lineTotal`, `applyDiscount` (both comment claims), `withTax` (US/UK/DE/unknown country), `priceOrder` composition and defaults, and both surviving assertions, each recomputed independently — all OK, and the composition check proved the test name is discriminating (discount-then-tax 965, tax-then-discount 966). **AC #4 labels rather than re-derives**, because items 12 and 13 rebuild the published record and re-running now would measure twice. The COS-10 glued-turn wording was extended in `FINDINGS.md`, `harness/README.md`, the ledger and `extend-measurement-coverage.md`, and the caveat is stated as deliberately *weaker* than the glued turn — it changes what the model met, not what the scorer read, so `agentic-read-report` and every conversational figure are explicitly excluded. **A new guard, `harness/test/fixture.test.mjs`** — the task itself notes this was found by reading a transcript rather than by a check, and nothing in the suite executed the fixture. It was written wrong **twice**, and both were caught by deliberately breaking the fixture rather than by the tests going green: (1) it could not fail at all, because `node --test` sets `NODE_TEST_CONTEXT=child-v8`, the child inherited it and reported over a serializer channel instead of exiting non-zero, so `execFileSync` never threw — reintroducing the 966 assertion left all 116 tests green; (2) after that fix, an empty suite still counted as green, because `node --test` reports a file containing *no* tests as `pass 1`, so a "pass count > 0" liveness check accepted a fixture whose tests had been deleted. Fixed with an env scrub plus `spawnSync` status checking, and by comparing reported passes against the number of `test(` declarations in the file. **`/code-review high` raised six findings, all real.** One had already been fixed on the branch (the session caught independently that its own "do not correct this to 966" comments were leaking, in the file the model reads, exactly what the AC #2 decision refused to leak). Of the other five, the one that matters most is a **fourth pre-existing defect**: the fixture is copied to the workspace *root*, so it has no `package.json` above it the way it does in this repo, and it had none of its own — `npm test` exits with `ENOENT` before a single test runs. Only `node --test` worked, and nothing told the model that. Same defect class as the reported assertion, one command earlier, and invisible to a guard that only ever invoked `node --test`. Fixed with a fixture `package.json` and a fifth guard assertion that runs `npm test` in a workspace-shaped copy. Two more were in the guard itself: it parsed the spec reporter's output while scrubbing only `NODE_TEST_CONTEXT`, so `NODE_OPTIONS=--test-reporter=tap` made it report **two failures against a green fixture** — accusing it of the defect just fixed; and its liveness count matched `test(` only at column 0, so indenting the cases inside a `describe()` would have failed a healthy fixture. Both fixed and both verified in each direction. The fifth: the corrected `BUG:` comment had *sharpened* a leak rather than only removing a contradiction — it named the file, the case and both values, the payload the guard's own fourth test forbids in the test file — so it is trimmed back to the original's information content. Final falsification sweep: reintroduce 966 → 3 failures; pin 850 → 2; fix the bug in the fixture → 2; delete its tests → 2; delete its `package.json` → 1; rename `test(` to `it(` → 0; wrap in `describe()` → 0; restored → 117/117. `npm --prefix harness test` **112 → 117**; `audit` exit 0; `lore check` exit 0 (24 files). |
| 5 | COS-14 | Task Done — 2026-08-17, session 14 | All 4 ACs verified, **no new cells** — every criterion is about which model list `improve` reads, and none of them needs an optimizer run. `cli.mjs:68` resolved one array before the subcommand branch and handed it to both paths, so a model added for `run` ran once per candidate per iteration of every loop started the documented way (`README.md`'s quick-start passes no `--models`). `resolveImproveModels` in `improve.mjs` is **not given** `matrix.models`, so inheriting `run`'s list is now structurally impossible rather than avoided by convention; precedence is `--models` > `matrix.improve.models` > a named `['haiku']` default with a warning, the shape COS-8 used for a missing `minReserveDelta`. `improve.models` is set to the three models `improve` already ran, so behaviour moves by nothing on their own. The decisive check was running both subcommands with the two lists deliberately divergent: `improve` printed `models: haiku (matrix.improve.models)` while `run` printed `3 models`, in the same session, without running a cell — zero cases makes the baseline unmeasurable, so the loop stops before buying a candidate, which is what makes an end-to-end check of that path run no cells. `npm --prefix harness test` **117 → 122** (CLI override, config list, absent key warns to the default, empty array treated as absent, real config resolving to its own list); `audit` exit 0; `lore check` exit 0. Also corrected the two docs that stated the coupling as fact — `harness/README.md`'s models bullet and `docs/stories/extend-measurement-coverage.md`'s notes. Merged as PR #14. |
| 6 | COS-9 | Task Done — 2026-08-17, session 17 | All 3 ACs verified, and AC #3 was settled by an old-vs-new diff rather than an assertion. **The defect**: dropping the literal "Option A / Option B" requirement — the right call, and still right — left `two_options_max` with no option cap at all for a reply that never writes a label, so three alternatives walked through in prose scored a clean 1.0. **The fix**: the cap term now keys on `max(labelled.size, statedCount, pivots + 1)`. `statedCount` reads a reply that says its own count ("three ways", "four approaches"); `two` is deliberately absent, since stating two is the rule being followed. `pivots` counts the phrases that introduce each alternative past the first — "another option", "alternatively", "or you could", "a third approach" — so zero pivots reads as one option, not zero. **AC #2 first, deliberately**: three new fixtures pin the recommendation-first prose reply at exactly 1.0, and they passed on the unmodified check before the fix existed, which is what makes them a regression guard rather than a tautology. **AC #1**: three sprawl fixtures — stated count, pivot chain, ordinal chain — all below 1.0 with the evidence string asserted. Both estimators sabotage-verified independently (each disabled in turn: 132/133, the failure landing on the intended test; restored 133/133). **AC #3**: a baseline was captured before the check was touched. Per-row, a probe scored every saved row across all 62 `results/*/rows.json`; 96 carry the check and **exactly one moved** — `22-59-53`, beginner on Haiku, `reserve-three-options`, 1.00 → 0.70. It is a true positive: that reply labels Option A and Option B, tells the reader they "have three paths", and closes by naming the third in prose — two labels, three alternatives, on the one case COS-2 wrote to provoke exactly this. In aggregate, 61 of 62 re-scored runs are byte-identical; the one that moved shifts beginner@haiku 63.4 → 63.3 (rules unchanged), `reserve-three-options` 67.0 → 66.7, reserve rules 88.1 → 88.0. **No published figure moves**: `reserve-three-options` appears in no doc, and every published claim about `22-59-53` rests on the five shared cases, the judge (saved, not re-derived), or its abort count. The three figures the task flagged as at risk all sit on runs the per-row diff shows unmoved. The ledger's "Instruments needed fixing mid-project, twice" read as the final word on this check and no longer was, so it now records the third pass, the one row that moved, and what the check still cannot see — sprawl with no stated count and no pivot, which is the judge's, because counting alternatives semantically would re-break the reply the first fix was for. Reviewing the new detection by probing it — not by reading it — found two defects it introduced, both fixed with their own sabotage-verified tests: "three ways" fired on benefit lists ("it helps in three ways: fewer retries, lower cost, and no drift"), so `ways` now has to point at a course of action (`ways to`, `ways forward`) while the other nouns stay unconditional; and the check read raw text where every other shape check in the file strips code first, so "or you can" in a code comment counted as an option. A second round, an adversarial subagent, returned six findings — the same two, plus four more, all real. The one that mattered killed an estimator: connective pivots ("alternatively", "or you could") scored a compliant two-option reply at 0.70, rebuilding the exact defect the label-blindness rewrite existed to remove, on the third attempt to fix this check. Verifying that claim against the corpus made the case decisive — the connective set matches **zero** of the 96 re-scorable rows carrying the check, while the stated count matches exactly two, both `reserve-three-options`. Counting alternatives now requires a claim ("a third approach", "another option") rather than a pivot. Also fixed: two literals that could drift into a silent `NaN`, costing a reply the cap point with no evidence line saying why; and a label pattern with no trailing boundary that read "the obvious option adds latency" as option A. Corrected my own error in the ledger denominator — 106 rows carry the check, 96 are re-scorable, the rest name optimizer candidates with no contract. **The re-score was re-run after every round and never changed**: one moved row, 61 of 62 runs byte-identical, the same three figures, across five versions of the check. Round 3 added two more, both mine: a reply that names a count in order to reject it is read as claiming it — documented as a limit rather than patched, because separating them needs negation scope and a fragile heuristic there would repeat the connective mistake — and the evidence string renamed from "presented in prose" to "claimed", since the count can come from a bullet list or from digits and is never a count of things counted. Published figures settled by the model split rather than by provenance: **0 of 34 Opus rows and 0 of 32 Sonnet rows move**, and both published `two_options_max` figures are Opus/Sonnet numbers. `npm --prefix harness test` **131 → 135**; `audit` exit 0; `lore check` exit 0 (24 files). |
| 7 | COS-20 | Task Done — 2026-08-17, session 18 | All 5 ACs verified. **No cells run for the measurement itself** — the whole study re-judges replies a finished run already saved. **The blocker was the missing path**: `score` re-runs deterministic checks only, and `judge()` was reachable only from `evaluate.mjs` per live cell, so nothing could re-judge a saved row. New `harness/src/rejudge.mjs` plus a `judge` subcommand plan, grade, decompose and report; 18 new tests, suite 135 → **153**. `judge()` gained an `ok` flag: it substitutes a score on four paths (no rubric, no text, failed call, unparseable output) and all four land inside the range real scores occupy, so a substituted 0.5 pooled into a variance study reads as the judge disagreeing with itself. Scoring behaviour is unchanged; only the new path reads the flag. **The run**: `results/2026-08-17T16-47-17-091Z`, 720 calls over the 60 saved replies of `12-44-03` (the per-model baseline), judged by Sonnet, Opus, Haiku and Fable, 3 times each. 6 calls returned unparseable JSON, all Haiku, all beginner, all excluded rather than pooled. **AC #1**: beginner under Sonnet — the arm COS-4's 24.6 describes — decomposes by one-way random-effects ANOVA into SD total **24.76 = 10.17 judge + 22.58 reply**, judge 16.9% of the variance and 41% of the SD, ICC 0.831. That the total reproduces 24.6 on a different arm, and that the six style x model arms span 22.33–31.31 against the ledger's quoted "22 to 32", are independent confirmations of both published figures. Corroborated from the other side: the saved Sonnet score against a fresh Sonnet mean over the same 60 replies is +0.26 [−4.11, +4.62] in the mean but MAD 10.81 per reply, max 55.7 — exactly the 11.5 MAD two draws at SD 10.17 predict. **AC #2**: three other tiers, paired per reply, per style and per case. Opus +2.36 [−1.43, +6.14] (no detectable shift), Haiku +10.80 [+6.81, +14.78], Fable +6.89 [+3.60, +10.18]. Disagreement is largest where the score is lowest: on beginner, Haiku is +18.01. Rank agreement is 0.83–0.89 overall and **collapses to 0.007** on `conv-followup-drift`. **AC #3**: the reply dominates, so the arithmetic barely moved — 24/49/95/148 cells per model for ±10/±7/±5/±4 against the ledger's 24/48/94/146, and 48/97/189/295 between arms against 47/95/187/291. Corrected in place. What is new is a **floor**: repeat-judging touches only the judge's 17%, so ±4 is 148 cells at one judge call, 131 at three, and never below **123**. **AC #4** answered against the task's own expectation. Going from k to k+1 judge calls beats spending the budget on cells only when a cell costs fewer than (k+1)(varReply + varJudge/k)/varJudge − k judge calls — 10.9 at k=1. Both sides measured, not assumed: a conversational Sonnet cell 5.4–15.1s (mean 10.5s, `results/2026-08-17T17-09-49-361Z`, `--no-judge`), a Sonnet judge call 6.1s median. **One cell costs about one judge call, not eleven, so judge once and buy cells.** The ratio flips only where a cell is genuinely expensive against the judge — an agentic cell at the 600s cap graded by Opus is 79 — and that is a measurement to take, not to assume. **AC #5**: four conclusions move and one survives. Beginner's verdict against its 70 bar is judge-dependent — the Sonnet gap is 11.9 points and Haiku's measured beginner shift is +18.01 [+12.34, +23.68], an interval lying entirely beyond it. The four-tier table's Opus-vs-Sonnet ordering flips sign between judges on deltas of 0.8–2.9 points, which says it was never resolvable. The advanced-to-intermediate gap is 2.7 under Sonnet and 10.0 under Opus and Fable. Any per-case conclusion from `conv-followup-drift` is judge-dependent. **Surviving**: advanced > intermediate > beginner under all four judges, and the intermediate-to-beginner gap narrows from 25.2 to 13.0 without closing. Docs: a new "Judge validation runs" section in the ledger with its own table and manifest convention, the noise-floor section split into its two halves, runbook sections for `judge` and for sizing an arm, `FINDINGS.md` and the story updated, and a `matrix.json` note saying why `judgeModel` stays `sonnet` despite being the least repeatable tier — every published judge figure was scored by it. `npm --prefix harness test` 135 → **153**; `audit` exit 0; `lore check` exit 0 (24 files). |
| — | COS-25 | Task Done — 2026-08-17, sessions 15 and 16 | Out of band, at the user's direction; the cursor stayed at COS-9 across both. All 7 ACs verified. `costUsd`/`totalCostUsd`/`spentUsd`/`spendOf` deleted from `harness/src` and `harness/test`; no `rows.json`, `summary.json`, `run.json` or report output carries a cost field, confirmed on a real written run directory. `matrix.json`'s `run.maxBudgetUsd` replaced by `run.maxCellSeconds: 600`, enforced by an `AbortController` in `runCell` — the only hard stop the SDK offers, since `maxTurns` bounds tool rounds but not the time inside one and `taskBudget` is advisory. **AC #5 was observed, not read**: new `harness/test/run.test.mjs` drives `runCell` to a real abort through an injected `query` seam (wedge-then-throw, wedge-then-quiet-end, a control that finishes in time, and a config-validation case), and both failure modes were sabotaged on purpose to prove the tests can go red. Two hazards found while writing the guard: `undefined * 1000` is `NaN` and `setTimeout` treats `NaN` as 0, so a config missing the key would have aborted every cell in the matrix instantly and labelled each one a timeout — `runCell` now throws instead of defaulting; and an abort can end the SDK iterator quietly rather than throwing, which would return a scoreable row with no reply, so a `timedOut` flag is the authority on the error rather than the thrown exception. Docs swept: the ledger's cost column and per-row dollar prose, `FINDINGS.md`, the runbook, four stories, the epic, two references, three ADRs, one spec and both READMEs. Sample-size claims kept their statistical basis and lost only the price annotations — the 146-cell figure now reads as what ±4 points requires at SD 24.6. Verbatim user quotes were left intact rather than rewritten. Done-task bodies deliberately out of scope as the immutable evidence record. Suite 124 → 126 (2 cost-only tests removed, 4 guard tests added); `audit` exit 0; `lore check` exit 0. Re-scoring `12-44-03` still returns 81.0%, so no published score moved. **Session 16 then fixed the five findings `/code-review high` returned, none of which session 15 had touched.** (1) `turns` was declared inside `runCell`'s try, so the catch returned empty arrays: a multi-turn case whose first turns completed and whose last wedged lost every completed transcript on the throwing abort path while the quiet path kept them — identical events, different rows, decided by SDK internals. `turns` and a shared `base` row are hoisted above the try; a new test drives the same two-turn cell down both paths and asserts they report the same completed turns, and restoring the old catch reds exactly that test. (2) The judge and `rewrite()` calls are still unbounded; the user chose to narrow the wording rather than widen this task, so `matrix.json`, `harness/README.md` and `docs/reference/harness-architecture.md` now say the guard bounds a cell and not a run, name both unbounded calls, and cite **COS-26**, opened to close it. (3) `matrix.json` said "lower it only against measured cell durations" and `harness/README.md` said 600 was "sized well above any cell observed here" — and nothing in the harness had ever recorded a cell duration, in the same change that deleted `costUsd`, the only per-cell size proxy the project had. Fixed by measuring rather than hedging: every row now carries `elapsedMs`, started with the timer so it spans exactly what the guard bounds, verified through `evaluate` → `writeResults` onto `rows.json` on disk. (4) `maxCellSeconds` was validated per cell, so a config typo read as an optimizer crash under `improve` and surfaced under `run` only after an empty `results/<stamp>/` existed; `cellLimitMs` is now exported and called once at CLI startup for `run` and `improve`, with `runCell` keeping it as a backstop and `config.test.mjs` asserting the shipped config against the shipped validator. (5) The claim that `wsp.cleanup()` orphans subprocesses was **measured rather than accepted**: a real 3s-limit cell, sampled before and five times after, showed one `claude` process holding the just-unlinked workspace as its cwd at T+0 and none by T+2s, with the workspace count back at baseline immediately. The window is real, bounded and inert — no leak, no shared directories — so the measurement is recorded as a comment and nothing changed. Suite 126 → **129**; `audit` exit 0; `lore check` exit 0 (24 files). |
| 9 | COS-16 | Task Done — 2026-08-19, sessions 20 and 27 | The first style-text change this project has shipped with every surviving edit measured on its own. `plain-english-beginner.md` moves from COS-4's pass-1 text (sha256 `96fdbea4`) to a three-edit candidate (`86451ddb`) removing the jargon-rule conflict (E1), the proof-number rule that demanded a number which may not exist and stated it three times (E2), and the router's missing precedence between two bullets that both match a tool-using report (E3). **AC #1**: five decisions recorded — three fixed, defect 5 retained (COS-15 made its worked gloss example score 1.0, so the stated reason no longer holds), defect 4 retained-not-shipped. **AC #2**: run `2026-08-20T03-03-26`, 150 non-errored cells a model against baseline `19-42-55` at the same size. **AC #3**: E1/E2/E3 each measured alone at 150 cells a model in session 20's retried ablation (`02-02-28`, `02-12-32`, `02-22-33`), all clean. **AC #4**: rules 99.16 / 97.38 against the shipped file's 98.95 / 97.37 and mean reply 62.87 / 58.69 words against 62.99 / 59.74 — stated at full precision because the Sonnet rules margin is a hundredth of a point, not a margin. **AC #5**: reserve arm `03-13-05` against `19-53-49`, 150 a model, 0 errored. **AC #6**: `audit` exit 0 on 12 checks, shipped file hashes to `86451ddb…`, byte-identical to what both arms measured. **The finding**: the four-edit bundle's Opus reply-length rise of +1.71 [+0.27, +3.16] disappears to -0.12 [-2.28, +2.04] when E4 is dropped — an interaction effect no single edit showed, catchable only because each was also measured alone, which is exactly what COS-4 could not do. All twenty paired intervals contain zero. Gates: 219/219 harness tests, `lore check` exit 0. Five documents plus the experiment ledger updated, because after this merge `19-42-55` no longer measures the file that ships. |
| 10 | COS-18 | Task Done — 2026-08-26, session 28 | All 5 ACs verified; **the diagnosis shipped and the fix did not**, and no style file changed. **AC #1** read all three files against COS-4's four patterns with file and line for every instance. **AC #2/#4** rest on run `2026-08-20T12-12-10` — intermediate and advanced, Opus and Sonnet, the five shared cases, 30 repeats, **600 cells, 0 errored, 0 judge timeouts**: intermediate carries all four patterns; advanced carries the router and, weakly, the contradiction, and is **recorded clean** on the scoped budget and the unbounded requirement. Arm scores advanced 99.4 / 97.3 rules and 74.3 / 68.1 judge, intermediate 95.6 / 94.7 and 69.5 / 72.7 — 150 cells a figure against the four-tier table's ten, and the table's "clean split" survives it in both directions. **The arm overturned the reading twice, which is why AC #2 forbade settling it by reading.** Counting over-length violations makes advanced look *worse* than intermediate (23.6% vs 13.4% on Sonnet) because advanced overruns its cap while stating it correctly — symptom without defect. Three measures separate them: intermediate's non-status replies average 1.43× and 1.13× its cap against advanced's 0.95× and 0.85×; the grader attaches the cap to *updates* in **14 of 20 and 8 of 9** of intermediate's over-length violations and **0 of advanced's 43**, every one read by hand after a regex was caught undercounting (the earlier 35.0% / 44.4% figures are withdrawn); and intermediate breaks its cap ~3× as often while being flagged ~half as often. The reading also ranked the two contradiction instances backwards — advanced's is far sharper on the page and fires 2–4× *less* often. Cleanest result in the run: **all 138 shape violations across both files fall on non-status cases and not one on a status update**, against COS-4's 10 of 40 on beginner. **AC #3**: the fix for intermediate's scoped cap was authored and measured as a single edit (`bd326da7` → `8ea1c01b`), 300 cells, 0 errored — rules **+3.0 [+0.1, +5.8]** and words **−24.6 [−46.4, −2.8]**, both clear of zero, non-status replies 1.43× → 0.97× on Opus, rules 99.1 / 97.1 reaching parity with advanced. **AC #5 is vacuous and honestly so**: the reserve before arm lost 163 of 300 cells to the monthly spend limit (all 150 Sonnet), the retry was stopped at 141 when throughput fell to ~0.7 cells/min, so **E1 was reverted** and moved to **COS-33** with its recipe, sha256 and all four intervals. Unmeasured text does not ship, and the reserve split is where two earlier candidate rewrites failed after passing everything else. 1468 cells written across six runs, 900 of them load-bearing, 568 recorded and used for nothing. Gates: 219/219 harness tests, `audit` exit 0 unpiped, `lore check` exit 0 over 24 files. Ledger project total corrected 5140 → **6608** after an uncounted tally was caught in this session's own draft. Opened COS-30, COS-31, COS-32, COS-33. |
| 11 | COS-17 | Task Done — 2026-08-27, session 29 | All 5 ACs verified. **Two clean arms, 0 errored cells in either**: `2026-08-27T12-35-06` (beginner × Haiku) and `2026-08-27T12-50-55` (beginner × Fable), the five shared cases, 30 repeats, 150 cells a model — composition read straight off the rows rather than assumed (5 cases × 30, `complete: true`, 0 errored, 0 no-reply). Arm means rules **95.8 / 99.3** and judge **48.2 / 65.2**, which with COS-16's 99.2 / 97.4 and 66.1 / 60.9 makes **the four-tier beginner row current on every tier for the first time** — it had been half history since COS-4. **The columns are comparable and that was checked, not assumed**: every input that could separate the two run days last changed before the earlier one (`checks.mjs`, `contracts.json`, `cases.json` at 2026-08-17; `judge.mjs`, `run.mjs` at 2026-08-18, all read from `git log`), so scorer, contract, judge prompt, runner, cases and style bytes are identical and the model is the only difference. **AC #4's answer is the strongest result**: the rewrite's length effect reproduces on both middle tiers, mean reply words falling from **1.406× to 0.899×** beginner's cap on Haiku and **1.648× to 0.830×** on Fable, **all ten case × model cells falling**, both tiers crossing from over the cap to under it. Read against COS-7: the per-tier fall (0.507 to 0.900) is larger than the largest adjacent-tier difference COS-7 could measure (0.339), and the after column turns in a different place than COS-7's sequence — so the ordering is not the capability ordering and does not survive a change of style text. **Length is a property of the file, not the tier**, which is COS-7's conclusion reached from the other direction. **AC #2** publishes paired intervals beside the means (COS-27's `interval`, pairing case × model): pooled over 10 pairs, judge +11.0 [+3.4, +18.7], words −53.0 [−91.4, −14.6], composite +8.7 [+1.8, +15.6], rules +6.4 [−0.7, +13.5]. **They are stated as directional, not as effect sizes**, and the reason is written down: the pre-rewrite side carries a pre-`3370e4d` contract on both its rules and its judge (re-scoring reads 91.1 / 91.6 against the published 90.9 / 91.4; the judge cannot be re-graded offline at all) and the COS-10 seam on its agentic cells. Dropping the agentic case — the project's own convention — keeps every sign and clears no interval at 8 pairs. The four arm means carry no confound between them and are the load-bearing figures. **AC #5 is satisfied vacuously and says so**: 0 aborted cells of 300, nothing to exclude; the task's expected Haiku write-then-verify aborts were out of scope because none of the five shared cases edits a file. **AC #3** removed the history from FINDINGS.md, the epic and the coverage story rather than footnoting it beside live numbers, and rewrote FINDINGS.md's judge-defect section, which described a row it no longer applies to. Gates: 219/219 harness tests, `audit` exit 0, `lore check` exit 0 over 24 files read unpiped. **Recorded and not resolved**: counting `rows.json` across `harness/results/` returns 6996 rows in 89 directories, which is 82 more than the ledger's running total plus this session's 302 — a discrepancy that predates COS-17, written into the ledger as open rather than papered over by picking a figure. |
| 12 | COS-21 | Task Done — 2026-08-28, sessions 30-33 | All 5 ACs verified. **2250 cells across 3 legs x 5 arms, 2248 non-errored / 2 errored** (disk-counted, matches the sum of recorded per-arm figures — AC #5's ledger check found no discrepancy this time), 30x the ADR's original per-arm n, every figure carrying a paired 95% interval. **AC #1-#2**: beginner × Opus, beginner × Haiku, advanced × Opus (the ADR's own cell) — argued in the task plan from where reinforcement is most likely to help (beginner, closest to a CLAUDE.md restatement) vs the ADR's own claim (advanced × Opus). **AC #3**: every ADR claim checked against a leg-3 interval. The 9.4-point `claude-md` gap comes back **−0.9 [−3.6, +1.9]**, a null at a tenth the size. The 4.5-point `long-prompt` gap comes back **−0.7 [−2.6, +1.1]** on advanced × Opus and **reverses sign** on beginner × Haiku (**+5.2 [+2.1, +8.2]**, clearing zero upward). "Every layer measured worse" is withdrawn as a general claim — 3 of 4 layers cleared zero upward on Haiku. Only the tail-reminder "inside the noise band" claim is confirmed (−0.7 [−3.1, +1.7], near-exact match). The two-model Sonnet replication claim is out of scope — COS-21 ran no Sonnet leg. **AC #4**: `docs/adr/reject-harness-level-reinforcement-of-style-rules.md` updated in place (status: "Accepted, narrowed by re-test"), new evidence section and per-claim verdicts added, Decision narrowed to scope the no-reinforcement default to models already complying with the style rather than a blanket rule, Consequences rewritten to withdraw the "CLAUDE.md restatement is a liability, deleting is an improvement" claim. `FINDINGS.md`'s recommendation re-stated to match. Gates: 219/219 harness tests, `lore check` exit 0 over 24 files. |
| 13 | COS-19 | Task Done — 2026-08-28, session 34 | **AC #1 unchecked, ACs #2-#5 checked, closed with the user's explicit approval.** Raised advanced x haiku (`2026-08-28T02-58-38-491Z`) and intermediate x haiku (`2026-08-28T13-31-38-172Z`) to 150 cells each, 0 errored — 10 of 12 four-tier cells now at n>=150, joining beginner's full row (COS-16/17) and advanced/intermediate x opus/sonnet (COS-18). Advanced x Fable stopped at 105/150 (`2026-08-28T03-13-14-527Z`, 45 errored on session-limit rejections); the user directed no further Fable attempts, so advanced/intermediate x Fable stay at their original n=10 and moved to **COS-34** (appended, item 27). **AC #2**: added `singleSampleInterval` to `harness/src/interval.mjs`, a 95% Student-t interval over per-case means (5 shared cases, repeats averaged within each first). **`/code-review high` caught a pseudo-replication bug in the first version before merge**: it pooled all 150 rows as independent observations (n=150, df=149), understating every interval roughly 5x against the correct n=5/df=4 over case means. Fixed and re-verified before merge, not shipped and patched after. Every judge figure in `FINDINGS.md`'s four-tier table now carries an honest interval — wide on every cell (n=5 regardless of repeat count), because case count, not cell count, is what this specific question is sized on. **AC #3**: re-checked every conclusion in the four-tier section. Withdrew "beginner's rules beat advanced on three tiers of four" (used advanced's stale ten-cell figures; at 150 cells each way it's parity, 2 of 4). **The bigger finding**: the "clean split" had only ever been checked by subtracting arm means, never with this project's own paired-by-case method (COS-27) — run properly across all four models, **every interval contains zero**, including Sonnet and Opus, which this project's text had called "confirmed." Haiku's point estimate itself moved (+9.3 at n=10 → +1.6 at n=150, paired SE 7.4→1.2) — real precision gain on the *paired* comparison, which is where more repeats actually helps. Updated `FINDINGS.md`, the epic doc and this story doc via `lore`. **AC #4**: confirmed every cell the live table carries today — the two still-underpowered Fable cells included — comes from a run measured after `3370e4d` landed; the contamination was already fully retired, just never stated as such in one place. **AC #5**: recorded per-arm cell counts and wall-clock in the ledger (458 attempted cells this session); disk-counted 9866 rows in 118 directories and flagged, not resolved, that COS-21's legs 2-3 (~1500 cells) were never logged in the ledger table — that gap predates COS-19 and backfilling it was out of scope. Gates: 224/224 harness tests (interval tests rewritten for the grouped behavior), `lore check` exit 0 over 24 files. |

**Campaign 3.**

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-23 | Task Done — 2026-08-18, session 22 | All 5 ACs verified, **no cells run** — every criterion was a reachability/history question. **AC #1**: swept every SHA in `docs/log.md` against `origin/dev` (`git merge-base --is-ancestor`) — 0/77 dead at the branch point. Cross-checked the specific SHAs COS-13 (`acadf1b`, `e71e38c`, `3d2635a`) and COS-14 (`374378a`) had diagnosed as dead: all four are gone from the file's text and unreachable, but each has a live replacement entry under the *same subject line* with a different, currently-reachable SHA (e.g. `374378a`'s "Give improve its own model list instead of run's" now cites `e0bb46e5`). Root cause: `lore sync` regenerates `docs/log.md`'s per-directory sections from a `git log` walk of the *current* HEAD, not an append-only ledger — so a dead pre-rebase SHA a mid-branch sync records self-heals the next time any later session's branch (descended from the merged `dev`) syncs again. The defect is real but strictly bounded to a one-session-cycle window between a PR's rebase-merge and the next docs-touching session's sync, never a permanent injury — confirmed tight: COS-14's own doc-log-recording commit (`2833a95`, rebased to `cb638d4`) is present in today's log, i.e. it self-healed within one cycle. The one gap open today was `ea48ed7` (session 21's own "record the campaign-3 log entry" commit), absent from `docs/log.md` until this session ran `lore sync` — the concrete AC #5 instance: a session whose doc-log commit was absent from the log today, closed by this fix. (COS-14's review-fix commit `b0014af` is correctly absent forever: it touches `harness/` and `README.md`, not `docs/`, and the log is scoped to `docs/` subdirectories by design — not a defect.) **AC #2**: chose "regenerate post-merge" over dropping SHAs or changing the merge strategy — since sync already regenerates the log from live history, the fix is one more `lore sync` call on `dev` right after every PR merge, before the `main` fast-forward, closing the gap in the same session instead of leaving it to the next one. Keeps the SHA provenance the task calls out as reader value, and does not touch the rebase-merge strategy the campaign locked in for linear history. **AC #3**: re-swept all 78 SHAs in the fixed `docs/log.md` against `origin/dev` — 0 dead. **AC #4**: `.claude/skills/backlog-handover/SKILL.md` step 9 now runs `lore sync` on `dev` unconditionally after every merge, commits+pushes if it changes anything, before promoting to `main`. `lore check` exit 0 (24 files, 0 errors, 0 warnings); `npm --prefix harness test` 179/179 (no code touched, so the count is unchanged from session 21's baseline). |
| 2 | COS-27 | Task Done — 2026-08-18, session 23 | All 3 ACs verified, **no cells run** — traced every published paired figure to its raw saved rows and reverse-engineered the exact computation by testing candidate formulas against them. **AC #1**: implemented `harness/src/interval.mjs` (`pairedInterval` + `tCritical95` + `METRICS`), exposed as `node src/cli.mjs interval --before=<rows> --after=<rows> --metric=rules|words|composite|judge`; 10 new tests including a real-data regression anchored to the reserve-arm rules figure. Suite 179 -> 189, 189/189 pass. **AC #2**: paired by (case, model), repeats averaged, sample-SD (n-1) Student-t interval. Found by testing candidates against the reserve arm (`02-12-24`->`02-16-47`, n=12, no repeat-averaging ambiguity) — the sample-SD formula reproduced the published rules figure (+7.7 [+5.3,+10.1] t=7.06) exactly on the first matching attempt. Extending to the shared-five arm (`02-10-45`->`02-15-14`, n=10) initially failed to reproduce any of its four metrics until the after-side was pooled with `02-25-39` — a later, larger re-run of the same byte-identical text the ledger already names as a noise fix for the judge reading — which then reproduced all four (rules, words, composite, judge) exactly. 7 of 8 published COS-4 table cells now reproduce to the last digit; reserve reply-words did not (-54.7 vs published -55.7, a ~1-word gap with no cause found after checking code blocks and tokenizer drift) and was restated per AC #2's second branch, with the original value and the investigation recorded in FINDINGS.md's footnote. **AC #3**: the CLI command re-derives any published figure from saved rows in one invocation. Updated FINDINGS.md's COS-4 table/footnote and the ledger's `02-16-47` row to match the tool's output; every conclusion (rules moved on reserve, shared-five rules interval still touches zero) is unchanged. `lore check` exit 0 (24 files, 0 errors, 0 warnings); `npm --prefix harness test` 189/189. |
| 3 | COS-22 | Task Done — 2026-08-18, session 24 | All 5 ACs verified against a review that found 4 gaps in COS-13's `harness/test/fixture.test.mjs` guard plus one docs-accuracy point, each closed with a sabotage-verified regression test proving the specific failure mode is caught. **AC #1**: `verdict()` now requires `skipped===0`, `todo===0` and an actual `pass` count >=2 pulled from the same `ℹ` summary lines, not just the source-derived assertion count — a fixture whose two tests are rewritten to `{ skip: true }` now fails the guard (it read green before: `pass 0`, `fail 0`, `assertions 2`). **AC #2**: the pinned-value scan walks every file under `fixtures/repo` (`readdirSync` recursive) instead of `test/pricing.test.mjs` alone; reintroducing acadf1b's original comment ("keeps 850 where rounding to the nearest cent keeps 849") into `src/pricing.js` now fails the guard, closing the exact leak that shipped green in that commit. **AC #3**: the `npm test` guard now runs the same `verdict()` parsing (not bare `r.status===0`) and asserts `result.error` is undefined; a sabotaged empty `PATH` surfaces `spawnSync npm ENOENT` instead of an opaque empty diff, and a `"test": "true"` no-op script that exits 0 without running anything now fails on `passedCount`. **AC #4**: replaced `.includes()` substring matching with a `\\b850\\b`/`\\b849\\b` word-boundary regex; `8500`, `1850`, `18500` and `$8.50` no longer false-positive. **AC #5**: qualified `docs/stories/make-the-measurements-trustworthy.md`'s `reserve-agentic-session` difficulty claim — `src/pricing.js` still carries a literal `BUG:` comment locatable by one `grep -rn BUG`, deliberate for `agentic-read-report` but meaning the case's remaining difficulty is search, not comprehension; edited outside lore-managed regions, `lore sync` then `lore check` exit 0 (24 files, 0 errors). 5 new tests, one per gap; `npm --prefix harness test` 190 -> 195, 195/195 pass. |
| 4 | COS-24 | Task Done — 2026-08-18, session 25 | All 10 ACs verified directly against the built CLI, then locked down with 9 new CLI-level tests (`harness/test/usage.test.mjs`, `execFileSync` — nothing imports `cli.mjs`). Widened the shared `pick()`/`parseArgs` path into three validated primitives in `cli.mjs`, all evaluated before any cell is measured: `validateFlags(cmd, args)` — a per-subcommand flag allowlist plus a shared flag-name-to-type table (list/number/boolean/value) — runs immediately after the existing `wantsHelp()` guard and rejects an unrecognised flag (AC #1), a value-taking flag given no value (AC #2, and AC #6 as a side effect since `resolve(args.rows)` is never reached with `args.rows===true`), and a boolean flag given one, e.g. `--no-judge=false` (AC #9); `num(key, raw, fallback)` replaces bare `Number(...)` for `repeats`/`concurrency`/`iterations`/`judge-repeats`, rejecting anything non-finite by name (AC #3, AC #8); `matchList(key, raw, known)` replaces `pick()` for `--variants` and `--cases` specifically (not `--styles`/`--models`, which stay open-ended by design, and not judge's own separate `--cases` filter, out of AC #4's stated scope — that filter now reuses the shared, already-validated result instead of re-parsing), rejecting an unmatched or entirely-empty list by name (AC #4), and retires the `variants[0] ?? matrix.variants[0]` fallback the same AC named. `improve`'s own check is `args.variants !== undefined && variants.length > 1`, not a bare length check: verified live (backgrounded, killed after its first log line) that a bare `improve --styles=plain-english-advanced` still reaches `resolveImproveModels` and starts the baseline measurement rather than throwing — the default (no `--variants` flag, which resolves to every configured variant) is `README.md`'s and `npm run improve`'s documented invocation, and AC #5's own wording ("passing two variants") is about an explicit flag naming more than one (AC #5). Manual live checks incurred one small, unintended real API cost during that last verification (disclosed to the user; the kill landed after, not before, the loop's first measurement log line). `npm --prefix harness test` 195 -> 204, 204/204 pass; no `docs/` change beyond the tracker/task, so no `lore sync` was needed on the branch itself. |
| 5 | COS-26 | Task Done — 2026-08-18, session 26 | All 6 ACs verified. `run.mjs`'s `cellLimitMs` generalized into an exported `secondsToMs(name, seconds)`, reused by two new call-site guards: `judge()` in `judge.mjs` and `rewrite()` in `improve.mjs` (previously an unexported inner function, now exported for direct testing) each wrap their `query()` call in their own `AbortController` + `setTimeout`, the same `timedOut`-flag shape `runCell` already used to distinguish a genuine abort from an SDK stream that ends quietly rather than throwing. **AC #1/#2**: a timed-out judge call substitutes the existing neutral-0.5 landing place with a violation naming the timeout instead of a generic failure string; a timed-out rewrite call logs the timeout distinctly, then returns `''` so the loop's pre-existing "author returned nothing usable — stopping" path handles it — no new failure path invented, per the task's own guidance. Both guards keep a real result that happens to race the timer: `judge()` only reports timeout when the output still fails to parse, `rewrite()` still returns a real body if the call actually completed. **AC #3**: `matrix.json` gained `run.judgeTimeoutSeconds` and `improve.rewriteTimeoutSeconds` (120 each, backstops sized above any observed no-tool call, not tuned figures — no `elapsedMs` equivalent exists for these calls yet), both validated once at CLI startup (`cli.mjs`) via `secondsToMs`, alongside the existing `cellLimitMs(opts.maxCellSeconds)` check; manually confirmed fail-loud by deleting each key in turn and running `node src/cli.mjs run`/`improve` — both threw naming the missing key before any cell ran, config restored after. **AC #4, sabotage-verified**: four new wedge-then-real-abort tests (two call shapes — throws on abort, ends the iterator quietly on abort — for both `judge()` and `rewrite()`), each driving the injected `queryFn` seam to a genuine `AbortController` fire, the same pattern `run.test.mjs` established for `runCell`'s own guard. **AC #5**: `matrix.json`'s `//run`/`//improve` comment blocks, `harness/README.md` and `docs/reference/harness-architecture.md` no longer call either call unbounded; grepped all three plus the two docs for "unbounded"/"no abortController"/"no timeout" post-edit, none remain. **AC #6**: `npm --prefix harness test` 214 -> 219, 219/219 pass (5 new: 2 in `checks.test.mjs`, 2 in `improve.test.mjs`, 1 in `config.test.mjs`); `node src/cli.mjs audit` exit 0; `lore check` exit 0 (24 files, 0 errors, 0 warnings). **Campaign 3 is now empty — all five of its issues (COS-23, COS-27, COS-22, COS-24, COS-26) are Resolved.** |

## Parked in campaign 1 — now queued as items 14 and 15

Both entries below record why campaign 1 stopped short. Neither is blocked on a
human: they are blocked on work that now has owners, and the user's 2026-08-17
decision to test everything removed the objection that made their bars unreachable.
They sit at the end of campaign 2's order for that reason.

**Achievability is still unproven for both**, and the risk policy below applies
unchanged — a session that cannot reach the bar records what it reached and parks
the issue again rather than lowering it.


- **COS-1** (session 7). ACs #1-#3 met and merged; **AC #4 not met and parked
  under the risk policy.** Two authoring passes were measured against a bar of
  judge > 65% on `agentic-fix-verify` and `conv-decision-holdout`, on Opus and
  Sonnet. Pass 1 ships: 46.2 / 42.0 / 51.2 / 54.7 (run `00-48-49`) against a
  first-ever current-text baseline of 50.0 / 40.0 / 48.3 / 46.7 (`00-44-03`).
  Pass 2 was more forceful and scored *below the original text* — arm mean judge
  43.6 against the baseline's 46.2 — and was reverted in full (`01-03-21`).

  Two things have to change before AC #4 is attemptable again, and neither is a
  style-file edit. **The agentic half is not measurable as written**: the judge
  is handed the whole turn rather than the final message, so
  `agentic-fix-verify`'s judge score is not a measure of the style file. That is
  the text-block seam already raised in session 6, now known to reach the judge
  and not only the two segmentation checks. **The conversational half is a
  length problem**, which is COS-4's subject — 70.8-82.6% of cells overrun their
  style's word cap in every arm, before and after (9/12, 17/24, 19/23), and no
  rule this task added touched that.

  Sequencing follows from that: COS-4 first, the seam fix before any retry of
  AC #4. Do not re-open COS-1 with an `improve` run — the rules now exist and
  the loop still has nothing to add, because what fails is length and an
  instrument defect, neither of which the optimizer can see.

- **COS-4** (session 8). ACs #2 and #3 met and merged; **AC #1 not met and
  parked under the risk policy.** The style file was rewritten, measured over 144
  cells across six arms and two disjoint case sets, 0 errored cells.

  **The task's own headline figure was wrong before any work started.** Beginner
  judge 45.9 / 48.4 came from run `12-44-03`, which predates COS-1's additions to
  the file *and* was graded with the judge told a 15-word sentence cap no style
  file states — 13 of that run's 64 beginner violations cite it by name. Commit
  `3370e4d` re-graded the rules offline and could not re-grade the judge, because
  a judge score cannot be recomputed without paying for the call again. A clean
  before arm read 58.7 / 70.7.

  **What shipped and what it did.** Beginner's rules contradicted each other in
  three places and the file never said which of its shapes a reply should take.
  Fixing that moved every deterministic measure and no judge measure. Paired by
  case x model: rules +5.2 shared and **+7.7 [+5.3, +10.1]** on reserve; reply
  words **−42.0** and **−55.7**; composite **+7.4 [+0.8, +14.0]** on reserve;
  judge **+1.3 [−15.0, +17.6]**. Over-cap share 40.0% → 14.3%, mean reply 103 →
  61 words. Rules on the shipped text are 98.5 / 97.4, the highest beginner has
  ever recorded. This is the first change in the project to move reply length at
  all.

  **AC #1 misses and is not settleable at this arm size.** Judge 73.9 [66.0, 81.9] on
  Opus and 58.1 [50.5, 65.6] on Sonnet at n=35 each; Sonnet's interval excludes
  70 from below. A confirmation arm on byte-identical text (50 cells) corrected
  this session's own first reading — a +7.1 judge delta computed at two cells per
  pair became +1.3 at seven, and Sonnet read 70.7, 65.8, 74.1 and 55.0 across
  four arms of the same five cases. Per-cell judge SD is 22-32, so clearing a 70%
  bar with confidence needs ~151 cells per model.

  What is left is a named negative: the remaining beginner gap is not length, not
  rule coverage and not missing content. Anyone reopening this should price the
  arm before agreeing to the bar.

## Raised — now tracked as issues

- **COS-29** — tracked (session 27): COS-16's own branch review found that E3's
  precedence sentence, the edit written to remove a router ambiguity, introduced
  a smaller one — 'When two of **these** match' is separated from the bullets it
  governs by the section's closing line. Not fixable inside COS-16, because the
  shipped bytes are the bytes both arms measured and any rewording ships
  unmeasured style text, which is the precedent COS-1 set and COS-4 violated.
  Queue item 22.

Every item below was raised across sessions 3 to 8 and deliberately left out of
the confirmed order. On 2026-08-17 the user asked for follow-up issues covering
everything untested, with nothing held back, so each now has a task ID and
acceptance criteria a future session can act on without this conversation.

- **COS-9** — tracked (session 3): `two_options_max` counts only literal option labels, so
  it cannot see prose option sprawl.
- **COS-12** — `run` does not flush rows incrementally (session 5). `improve` persists
  after every style; `run` writes `rows.json` only after the entire matrix
  completes, so a killed or crashed run loses every cell it already measured.
  Session 6 ran three large `run` invocations with this exposure live.
- **COS-10** — assistant text blocks are concatenated with no separator (session 6,
  and the largest of the three). `run.mjs` does `text += b.text`, so on an
  agentic turn the pre-tool narration is glued to the post-tool answer:
  `"I'll look at the file first.The bug is in ..."`. `sentences()` needs
  whitespace after the full stop and `paragraphs()` needs a blank line, so the
  run-on scores as one long sentence in one paragraph. Present in **0 of 131
  conversational cells** and most agentic ones (Opus 3/6, Sonnet 1/7, Haiku
  10/12, Fable 5/6, and 6/6 on Fable's `agentic-fix-verify`, where
  `paragraph_length` reads 16.7 and is measuring the harness). The four-tier
  baseline table is unaffected in practice and no affected figure was published,
  but `sentence_length` and `paragraph_length` are currently unquotable on
  agentic cells for every model. Fixing it moves agentic numbers already in
  `docs/` and `FINDINGS.md`. **Session 7 widened this and raised its priority:
  the judge reads the same concatenated text**, so every agentic judge score in
  the project is measured on the whole turn rather than the final message. In 16
  of 18 `agentic-fix-verify` cells the reply carries pre-update narration, and in
  all 16 a judge violation quotes it. This is now a blocker on COS-1's AC #4, not
  only a caveat on two checks — though it is not the whole story either, since 10
  of those 18 final updates are over the word cap on their own.
- **COS-11** — an errored cell scores 0 on rules and 1.0 on the judge (session 7).
  `evaluate.mjs` skips the judge on an errored row and substitutes
  `{ score: 1 }`, so a cell that returned no text contributes a free 100% to
  every judge mean. The rules half is documented from COS-5; the judge half is
  the opposite bias, is not documented, and the two do not cancel. One turn-limit
  abort in `01-03-21` moved that run's `agentic-fix-verify`-on-Opus judge from
  33.0 to **44.2**. **Partly fixed in session 7, because COS-1 made it worse
  first**: adding a second agentic case to `reserve` put the most abort-prone
  case type inside `improve`'s adoption gate, where each one-sided abort moved
  the delta ~0.01 against a `minReserveDelta` of -0.02. The gate now compares
  only cases that produced a reply on both sides, names what it dropped, and
  rejects rather than adopting when nothing is comparable. The wider bias in
  `summarize()` — every judge mean anyone quotes — is untouched and still needs
  the user's call. Until then, filter on `!row.error` before quoting.
- **COS-13** — the agentic fixture contradicts itself (session 7, from the branch review).
  `harness/fixtures/repo/test/pricing.test.mjs` asserts `applyDiscount(999, 15)`
  is 850 while its own comment computes 849. A model that correctly replaces
  `Math.floor` with rounding breaks a currently-passing test and has to decide
  unaided whether to edit the assertion, which is scoring noise on every agentic
  case — including the two now on the reserve gate. Pre-existing; fixing it moves
  published agentic numbers, so it is raised rather than patched.
- **COS-10** (same task, same subsystem) — `sentences()` merges a list header into its first item (session 4). It does
  not split on a single newline, so "Here's why:\nYou're paying twice." scores as
  one long sentence. Measured at 12.2% of over-cap sentences. Fixing it also
  moves published numbers. Note this and the seam above are the same subsystem
  and would sensibly be one task.
- **COS-14** — `improve` inherits `run`'s model list (session 6, from the branch review).
  `matrix.models` is the default for both, and `harness/README.md`'s own
  quick-start line is `improve --styles=… --iterations=4` with no `--models`, so
  any model added to that list runs on every optimizer iteration of the
  documented invocation. COS-7 kept Fable out for exactly this reason, which
  documents the footgun rather than removing it. Giving `matrix.improve` its own
  `models` key would remove it. Small, and it makes the top tier safe to add.
- **COS-15** — the audit compares numbers, not conditions (session 4). Beginner's file
  says "never show code *unless they ask*"; `maxCodeLines: 0` cannot express the
  condition. Documented in `harness/README.md` as a limit of the instrument.

- **~~A judge bar stated to the point is unreachable~~ — SETTLED by the user
  on 2026-08-17: "we have to get everything tested - no budget."** Run size is no
  longer a constraint, so the bars stand and the arms get sized to support them.
  Every measurement issue opened below requires **n >= 146 non-errored cells per
  model**, which is what a 95% half-width of +/-4 points costs at the shipped
  text's pooled judge SD of 24.6 (Opus 24.1, Sonnet 22.8) and the task's measured
  SD 24.6. Detecting a real difference between two
  arms costs roughly double: 47 cells per arm for 10 points, 95 for 7, 187 for 5,
  291 for 4. Note what this does not buy: sample size narrows an interval, it
  does not move a point estimate above a bar.

  The finding that produced the decision stands. Per-cell judge SD is 22 to 32,
  so the ten-cell arms every per-model judge figure in this project rests on
  carry 95% intervals about 30 points wide, and beginner on Sonnet read 70.7,
  65.8, 74.1 and 55.0 across four arms of the same five cases. COS-1's "> 65%"
  and COS-4's "> 70%" were both written without this being known. **COS-19** now
  owns re-measuring the headline table at a sample size its claims need, and
  **COS-20** owns finding out how much of that 24.6 is the judge rather than the
  reply — if the judge dominates, re-judging saved replies is faster per point
  of precision than buying cells, and the 146 figure comes down.

- **COS-16** (session 8, new) — the beginner rewrite left five contradictions of
  the same class it removed: the jargon rules disagree for a word the reader used
  first, the proof-number rule demands a number that may not exist and is stated
  three times, two router bullets both match a tool-using report, the router omits
  two of the file's own six shapes, and the file's worked example of the gloss
  rule uses a banned term. Recorded rather than fixed because the session had run out of room
  and shipping unmeasured style text is against COS-1's precedent.
- **COS-17** (session 8, new) — beginner was rewritten and re-measured on Opus and
  Sonnet only. Haiku and Fable sit in the middle of COS-7's overrun sequence and
  are a direct test of whether the fix is a property of the file or of two models.
- **COS-18** (session 8, new) — nobody has looked for beginner's four structural
  defects in the other two files. Intermediate is the live suspect: COS-7 measured
  it at 144 words against a 100-word cap on Opus.
- **COS-19** (session 8, new) — the four-tier baseline is the project's headline
  result and twelve of its judge cells are ten-cell arms.
- **COS-20** (session 8, new) — the judge has never been validated as an
  instrument. One model, one call per cell, no separation of judge-call variance
  from reply variance, and no inter-judge agreement measured. Cheap, because saved
  replies can be re-judged without re-running a cell.
- **COS-21** (session 8, new) — the *Reject harness-level reinforcement* ADR is
  Accepted on **five cells per arm**, one style, one model, and style text that no
  longer ships.

## Risk policy (confirmed by the user on 2026-08-16)

"Record and park." If COS-4 or COS-1 cannot reach its measured judge-score bar,
the session records every attempt and the scores actually reached in the task
notes, moves the issue to "Not queued" with that evidence as the reason, advances
the cursor, and continues. Nothing merges that does not meet its acceptance
criteria, and no session stalls waiting for a human.

Both remaining issues carry known risk against that policy:

- **COS-4 was taken in session 8 and the risk landed.** It asked beginner's judge
  score to exceed 70% on Opus and Sonnet. The shipped rewrite reaches 73.9 and
  58.1 at n=35 a model, so the bar is missed on Sonnet and the task is parked.
  The prediction recorded here — that achievability was unproven — held, but not
  for the reason given: the session established that the criterion was **not
  objectively testable at that arm size**, because a ten-cell judge arm carries a
  30-point interval. Both hard style tasks were sequenced last on the user's
  "safety-first" ordering, and both hit a judge bar rather than a content wall.

  **Campaign 2 removes the arm-size objection but not the risk.** The bars stand,
  the arms get sized to support them, and both issues sit last in the order
  behind the work that unblocks them. Sonnet at 58.1 is 12 points under the bar
  and no sample size closes that — only a better style file will, which is what
  COS-16 and COS-18 are for. If it still misses, record and park again.
- **No ruling is needed on which models the bars apply to, despite the owning
  story's looser phrasing.** COS-1's AC #4 and COS-4's AC #1 both name "opus and
  sonnet" explicitly, so the two tiers added by COS-5 and COS-7 do not move
  either bar — beginner climbs to 70% from 45.9 and 48.4, not from Haiku's 37.5.
  The story said "on both models", written when two tiers were measured; COS-7
  reconciled it to say what the tasks say rather than widening anything.
- **COS-1** asks multi-tool sessions and open-ended decisions to reach 65%.
  Session 6 supplies the sharpest evidence yet on the first half: on
  `agentic-fix-verify` even the top tier scores judge 41.2, and
  `leads_with_conclusion` 16.7 — worse than any other model on any case. The gap
  is not a small-model gap.

## Session log

- 2026-08-16 — session 0 (init): inventoried COS-1 through COS-8, all eight
  classified agent-resolvable. Queue order and risk policy confirmed with the
  user. Tracker created as doc-1. `.claude/handovers/` gitignored and
  `archive/handovers/` created during skill adoption (aed40a2). Cursor armed at
  COS-6.
- 2026-08-16 — session 1: resolved COS-6 on `feature/COS-6`. No drift found at
  restore: `dev`, `main`, and both remotes were all level at 80bc691, no leftover
  branches, no open PRs. Rewrote README.md's Install section and added "How the
  style name resolves", "Confirm it loaded", and "Going deeper". Facts were
  lifted from the existing mechanics reference and install runbook rather than
  re-derived — no probing, no harness run, no cost. `lore sync` was needed after
  all: moving COS-6's status put the story's managed task block into drift, and
  `lore check` failed until it was reconciled (it also auto-commits the touched
  `backlog/` file — expect that commit on the branch). Cursor advanced to COS-3.
  `/code-review high` raised three issues, all real and all fixed before the PR:
  a `<PR_SHA>` placeholder committed into this tracker's resolved row; `/config`
  described as if it set the style globally when it writes a project-scoped
  `.claude/settings.local.json`; and the README's own level headings using an em
  dash where the literal style names use an ASCII hyphen — copying a heading
  would have produced exactly the silent Default fallback the section warns
  about. Worth carrying forward: reviewing docs against the failure they claim to
  prevent caught two traps that every automated gate passed.
  Merged via PR #1 (rebase) as `0631c04`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.
- 2026-08-16 — session 2: resolved COS-3 on `feature/COS-3`. No drift at restore:
  `dev`, `main`, and both remotes level at 325d2b0, no leftover branches, PR #1
  merged and pruned. The design question the handover flagged — where improve
  rows should live — resolved in favour of writing them at
  `results/<stamp>/rows.json`, the exact path `score`'s `newestRows()` already
  globs, so `score` needed no change at all to satisfy AC #3. Rows carry an
  `iteration` tag; reverted iterations are persisted too. `spentUsd` deleted in
  favour of summing the rows. `improveStyle` gained three optional parameters —
  `rows` (a caller-supplied sink), `onRows` (flush callback) and `deps`
  ({ evaluate, rewrite }) — so the persistence could be unit-tested without
  runs and could survive a crash; 12 new cases in `harness/test/improve.test.mjs`.
  `/code-review high` found five issues, all real and all fixed before the PR.
  The serious one is worth carrying forward: writing an improve run's
  `summary.json` and `report.md` at the same paths and shapes a plain `run` uses
  made the loop's pooled mean — baseline plus every rejected candidate — look
  like a style's score, and the first evidence run's report headlined 63.0% for a
  style whose real measured figure was 65.4/71.6. That is the same class of trap
  as session 1's: a number that every automated gate passes and only a reader
  catches. Fixed by labelling rather than by hiding the file. Also found: a
  by-iteration table that averaged two styles' traces together, no cell count recorded
  for a style that crashed, and rows flushed only between styles. Two smaller
  lessons: the `npm test` script named `checks.test.mjs` explicitly and would
  have silently skipped the new file (now globs `test/*.test.mjs`), and three
  docs asserted "improve persists no rows" as standing fact — found by grepping
  the docs for what the change made false, not by any gate. Left for the user to
  rule on: a pre-existing comment/code disagreement at `harness/src/improve.mjs`
  about whether a reverted iteration briefs from the failed attempt or the
  incumbent — the code does the latter, the comment claims the former. Total
  Three proving runs this session. Merged via PR #2 (rebase) as
  `1daff4d`; `dev` and `main` both pushed at that SHA, no branch litter, no open
  PRs. Cursor advanced to COS-2.
- 2026-08-16 — session 3: resolved COS-2 on `feature/COS-2`. No drift at restore: `dev`, `main` and both remotes level at cdfd153, no leftover branches, PR #1/#2/#3 all merged and pruned.

  The design call the handover flagged — where the reserve cases come from — went against the handover's own suggestion. It proposed reusing the four cases from the historical never-seen run, but those four are now IN train and holdout, so moving them would have cut train 5 -> 3 and holdout 4 -> 2 and shrunk the signal the loop depends on. Wrote four NEW cases instead, chosen as shapes no split contains, because the ADR's finding is that candidates overfit to case SHAPE rather than wording. Pool is 13 (5/4/4).

  Two decisions worth carrying forward. First, a reserve rejection is a ROLLBACK, not an annotation: `best.md` is documented as the winner and is the file a reader diffs and copies, so on rejection it holds the incumbent and the rejected rewrite stays at `v<N>.md`. Second, the verdict line was extracted from `cli.mjs` into `report.mjs` as `renderVerdict()` — AC #3 says a regressing candidate must be REPORTED as rejected, and leaving that in a `console.log` would have made the criterion unverifiable except by eye.

  The evidence took six runs because adoption is stochastic: the reserve pass only fires when the loop actually keeps a rewrite, and three of the six runs reverted everything. That is worth knowing before scoping a session that needs an adopting run — expect roughly one in two, and prefer a low-scoring style with headroom.

  `/code-review high` found six issues, all real. The one worth remembering is the config footgun: `cfg.minReserveDelta` had no fallback, so a `matrix.json` naming a reserve split but omitting the threshold would evaluate `delta >= undefined` — false for every candidate — and silently roll back every run while logging an ordinary-looking REJECT. Also found: a new case whose judge rewarded exactly what one of its own deterministic checks scored 0 for (`leads_with_conclusion` vs a compliance reply opening "I'll…"), and README advice to compare splits in `BY SPLIT`, which on an improve run pools every iteration and so compares different version mixes. The sixth is COS-9: `two_options_max` counts only literal option labels, so it cannot see prose option sprawl — fixing it moves scores already quoted in `docs/` and `FINDINGS.md`, so it is its own task rather than scope creep here.

  Caught before the review returned, by re-reading my own runbook edit: the rejection example printed the rejected candidate's train and holdout on the REJECTED headline, when the code rolls `best` back before rendering and so prints v0's. Third session running that the only defect no automated gate caught was a plausible number in prose. Merged via PR #4 (rebase) as `2d4bcb4`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-8.
- 2026-08-16 — session 4: resolved COS-8 on `feature/COS-8`. No drift at restore: `dev`, `main` and both remotes level at c2c83b2, no leftover branches, PRs #1-#4 merged and pruned.

  Took AC #4 first because it was free and unambiguous. `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`; `node src/cli.mjs audit` exits 1 on disagreement and the same comparison runs under `npm test` (suite 34 -> 45). The design decision that matters: an unrecognised phrasing reports as UNSTATED rather than being skipped, and a second test asserts every style states every field, so the guard cannot quietly shrink from four fields to three when someone rewords a style file. Proved by re-creating the exact divergence that shipped.

  The caps question went the opposite way from the small-sample evidence, and that is the lesson. An 8-cell Haiku probe said stating a 12-word cap works: mean sentence 16.6 -> 12.3 words, over-cap 30% -> 11%, reply length flat, judge up. The user ratified tightening on it. The 24-cell paired validation on opus and sonnet then measured **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter and 6 longer, judge 0.557 -> 0.532, reply length up 105 -> 114. Reverted. The mechanism is clean and now documented in three places: a cap only bites where it binds — Haiku writes 16.6-word sentences and felt a 12-word cap, opus and sonnet already write 11-12 and had nothing to pull against. **Probe the small model to learn whether an instruction CAN bind; measure the target models before believing it DOES.** The Haiku effect sits 9.8 standard errors outside the opus/sonnet interval.

  Two process notes worth carrying. First, the question put to the user carried its own revert condition ("validate on both models and only keep it if it holds up"), so reverting after a failed validation executed their decision rather than overriding it — no second round trip. Second, the paired design mattered more than sample size: registering the pre-change file as a temporary contract entry and running old and new in the SAME run removed model, case and date as confounds, which is what made 24 cells enough to exclude the effect the probe had predicted.

  Also settled for free: paragraph caps are inert at every level (1.4-1.8 sentences against a cap of 4; re-scoring the same replies at cap 3 moves the check by 0.000-0.017), so there was never a differentiation to be had there. And the finding that actually matters for COS-4, recorded in the story: the binding constraint at the lower levels is reply length, not sentence length — beginner averages 119 words against its stated 80 with half its replies over, and where the two can be told apart the judge tracks reply length at -0.647 against sentence length's -0.368.

  Raised but not done, needs the user's call: `sentences()` in `checks.mjs` does not split on a single newline, so a list header ending in ':' merges with its first item — 9 of 74 over-cap sentences (12.2%), worth 1.2-1.6 points of over-20w rate. Too small to change any conclusion here, but fixing it moves numbers already published in `docs/` and `FINDINGS.md`, which is the COS-9 shape. Merged via PR #5 (rebase) as `ac1a161`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-5.
- 2026-08-16 — session 5: resolved COS-5 on `feature/COS-5`. No drift at restore:
  `dev`, `main` and both remotes level at 092f3b4, clean tree, no leftover
  branches, no open PRs — the handover matched reality exactly.
  The re-run question the handover flagged (re-run opus/sonnet on the full pool,
  a full re-run, or state the case-count difference) was answered a third way: slice the
  new haiku rows to the five case ids the old run used, after proving in git that
  the case definitions, style files, `checks.mjs` and `contracts.json` are all
  unchanged between the runs. That makes the table like-for-like on cases rather
  than merely captioned, costs nothing, and leaves the run/date difference as the
  only stated caveat. Re-scoring `12-44-03` offline first — free — reproduced all
  twelve published figures exactly, which is what made reuse defensible.
  **Two findings, one of them a correction to published work.** The measured
  Haiku failure mode is turn-limit exhaustion on fix-then-test cases, which
  forced a distinction the two-model data never needed: a cell that never
  answered is not a badly-styled cell, and pooling the two hid a ~10-point effect.
  The larger one is that this run refuted the hypothesis the handover handed it.
  Session 4's 8-cell probe reported Haiku at 16.6-word sentences and the project
  built its central "a cap only bites where it binds" explanation on that number.
  Haiku's actual baseline, at 6x the sample on an identical configuration, is
  12.1–12.2 words, and its *untightened* over-12 share (38.4–43.0%) contains the
  40.5% the probe credited to the tightened file. COS-8's decision survives —
  reverting was right, and for a simpler reason than it recorded: no model in the
  matrix sat far enough above the cap for it to have obvious room to work. The
  ledger, the audience-level spec and `harness/README.md` were corrected rather
  than deleted, both samples shown.
  Carry forward: **the free check was available at the time and nobody ran it.**
  Re-measuring a probe's own baseline from saved rows costs nothing, and it is
  the check that would have caught this before it reached four documents.
  `/code-review high` raised 10 findings, all real. The critical one was mine and
  is the sharpest lesson of the session: my analysis script measured sentence
  length with a plain `split(/\s+/)` instead of `checks.mjs`'s `words()`, which
  drops non-alphanumeric tokens. Every hand-computed sentence figure was inflated,
  and on the strength of that bug I had written into the ledger that session 4's
  "over-cap 30% → 11%" did not reproduce. It does, exactly. **A correction is a
  claim too, and needs the same verification as the thing it corrects — computed
  with the project's own instrument, not a convenient re-implementation of it.**
  The refutation itself survived recomputation unchanged. Four other findings were
  documents left contradicting the new result (the story's own Goal, the ADR, the
  harness README, the epic snapshot) and one was an argument that dismissed a
  4-cell arm as noise while trusting its 4-cell twin. The `run --help` footgun
  this session hit was fixed, not merely recorded: `src/usage.mjs` now
  short-circuits any help-shaped argv before config is read, an unknown command
  exits 2, and 6 tests cover it — one of which shells out and asserts that
  `run --help` creates no results directory. Suite 47 → 52. Writing that test
  found a second hole: `parseArgs` only recognises `--` flags, so `-h` would have
  fallen through to a full run.
  Left for the user to schedule: `run` still writes `rows.json` only after the
  entire matrix finishes, so a killed run loses every measured cell — `improve`
  flushes per style. That is a change to run semantics, not a guard, so it was
  not taken as scope here.
  Merged via PR #6 (rebase) as `14d72ea`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.
- 2026-08-16 — session 6: resolved COS-7 on `feature/COS-7`. No drift at restore:
  `dev`, `main` and both remotes level at 82d32e5, clean tree, no leftover
  branches, PRs #1–#6 all merged and pruned — the handover matched reality
  exactly, for the second session running.

  **The campaign's largest session, and the one where scoping
  paid off.** The handover's core advice — run Fable on the five shared case
  ids so the result drops into the existing table with no slicing — was followed
  and was right. The alternative, the full 13-case pool, is a much heavier run —
  12 of its 78 cells are write-then-verify, the largest kind — and would have
  produced a second, non-comparable table. (This line originally read "runs an
  order of magnitude more tokens on Fable than on Haiku". That was the per-cell
  cost table read as a token span, which does not hold once per-tier prices are
  accounted for; session 16 corrected it here, in `FINDINGS.md` and in the
  measurement-coverage story.) Reuse of the other three columns was re-verified rather than assumed, as
  the handover insisted: the five case definitions are byte-identical across five
  SHAs, `checks.mjs` and all three style files are byte-identical 444b221→HEAD,
  and `contracts.json` *did* change once after `12-44-03` — which the offline
  re-score settled by reproducing all twelve published figures exactly. That
  contracts change is worth noting: the precondition check was not a formality
  this time, it actually found a difference and then disposed of it.

  **Both open questions closed, one against expectation.** Word-cap overrun does
  not track model tier. The two-model data made Opus look like the verbose end of
  a gradient; the four-tier data turns twice (Sonnet 0.961, Haiku 1.088, Fable
  1.229, Opus 1.300 words ÷ cap), and paired over 15 cells the *smallest* model
  overruns significantly more than the second smallest while the *top two* are
  indistinguishable. Sonnet is the outlier that keeps to the cap. And the
  one-file decision holds at the top of the range, which completes it for four
  tiers of four across a tenfold cost spread.

  Two things worth carrying forward beyond the ACs. First, **the top tier's
  agentic result is the strongest evidence in the project that the opening
  narration failure is a Claude Code habit, not a model limitation** — Fable
  finishes `agentic-fix-verify` 6 times out of 6 where Haiku fails 5 of 6, and
  scores `leads_with_conclusion` 16.7 doing it, worse than any other model on any
  case. Capability removed the aborts and made the style compliance worse.
  Second, **reading the transcripts is still what finds the defects.** The
  text-block seam (`text += b.text` with no separator, so pre-tool narration
  fuses to the post-tool answer) was invisible to every gate and was found by
  looking at why `paragraph_length` read 16.7. It was bounded before anything was
  published — 0 of 131 conversational cells, most agentic ones — and no affected
  figure was quoted anywhere. Raised, not patched, because fixing it moves
  agentic numbers already in `docs/` and `FINDINGS.md`.

  One self-inflicted cost, recorded because the project documents footguns: the
  model-id probe named `--models`, `--styles`, `--cases` and `--repeats` but not
  `--variants`, so it ran five variants instead of one — five cells instead of one.
  Every axis left unnamed takes its full default. It did buy the variant pricing
  on the top tier (long-prompt is 3.9× baseline), now in `harness/README.md`.
  Also deliberate: Fable was **not** added to `matrix.json`'s `models`, because
  that list is `improve`'s default too and the largest tier would then run
  on every optimizer iteration — the same shape as the `run --help` footgun COS-5
  fixed.

  **The review earned its keep, and the lesson is new.** Five previous sessions
  found prose numbers that were wrong. This one's worst finding was a number that
  was *right* and an inference on top of it that was not: six paired comparisons
  on the same 15 units, three bolded significant, no multiplicity adjustment —
  and the units were 3 styles x the SAME 5 cases, so they were not independent
  either. Under Bonferroni only one of the three survives. The fix was to stop
  leaning on inference at all: a tier gradient predicts each step up the range
  overruns more than the step below, and two of the three adjacent steps go the
  wrong way. That is a fact about the means, and no sample size argument touches
  it. **Re-deriving a number is not the same as checking the claim built on it.**

  Also worth carrying: the review caught a gate claim that was false — the notes
  said `matrix.json`'s parse was covered by the existing suite, and nothing loads
  that file. Fixed rather than reworded (`harness/test/config.test.mjs`, suite
  52 → 56, proved by breaking the JSON and watching `npm test` go red). And it
  found that the four-tier table cannot be reproduced from `12-44-03`'s stored
  `rulesScore`, which predates 3370e4d; only re-scoring gives the published
  figures. That dependency is now stated beside the table, because the reviewer
  nearly filed it as a discrepancy.

  Merged via PR #7 (rebase) as `0747cc8`; `dev` and `main` both pushed at
  that SHA, no branch litter, no open PRs. Cursor advanced to COS-1, the
  first of the two hard style tasks.
- 2026-08-17 — session 7: took COS-1 on `feature/COS-1`. No drift at restore:
  `dev`, `main` and both remotes level at e48a48d, clean tree, no leftover
  branches, no open PRs. **The bar was not met and the issue is parked, not
  resolved** — the campaign's first negative result. ACs #1-#3 shipped: all three
  style files gained "Reporting a long/multi-tool session" and "When neither
  option is clearly better", and two cases were added on the `reserve` split
  (`reserve-agentic-session`, `reserve-decision-tie`) following COS-2's precedent
  of writing new cases rather than moving existing ones. Five real runs,
  The session's durable output is two instrument
  findings rather than a score: the text-block seam reaches the **judge**, and an
  errored cell scores 0 on rules but 1.0 on the judge. Both are in the ledger,
  `harness/README.md` and the raised list. Also closed a parse-guard gap of
  exactly the kind session 6's review found in `matrix.json`, one file over:
  `cases/cases.json` was read at CLI startup with nothing asserting it parsed.
  Suite 56 → **64**, and all five new case guards were proved to fire by breaking
  the file on purpose. The branch review returned 11 findings and every one was
  real: four wrong numbers in my own prose (all from counting words without
  `stripCode`, so the published over-cap range excluded the shipped arm), one
  withdrawn claim, and — the serious one — **a regression I introduced**, putting
  an abort-prone agentic case inside `improve`'s adoption gate while the diff
  documented that same error bias in three places and left the code alone. Fixed
  in the gate with six new tests, after `01-33-41` measured the case aborting
  3 of 6 on Haiku. `audit` exit 0; `lore check` exit 0. Six real runs. Merged via PR #8 (rebase) as `1c35697`; `dev` and `main` both
  pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-4.
- 2026-08-17 — session 8: took COS-4, the last item in the confirmed order, on
  `feature/COS-4`. No drift at restore: `dev`, `main` and both remotes level at
  f792b32, no leftover branches, PRs #1-#8 all merged and pruned. **ACs #2 and #3
  met and merged; AC #1 missed and parked**, so the task returned to To Do
  unassigned. Six real arms, 144 cells, 0 errored cells.

  The session began by refusing the task's own baseline. 45.9 / 48.4 failed two
  independent checks — it predates COS-1's additions to the file, and its judge
  was told a 15-word sentence cap no style file states, cited by name in 13 of
  that run's 64 beginner violations. `3370e4d` had re-graded the rules offline
  and could not re-grade the judge. A clean before arm read 58.7 / 70.7.

  The diagnosis was contradiction, not omission: an 80-word cap scoped to
  status updates while the harness applied it to every reply, unbounded demands
  for analogies and for explaining what a thing is, "skip all internal details"
  quoted as a violation against the evidence beat 2 requires, and no statement
  anywhere of which shape a reply should take — 8 of 24 judge violations on the
  weakest cases demanded the three status beats on replies that are not status
  updates. Fixing those moved rules +5.2 / +7.7 and reply words −42.0 / −55.7 on
  two disjoint case sets, took over-cap share 40.0% → 14.3%, and left the judge
  at +1.3 [−15.0, +17.6]. First change in the project to move reply length.

  Two things this session got wrong and corrected itself. A second authoring pass
  was measured and reverted in full — statistically identical to the first, and it
  introduced a false premise on a tool-using case. And the session's own first
  conclusion, a +7.1 judge gain agreeing across two case sets, did not survive a
  50-cell confirmation arm on byte-identical text: at seven cells per pair the
  same delta is +1.3. Sonnet read 70.7, 65.8, 74.1 and 55.0 across four arms of
  the same five cases. That is now the ledger's judge noise floor, and it is the
  most reusable thing the session produced.

  Merged via PR #9 (rebase) as `31433b8`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.

  Review: `/code-review high` raised 11 findings. Ten were real and fixed in
  `ff4ec99` — eight wrong published figures, including a "128 cells" that appears
  nowhere in the data, a per-cell figure taken from the smallest arm, and a
  sample-size claim that confused precision with a score. The central one was a
  miscount: "8 of 24 violations" was eyeballed rather than computed, and counting
  it gives 10 of 40. The eleventh finding's counter-claim was drawn from the
  superseded run this very task exists to stop quoting, so it was recorded rather
  than applied. Five defects in the shipped style text are recorded in the task
  rather than fixed: the session had run out of room and shipping unmeasured text is what
  COS-1's precedent forbids.
- 2026-08-17 — after session 8, on the user's instruction "we have to get
  everything tested - no budget": opened twelve follow-up issues (COS-10 through
  COS-21) covering every defect and untested claim the campaign recorded but did
  not act on, and wired COS-1 and COS-4 to them as dependencies. The arm-size
  question the tracker had been holding for the user is settled — bars stand,
  arms get sized to support them, and every measurement issue requires n >= 146
  non-errored cells per model. Three of the twelve are new findings rather than
  carried-forward ones: the judge has never been validated as an instrument
  (COS-20), the *Reject harness-level reinforcement* ADR is Accepted on five
  cells per arm (COS-21), and nobody has checked the other two style files for
  the defects the beginner rewrite found (COS-18).
- 2026-08-17 — campaign 2 armed (`/backlog-handover init`). Inventoried all 15
  open issues; every one classified agent-resolvable, because every acceptance
  criterion is checkable by a test, a command, or a measured run, and none needs
  a human present. Nothing went to "Not queued": COS-1 and COS-4 were parked in
  campaign 1 on blockers that now have owners and on an arm-size objection the user
  has removed, so they queue last rather than sitting out.

  The user was offered two orders and chose the longer one — tools first, then
  the whole sweep, over a seven-session path straight to the two missed bars —
  and separately chose to keep COS-17 as its own session rather than folding it
  into COS-19. Both choices are recorded verbatim in the Cursor section.

  No cells run this session. Cursor armed at COS-12, which is first precisely because
  it is insurance: `run` currently writes `rows.json` only after the whole matrix
  completes, and campaign 2's arms are an order of magnitude larger than anything
  run so far.

- 2026-08-17 — session 9: resolved COS-12 on `feature/COS-12`, campaign 2's first
  issue. Restore found no drift that mattered: `dev`, `main` and both remotes
  level at `9f54140`, tree clean, no leftover branches, no open PRs. The
  handover was grounded two commits earlier at `7c269a1`; the gap is init's own
  arming commits, which is why the drift is benign.

  `run` now re-writes its whole results directory after every completed cell.
  The design question was where completeness should live, and the answer was
  *not* inside `rows.json`: every run in the ledger is a bare array and every
  offline re-derivation reads it as one, so wrapping it would have broken
  `score --rows=` on the project's entire history. A sibling `run.json` carries
  `{kind, stamp, complete, completed, expected, costUsd}` instead. New
  `harness/src/results.mjs` writes all four files through a temp file and
  `rename(2)`, manifest last so it can only ever undercount what is on disk.
  `improve` was moved onto the same writer, which is where the one real bug of
  the session surfaced: `improveStyle` calls `onRows(rows)` and the new flush's
  first parameter is the completeness flag, so passing `flush` bare would have
  stamped every mid-loop flush `complete: true`.

  AC #4 is the one that carried the rest — a real 4-cell run SIGKILLed
  after two cells, both survivors fully scored, `score` re-reading them at exit
  0 behind `PARTIAL run — 2 cells of 4 expected (2 never ran)`. Across
  three runs, the third an `improve` loop run only because nothing else
  exercises that branch and this change moved it onto the shared writer. Re-scoring `12-44-03` still returned 81.0%, so nothing
  published moved. `npm test` 64 → 77; `audit` exit 0; `lore check` exit 0.

  Two pieces of stale prose were fixed rather than left: `usage.mjs`'s
  `wantsHelp` comment stated the old once-at-the-end behaviour as a present
  fact, and the ledger's COS-5 caveat still said the CLI treats `run --help` as
  `run` when COS-5 itself added the guard. Also found while updating the
  ledger's own total: its 26 rows did not sum to the stated figure — a rounding
  artifact, now stated rather than silently reconciled.

  `/code-review high` earned its place twice over. Two of its four findings are
  hazards this change *created*: a partial `report.md` had never been possible
  before, and a bare `score` had never been able to resolve to a partial run.
  Both passed every automated gate. The other two are the change failing to
  apply its own stated invariants to `improve` — `complete: true` over three
  crashed styles, and `improve.json` written after the manifest the module
  documents as going last. Worth carrying forward: when a change makes a new
  state representable, ask which existing readers have never had to consider it.

  Merged via PR #10 (rebase) as `b735501`; `dev` and `main` both pushed at
  that SHA, remote and local `feature/COS-12` pruned, no open PRs. Cursor
  advanced to COS-10.

- 2026-08-17 — session 10: resolved COS-10 on `feature/COS-10`. No drift at
  restore: `dev`, `main` and both remotes level at `f6c098f`, tree clean, no
  leftover branches, PR #10 merged and pruned, cursor and handover agreed.

  The seam is fixed and the fix is deliberately not retroactive. `runTurn` keeps
  the assistant's blocks in order; `splitTurn` derives `trace` (all text blocks,
  blank-line joined) and `final` (the blocks after the last tool call). The
  fallback matters more than it looks: when a turn ends ON a tool call there is
  no post-tool block, and returning `''` would score 1.0 on every "no X found"
  check while returning the trace would re-glue exactly what the split exists to
  separate — so it returns the last thing the model actually said.

  **The design question was which string each rubric asks about, and the answer
  came from the rubrics rather than from taste.** Three of the four agentic case
  rubrics say "the final message ... in style"; `agentic-read-report` says "no
  narration of the search process", which needs the narration present. So checks
  that measure how the answer is written read `final`, rules the style states as
  outright bans (narration, celebration, emoji) read `trace`, and the judge reads
  whatever its case declares in `judgeOn`. Both choices are recorded on the saved
  row (`checks[].reads`, `judgeReads`), so a figure lifted out of `rows.json`
  carries the string that produced it. Two tests enforce the declarations.

  **AC #1 was bought, not argued.** A 2-cell Opus/Sonnet run on
  `agentic-fix-verify` caught the exact sentence this project has quoted
  since session 6 — *"I'll look at the file first."* — in a row that now holds it
  in `trace` and not in `text`. Segmented three ways: the glued string reads one
  22-word opening sentence, over beginner's 20-word cap; `final` reads it at 17,
  under it; `trace` reads the narration as its own 6-word sentence. A check
  changes answer on a real cell, which is the defect in one line. A prior 1-cell
  Haiku run had made a tool call with no pre-tool text and returned the
  two views byte-identical — worth having, because that is the case the fix must
  leave alone.

  **AC #5 was most of the session, and the useful part is what it could not do.**
  Gluing is lossy, so no saved agentic figure can be re-derived onto the fix; the
  honest move is the AC's own escape hatch — re-score to confirm the applicable
  half changes nothing, then label the figure as measured on the glued turn
  everywhere it appears. What *is* re-derivable is the newline split, and that
  was run across all 61 saved runs, old code against new, per run and per scope
  and per check. Rule totals move at most +1.07 points anywhere and 0.00–0.34 on
  every run behind a published four-tier figure. Segmentation figures move more
  and were corrected in place.

  Worth carrying forward: **every pre-fix figure was reproduced exactly before
  its replacement was quoted.** All twelve FINDINGS sentence figures, the
  ledger's three-row probe table and the paired validation's CI all came back
  identical on HEAD's code, which is what makes the deltas trustworthy rather
  than a second opinion. That check also caught the one place the conclusion
  needed restating: the ledger argued the 12-word cap did nothing because the
  tightened arm's over-12 share sat *inside* the untightened range; re-segmented
  it sits *above* it, and the paired CI moved from just excluding zero to
  including it. Same conclusion, firmer, but it had to be rewritten rather than
  left to read as if the old numbers still supported it.

  `/code-review high` earned its place again, and the sharpest finding was
  against this session's own prose: the ledger sentence saying the
  re-segmentation moved "at most 1.07 points, all of it in `sentence_length`"
  was wrong on both counts, because `paragraph_length` counts sentences per
  paragraph and `active_voice` iterates them. Two of the five fixed findings are
  ways a cell could earn free credit — `paragraph_length`'s list exemption saw
  only a paragraph's first character, so once bullets became sentences a
  five-item list failed a cap of four; and `code_block_size`/`no_jargon` were
  reading the final message despite being ban lists, so a 30-line diff dumped
  before the last tool call scored clean on the two heaviest beginner checks.
  Worth carrying forward: **when a change alters a shared primitive, list every
  consumer of it before claiming what moved.** `sentences()` has three consumers
  and the re-derivation was written as if it had one.

  `npm test` 79 → 94; `audit` exit 0; `lore check` exit 0.

- 2026-08-17 — session 11: **COS-11 resolved.** Errored cells no longer bias
  any figure the project quotes. One predicate, `producedReply(row)`, decides
  both whether a cell may be scored and whether it may be pooled; `summarize()`
  averages only the cells that replied and every figure states its own `n`,
  `noReply` and `cells`. An arm where nothing replied reports `null` and both
  renderers print `n/a` — zero is a score, and publishing "we could not measure
  this" as "it failed every rule" is the failure this task exists to stop.

  The predicate reads the turn, not the SDK error flag, which also closes the
  wider case COS-10's review found and handed here: a cell that goes silent
  without the flag scored 0.931 on rules plus a free judge 1.0, landing near 0.95
  for saying nothing. All 41 saved runs were swept; five hold a silent cell and
  in every one the flag was set, so the no-flag half changes no published figure
  today and is closed before the abort-prone arms are bought.

  The bias, measured on the run the AC names (`22-59-53`, 6 aborts in 78 Haiku
  cells): haiku rules 84.2 → 91.2, haiku judge 47.0 → 42.6. On
  `agentic-fix-verify` alone, rules 10.3 → 62.1 and judge 85.8 → 15.0. Opposite
  directions, one run, no cancellation.

  **The COS-10 lesson was applied rather than re-learned.** All five consumers of
  `summarize()` were enumerated before anything was claimed, and the fifth was
  the one that mattered: `improve.mjs` reads `summary.overall` for KEEP/REVERT,
  and `null - 0.65` is `-0.65` in JS, so an unmeasurable arm would have scored as
  a regression or a win by accident. An incomparable side is now always a REVERT.
  A second divergence surfaced from the same sweep: `cli.mjs score` branched on
  `r.text` while the live path branched on `error && !text`, so offline
  re-scoring and live scoring could grade different sets of cells — which would
  have quietly undermined every "re-scoring reproduces the published figure"
  claim in the ledger. Both now use the one predicate.

  **One published conclusion moved and was corrected in place.** `14-48-09`'s
  ledger row read "On holdout the rewrite showed the usual signature — rules
  70.8 → 83.3, judge 72.5 → 21.2". One of its four v0 holdout cells was an
  abort; excluded, v0 holdout is rules 94.3 and judge 63.3, so rules fell as
  well — both halves fell on both splits, and the holdout delta is −0.265 rather
  than the −0.193 the loop recorded. The REVERT verdict is unchanged and was
  never in doubt. The pooled figures were kept beside the corrected ones because
  they are what the loop actually decided on.

  Worth carrying forward: **a published figure written by a session that
  remembered the discipline needs no correction, and finding that out is
  small.** `01-03-21`'s row already read "43.6 with the errored cell excluded
  (45.9 if it is pooled)"; checking it took one command and it reproduced
  exactly. Four of the five affected runs needed nothing. Checking each figure
  against the run behind it, one at a time, is what separated the one that moved
  from the four that did not.

  `npm test` 94 → 104; `audit` exit 0; `lore check` exit 0.

- 2026-08-17 — session 12: **COS-13 resolved.** Ran the fixture before
  reading it, which is the only reason the session found anything: the suite was
  **red on a clean checkout**, `priceOrder` asserting 966 against the code's 965.
  The task described a different defect one line above it. Three of the four
  agentic cases ask the model to run these tests, so every agentic figure in the
  project was measured against a model meeting an unexplained failure it had not
  caused — and the harder a model worked, the more of it it met. 966 turned out
  to be the tax-before-discount value, so like the 850/849 pair it was a number
  contradicting the intent stated next to it; the `BUG:` comment was a third of
  the same shape, saying a value "yields 670 instead of 670" and citing a case
  where floor and round agree.

  The decision worth keeping: the fixture must be green *both* before and after a
  correct fix. Red-on-arrival is noise; red-only-after-the-fix is worse, because
  the model must then adjudicate between the test and the code. That invariant
  ruled out pinning the buggy value. It did **not** by itself choose between
  asserting the corrected value and dropping the assertion — AC #2 did, because a
  red test naming the file and the expected value hands `reserve-agentic-session`
  the answer it exists to withhold. The obvious fix was the wrong one, and only
  the second criterion separated them.

  Both defects in the new guard were found by breaking the fixture on purpose,
  not by the suite passing. The first version could not fail at all
  (`NODE_TEST_CONTEXT` inherited by the child suppresses its exit code); the
  second accepted a fixture with every test deleted (`node --test` scores an
  empty file as `pass 1`). A regression guard that has never been observed to
  fail is not evidence of anything — the falsification sweep is what made these
  four assertions worth having.

  The branch review then found a **fourth** defect of the same family that all
  of the above had walked past: `npm test` never worked in a workspace at all.
  The fixture is copied to the workspace root, so nothing sits above it, and it
  shipped no `package.json` — the most natural reading of "run the tests" died
  with `ENOENT` before a single test ran. The session had built a guard for
  exactly this class of problem and still missed it, because the guard only ever
  invoked `node --test`. A check that reproduces the harness's own habits does
  not reproduce the model's; the question worth asking of any fixture guard is
  "what command will the model actually type?"

  Two of the review's findings were in the new guard rather than the fixture,
  and both are the same failure as the two the session had already caught: a
  check that reports green when it should not, or red when it should not. It
  parsed the spec reporter's output while scrubbing only `NODE_TEST_CONTEXT`, so
  `NODE_OPTIONS=--test-reporter=tap` made it report two failures against a
  perfectly healthy fixture — accusing it of the very defect COS-13 had fixed.
  Four separate defects in one guard file, every one of them found by running it
  against a deliberately altered fixture rather than by reading it.

  `npm --prefix harness test` 112 → 117; `audit` exit 0; `lore check` exit 0.

- 2026-08-17 — session 13: **no queue item; carried COS-13 to merge.** Recorded
  here after the fact — the session logged its outcome in the Cursor section and
  the queue rows but never wrote a session-log line, and session 14 filled the
  gap rather than leave the log discontinuous. It restored onto a
  `feature/COS-13` branch session 12 had finished, reviewed and never published,
  and carried it from the review gate through PR #13's merge. Two things came
  out of it. A parallel auto-mode task moved the branches underneath the
  session: `HEAD` was left on `main`, the follow-ups commit was authored there,
  and `main` briefly led `dev` — repaired by fast-forwarding `dev` after
  verifying descent. And the branch review was started in the background and
  **finished after the PR merged**, so its four findings had no gate left to
  hold them; two became COS-22 and COS-23, appended as queue items 16 and 17
  rather than inserted, because the order above them is the user's.

- 2026-08-17 — session 14: **COS-14 resolved.** The change is small — one
  resolver, one call site, one config key — and the only real decision was
  where to put it. `cli.mjs:68` resolves the model list once, before the
  subcommand branch, and both `run` and `improve` were handed the same array;
  the fix re-resolves inside the `improve` branch instead of moving that line,
  so `run` keeps reading `matrix.models` untouched. `resolveImproveModels` is
  deliberately not passed `matrix.models` at all: the point of the task was to
  remove an inheritance, and a resolver that *could* fall back to `run`'s list
  would be one edit away from doing it again. The eleven-line `//models` comment
  in `matrix.json` existed only to warn about that coupling, and is now the
  warning it replaced.

  The absent-key branch is `['haiku']` and only haiku, warned, following COS-8's
  missing-`minReserveDelta` shape. An absent key has to fail small: this list is
  run once per candidate per iteration, so the default is the one place a
  mistake multiplies hardest. `[]` is treated as absent rather than as zero
  models, which would otherwise be a loop that measures nothing and still pays
  the author model for every rewrite.

  Verification was free and end-to-end anyway, which is the transferable part:
  `improve --cases=__none__` reaches the model-resolution line, prints it, finds
  no baseline cell, and stops before buying a candidate. Running it with
  `improve.models` temporarily set to `['haiku']` while `matrix.models` still
  held three showed `models: haiku (matrix.improve.models)` and `3 models` from
  `run` in the same session — the decoupling demonstrated on the real path at
  on the real CLI, rather than asserted from a unit test alone. `npm --prefix harness test`
  117 → 122; `audit` exit 0; `lore check` exit 0. Two docs stated the coupling
  as fact and were corrected with it: `harness/README.md`'s models bullet and
  `docs/stories/extend-measurement-coverage.md`'s notes.

  Afterwards, on the user's instruction to open follow-ups for anything missed,
  the session probed the CLI's whole argument surface without running a cell and opened
  **COS-24** as queue item 18. The review had found one instance — `--models=`
  swallowed — and fixing it for `improve` alone left the same defect in every
  other flag, because `parseArgs` accepts any `--name` and `pick` accepts
  whatever follows it. Nine more were verified by running them with
  `--cases=__none__` or by calling the affected function directly. Two are worse
  than the one that was found: `run --concurrency=abc` makes
  `Array.from({ length: NaN })` empty, so `pool` starts zero workers, returns
  `[null, null, null]` and the run dies in `summarize` with a null-property
  error after measuring nothing; and `run --no-judge=false` turns the judge off,
  because `'false'` is truthy, silently dropping the 30% judge component from
  figures that then sit beside runs that kept it. The largest is the
  plainest: an unknown flag such as `--modles=haiku` is ignored and the full
  default matrix runs.

  COS-23 also gained a fifth criterion from the same sweep. Its own merge is the
  evidence: `docs/log.md` cites `374378a` twice, which the rebase rewrote to
  `e0bb46e` and which is not an ancestor of `dev`, while `b0014af` and `2833a95`
  — the review-fix and doc-log commits — appear zero times, because `lore sync`
  has to run before a branch's last commits exist. The log is both unreachable
  and incomplete, and a direction chosen for one should cover both.

- 2026-08-17 — session 15: **COS-25 resolved. Taken out of band at the user's
  direction; the cursor stayed at COS-9.** The user asked why the project tracked
  cost at all, and three answers settled it. The dollar figures came from the
  Agent SDK's `total_cost_usd`, which is a list-price valuation of tokens the SDK
  emits whether the caller is on per-token billing or a subscription — so nobody
  was ever charged the totals campaign 1 recorded. Cost never entered a style's score;
  `checks.mjs` plus the judge do that, and the figures were telemetry about the
  test rig. And `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` are both unset
  here, so the SDK falls back to Claude Code's stored OAuth credentials — the
  subscription. Stated at the time, and worth repeating: a live run's auth
  handshake was not observed, so that last point is inference from the credential
  chain rather than a measurement.

  **The one thing that was not just telemetry was `maxBudgetUsd`.** It was passed
  live to the SDK at `run.mjs:59` and hard-stopped a runaway cell, so deleting it
  without a replacement would have removed the only runaway guard. Of the three
  bounds the SDK exposes — verified in `sdk.d.ts` — only `abortController` is a
  true circuit breaker: `maxTurns` bounds tool rounds but not the time spent
  inside one, and `taskBudget` merely tells the model its remaining tokens and
  asks it to pace itself, which is exactly what a wedged loop will not do. The
  guard is now `run.maxCellSeconds: 600`, a wall-clock ceiling over the whole cell
  rather than each turn, so a multi-turn case cannot run N times the limit.

  **Two hazards surfaced while writing it, both fixed and both tested.**
  `undefined * 1000` is `NaN` and `setTimeout` treats `NaN` as 0, so a config that
  forgot the key would have aborted every cell in the matrix on the next tick and
  labelled each one a timeout — a whole run of fabricated timeouts that no
  completeness check would flag. `runCell` now validates and throws rather than
  defaulting. And an abort can end the SDK iterator quietly instead of throwing,
  on which path `result` stays null and the row would come back `error: null` with
  empty text, indistinguishable from a model that said nothing; a `timedOut` flag
  is the authority on the error rather than the thrown exception.

  **The guard was watched failing before it was trusted.** New
  `harness/test/run.test.mjs` drives `runCell` to a real abort through an injected
  `query` seam — the `deps` pattern `evaluate` and `improveStyle` already use —
  covering wedge-then-throw, wedge-then-quiet-end, a control that finishes in
  time, and the config-validation case. Both mechanisms were then sabotaged on
  purpose: dropping the `timedOut` authority reds exactly the quiet test, and
  replacing the validation with a silent default reds exactly the config test.
  That is the campaign's own do-not-repeat rule applied to its newest guard.

  Scope: `harness/src` (six files), `harness/test` (five files), `matrix.json`,
  the ledger's cost column and per-row prose, `FINDINGS.md`, the runbook, four
  stories, the epic, two references, three ADRs, one spec, both READMEs, and this
  tracker. Sample-size claims kept their statistical basis and lost only the price
  annotations. Two judgement calls worth recording: verbatim user quotes were left
  intact rather than rewritten, because altering an attributed quote falsifies the
  record; and Done-task bodies were left alone as the immutable evidence record of
  what each session measured, which is stated in COS-25's description rather than
  left implicit.

  Suite 124 → 126 (2 cost-only tests removed, 4 guard tests added); `audit`
  exit 0; `lore check` exit 0. Re-scoring `12-44-03` offline still returns 81.0%,
  so no published score moved. `improve --cases=__none__ --iterations=0` exercised
  the whole loop path at 0 cells and the written `run.json`/`summary.json` carry
  no cost field. Cursor still armed at COS-9.

- 2026-08-17 — session 16: **COS-25 finished and merged. No queue item taken; the
  cursor is still COS-9.** Session 15 marked COS-25 Done, then `/code-review high`
  returned five findings and the status was walked back; the branch sat committed,
  unpushed and unmerged. This session resolved all five and merged it.

  **The one real defect was mine, introduced by the guard itself.** `turns` was
  declared inside `runCell`'s `try`, so the `catch` could not see it and returned
  `allTurns: []`. Before this change only an unexpected exception reached that
  catch; the timeout made it a routine path. A multi-turn case whose turns 1 and 2
  completed and whose turn 3 wedged lost both transcripts — while the *quiet*
  abort path, which never enters the catch, kept them. Same event, two structurally
  different rows, decided by which way the SDK happened to end the stream. `turns`
  and a shared `base` row are hoisted above the try; `text`/`trace` stay `''` on
  the catch path deliberately, matching what the quiet path already reports for a
  turn that produced nothing.

  **The disputed finding was settled by measuring, and it was real.** The review
  claimed `wsp.cleanup()` orphans subprocesses into deleted workspaces at
  concurrency 4. Session 15's handover argued against it from the SDK's own
  stdin-EOF-plus-grace-window documentation and its 5.0s teardown on a 3s limit.
  Neither was evidence. One real Haiku cell at a 3s limit, sampled once before and
  five times after, gave the answer: 22 `claude` processes and 5 `osh-*`
  workspaces at baseline; at T+0 **23 processes and one holding the just-unlinked
  workspace as its cwd**; back to 22 and 0 by T+2s, with the workspace count never
  above baseline. So the window exists — the review was right — and it is bounded
  at under two seconds, leaks nothing, and cannot cross cells because each has its
  own directory. No behaviour change: making `cleanup` wait would cost every
  timed-out cell that delay for no measured gain. The numbers are now a comment on
  the call so nobody re-derives them. **Both of the session-15 arguments against
  this finding were plausible and both were wrong; the probe took two minutes.**

  **One finding was closed by recording a measurement instead of softening a
  claim.** `matrix.json` told readers to "lower it only against measured cell
  durations" and `harness/README.md` called 600 "sized well above any cell observed
  here" — and no `Date.now`, `hrtime` or duration field existed anywhere in the
  harness, in the same change that had just deleted `costUsd`, the only per-cell
  size proxy the project had. Every row now carries `elapsedMs`, started with the
  timer so it measures exactly the span the guard bounds, and verified all the way
  onto `rows.json` rather than at `runCell`'s return. The README now states
  outright that nothing recorded a cell duration before that field, so no earlier
  figure supports a tighter ceiling.

  **One was a scope decision, and it went to the user rather than being taken
  here.** The judge call and the optimizer's `rewrite()` take no `abortController`,
  so either stalling hangs a run — pre-existing, since `maxBudgetUsd` never covered
  them, but the docs called `maxCellSeconds` "the runaway guard" without
  qualification. Offered as narrow-the-wording-and-file versus bound-them-now; the
  user chose the former. `matrix.json`, `harness/README.md` and
  `docs/reference/harness-architecture.md` now say the guard bounds a cell and not
  a run, name both unbounded calls, and cite **COS-26**, created for the fix and
  appended as queue item 19 rather than slotted into the confirmed order.

  **The remaining finding moved a check to where it can be read.**
  `maxCellSeconds` was validated per cell, so under `improve` the throw was caught
  by the per-style handler and filed as a style failure — a config typo reading as
  an optimizer crash — and under `run` it surfaced only after an empty
  `results/<stamp>/` already existed. `cellLimitMs` is exported and called once at
  CLI startup for `run` and `improve`; `score` is exempt because it re-grades saved
  rows and never runs a cell; `runCell` keeps it as the backstop for direct
  callers; and `config.test.mjs` now asserts the shipped `matrix.json` against the
  shipped validator so the two cannot drift.

  All three new tests were sabotage-verified, the campaign's standing rule: the
  old empty-array catch reds only the both-paths test, deleting `elapsedMs` reds
  only the duration test, and making `cellLimitMs` default instead of throw reds
  only the two tests that assert it throws.

  **The review was then run twice more, and each pass found real defects the one
  before it had not.** Round two, six findings. The worst: `cellLimitMs` guarded
  the low end and not the high end, and `setTimeout` truncates any delay past
  2147483647 ms to **1 ms** — measured, a limit of 999999999 seconds fires after
  2 ms. So the one edit an operator would make to disable the guard produced
  exactly the runaway the low-end check exists to prevent. Round two also found
  that `runTurn` had no `catch`, so a wedged turn's partial reply died with the
  exception on the throwing path while the quiet path kept and graded it — the
  same defect as finding 1, one level down — and that this branch's own README
  sentence about a top tier running "an order of magnitude more tokens" was a
  **cost** span converted into a **token** span, which does not hold because
  per-tier prices differ by about that same factor.

  Round three, five findings, and the sharpest was that the round-two fix for
  that last one had been applied in `harness/README.md` and left standing in
  `FINDINGS.md`, the measurement-coverage story and this tracker. All three are
  corrected above and in place. Round three also caught `MAX_TIMER_MS` declared
  below the function that reads it — inert today, a `ReferenceError` the moment
  anything calls `cellLimitMs` at module scope — and a real measurement loss:
  `timedOut` was unconditionally authoritative, so a cell finishing at 599.9s of
  a 600s limit came back stamped `error_timeout` and was dropped from every mean.
  A turn is now trusted only when the SDK closed it with a result message, which
  is the signal that separates a finished turn from one an abort closed quietly;
  `!error` alone would have reintroduced the very defect the `timedOut` flag was
  added for, and sabotaging it that way reds three tests.

  Suite 126 → **131**; `audit` exit 0; `lore check` exit 0 (24 files). Re-scoring
  the published `12-44-03` arm offline still returns 81.0%, so no published score
  moved. **Three review rounds, sixteen findings, all fixed** — and the lesson
  worth carrying is that a fix applied in the file the reviewer names is not the
  same as a fix applied everywhere the claim lives.

- 2026-08-17 — session 17: took **COS-9**, campaign 2 item 6, in order, after two
  consecutive out-of-band sessions had left the cursor untouched. Restored the
  option cap that the label-blindness fix had removed for unlabelled replies,
  keying it on the signals a sprawling reply carries anyway — a stated count, or
  the pivots that introduce each alternative past the first — rather than on any
  attempt to identify alternatives semantically, which would have re-broken the
  reply the first fix was written for.

  The session's discipline was to write the AC #2 regression fixtures **before**
  the fix and confirm they passed on the unmodified check: a guard that only ever
  ran against the finished code proves nothing about what the code protects. Both
  new estimators were then sabotage-verified independently, each disabled in turn
  to confirm its failure lands on the intended assertion.

  AC #3 was the reason this task was queued as a tools-first item, and it came in
  cheaper than feared. A baseline was captured before the check was touched, then
  re-scored: **1 of 96 rows moved across all 62 saved runs**, and it was
  `reserve-three-options` — the case COS-2 added specifically to provoke this
  blind spot, on the exact reply that labels two options and names a third in
  prose. 61 of 62 runs are byte-identical; no published figure moves. The ledger
  now carries that re-score as the durable record, since `results/` is gitignored.

  The review round earned its keep by probing the new code rather than reading
  it: two false positives the fix had introduced — "three ways" on a benefit
  list, and "or you can" inside a code block — were found that way, and neither
  would have shown up in a diff read. Both fixed, both sabotage-verified, and
  the re-score re-run afterwards returns the identical row and figures.

  Round 2 was the one that paid. An adversarial subagent found that the pivot
  estimator — the half of the fix built on "alternatively" and "or you could" —
  scored a compliant two-option reply at 0.70, which is the original defect
  rebuilt on the third attempt to fix this check. Checking that claim against the
  corpus settled it: those connectives match zero of the 96 re-scorable rows,
  while the stated count matches exactly the two real sprawl replies. The
  estimator had no observed true positive and a live false-positive path, so it
  came out. **The general lesson outlasts the fix**: a detector added to a scorer
  should be audited against the saved corpus before it ships, because "never
  fires" and "fires on the wrong thing" are both invisible in a diff and both
  obvious in the rows.

  Two sabotage runs came back green this session and both were wrong — once the
  substitution had silently failed to apply, once the fixture was too weak to
  trip the cap. A green sabotage run proves nothing until the sabotage is
  confirmed to have landed.

  Three rounds, eleven findings, all fixed. Both round-3 subagents died without
  reporting, so round 3 was completed by hand — probing the four estimators
  against adversarial inputs, auditing them against the corpus, and re-reading
  the final diff. That is worth knowing for the next session: the round happened
  and found two more defects, but it was not an independent pair of eyes.

  Suite 131 → **135**; `audit` exit 0; `lore check` exit 0.

- 2026-08-17 — session 18: resolved COS-20 on `feature/COS-20`. Clean start;
  the only drift was that session 17's archive commit had already been pushed
  and `main` promoted, so nothing needed reconciling. **The task's first half
  was a missing tool, not a detour**: nothing in the harness could re-judge a
  saved row, so `src/rejudge.mjs` and a `judge` subcommand were built before
  any acceptance criterion could be touched. 720 judge calls over the 60 saved
  replies of `12-44-03`, four judge tiers, three repeats each, no cells.
  The headline: the judge is **17% of the per-cell variance and the reply 83%**,
  so the arms this campaign is sized on stand — confirmed to within two cells,
  with a floor of 123 that no amount of repeat-judging beats. The task's own
  premise, that repeat-judging might be the cheaper fix, is refuted by measuring
  both costs: a cell is about one judge call and the crossover is 10.9.
  The instrument findings are the durable part. Sonnet, the configured judge, is
  the **least repeatable** of the four tiers (judge SD 10.17 against Opus's
  5.49); Haiku is neither fast nor reliable (59.5s per call, 6 unparseable
  replies in 180); and a change of judge moves the beginner bar's verdict, the
  Opus-vs-Sonnet ordering and the advanced-to-intermediate gap, while leaving
  the style ranking intact. `judgeModel` was deliberately left at `sonnet`
  and the reason recorded in `matrix.json`: every published judge figure was
  scored by it.
  Two design decisions worth carrying. `judge()` now returns `ok`, because
  its four substituted scores all sit inside the range real scores occupy and a
  substituted 0.5 in a variance study reads as the judge disagreeing with
  itself. And the plan is ordered by sweep rather than by reply, so a killed
  judge run leaves whole balanced passes rather than a few replies judged many
  times — the same reasoning as COS-12, applied to a different loop.
  Suite 135 → **153**; `audit` exit 0; `lore check` exit 0.

- 2026-08-17 — session 19: resolved COS-15 on `feature/COS-15`. No drift at restore: `dev`, `main` and both remotes level at `b2291ac`, no leftover branches, no open PRs.

  **The design call went against editing the product.** AC #1 required the choice to be argued, and the two conditionals turned out to be conditioned on different things, which decided them separately rather than together. The gloss rule ("explain it right after in one short phrase", with "I updated the API (the messenger that lets two programs talk)" as the file's own example) is conditioned on the REPLY, which is the string a check already reads — and `no_jargon` was named "avoids unglossed jargon" from the start, so only the implementation was unconditional. It now grades first use and forgives two gloss forms. "Never show code unless they ask" is conditioned on the REQUEST, which no check can see; a regex over the prompt would put a guess inside the one instrument whose value is being deterministic, so the condition lives in `codeOnRequest` on the contract and `requestsCode` on the case. Restating the two style files was rejected on the principle that the style files are the shipped product and the harness is the instrument: both prose rules are correct guidance for a real reader, and editing a shipped artifact to fit a scorer would also have cost a 148-cell beginner arm to re-measure something the harness never exercises.

  **The audit now fails a conditional in both directions.** Prose that lifts a cap with no matching contract field is drift, and so is a contract that lifts a cap the prose never grants — a reader of the style would never learn the permission exists. Only a READER'S REQUEST counts as a condition: advanced's "when they carry the point faster than prose" is a judgement the writer makes, and treating it as a condition would have demanded a `codeOnRequest` graded on every reply. The condition is read from the sentence that states the cap, not the whole file, because beginner says "Do not elaborate unless asked" three sections above its code rule.

  **Fixing the guard exposed a defect in the guard.** The condition scan tested `PATTERNS` — which carry `/g` for `matchAll` — with `.test()`, which advances `lastIndex`; `matchAll` copies it, so the SECOND parse of a body skipped its own opening lines and reported a stated cap as `unstated`. It surfaced as one test failing on the advanced file and nothing else. Caught by idempotence, which is now a test: parsing the same body twice must give the same answer.

  **AC #4 cost nothing to satisfy and everything to discharge honestly.** No style file changed, so there was nothing to measure. But the checks change moves saved scores, so all 63 saved runs were re-scored OLD CODE against NEW CODE — not saved-score against current code, which folds in every scorer change since. 651 rows graded, 72 skipped (all optimizer candidates and ad-hoc experiment styles with no contract). Exactly 6 rows moved, all `no_jargon`, all beginner; `code_block_size` moved zero because no case sets `requestsCode`. Every one of the 6 was hand-read and is a real gloss. Five published figures moved and were corrected: `02-12-24` opus rules 87.2 → 88.1, `02-15-14` sonnet 97.7 → 98.2, `02-20-01` sonnet 97.1 → 97.4, `14-48-09` train delta −0.029 → −0.035, and FINDINGS' shipped-text sonnet 97.4 → 97.7. No conclusion changed.

  **What could not be corrected, and why that is now its own task.** The paired figures in FINDINGS (+7.7 [+5.3, +10.1] t=7.06 on the reserve six, +5.2 [+0.0, +10.4] on the shared five) sit on arms that moved. Recomputing them from the saved rows reproduces every ARM MEAN in the ledger to the last digit but not the intervals: +7.8 [+5.3, +10.2] t=7.02 old against the published +7.7/t=7.06. Arm means matching exactly is what makes that a method difference rather than a data difference, so the published intervals were footnoted with the measured movement rather than silently replaced by a second method. That is **COS-27**. The by-hand read AC #2 demanded also found advanced's "under 120, headers and code included" against `total_length`'s `stripCode` — a basis mismatch, not a conditional, outside these ACs — which is **COS-28**. Intermediate's "under about 100 words when things are normal" was examined and judged NOT a defect: `total_length` gives full credit at the cap and decays to 0 at twice it, so a soft cap is graded as one.

  Six mutations, each asserted to have landed before its red was believed, each red only on its intended test: two on `contracts.json` at the CLI (audit exit 1, restored to exit 0) and four on `checks.mjs`. Suite 159 → 175.


- 2026-08-17/18 — session 20: took COS-16, the cursor, on `feature/COS-16`.
  No drift at restore: `dev`/`main` both at `62eb6a9`, no leftover branches, no
  open PRs.

  **Priced the ablation before writing prose, per AC #3's own demand.** COS-4's
  failure was measuring five edits as one bundle and being unable to tell them
  apart. Five defects became four edits (removing/bounding three, adding one)
  plus one retained-as-is: defect #5's gloss example ("API (the messenger that
  lets two programs talk)") was COS-15's own fix made moot — `no_jargon` now
  grades first use and forgives exactly that shape, so the example demonstrates
  compliance rather than violating it.

  **The baseline re-measurement corrected a real published figure.** COS-4
  published beginner's judge score at n=35/model: 73.9 Opus, 58.1 Sonnet. At
  n=150/model (0 errors, both the five shared cases and six reserve cases),
  it reads 66.8 / 60.9 — inside COS-4's own stated interval, so the estimate
  did not move, the interval did. It matters: 73.9 was above the project's 70%
  bar, 66.8 is below it. Corrected in FINDINGS.md and four docs, merged as
  `716d628`.

  **The four-edit bundle is a null result with one real regression.** Judge
  flat on both splits; rules move under a quarter point either way. But Opus's
  mean reply length rose +1.71 [+0.27, +3.16] words on the shared five — a real
  effect, breaching AC #4's not-above-63.0 reading. No single edit explains it:
  all four, measured individually after the ablation was retried clean (0
  errors, 150/model each), show no harm on any metric. Testing E1+E2+E3 with
  E4 dropped found the likely source — Opus's word delta falls to +0.20
  [-2.75, +3.15], null — but that arm's Sonnet half hit the usage window at 56
  of 150 cells and needs a clean re-run before the three-edit candidate can
  ship.

  **Parked at the user's direction** rather than waiting out a third window.
  Merged only what was legitimately independent of the shipping decision: the
  corrected judge figures and six new ledger rows recording every cell spent
  this session (4540 cells persisted project-wide, up from 640). `/code-review
  medium` found one arithmetic slip in a since-superseded planning note,
  corrected. `npm --prefix harness test` 179/179; `audit` exit 0; `lore check`
  exit 0. Merged via PR #19 (rebase) as `9081f33`, with one commit
  (`f674597`, the arithmetic correction) recovered by direct cherry-pick to
  `dev` after `gh pr merge`'s local housekeeping failed on an uncommitted file
  and the retry reported the PR already merged — the remote `feature/COS-16`
  was not auto-deleted in that path and was removed manually. `dev` and `main`
  both pushed at `716d628`, no branch litter, no open PRs. The cursor did not
  move: COS-16 remains item 9, unresolved.

- 2026-08-18 — session 21 (tracker admin, no issue lifecycle run): the user
  asked what cell-free work was available while COS-16 waits out Claude Code's
  usage limits. Proposed Campaign 3 — COS-23, COS-27, COS-22, COS-24, COS-26,
  the five To Do issues whose acceptance criteria need no harness `run` — and
  the user confirmed the order via `/backlog-handover init`. Tracker updated:
  Cursor section re-pointed to Campaign 3 / COS-23, Campaign 2's cursor held
  (not advanced, not abandoned) at COS-16 with a resume pointer into the
  task's own notes. No branch, no PR — this is tracker administration only,
  committed directly to `dev` per the init lifecycle's own convention (I3).
- 2026-08-18 — session 22: resolved COS-23 on `feature/COS-23`. No drift at
  restore: `dev`/`main` both at `d03a7db`, clean apart from an untracked,
  unowned `system-prompt.md`, no leftover branches, no open PRs. Swept every
  SHA in `docs/log.md` against `origin/dev` and found the campaign's own
  `lore sync` already self-heals a dead pre-rebase SHA within one session
  cycle — the file is a live regeneration from `git log`, not an append-only
  ledger. Closed the one gap still open today (`ea48ed7`, absent from the log
  until this session's `lore sync` ran) and added a permanent fix: SKILL.md
  step 9 now re-syncs `docs/log.md` on `dev` right after every PR merge, so
  the gap never survives past the session that created it. **Self-caught
  defect, worth carrying forward**: the first attempt to update this tracker
  truncated it from 1361 to 399 lines — `backlog doc view --plain`'s output
  exceeded the tool's display cap, and piping the saved file through
  `sed -n '1,400p'` silently dropped everything past line 400 (the "Risk
  policy" and "Session log" sections included) before it was ever committed.
  Caught by comparing the post-update file's line/byte count against the
  pre-edit git blob rather than trusting the CLI's "Updated document" success
  message. Recovered the full content with `git show <sha>:<path> > file`
  (a direct shell redirect, which does not pass through the tool's output
  cap) and re-applied the same edits against the complete file. **Do not
  read or round-trip a large backlog doc through the Bash tool's captured
  stdout — redirect straight to a file and diff/wc it before trusting an
  edit is complete.**
- 2026-08-18 — session 23: resolved COS-27 on `feature/COS-27`. No drift at
  restore: `dev`/`main` both at `e222b64`, clean apart from the same
  untracked, unowned `system-prompt.md`, no leftover branches, no open PRs.
  Traced FINDINGS.md's published COS-4 paired figures to their raw saved
  rows and reverse-engineered the exact computation: pair by (case, model),
  average repeats, sample-SD (n-1) paired-t interval. Confirmed against the
  reserve arm first (no repeat-averaging ambiguity, n=12) — matched the
  published rules figure to the last digit on the first attempt. The
  shared-five arm needed one more insight: its after-side pools a second,
  larger run (`02-25-39`) the ledger already names as a judge-noise fix,
  and pooling it in reproduced all four of that column's metrics exactly.
  7 of 8 published cells reproduce exactly; reserve reply-words did not
  (~1-word gap, no cause found after checking the obvious candidates) and
  was restated with the original value and the investigation recorded,
  per the task's own AC #2 branch for that outcome. Implemented as
  `harness/src/interval.mjs` + `node src/cli.mjs interval`, with a
  real-data regression test anchored to the reserve rules figure so a
  future change to the method cannot silently drift from what FINDINGS.md
  quotes. Suite 179 -> 189.
- 2026-08-18 — session 24: resolved COS-22 on `feature/COS-22`. No drift at
  restore: `dev`/`main` both at `d3022be`, clean apart from the same
  untracked, unowned `system-prompt.md`, no leftover branches, no open PRs,
  190/190 baseline. Hardened `harness/test/fixture.test.mjs` against all 4
  gaps a review found plus the docs-accuracy point: `verdict()` now checks
  `skipped`/`todo`/`pass` counts, not just `fail` and a source-derived
  assertion count, so an all-skipped suite fails instead of reading green;
  the pinned-value scan walks every file under `fixtures/repo`, not just the
  test file, and switched from `.includes()` to a `\b850\b`/`\b849\b`
  word-boundary regex so `src/pricing.js` is covered and `8500`/`1850` no
  longer false-positive; the `npm test` guard routes through the same
  `verdict()` parsing and surfaces `r.error` on a spawn failure instead of an
  opaque empty diff, and now fails a `"test": "true"` no-op script that
  exits 0 without running anything. Qualified the `reserve-agentic-session`
  difficulty claim in `docs/stories/make-the-measurements-trustworthy.md`:
  `src/pricing.js` still carries a literal `BUG:` comment a single
  `grep -rn BUG` finds, deliberate for `agentic-read-report` but meaning the
  case's remaining difficulty is search, not comprehension. 5 new
  sabotage-verified regression tests, one per gap, each proving the specific
  failure mode is caught. Suite 190 -> 195.
- 2026-08-18 — session 25: resolved COS-24 on `feature/COS-24`. No drift at
  restore: `dev`/`main` both at `da2deb4`, clean apart from the same
  untracked, unowned `system-prompt.md`, no leftover branches, no open PRs,
  195/195 baseline. Widened `cli.mjs`'s shared `pick()`/`parseArgs` into
  validated flag parsing: an unrecognised flag, a value-taking flag with no
  value, a boolean flag given one, a non-numeric `repeats`/`concurrency`/
  `iterations`/`judge-repeats`, and an unmatched `--variants`/`--cases` entry
  now all throw a message naming the flag before any cell is measured, in
  place of silently becoming `true`/`NaN`/an empty list/a wrong default.
  `improve` given more than one explicit `--variants` now errors instead of
  silently using the first; the no-flag default (every configured variant,
  narrowed to the first) is unchanged on purpose — that is the invocation
  `README.md` and `npm run improve` document, not the "passing two variants"
  bug the AC describes, and a bare length check would have broken both. One
  small, unintended real API cost during manual verification of that default
  path (a backgrounded `improve` run killed just after its first measurement
  log line, not before it) — flagged to the user. 9 new CLI-level tests in
  `harness/test/usage.test.mjs`, one per failure family, `execFileSync`
  against the built CLI since nothing imports `cli.mjs`. Suite 195 -> 204.
- 2026-08-18 — session 26: resolved COS-26 on `feature/COS-26`, Campaign 3's
  last item. No drift at restore: `dev`/`main` both at `ece23e6`, clean apart
  from the same untracked, unowned `system-prompt.md`, no leftover branches,
  no open PRs, 214/214 baseline. Generalized `run.mjs`'s `cellLimitMs` into a
  shared `secondsToMs(name, seconds)` validator and reused it to give
  `judge.mjs`'s `judge()` and `improve.mjs`'s `rewrite()` (now exported) each
  their own `AbortController` timeout — `run.judgeTimeoutSeconds` and
  `improve.rewriteTimeoutSeconds` in `matrix.json`, 120s backstops, both
  fail-loud at CLI startup on a missing/bad value the same way
  `maxCellSeconds` already did. A stalled judge call substitutes the existing
  neutral-0.5 path with a violation naming the timeout; a stalled rewrite call
  is folded into the loop's existing "author returned nothing usable" stop
  path, with a distinct log line so the two are not indistinguishable. Both
  guards keep a real result if it happens to land in the same tick the timer
  fires, rather than discarding a genuine measurement. Sabotage-verified with
  4 new wedge-then-real-abort tests (throw-on-abort and quiet-end-of-iterator,
  for both calls) driving the injected `queryFn` seam to a real
  `AbortController` fire, plus 1 config test on the two new matrix.json keys.
  Suite 214 -> 219. `harness/README.md` and
  `docs/reference/harness-architecture.md` updated so neither call reads as
  unbounded any more — `lore sync`/`lore check` both clean. **Campaign 3 is
  now empty** — COS-23, COS-27, COS-22, COS-24 and COS-26 are all Resolved.
  Cursor section rewritten to stop pointing at a specific next issue and
  instead direct the next `restore` session to ask the user whether to resume
  Campaign 2 at COS-16 (cell budget permitting) or `init` a fresh queue,
  per the skill's own queue-empty branch.

- 2026-08-19 — session 27: resumed COS-16 and finished it, the item Campaign 2
  had been held at since session 20. Nothing was re-authored: the three-edit
  candidate rebuilt from the recipe in the task to the same sha256 `86451ddb`,
  verified before a cell was spent. The two arms session 20 lost to Claude
  Code's usage window ran clean on the first attempt — `2026-08-20T03-03-26`
  (shared five, 30 repeats) and `03-13-05` (reserve six, 25 repeats), 300 cells
  each, 150 a model, **0 errored in either**, 19m18s of wall clock end to end
  — 31 cells a minute at concurrency 12, measured from the run stamps rather
  than carried over from session 20's 26.5 estimate. All twenty paired intervals — pooled and per-model, both splits,
  rules/judge/composite/words — contain zero, and the four-edit bundle's Opus
  word regression (+1.71 [+0.27, +3.16]) reads -0.12 [-2.28, +2.04] with E4
  dropped, now on a full Sonnet arm rather than Opus alone. All six acceptance
  criteria checked with run stamps; `audit` exit 0, 219/219 tests, `lore check`
  exit 0. Because shipping these bytes means `19-42-55` and `19-53-49` no longer
  measure the file that ships, `FINDINGS.md` (four passages), `docs/index.md`,
  the epic and three stories were corrected and two rows added to the experiment
  ledger, whose persisted-cell total moves 4540 → 5140. One mid-session claim
  was corrected in the task notes: an `audit` exit code read through a `tail`
  pipe was the pipe's, not the audit's; re-run unpiped it is 0, and no
  conclusion rested on the masked reading. Cursor advances to COS-18. `/code-review high` raised twelve defects,
  all in the prose and record layer — it re-scored both runs, recomputed every
  interval and re-ran every gate, and found the measurement sound. Eleven were
  fixed on the branch: a truncated sentence that lost the word 'Sonnet', three
  copies of a wrong count ('four of the five contradictions' for three), E4
  described as 'a fifth change', **a double-rounded Opus judge figure (66.2 for
  the true 66.1) that had already propagated to eight places**, a Resolved row
  separated from its table by a blank line, **two invented cell counts in this
  tracker (3000/1244 for the counted 4500/1183)**, an interval enumeration
  listing 24 metrics for a count of 20, and four passages still calling
  `19-42-55` 'the shipped text' with the correction appended below rather than
  the sentence fixed. The twelfth is filed as **COS-29**: E3's precedence
  sentence has a dangling antecedent, and fixing it means changing bytes that
  have been measured, so it gets its own arm rather than a quiet edit here. Two
  of the eleven — the double-rounded judge figure and the invented cell counts —
  are precisely the stray-number defect class COS-16 exists to remove, found in
  COS-16's own record.
  Noted while placing COS-16's row and **not fixed**: the Campaign 2 Resolved
  table has no row 8. COS-15 was resolved in session 19 and its row was never
  added. Left alone rather than reconstructed, because writing an evidence
  summary from outside that session is how invented figures get into this file —
  the task record for COS-15 is intact and is the place to read it from.

- 2026-08-20 / 2026-08-26 — session 28: resolved COS-18 on `feature/COS-18`. No
  drift at restore. **Shipped the diagnosis and not the fix**, which is the
  session's one substantive judgement call and was made twice: once when the
  monthly spend limit destroyed the reserve before arm, and again six days later
  when the retry — launched only after a 2-cell probe confirmed the limit had
  cleared — crawled at ~0.7 cells a minute and was stopped by hand at 141 of 300.
  E1 was reverted, the style files are byte-identical to HEAD, and the measured
  edit moved to COS-33 intact.

  **What the arm settled.** Intermediate carries all four of COS-4's defects;
  advanced carries the router and, weakly, the contradiction, and is clean on the
  other two. 600 cells, 0 errored. The router finding is the cleanest in the
  campaign so far: 138 of 138 shape violations on non-status cases.

  **Three self-corrections, all caught inside the session and all recorded.** A
  600-cell arm was launched on the train split under the belief that it was "the
  five shared cases" and killed at 125; the shared five is a convention 22 of 24
  five-case runs follow and `cases.json` records it nowhere. `interval` reported
  "the edit did nothing" until the before file was filtered to one style — it
  pairs on case and model and ignores style, now COS-30. And a cell tally written
  from memory put six runs at five and 1468 rows at 1166; the ledger total was
  briefly wrong at 6306 before being counted to 6608.

  **Two things a later session should not have to rediscover.** Throughput moved
  by an order of magnitude within one session (≈5 cells/min to ≈0.7), so session
  27's 31 is not a planning figure any more. And `/private/tmp` did not survive
  the six-day gap — the analysis scripts and the candidate file were lost, while
  the edit rebuilt byte-for-byte from the recipe and sha256 recorded in the task.
  Durable facts belong in the task, not in a scratch directory.

- 2026-08-27 — session 29: took COS-17, the cursor item. Probed the usage ceiling
  with 2 cells before committing 300 (`2026-08-27T12-34-30`, clean), then ran two
  150-cell arms — beginner on Haiku (`12-35-06`) and on Fable (`12-50-55`), the
  five shared cases, 30 repeats, **0 errored cells in either**. Completed the
  four-tier beginner row: rules 95.8 / 97.4 / 99.2 / 99.3 and judge 48.2 / 60.9 /
  66.1 / 65.2 on Haiku / Sonnet / Opus / Fable, all four at 150 non-errored cells.
  Verified from `git log` that the scorer, contract, judge prompt, runner and case
  set all last changed before the Opus/Sonnet run, which is what makes a seven-day
  gap between the columns harmless. The rewrite's length effect reproduces on both
  middle tiers and does so larger than any tier step COS-7 could measure. Updated
  FINDINGS.md, the epic, the coverage story and the ledger; removed the history
  figures rather than footnoting them; rewrote FINDINGS.md's judge-defect section,
  which described a row it no longer applies to. **Corrected two of my own claims
  before committing**: "beginner's rules column is now the strongest of the three"
  (false on Haiku by 0.2) and "the largest measured change in the project" (a
  superlative with two rewrites and a contract fix stacked in it that no arm
  separates). **Flagged, not fixed**: the ledger's running cell total is 82 short
  of a disk count. Cursor advances to COS-21.

- 2026-08-27 — session 30: **took COS-21 and resolved leg 1 of 3; the issue stays
  open and the cursor stays on it.** Before running anything, established that
  **AC #5 was unsatisfiable as written** — it asked for per-arm costs that COS-25
  deliberately removed from the harness — and amended it, with the user's
  approval, to wall-clock and cell counts. The user set the campaign's pacing rule
  in the same exchange (25% of any 5-hour window; "I'd rather it take 24+ hours
  than max out a limit"), which is what makes COS-21 a multi-session issue.
  **Leg 1, beginner × Opus, five variants at 150 non-errored cells each, 0 errored
  across all five**: baseline composite 83.07, long-prompt 81.84, claude-md 81.36,
  tail-reminder 81.00, all-fixes 80.24. Paired against baseline over 15 case pairs,
  **only all-fixes clears zero** — composite −2.8 [−5.2, −0.5], judge −4.7
  [−9.1, −0.4]. The ADR's headline claim, `claude-md` at −9.4, comes back **−1.7
  [−4.5, +1.1]** on this leg. Direction reproduces; magnitude and ranking do not.
  Nothing is concluded yet: leg 3 tests the ADR's own cell and is not run.
  **Lost one arm to the monthly spend limit** (`15-15-54`, 121 of 150 errored) —
  the fourth this campaign — then re-probed with two cells after a pause, found it
  clear, and retried it clean. Worth separating: the session was inside its
  5-hour-window budget at 34 minutes; **the monthly limit is a different ceiling
  and that budget does not protect against it.** **Resolved 70 of the 82 cells
  session 29 flagged as missing from the ledger total**: 9 directories carry an
  `improve.json` and no `run.json`, and the previous count read a missing
  `run.json` as "pre-manifest" and swept 70 improve-loop cells into a total that
  has always excluded them. Corrected figure is a 12-cell gap, still open. Merged
  as PR #28 (rebase).
- 2026-08-27 — session 31: **COS-21 leg 2 (beginner × Haiku), four of five arms.**
  Probed two cells (`22-23-51`, 0 errored, 12.6s) before committing, per the rule
  that has now paid off five sessions running. Ran baseline `22-24-10`,
  long-prompt `22-41-46`, tail-reminder `22-59-12`, claude-md `23-15-05` — 600
  cells attempted, **598 non-errored, 2 errored**, every arm clearing AC #1's 146
  floor. **65m40s of cell running at 8.7–9.7 cells a minute**, stopped at a
  variant boundary because a fifth arm would land at ~82 minutes, past the
  ~75-minute budget. `all-fixes` carries to session 32.
  **The result sits on the other side of zero from leg 1's.** On Opus every
  reinforcement variant scored below baseline, but only `all-fixes` cleared zero —
  the other three were nulls, not measured costs. On Haiku, against a 68.69
  baseline: long-prompt
  **+5.2 [+2.1, +8.2]** composite and **+9.7 [+3.9, +15.6]** judge; tail-reminder
  **+3.3 [+1.1, +5.4]** and **+6.0 [+1.7, +10.3]** — both clear of zero, both
  upward, both driven entirely by judge with rules and length flat. claude-md is
  the exception and an instructive one: composite +2.0 [−1.6, +5.6] is a null,
  but it cuts mean reply length **−15.9 words [−22.4, −9.3]**, from 87.3 (over
  the 80-word cap) to 70.6 (under it), and that shortening buys no score. The
  working hypothesis is that reinforcement helps a model already failing the style
  and does not help one already complying — **supported by this leg, not concluded
  from it.** The stronger claim, that it actively costs the complying model, rests
  on a single leg-1 arm and is not made here. The ADR and FINDINGS.md remain untouched: leg 3 is the ADR's own
  cell and has not run.
  **One process note worth keeping:** `backlog task edit --notes` *replaces*
  implementation notes rather than appending, and wiped session 30's seven
  sections on the first write. Recovered from `git show HEAD:` and re-applied
  with `--append-notes`. Use `--append-notes` on any multi-session task.
  A tail-reminder arm was also launched from the repo root instead of `harness/`
  and died on `MODULE_NOT_FOUND` in under a second — no results directory, no
  cells spent, re-run clean.

- 2026-08-28 — session 32: **COS-21 leg 2 finished and leg 3 opened.** Branch
  `feature/COS-21` off `dev` @ `b87dfc5`. Four arms, **600 cells attempted, 600
  non-errored, 0 errored** — the campaign's cleanest session — in **68m47s** of
  cell running against the ~75-minute pacing budget, stopped at a variant
  boundary. Leg 2 arm 5 `all-fixes` (`2026-08-28T00-33-04-943Z`, 15m13s) came in
  at composite 72.77 vs the 68.69 baseline: **+4.1 [+1.9, +6.3]** composite,
  **+6.9 [+2.6, +11.2]** judge, words **−10.6 [−18.4, −2.9]**. That makes **three
  of leg 2's four reinforcement variants clear zero upward on Haiku**, with
  `claude-md` a score null that still shortens replies. Leg 3 then began on the
  ADR's own cell: baseline `2026-08-28T00-49-16-410Z` at composite 88.40 (rules
  98.34, judge 65.22, 109.7 words), `long-prompt` `01-08-39` at 87.67, and
  `tail-reminder` `01-27-19` at 87.69. **Both reinforcement arms are nulls** —
  −0.7 composite each, intervals spanning zero. Nothing in the ADR or FINDINGS.md
  was touched, deliberately: `claude-md` carries the ADR's largest number and has
  not run. Cursor stays on **COS-21**.

- 2026-08-28 — session 33: **COS-21 finished: leg 3's last two arms, then the
  analysis.** Branch `feature/COS-21` off `dev` @ `db8605e`. Probed 2 cells
  (13s) before committing. `claude-md` (`2026-08-28T02-02-08-988Z`, 150/0,
  ~14-19 min) came back **−0.9 [−3.6, +1.9] composite, −2.8 [−10.2, +4.6]
  judge — the ADR's headline 9.4-point claim, a tenth the size and a null.**
  `all-fixes` (`2026-08-28T02-20-08-256Z`, 150/0, 18m36s) came back **−1.7
  [−4.1, +0.8] composite, −3.8 [−10.1, +2.5] judge — also a null**, unlike
  leg 1 where `all-fixes` was the one arm that cleared zero. **Leg 3 final:
  all four reinforcement variants are nulls on the ADR's own cell.** Grid
  complete: 2250 attempted, 2248 non-errored, 2 errored (both leg 2). AC #5's
  ledger check counted `rows.json` on disk across all 15 arms rather than
  summing from memory — the disk count matched the recorded per-arm sum
  exactly, no correction needed this time. **Analysis**: every ADR claim
  checked against the leg-3 interval — 9.4-point and 4.5-point gaps withdrawn,
  "every layer worse" withdrawn as a general claim (3 of 4 layers cleared
  zero upward on Haiku), tail-reminder's noise-band claim confirmed, the
  Sonnet replication claim out of scope. Updated
  `docs/adr/reject-harness-level-reinforcement-of-style-rules.md` in place
  (status: "narrowed by re-test") — decision scoped to models already
  complying with the style rather than a blanket rule — and re-stated
  `FINDINGS.md`'s recommendation, withdrawing the "delete CLAUDE.md tone
  rules" advice as unproven. Gates: 219/219 harness tests, `lore check` exit
  0 over 24 files. All 5 ACs verified and checked; task marked Done. Cursor
  advances to **COS-19**.

- 2026-08-28 — session 34: restored, verified no drift (`dev`/`main` both at
  `0a4fb13`, clean, no leftover branches, COS-19 To Do and unstarted, tracker
  cursor agreed), branched `feature/COS-19` off `dev`. Probed 2 cells on all
  four target arms (advanced/intermediate x haiku/fable), 8/8 clean, then ran
  advanced x haiku full (`2026-08-28T02-58-38-491Z`, 150/150, 0 errored,
  13m45s). Started advanced x fable; it lost 45 of 150 cells to repeated
  session-limit errors (`2026-08-28T03-13-14-527Z`, 105 usable). **The user
  directed skipping further Fable attempts** rather than keep re-hitting the
  limit. Ran intermediate x haiku full (`2026-08-28T13-31-38-172Z`, 150/150,
  0 errored, ~11m43s) — the last measurable arm. Built AC #2's single-sample
  interval tool (`singleSampleInterval` in `interval.mjs`, wired through
  `interval --rows=`). **`/code-review high` caught a pseudo-replication bug
  in the first version before merge**: it treated 150 rows (5 cases x 30
  repeats) as 150 independent observations, understating every interval
  roughly 5x. Fixed to group by case first (n=5, df=4 on every cell
  regardless of repeat count), matching `pairedInterval`'s existing
  de-clustering; 224/224 tests after. Computed corrected judge intervals for
  all 12 four-tier cells and rewrote `FINDINGS.md`'s per-cell table. That fix
  also changed AC #3's re-check: withdrew the beginner-vs-advanced rules
  parity claim as before, but the "clean split" re-check turned out bigger
  than first reported — properly paired by case (this project's own method,
  never actually applied to this specific claim), **every model's interval
  contains zero, including Sonnet and Opus, which had been called
  "confirmed"** on arm-mean subtraction alone. Haiku's point estimate itself
  moved (+9.3 at n=10 → +1.6 at n=150, paired SE 7.4→1.2), which is where the
  extra repeats actually bought precision. Confirmed AC #4 already fully
  satisfied — no live cell predates `3370e4d`. Updated the epic doc and this
  story doc via `lore link`/`lore sync`; `lore check` exit 0 over 24 files.
  Updated the
  ledger with this session's runs and an honest disk recount (9866 rows in
  118 directories), flagging COS-21's un-logged legs 2-3 as the gap's likely
  source rather than forcing a false reconciliation. **Asked the user how to
  close AC #1's Fable gap**; they chose opening a follow-up (COS-34, appended
  as queue item 27, linked to this story) over leaving COS-19 In Progress.
  COS-19 marked Done with AC #1 unchecked and the caveat recorded. Cursor
  advances to **COS-4**, item 14 — COS-34 stays appended behind items 14-26,
  not next.
