---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-18 13:30'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**ACTIVE CAMPAIGN: 3 (cell-free housekeeping). Next issue: COS-27.** Campaign 2's
cursor (COS-16) is HELD, not resolved and not abandoned — see below. A
`restore` session should take COS-27 next, in Campaign 3's confirmed order.

**Why the cursor moved off COS-16.** COS-16 needs one more clean measurement
arm (the E1+E2+E3 candidate's Sonnet half) before it can ship, and that
ablation has hit Claude Code's 5-hour usage window twice, plus a weekly limit
the user hit on 2026-08-18. None of Campaign 3's five issues need a harness
`run` — they are code, tests, and docs work verified by `npm test`, sabotage,
offline re-scoring of saved rows, or git reachability checks — so the campaign
can keep moving without spending a cell. Confirmed by the user on 2026-08-18
("add the cell-free issues to a new campaign") after being offered the option
during a status check.

**Resuming COS-16.** When cell budget is available again — ask the user, or
try one clean arm and stop immediately if the usage-limit error reappears —
re-point the Cursor section back to `**Next issue: COS-16**` and continue
Campaign 2 from where it left off. Every fact needed to resume is in the task
itself (`backlog task view COS-16 --plain`): the exact three-edit candidate to
rebuild (sha256 `86451ddb`), which arm is missing (Sonnet, five shared cases,
30 repeats), and which ACs are still open (#2, #4, #5, #6). Do not re-derive
any of it from this tracker.

## Campaign 3 (cell-free housekeeping)

Confirmed by the user on 2026-08-18, from an AI-proposed order: COS-23 first
because `docs/log.md`'s SHA problem affects the campaign's own record for
every session including COS-16's eventual resumption; then COS-27
(reproducibility); then COS-22, COS-24, COS-26 by increasing code complexity.
Runs interleaved with Campaign 2 — this section's cursor is the tracker's
active cursor until Campaign 3 empties or the user redirects.

| # | Issue | Type | One-line note |
|---|---|---|---|
| 1 | COS-23 | protocol | **Resolved, session 22.** `docs/log.md` cites SHAs `gh pr merge --rebase` destroys — systemic across the campaign. See Resolved. |
| 2 | COS-27 | measurement/harness | FINDINGS.md's paired confidence intervals have no recorded, reproducible method. **The active cursor.** |
| 3 | COS-22 | harness | Harden the fixture guard COS-13 added — 4 gaps, one already fired unnoticed. |
| 4 | COS-24 | harness | CLI silently substitutes defaults for malformed flags — 10 ACs, all unit-testable. |
| 5 | COS-26 | harness | Bound the judge/rewrite calls so a stalled grader cannot hang a run. |

## Campaign 2 (held at COS-16)

**Next issue: COS-16** — queue order for campaign 2 confirmed by the user on
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

**Session 20 took COS-16 and did not finish it. The cursor stays COS-16.**
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
| 9 | COS-16 | styles | The five contradictions COS-4 left. Each edit measured on its own this time. |
| 10 | COS-18 | styles | Do intermediate and advanced carry beginner's four defects? Nobody has looked. |
| 11 | COS-17 | measurement | Beginner on Haiku and Fable. Kept separate from COS-19 by the user's decision. |
| 12 | COS-21 | measurement | The reinforcement ADR rests on five cells per arm. |
| 13 | COS-19 | measurement | The four-tier baseline at a sample size its claims need. Last of the measurement work, so it measures final text. |
| 14 | COS-4 | styles | Beginner judge > 70% on Opus and Sonnet. Currently 73.9 / 58.1. Achievability unproven. |
| 15 | COS-1 | styles | Judge > 65% on the two weak cases. Achievability unproven, and its arms were never sized. |
| 16 | COS-22 | harness | **Moved to Campaign 3, item 3, 2026-08-18.** Harden the fixture guard COS-13 added. Four gaps, one of which already fired unnoticed on the branch that introduced the guard. Runs no cells. |
| 17 | COS-23 | protocol | **Moved to Campaign 3 item 1, 2026-08-18; resolved session 22.** `docs/log.md` cites SHAs that `gh pr merge --rebase` destroys. Systemic across the campaign, not a COS-13 defect. Runs no cells. |
| — | COS-25 | harness | **Resolved out of band, sessions 15 and 16.** Not a queue item: taken at the user's direction ahead of the cursor. Removed cost and budget tracking from the harness, the published record and this tracker, and replaced `maxBudgetUsd` with a wall-clock runaway guard. Session 15 implemented and reviewed it; session 16 fixed the review's findings and merged. Runs no cells. |
| 18 | COS-24 | harness | **Moved to Campaign 3, item 4, 2026-08-18.** The CLI silently substitutes defaults for malformed flags: an unknown flag (`--modles=haiku`) runs the full default matrix, `--concurrency=abc` measures nothing, `--no-judge=false` turns the judge off. Opened by session 14; COS-14 fixed one flag on one subcommand and this is the widening. Runs no cells. |
| 19 | COS-26 | harness | **Moved to Campaign 3, item 5, 2026-08-18.** The judge call in `judge.mjs` and the optimizer's `rewrite()` in `improve.mjs` take no `abortController` and no timeout, so either stalling hangs a run that has already bought hours of cells. `maxCellSeconds` bounds a cell, not a run, and `maxBudgetUsd` never covered these two either — the gap predates both guards. Opened by session 16 from COS-25's review; **appended after item 18 rather than slotted into the order the user confirmed.** Runs no cells. |
| 20 | COS-27 | measurement | **Moved to Campaign 3, item 2, 2026-08-18.** The paired confidence intervals in `FINDINGS.md` have no recorded computation and cannot be reproduced to the last digit, so a scoring change cannot update them. Opened by session 19; **appended**. Runs no cells. |
| 21 | COS-28 | styles | Advanced states "under 120, headers and code included" while `total_length` counts `stripCode(text)`. A basis mismatch, not a conditional, so COS-15 could not reach it. Opened by session 19; **appended**. Costs a run or a re-score, depending on which side moves. |

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

**Campaign 3.**

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-23 | Task Done — 2026-08-18, session 22 | All 5 ACs verified, **no cells run** — every criterion was a reachability/history question. **AC #1**: swept every SHA in `docs/log.md` against `origin/dev` (`git merge-base --is-ancestor`) — 0/77 dead at the branch point. Cross-checked the specific SHAs COS-13 (`acadf1b`, `e71e38c`, `3d2635a`) and COS-14 (`374378a`) had diagnosed as dead: all four are gone from the file's text and unreachable, but each has a live replacement entry under the *same subject line* with a different, currently-reachable SHA (e.g. `374378a`'s "Give improve its own model list instead of run's" now cites `e0bb46e5`). Root cause: `lore sync` regenerates `docs/log.md`'s per-directory sections from a `git log` walk of the *current* HEAD, not an append-only ledger — so a dead pre-rebase SHA a mid-branch sync records self-heals the next time any later session's branch (descended from the merged `dev`) syncs again. The defect is real but strictly bounded to a one-session-cycle window between a PR's rebase-merge and the next docs-touching session's sync, never a permanent injury — confirmed tight: COS-14's own doc-log-recording commit (`2833a95`, rebased to `cb638d4`) is present in today's log, i.e. it self-healed within one cycle. The one gap open today was `ea48ed7` (session 21's own "record the campaign-3 log entry" commit), absent from `docs/log.md` until this session ran `lore sync` — the concrete AC #5 instance: a session whose doc-log commit was absent from the log today, closed by this fix. (COS-14's review-fix commit `b0014af` is correctly absent forever: it touches `harness/` and `README.md`, not `docs/`, and the log is scoped to `docs/` subdirectories by design — not a defect.) **AC #2**: chose "regenerate post-merge" over dropping SHAs or changing the merge strategy — since sync already regenerates the log from live history, the fix is one more `lore sync` call on `dev` right after every PR merge, before the `main` fast-forward, closing the gap in the same session instead of leaving it to the next one. Keeps the SHA provenance the task calls out as reader value, and does not touch the rebase-merge strategy the campaign locked in for linear history. **AC #3**: re-swept all 78 SHAs in the fixed `docs/log.md` against `origin/dev` — 0 dead. **AC #4**: `.claude/skills/backlog-handover/SKILL.md` step 9 now runs `lore sync` on `dev` unconditionally after every merge, commits+pushes if it changes anything, before promoting to `main`. `lore check` exit 0 (24 files, 0 errors, 0 warnings); `npm --prefix harness test` 179/179 (no code touched, so the count is unchanged from session 21's baseline). |

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
