---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-17 13:58'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-9** — queue order for campaign 2 confirmed by the user on
2026-08-17, who chose the "Fix tools first, then everything" option from a
presented comparison over a shorter path that went straight to the two missed
bars: "15 sessions. Repairs the measuring tools before spending on any test,
then re-establishes every published number. Slowest to the headline goal, but
nothing gets measured twice." The user separately confirmed keeping COS-17 as
its own session rather than folding it into COS-19, because "it answers sooner
and cheaper, and COS-19 can reuse its data."

Do not re-ask before taking the next item.

Campaign 2 items 1 to 5 (COS-12, COS-10, COS-11, COS-13, COS-14) are resolved;
the cursor has advanced to item 6.

**Session 13 took no queue item.** It restored onto a `feature/COS-13` branch
that session 12 had finished and reviewed but never published, carried the
lifecycle from the review gate through the PR merge, and opened COS-22 and
COS-23 from the review's remaining findings. The cursor did not move: COS-14 was
armed before session 13 started, and session 14 took it.

Campaign 1 is closed. Its cursor ran COS-6 -> COS-3 -> COS-2 -> COS-8 -> COS-5
-> COS-7 -> COS-1 -> COS-4; six resolved, two parked. Those two are now items 14
and 15 of campaign 2, because the blockers under them have owners.

## Queue (confirmed order)

**Campaign 1: complete.**

| # | Issue | Type | Outcome |
|---|---|---|---|
| 1-6 | COS-6, COS-3, COS-2, COS-8, COS-5, COS-7 | mixed | Resolved, merged, all acceptance criteria met |
| 7 | COS-1 | styles | ACs #1-#3 merged; AC #4 missed and parked |
| 8 | COS-4 | styles | ACs #2-#3 met and merged; AC #1 missed and parked |

**Campaign 2: 17 issues.** Items 1-15 are the order the user confirmed on
2026-08-17. Items 16 and 17 were opened later, by session 13, from a review that
landed after COS-13 had already merged; they are **appended, not inserted**,
because the order above is the user's and a session does not get to rewrite it
quietly. Read the note under the phase list before taking one.

| # | Issue | Type | One-line note |
|---|---|---|---|
| 1 | COS-12 | harness | **Resolved, session 9.** Flush rows so a killed run keeps what it paid for. Insurance before any large arm. Cost $0.1812 to prove, not the $0 planned. |
| 2 | COS-10 | harness | **Resolved, session 10.** Score the final message, not the whole turn. Cost $0.4143 to prove the seam end-to-end. The fix does not reach backwards: saved agentic figures are labelled, not corrected. |
| 3 | COS-11 | harness | **Resolved, session 11.** Errored cells scored 0 on rules and 1.0 on the judge. Both biases, one fix, at the one place every figure comes from. $0 — re-scoring saved rows is free. Corrected one published conclusion (`14-48-09`). |
| 4 | COS-13 | fixture | **Resolved, session 12.** The reported contradiction was one of three; the fixture's test suite was red on a clean checkout. $0. |
| 5 | COS-14 | config | **Resolved, session 14.** `improve` now bills `matrix.improve.models`; `run`'s list is no longer reachable from that path. $0. |
| 6 | COS-9 | checks | `two_options_max` is blind to prose option sprawl. Re-scores saved rows, no new spend. |
| 7 | COS-20 | judge | Validate the judge as an instrument. Cheap — saved replies re-judge for free — and may cut every later sample size. |
| 8 | COS-15 | contracts | The audit cannot express "unless they ask". Touches two style rules, so it measures. |
| 9 | COS-16 | styles | The five contradictions COS-4 left. Each edit measured on its own this time. |
| 10 | COS-18 | styles | Do intermediate and advanced carry beginner's four defects? Nobody has looked. |
| 11 | COS-17 | measurement | Beginner on Haiku and Fable. Kept separate from COS-19 by the user's decision. |
| 12 | COS-21 | measurement | The reinforcement ADR rests on five cells per arm. |
| 13 | COS-19 | measurement | The four-tier baseline at a sample size its claims need. Last of the measurement work, so it measures final text. |
| 14 | COS-4 | styles | Beginner judge > 70% on Opus and Sonnet. Currently 73.9 / 58.1. Achievability unproven. |
| 15 | COS-1 | styles | Judge > 65% on the two weak cases. Achievability unproven, and its arms were never sized. |
| 16 | COS-22 | harness | Harden the fixture guard COS-13 added. Four gaps, one of which already fired unnoticed on the branch that introduced the guard. No spend. |
| 17 | COS-23 | protocol | `docs/log.md` cites SHAs that `gh pr merge --rebase` destroys. Systemic across the campaign, not a COS-13 defect. No spend. |

The order is a valid topological sort of the recorded dependencies, and every
phase boundary is a real constraint rather than a preference:

- **1-6, repair the instrument.** No measurement spend. COS-12 is first because
  it is insurance for everything after it. Buying precision on a scorer that
  reads the wrong string, pools errored rows and grades against a
  self-contradicting fixture would be expensive and worthless.
- **7, characterise the instrument.** COS-20 before the expensive arms, because
  it may lower the 146-cell figure the rest of the campaign is priced on.
- **8-11, the style text.** Every file change lands before the record is rebuilt,
  so nothing is measured twice.
- **12-13, rebuild the published record.** COS-19 last of these: it re-measures
  the headline table, and it must measure final text.
- **14-15, the two parked bars**, each of which depends on work above it.

**On items 16 and 17.** By nature both belong in the repair phase — they are
cheap, they buy no cells, and COS-22 is literally tool repair. They sit at the
end anyway because nothing downstream depends on either: COS-22 hardens a guard
that already enforces the invariant it was written for, and COS-23 is a
provenance defect in a generated log, not in any measurement. Neither blocks a
single item from 5 to 15. A session that wants to promote them into the repair
phase should say so to the user rather than assume, since that reorders a
sequence the user chose from a presented comparison.

Both came from the COS-13 branch review, which finished **after** the PR had
merged — the review agent watched `dev..HEAD` go empty underneath it and
re-reviewed the merged tree. That is a protocol hole worth naming: the skill
treats review as a pre-merge gate, and this session ran it in the background and
let the merge proceed. Run the review to completion before opening the PR.

**Campaign 1 spend: $53.00** — COS-6 nothing, COS-3 $0.7500, COS-2 $1.1800,
COS-8 $2.4152, COS-5 $1.8770, COS-7 $14.4290, COS-1 $13.6567, COS-4 $18.6813.

**Campaign 2 has no budget ceiling**, by the user's decision on 2026-08-17 ("we
have to get everything tested - no budget"). For planning: an arm at the required
146 non-errored cells per model runs about $19 at the measured $0.1297 a cell,
and considerably more on Fable, whose worst single agentic cell has cost $1.1315.
Budget off the worst cell, not the mean. Items 1-6 were planned at zero spend;
COS-12 in fact cost $0.1812, because its fourth acceptance criterion required a
real run to be killed rather than a unit test. Expect the same shape on the
other instrument-repair items: a few cents to prove a behaviour end to end. The
arm-sized spend still starts at item 8, and the largest single session is COS-19.

**Campaign 2 spend so far: $0.5955** — COS-12 $0.1812 ($0.0682 the killed run, $0.0216 the completed one, $0.0914 an improve loop run to exercise the shared writer), COS-10 $0.4143, COS-11 **$0** (every acceptance criterion was satisfiable from saved rows; the first item in either campaign to cost nothing since COS-6).

Note for anyone reconciling this against an earlier version: the pre-COS-7 total
was recorded here and in session 5's handover as $5.93, but the five per-session
figures those documents themselves state sum to **$6.2222**. The parts are the
evidence — each is quoted in its own Resolved row from that session's runs — so
the sum has been corrected rather than the parts. The $5.93 appears to have been
carried forward without re-adding.

Two spend caveats recorded under COS-5. Cells that abort on the turn limit carry
`costUsd: 0`, so `22-59-53`'s six failed cells burned tokens no row records. And
one aborted invocation — `node src/cli.mjs run --help`, which the CLI then
treated as `run` — ran about two minutes at concurrency 4 across the full matrix
before being killed. It wrote no `rows.json`, so its spend is real, unquantified,
and excluded. A third, smaller one under COS-7: a model-id probe that omitted
`--variants` ran five cells instead of one, $1.58 instead of ~$0.19. That spend
IS counted above.

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-6 | Task Done — 2026-08-16, session 1 | README-only. All 3 ACs checked against quoted README lines: name resolution from frontmatter `name:` with filename fallback, a "Confirm it loaded" section giving the behavioural check and the canary, and the silent-fallback statement. Scripted checks: all three frontmatter names appear verbatim in the README (3/3); both new doc links resolve. `npm --prefix harness test` 11/11; `lore check` 0 errors after `lore sync`. Review found 3 issues, all fixed on the branch. Merged as `0631c04`. |
| 2 | COS-3 | Task Done — 2026-08-16, session 2 | All 3 ACs proved against a real improve run on the reviewed code, `results/2026-08-16T15-04-22-436Z/` (beginner, Haiku, 2 cases, 1 iteration, 4 cells, $0.0919), after an earlier 18-cell run at `14-48-09` ($0.6097) established the same three identities on the first implementation. AC #1: all four per-iteration transcript files present including the reverted v1, and `rows.json` groups 1/1/1/1 across v0 and v1. AC #2: rows sum = `summary.json` totalCostUsd = `improve.json` spentUsd = 0.0919, the counter deleted in favour of `spendOf(rows)`. AC #3: `score --rows` reproduced the loop's logged 0.8 / 0.9 / 0.669 / 0.85 exactly, exit 0 with the API pointed at a dead socket and no new results directory; no-arg `score` finds an improve run unaided. Plain-run path unchanged (12-44-03 still 81.0% at $7.517). `npm --prefix harness test` 23/23 (12 new); `lore check` 0 errors. `/code-review high` found five issues, all real and all fixed on the branch. Merged as `1daff4d`. |
| 3 | COS-2 | Task Done — 2026-08-16, session 3 | All 4 ACs proved on real improve runs against the committed code, not unit tests alone. Six paid runs, $1.18 total against a ~$3 budget. The decisive one is `results/2026-08-16T20-57-54-086Z/` (beginner, Haiku, 1 train + 1 holdout + 2 reserve, 3 iterations, 12 cells, $0.30): the real optimizer produced a candidate that won train and beat holdout by 29.5 points (0.644 -> 0.99), and was **17.7 points worse on the reserve** (0.623 vs 0.800). The guard rejected it and rolled back — `best.md` came out byte-identical to the shipped `plain-english-beginner.md` (`diff -q`), with the rejected rewrite preserved at `v2.md`. Offline re-scoring shows the ADR's signature exactly: reserve rules flat 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. AC #1 checked by scripted search of persisted rows — 0 reserve case ids in any train or holdout row, reserve files written for v0 and the winner only. AC #2's accept path proved in `20-50-12` (v1 0.582 vs v0 0.591, -0.009, ACCEPT); the no-adoption skip path in `20-47-28` and `20-55-37`. Case pool 9 -> 13 (5/4/4), new cases rather than carved out. `npm --prefix harness test` 34/34 (11 new); `lore check` 0 errors. `/code-review high` found six issues, all real: five fixed on the branch — including a config footgun where a missing `minReserveDelta` would have silently rolled back every run — and the sixth raised as COS-9. Merged via PR #4 (rebase) as `2d4bcb4`. |
| 4 | COS-8 | Task Done — 2026-08-16, session 4 | All 4 ACs verified; the caps question was settled by trying the change and measuring it, not by argument. AC #4 first and free: new `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`, exposed as `node src/cli.mjs audit` (exit 1 on disagreement) and 11 test cases; suite 34 -> 45. Proved by re-creating the divergence that actually shipped (contracts back to beginner 15/3, intermediate 18): 3 FAILs, CLI exit 1, `npm test` 43/45. AC #1: measured `results/2026-08-16T12-44-03-883Z/` — all three levels already write the same sentence length (beginner 12.3, intermediate 12.4, advanced 11.5 words), so the lower levels are not being served shorter sentences today; paragraph caps settled offline for free as inert (1.4-1.8 sentences against a cap of 4; re-scoring at cap 3 moves the check 0.000-0.017). A $0.18 Haiku probe (`22-18-53`) said a 12-word cap works — 16.6 -> 12.3 words, over-cap 30% -> 11% — and the user ratified tightening on it, conditional on both-model validation. AC #3 killed it: paired opus+sonnet run over 6 cases spanning all three splits (`22-27-15`, 24 cells, $2.24) moved mean sentence length **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter, judge 0.557 -> 0.532, reply length 105 -> 114. Reverted; `git status` clean on both files. AC #2 is checked but vacuous — nothing shipped tightened; the mechanism was exercised (file first, contracts second, audit caught the in-flight mismatch) before the revert. `/code-review high` found seven issues, all real and all fixed on the branch — including a fourth-consecutive-session prose-number defect (the spec quoted Haiku's over-20-word rate against an over-12-word metric) and the guard not being wired into the optimizer runbook's adopt step, where it would predictably have turned `npm test` red on a legitimately-won rewrite. Suite 34 -> 47. Total spend $2.4152 against ~$8. Merged via PR #5 (rebase) as `ac1a161`. |
| 5 | COS-5 | Task Done — 2026-08-16, session 5 | All 3 ACs verified against `results/2026-08-16T22-59-53-852Z` (3 styles x haiku x baseline x **13 cases** x 2 repeats = 78 cells, $1.8770). AC #1 ran the full pool, not the 5 cases the old baseline used. AC #2 was satisfied **without re-running opus/sonnet** (~$19.5 at 12-44-03's measured $0.1253/cell, against a ~$5 budget): the new haiku rows were sliced to the same 5 case ids `12-44-03` used, after verifying in git that those 5 case definitions are byte-identical across 444b221/8a76f13/49fd1fa/HEAD and that the style files, `checks.mjs` and `contracts.json` are unchanged between the runs; re-scoring `12-44-03` offline reproduced its 12 published FINDINGS figures to the tenth of a point. Zero errored cells in that slice on any model. Result: rules survive the drop to the cheapest tier (haiku 90.9–96.0, never more than 1.8 points behind the better of opus/sonnet, and ahead of opus on intermediate); judge does not (37.5–62.2, last on all three styles) — which also closed the one-style-file ADR's open item that the cheap tier was untested. AC #3's failure mode is **turn-limit exhaustion, not wording**: 6 of 78 cells returned no reply at all, every one a 12-turn abort on a case that edits a file then runs tests. Like-for-like on `agentic-fix-verify`, the one such case all three models have run: haiku 5 aborts in 6 cells, opus 0 in 6, sonnet 0 in 6. It hit all three styles, so no rewrite fixes it. Because an empty reply scores 0.0 on every rule, pooling those cells understates haiku's rule compliance ~10 points — FINDINGS.md now reports "replies only" and "counting no-reply as 0" separately. **The predicted failure mode was refuted**: measured with `checks.mjs`'s own `words()`, haiku averages 11.8w on the shared 5 and 12.0w on the full pool, and **sonnet** is the long-sentence model at 13.5w. The probe's arms re-derive exactly, but its 16.6 is not haiku's baseline — the same configuration measures 12.1w at 8 cells and 12.2w at 25. Decisively, the probe's case was a 12-word cap cutting the over-12 share 60.0% → 40.5%; haiku's *untightened* share is 38.4–43.0%, so 40.5% sits inside its own range. Stated as "the evidence for an effect is gone", not "there is no effect", since the tightened arm is also n=4. COS-8's revert stands and is strengthened; its mechanism is corrected in the ledger, the audience-level spec and `harness/README.md`. Also fixed rather than only documented: `run --help` launched the full paid matrix (new `src/usage.mjs` guard, unknown command now exits 2). `npm test` 47 → 52; `audit` exit 0; `lore check` exit 0. `/code-review high` raised 10 findings, all real and all addressed. Merged via PR #6 (rebase) as `14d72ea`. |
| 6 | COS-7 | Task Done — 2026-08-16, session 6 | All 4 ACs verified. Three paid runs, **$14.4290** against a ~$20 budget — the campaign's most expensive session and its last measurement task. `23-47-08` (5 cells, $1.58) confirmed the SDK accepts `claude-fable-5[1m]` before the matrix launched. `23-48-45` (30 cells, $7.04, **0 errors**) is the Fable baseline on the same five case ids, style text, scorer and variant as `12-44-03`. `23-53-02` (6 cells, $5.81, 0 errors) added `agentic-fix-verify`, the one case that discriminated the tiers. Reuse of `12-44-03`/`22-59-53` as the other three columns was re-verified, not assumed: the five case definitions are byte-identical across 444b221/3370e4d/8a76f13/49fd1fa/HEAD, `checks.mjs` and all three style files are byte-identical 444b221→HEAD, and because `contracts.json` did change once (3370e4d, after `12-44-03`) the question was settled by re-scoring both runs offline — all twelve published figures reproduced exactly. **AC #1**: advanced 97.9/78.3, intermediate 93.1/67.7, beginner 91.4/53.9. The top tier does not sweep — last of four on intermediate rules, behind Sonnet on intermediate judge. **AC #2**: FINDINGS.md's per-model table, the epic snapshot and the story's coverage table all carry four columns. **AC #3 — word-cap overrun does not track tier.** Mean reply words ÷ that style's own cap, counted with `checks.mjs`'s own `words()`: Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300; in tier order the sequence turns twice. Paired over the 15 (style × case) cells, the cheapest model overruns significantly MORE than the second cheapest (+0.127, 95% CI [+0.034, +0.219]) and the top two tiers are indistinguishable (+0.070, CI [−0.118, +0.259]). Sonnet is the outlier that keeps to the cap; there is no gradient. The doc's "roughly twice as often" is from a run whose style text has since been replaced — on the shipped files it is 1.44×. **AC #4 — one-file decision confirmed** at the top of the range: Fable drops the same rule subsets the others do, never more than 2.5 points behind the best of the other three, the eight rules it does not drop scoring 96.7–100.0 on all four tiers at once. One ADR overstatement corrected while confirming it (the ranking is identical for rules, but the judge's top two swap: Haiku/Sonnet rank intermediate above advanced, Opus/Fable the reverse — already present in the three-model data). Beyond the ACs: Fable aborts **0 of 6** on `agentic-fix-verify` where Haiku aborts 5 of 6, at $0.9681/cell, but its own compliance falls 94.1/66.6 → 79.5/41.2 there with `leads_with_conclusion` at 16.7 — on `agentic-read-report`, the one agentic case all four tiers ran under the current style text, `leads_with_conclusion` is sonnet 100.0, opus 50.0, haiku 16.7, **fable 16.7** — the top tier level with the cheapest and both far behind the middle two, which makes pre-tool narration a Claude Code habit rather than an Opus trait. Reading those transcripts found a harness defect, raised not patched (see below). Fable deliberately kept OUT of `matrix.json`'s `models`, which is `improve`'s default too. `npm test` **52 → 56** (new `harness/test/config.test.mjs`); `audit` exit 0; `lore check` exit 0. `/code-review high` raised 9 findings, all real and all addressed — the serious one being statistical over-claiming in my own word-cap section, where six paired comparisons on the same 15 units were run without multiplicity adjustment and three bolded as significant; under Bonferroni only one survives, and the units are 3 styles x the SAME 5 cases so the intervals were too narrow besides. The section was rewritten to rest on the point estimates instead, which need no inference and give the same answer. Merged via PR #7 (rebase) as `0747cc8`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. |

**Campaign 2.**

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-12 | Task Done — 2026-08-17, session 9 | All 4 ACs verified, and AC #4 required a real kill rather than a unit test. Two paid Haiku runs, **$0.0898**. `results/2026-08-17T05-29-31-663Z` (beginner, Haiku, baseline, 4 conversational cases, repeats 1, concurrency 1, judge on) was SIGKILLed — `kill -9`, no handler, no graceful shutdown — the moment `run.json` read `completed=2`. Both survivors came back fully scored: `conv-status-auth` rules 0.985 / judge 0.62 / total 0.802, `conv-decision-db` rules 1.0 / judge 0.58 / total 0.79, $0.0682 between them. The killed process never printed its `wrote` line, so nothing but the per-cell flush put those files on disk (**AC #1**). `run.json` read `complete: false, completed: 2, expected: 4` (**AC #2**), and `score --rows=` exited 0 printing `PARTIAL run — 2 cells of 4 expected (2 never ran)` above every table (**AC #3**). `results/2026-08-17T05-31-40-879Z`, the same configuration allowed to finish, writes `complete: true` and `score` says `complete run — 1 cell`. Design: `rows.json` stays a bare array — every run in the ledger is one and every offline re-derivation reads it as one — so completeness lives in a sibling `run.json`, and every file is written through a temp file and `rename(2)` so a kill mid-write cannot truncate the paid data. The manifest is written last on purpose: it can then only ever undercount what is on disk. New `harness/src/results.mjs` owns the directory; `evaluate()` gained `onRows` (per completed cell, indexed by cell so a partial file is ordered like the complete one it would have become) and an injectable `runCell`; `improve` uses the same writer. Regression check: re-scoring `12-44-03` still returns 81.0% at $7.517, so the flush moved no published figure. `/code-review high` raised four findings, all real and all fixed on the branch: a partial `report.md` was indistinguishable from a complete one (it now opens with the manifest sentence as a blockquote, the same device `report.mjs` already used for optimizer traces); the PARTIAL line went to stderr while every figure went to stdout, so `score > figures.txt` dropped it — and that was a *new* exposure, because a bare `score` resolves to the newest run and only now can the newest run be a partial one; `improve` stamped `complete: true` even when every style threw; and `improve.json` was written after the manifest, contradicting the manifest-last invariant this change itself asserts. `npm --prefix harness test` **64 → 79**; `audit` exit 0; `lore check` exit 0. Spend caveat now recorded in the ledger: the cell in flight when the kill lands has spent tokens no row will ever carry, so flushing recovers completed cells, not the interrupted one. Merged via PR #10 (rebase) as `b735501`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. |
| 2 | COS-10 | Task Done — 2026-08-17, session 10 | All 5 ACs verified. Three paid Haiku/Opus/Sonnet cells, **$0.4143**. `run.mjs` no longer does `text += b.text`: it keeps the assistant's blocks in order and `splitTurn` derives `trace` (all text blocks joined by a blank line) and `final` (the blocks after the last tool call, falling back to the last block said if the turn ended on one — `''` would score 1.0 on every "no X found" check). The row carries `text` = final, `trace`, `allTurns` (per-turn trace) and `allFinals`. **AC #1 was measured, not read**: run `06-21-53` (2 cells, $0.38) caught an Opus cell making 8 tool calls and opening *"I'll look at the file first."* — `trace` 642 chars, `text` 612, the difference being exactly that narration. Segmented with the project's own `sentences()`, the glued string the old code would have saved reads one **22-word** opening sentence, over beginner's 20-word cap; `final` reads it at **17 words**, under it; `trace` reads the narration as its own 6-word sentence. One check changes answer on one cell — the whole defect in miniature. The Sonnet cell aborted on the turn limit and wrote `trace: ''`, exercising the error path; `06-21-03` (1 cell, $0.03, Haiku) made a tool call with *no* pre-tool text and returned the two views byte-identical, which is the case the fix has to leave alone. **AC #2**: every entry in `CHECKS` declares `reads: 'final' | 'trace'` and the value is copied onto each saved check row, so a figure lifted from `rows.json` says which string produced it. The line comes from the case rubrics, not taste — three of the four agentic rubrics say "the final message ... in style", so checks measuring how the answer is written read `final`; rules the style states as outright bans (narration, celebration, emoji) read `trace`, because those are violations wherever they appear. The judge reads `caseDef.judgeOn`: `agentic-read-report` → `trace` (its rubric grades narration of the search), the other three agentic cases → `final`. Both are enforced by tests, and the chosen judge view is saved as `judgeReads`. `scoreDeterministic` now throws a TypeError on a bare string so no caller could be missed silently. **AC #3/#4**: `sentences()` splits on a single newline; against HEAD's code the new tests move "Here's why:\nYou're paying twice." from 1 sentence to 2, a two-item list from 2 to 3, and `sentence_length` at an 8-word cap from 0.0 to 1.0 — and `splitTurn`/`viewsOf`/`VIEWS` do not exist on HEAD at all, so the whole new block fails to link against it. **AC #5 is the one that took the session.** All 61 saved runs were re-scored on both codebases and compared per run, per scope and per check. The seam half **cannot be applied backwards** — gluing is lossy — so every published agentic figure was re-scored to confirm the applicable half leaves it unchanged (`paragraph_length` on `agentic-read-report` 100.0/100.0/100.0/95.8 by tier; Fable `agentic-fix-verify` `paragraph_length` 16.7, `leads_with_conclusion` 16.7, rules 79.5; `leads_with_conclusion` on `agentic-read-report` 50.0/100.0/16.7/16.7) and then **explicitly labelled as measured on the glued turn** in `FINDINGS.md`, the ledger, `harness/README.md` and both story docs. The newline half *is* re-derivable and was: rule totals move at most +1.07 points on any run and scope, and 0.00–0.34 on every run behind a published four-tier figure — inside the noise floor — but segmentation figures move more and were corrected in place (FINDINGS' per-model table Opus 10.6→10.2w/7.9→6.3%, Fable 11.1→10.7/9.6→8.8%, Haiku 11.3→10.1/10.0→8.1%, Sonnet 13.4→12.9/20.3→19.5%, Haiku full-pool 11.5→9.6/10.6→7.0%; the ledger's probe table 16.6→15.5, 12.1→10.8, 12.2→10.4 words and 60.0→56.3%, 43.0→35.2%, 38.4→30.2%). **Every pre-fix figure reproduced exactly before its replacement was quoted**, which is what makes the deltas trustworthy. One published conclusion needed restating: the ledger argued the 12-word cap did nothing because the tightened arm's 40.5% over-12 share sat *inside* the untightened range 38.4–43.0%; re-segmented it reads 38.5% against 30.2–35.2%, i.e. **above** the range, and the paired CI moved from [0.06, 8.07] to [−0.17, 8.03] — from barely excluding zero to including it. The conclusion holds and is firmer; it was restated rather than left standing. `/code-review high` raised six findings, all real; five fixed on the branch. Two were ways a cell could earn free credit — `paragraph_length`'s list exemption saw only a paragraph's first character, so once bullets became sentences a five-item list failed a cap of four; and `code_block_size`/`no_jargon` read the final message despite being ban lists, so a 30-line diff dumped before the last tool call scored clean on the two heaviest beginner checks. A third, an unrecognised `judgeOn`, handed over the whole judge weight silently. The review also caught this session's own ledger sentence claiming the re-segmentation moved 'at most 1.07 points, all of it in `sentence_length`' — wrong on both counts, since `paragraph_length` and `active_voice` re-segment too. The sixth finding (a non-errored empty cell scoring 0.931 on rules) is pre-existing and byte-identical on `dev`; recorded for COS-11, and the README claim it contradicted was corrected here. `npm --prefix harness test` **79 → 94**; `audit` exit 0; `lore check` exit 0. |
| 3 | COS-11 | Task Done — 2026-08-17, session 11 | All 5 ACs verified, **$0 spend** — every criterion was satisfiable from saved rows, and re-scoring is free. One predicate, `producedReply(row)` in `checks.mjs`, now decides both whether a cell may be scored and whether it may be pooled into a mean. It is keyed on the turn, not on the SDK error flag, which closes the wider version of the same bias COS-10's review found: a cell that goes silent *without* the flag scored 0.931 on rules for beginner on `agentic-fix-verify` — every "no X found" check finds no X — plus the free judge 1.0, landing near 0.95 for saying nothing. **AC #1/#4, the two biases in one run**: re-scoring `22-59-53` (78 Haiku cells, 6 turn-limit aborts, the run the AC names) moves haiku rules **84.2 → 91.2** and haiku judge **47.0 → 42.6** — up and down, same run, no cancellation. On the case that actually aborts, `agentic-fix-verify`, rules go 10.3 → 62.1 and judge 85.8 → 15.0 at n=1/6. Pinned by a test that asserts both directions at once rather than by that table. **AC #2**: a group with no replying cell reports `null`, not 0 — zero is a score, the worst one, and would publish "we could not measure this" as "it failed every rule". Seen live on `01-33-41`, where advanced @ haiku aborted 2 of 2 and now prints `unmeasured / n/a`. **AC #3**: every group in `summary.json` carries `n` (cells behind the figure), `noReply` and `cells`; `report.md` renders all three as columns and a **Measured over:** header; the console tables print `no reply=k/N`. `costUsd` deliberately still pools every cell — an aborted cell was paid for. **AC #5**: all 41 saved runs were swept, not just the one named. Five hold a silent cell (`14-48-09` 1/18, `22-59-53` 6/78, `01-03-21` 1/24, `01-33-41` 3/6, `06-21-53` 1/2) and in **all five the flag was set**, so the no-flag case still has never appeared in a saved run and changes no published figure today. Each published figure was then checked against the run behind it: the `22-59-53` ledger row and FINDINGS' four-tier table are unchanged (both quote the five shared conversational cases, where nothing errored); the ledger's `94.2 → 83.4 on advanced` reproduces exactly; `01-03-21`'s row already quoted "43.6 with the errored cell excluded (45.9 if it is pooled)" and needed no correction — it was written by a session that remembered the discipline. **One published conclusion moved**: `14-48-09`'s ledger row read "On holdout the rewrite showed the usual signature — rules 70.8 → 83.3, judge 72.5 → 21.2". One of its four v0 holdout cells was an `agentic-fix-verify` abort; excluded, v0 holdout is rules **94.3** and judge **63.3**, so rules fell too and both halves fell on both splits. The holdout delta is −0.265, not the −0.193 the loop recorded. The REVERT verdict is unchanged. Corrected in place, with the pooled figures kept, because they are what the loop actually decided on. The five consumers of `summarize()` were enumerated before anything was claimed (the COS-10 lesson): `evaluate()`, `results.mjs`, `cli.mjs run`, `cli.mjs score` and `improve.mjs` — the last reads `summary.overall` for KEEP/REVERT, and `null - 0.65` is `-0.65` in JS, so an unmeasurable arm would have read as a regression or a win by accident; an incomparable side is now always a REVERT. `cli.mjs score` branched on `r.text` where the live path branched on `error && !text`, so the two disagreed on a cell that errored while emitting text — both now use the one predicate, which is what makes AC #5's re-derivation a re-derivation. `npm --prefix harness test` **94 → 104**; `audit` exit 0; `lore check` exit 0. |
| 4 | COS-13 | Task Done — 2026-08-17, session 12 | All 4 ACs verified, **$0 spend** — every criterion was settled by running the fixture, not by buying cells. The reported defect (an assertion of 850 beside a comment computing 849) was one of **three of the same shape, and not the worst**. Found by running the pristine fixture before touching it: `node --test test/pricing.test.mjs` gave `tests 3 / pass 2 / fail 1` — `priceOrder` asserted **966 where the code returns 965**, so **the suite was red on a clean checkout**. 966 is exactly what you get taxing *before* discounting (`applyDiscount(withTax(1000,'US'),10)` = 966), so that number contradicted the test's own name, one line below the contradiction that was reported. `workspace.mjs` copies this fixture into every workspace and three of the four agentic cases ask the model to run the tests, so every model that did met a failure it had not caused and that had nothing to do with the rounding bug — the more thoroughly it worked, the more of this it met. Third defect: the `BUG:` comment read "yields 670 instead of 670", a number differing from itself, and cited a case that does not exhibit the bug at all (1000*0.33 = 330 exactly, so floor and round agree). Fourth: the module header claimed cents "everywhere except the public API" while every export takes and returns cents. **AC #1/#2 turn on one decision.** Three candidates for the 999/15 assertion: assert 849 (the fixed value), assert 850 (the current value, honestly labelled), or drop it. Settled against one invariant — *after a correct fix the suite must be green*, because a suite that breaks when the model does the right thing is precisely the adjudication noise this task exists to remove. That kills "assert 850". Between the other two, AC #2 decides: asserting 849 makes the suite **red on arrival with a failure naming both the file and the expected value**, which hands `reserve-agentic-session` its answer from one command — the case whose own note says it "withholds both, which forces search, read, run, edit and re-run" — and re-creates for `reserve-agentic-write` the same unrelated-red-test noise defect 1 was causing. So the assertion was dropped. No coverage lost: `applyDiscount` is still exercised by the 1000/33 case, whose value is identical under floor and round. Verified both directions: pristine `pass 2 / fail 0`, and a temp copy with `Math.floor` → `Math.round` also `pass 2 / fail 0`, with the bug still behavioural (850 pristine, 849 fixed). **AC #3** was a full sweep, not a spot check: `lineTotal`, `applyDiscount` (both comment claims), `withTax` (US/UK/DE/unknown country), `priceOrder` composition and defaults, and both surviving assertions, each recomputed independently — all OK, and the composition check proved the test name is discriminating (discount-then-tax 965, tax-then-discount 966). **AC #4 labels rather than re-derives**, because items 12 and 13 rebuild the published record and re-running now would measure twice. The COS-10 glued-turn wording was extended in `FINDINGS.md`, `harness/README.md`, the ledger and `extend-measurement-coverage.md`, and the caveat is stated as deliberately *weaker* than the glued turn — it changes what the model met, not what the scorer read, so `agentic-read-report` and every conversational figure are explicitly excluded. **A new guard, `harness/test/fixture.test.mjs`** — the task itself notes this was found by reading a transcript rather than by a check, and nothing in the suite executed the fixture. It was written wrong **twice**, and both were caught by deliberately breaking the fixture rather than by the tests going green: (1) it could not fail at all, because `node --test` sets `NODE_TEST_CONTEXT=child-v8`, the child inherited it and reported over a serializer channel instead of exiting non-zero, so `execFileSync` never threw — reintroducing the 966 assertion left all 116 tests green; (2) after that fix, an empty suite still counted as green, because `node --test` reports a file containing *no* tests as `pass 1`, so a "pass count > 0" liveness check accepted a fixture whose tests had been deleted. Fixed with an env scrub plus `spawnSync` status checking, and by comparing reported passes against the number of `test(` declarations in the file. **`/code-review high` raised six findings, all real.** One had already been fixed on the branch (the session caught independently that its own "do not correct this to 966" comments were leaking, in the file the model reads, exactly what the AC #2 decision refused to leak). Of the other five, the one that matters most is a **fourth pre-existing defect**: the fixture is copied to the workspace *root*, so it has no `package.json` above it the way it does in this repo, and it had none of its own — `npm test` exits with `ENOENT` before a single test runs. Only `node --test` worked, and nothing told the model that. Same defect class as the reported assertion, one command earlier, and invisible to a guard that only ever invoked `node --test`. Fixed with a fixture `package.json` and a fifth guard assertion that runs `npm test` in a workspace-shaped copy. Two more were in the guard itself: it parsed the spec reporter's output while scrubbing only `NODE_TEST_CONTEXT`, so `NODE_OPTIONS=--test-reporter=tap` made it report **two failures against a green fixture** — accusing it of the defect just fixed; and its liveness count matched `test(` only at column 0, so indenting the cases inside a `describe()` would have failed a healthy fixture. Both fixed and both verified in each direction. The fifth: the corrected `BUG:` comment had *sharpened* a leak rather than only removing a contradiction — it named the file, the case and both values, the payload the guard's own fourth test forbids in the test file — so it is trimmed back to the original's information content. Final falsification sweep: reintroduce 966 → 3 failures; pin 850 → 2; fix the bug in the fixture → 2; delete its tests → 2; delete its `package.json` → 1; rename `test(` to `it(` → 0; wrap in `describe()` → 0; restored → 117/117. `npm --prefix harness test` **112 → 117**; `audit` exit 0; `lore check` exit 0 (24 files). |
| 5 | COS-14 | Task Done — 2026-08-17, session 14 | All 4 ACs verified, **$0 spend** — every criterion is about which model list `improve` reads, and none of them needs an optimizer run. `cli.mjs:68` resolved one array before the subcommand branch and handed it to both paths, so a model added for `run` was billed once per candidate per iteration of every loop started the documented way (`README.md`'s quick-start passes no `--models`). `resolveImproveModels` in `improve.mjs` is **not given** `matrix.models`, so inheriting `run`'s list is now structurally impossible rather than avoided by convention; precedence is `--models` > `matrix.improve.models` > a named `['haiku']` default with a warning, the shape COS-8 used for a missing `minReserveDelta`. `improve.models` is set to the three models `improve` already billed, so cost and behaviour move by nothing on their own. The decisive check was running both subcommands with the two lists deliberately divergent: `improve` printed `models: haiku (matrix.improve.models)` while `run` printed `3 models`, in the same session, at $0 — zero cases makes the baseline unmeasurable, so the loop stops before buying a candidate, which is what makes an end-to-end check of a paid path free. `npm --prefix harness test` **117 → 122** (CLI override, config list, absent key warns to the default, empty array treated as absent, real config resolving to its own list); `audit` exit 0; `lore check` exit 0. Also corrected the two docs that stated the coupling as fact — `harness/README.md`'s models bullet and `docs/stories/extend-measurement-coverage.md`'s notes. Merged as PR #14. |

## Parked in campaign 1 — now queued as items 14 and 15

Both entries below record why campaign 1 stopped short. Neither is blocked on a
human: they are blocked on work that now has owners, and the user's 2026-08-17
decision removed the budget constraint that made their bars unaffordable to test.
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
  cells across six arms and two disjoint case sets, $18.6813, 0 errored cells.

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

  **AC #1 misses and is not affordable to settle.** Judge 73.9 [66.0, 81.9] on
  Opus and 58.1 [50.5, 65.6] on Sonnet at n=35 each; Sonnet's interval excludes
  70 from below. A confirmation arm on byte-identical text (50 cells) corrected
  this session's own first reading — a +7.1 judge delta computed at two cells per
  pair became +1.3 at seven, and Sonnet read 70.7, 65.8, 74.1 and 55.0 across
  four arms of the same five cases. Per-cell judge SD is 22-32, so clearing a 70%
  bar with confidence needs ~151 cells per model, about $32 an arm.

  What is left is a named negative: the remaining beginner gap is not length, not
  rule coverage and not missing content. Anyone reopening this should price the
  arm before agreeing to the bar.

## Raised — now tracked as issues

Every item below was raised across sessions 3 to 8 and deliberately left out of
the confirmed order. On 2026-08-17 the user asked for follow-up issues covering
everything untested, with no budget constraint, so each now has a task ID and
acceptance criteria a future session can act on without this conversation.

- **COS-9** — tracked (session 3): `two_options_max` counts only literal option labels, so
  it cannot see prose option sprawl.
- **COS-12** — `run` does not flush rows incrementally (session 5). `improve` persists
  after every style; `run` writes `rows.json` only after the entire matrix
  completes, so a killed or crashed run loses every cell it already paid for.
  Session 6 ran $12.84 of `run` invocations with this exposure live.
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
  any model added to that list is billed on every optimizer iteration of the
  documented invocation. COS-7 kept Fable out for exactly this reason, which
  documents the footgun rather than removing it. Giving `matrix.improve` its own
  `models` key would remove it. Small, and it makes the top tier safe to add.
- **COS-15** — the audit compares numbers, not conditions (session 4). Beginner's file
  says "never show code *unless they ask*"; `maxCodeLines: 0` cannot express the
  condition. Documented in `harness/README.md` as a limit of the instrument.

- **~~A judge bar stated to the point is not affordable~~ — SETTLED by the user
  on 2026-08-17: "we have to get everything tested - no budget."** Budget is no
  longer a constraint, so the bars stand and the arms get sized to support them.
  Every measurement issue opened below requires **n >= 146 non-errored cells per
  model**, which is what a 95% half-width of +/-4 points costs at the shipped
  text's pooled judge SD of 24.6 (Opus 24.1, Sonnet 22.8) and the task's measured
  $0.1297 a cell — about $19 a model-arm. Detecting a real difference between two
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
  reply — if the judge dominates, re-judging saved replies is cheaper per point
  of precision than buying cells, and the 146 figure comes down.

- **COS-16** (session 8, new) — the beginner rewrite left five contradictions of
  the same class it removed: the jargon rules disagree for a word the reader used
  first, the proof-number rule demands a number that may not exist and is stated
  three times, two router bullets both match a tool-using report, the router omits
  two of the file's own six shapes, and the file's worked example of the gloss
  rule uses a banned term. Recorded rather than fixed because the budget was gone
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
  objectively testable at that budget**, because a ten-cell judge arm carries a
  30-point interval. Both hard style tasks were sequenced last on the user's
  "safety-first" ordering, and both hit a judge bar rather than a content wall.

  **Campaign 2 removes the budget objection but not the risk.** The bars stand,
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
  is not a cheap-model gap.

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
  spend and could survive a crash; 12 new cases in `harness/test/improve.test.mjs`.
  `/code-review high` found five issues, all real and all fixed before the PR.
  The serious one is worth carrying forward: writing an improve run's
  `summary.json` and `report.md` at the same paths and shapes a plain `run` uses
  made the loop's pooled mean — baseline plus every rejected candidate — look
  like a style's score, and the first evidence run's report headlined 63.0% for a
  style whose real measured figure was 65.4/71.6. That is the same class of trap
  as session 1's: a number that every automated gate passes and only a reader
  catches. Fixed by labelling rather than by hiding the file. Also found: a
  by-iteration table that averaged two styles' traces together, no spend recorded
  for a style that crashed, and rows flushed only between styles. Two smaller
  lessons: the `npm test` script named `checks.test.mjs` explicitly and would
  have silently skipped the new file (now globs `test/*.test.mjs`), and three
  docs asserted "improve persists no rows" as standing fact — found by grepping
  the docs for what the change made false, not by any gate. Left for the user to
  rule on: a pre-existing comment/code disagreement at `harness/src/improve.mjs`
  about whether a reverted iteration briefs from the failed attempt or the
  incumbent — the code does the latter, the comment claims the former. Total
  spend this session $0.75 across three proving runs. Merged via PR #2 (rebase) as
  `1daff4d`; `dev` and `main` both pushed at that SHA, no branch litter, no open
  PRs. Cursor advanced to COS-2.
- 2026-08-16 — session 3: resolved COS-2 on `feature/COS-2`. No drift at restore: `dev`, `main` and both remotes level at cdfd153, no leftover branches, PR #1/#2/#3 all merged and pruned.

  The design call the handover flagged — where the reserve cases come from — went against the handover's own suggestion. It proposed reusing the four cases from the historical never-seen run, but those four are now IN train and holdout, so moving them would have cut train 5 -> 3 and holdout 4 -> 2 and shrunk the signal the loop depends on. Wrote four NEW cases instead, chosen as shapes no split contains, because the ADR's finding is that candidates overfit to case SHAPE rather than wording. Pool is 13 (5/4/4).

  Two decisions worth carrying forward. First, a reserve rejection is a ROLLBACK, not an annotation: `best.md` is documented as the winner and is the file a reader diffs and copies, so on rejection it holds the incumbent and the rejected rewrite stays at `v<N>.md`. Second, the verdict line was extracted from `cli.mjs` into `report.mjs` as `renderVerdict()` — AC #3 says a regressing candidate must be REPORTED as rejected, and leaving that in a `console.log` would have made the criterion unverifiable except by eye.

  The evidence took six runs because adoption is stochastic: the reserve pass only fires when the loop actually keeps a rewrite, and three of the six runs reverted everything. That is worth knowing before budgeting a session that needs an adopting run — expect roughly one in two, and prefer a low-scoring style with headroom.

  `/code-review high` found six issues, all real. The one worth remembering is the config footgun: `cfg.minReserveDelta` had no fallback, so a `matrix.json` naming a reserve split but omitting the threshold would evaluate `delta >= undefined` — false for every candidate — and silently roll back every run while logging an ordinary-looking REJECT. Also found: a new case whose judge rewarded exactly what one of its own deterministic checks scored 0 for (`leads_with_conclusion` vs a compliance reply opening "I'll…"), and README advice to compare splits in `BY SPLIT`, which on an improve run pools every iteration and so compares different version mixes. The sixth is COS-9: `two_options_max` counts only literal option labels, so it cannot see prose option sprawl — fixing it moves scores already quoted in `docs/` and `FINDINGS.md`, so it is its own task rather than scope creep here.

  Caught before the review returned, by re-reading my own runbook edit: the rejection example printed the rejected candidate's train and holdout on the REJECTED headline, when the code rolls `best` back before rendering and so prints v0's. Third session running that the only defect no automated gate caught was a plausible number in prose. Total spend this session $1.18. Merged via PR #4 (rebase) as `2d4bcb4`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-8.
- 2026-08-16 — session 4: resolved COS-8 on `feature/COS-8`. No drift at restore: `dev`, `main` and both remotes level at c2c83b2, no leftover branches, PRs #1-#4 merged and pruned.

  Took AC #4 first because it was free and unambiguous. `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`; `node src/cli.mjs audit` exits 1 on disagreement and the same comparison runs under `npm test` (suite 34 -> 45). The design decision that matters: an unrecognised phrasing reports as UNSTATED rather than being skipped, and a second test asserts every style states every field, so the guard cannot quietly shrink from four fields to three when someone rewords a style file. Proved by re-creating the exact divergence that shipped.

  The caps question went the opposite way from the cheap evidence, and that is the lesson. A $0.18 Haiku probe said stating a 12-word cap works: mean sentence 16.6 -> 12.3 words, over-cap 30% -> 11%, reply length flat, judge up. The user ratified tightening on it. The $2.24 paired validation on opus and sonnet then measured **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter and 6 longer, judge 0.557 -> 0.532, reply length up 105 -> 114. Reverted. The mechanism is clean and now documented in three places: a cap only bites where it binds — Haiku writes 16.6-word sentences and felt a 12-word cap, opus and sonnet already write 11-12 and had nothing to pull against. **Probe the cheap model to learn whether an instruction CAN bind; measure the target models before believing it DOES.** The Haiku effect sits 9.8 standard errors outside the opus/sonnet interval.

  Two process notes worth carrying. First, the question put to the user carried its own revert condition ("validate on both models and only keep it if it holds up"), so reverting after a failed validation executed their decision rather than overriding it — no second round trip. Second, the paired design mattered more than sample size: registering the pre-change file as a temporary contract entry and running old and new in the SAME run removed model, case and date as confounds, which is what made 24 cells enough to exclude the effect the probe had predicted.

  Also settled for free: paragraph caps are inert at every level (1.4-1.8 sentences against a cap of 4; re-scoring the same replies at cap 3 moves the check by 0.000-0.017), so there was never a differentiation to be had there. And the finding that actually matters for COS-4, recorded in the story: the binding constraint at the lower levels is reply length, not sentence length — beginner averages 119 words against its stated 80 with half its replies over, and where the two can be told apart the judge tracks reply length at -0.647 against sentence length's -0.368.

  Raised but not done, needs the user's call: `sentences()` in `checks.mjs` does not split on a single newline, so a list header ending in ':' merges with its first item — 9 of 74 over-cap sentences (12.2%), worth 1.2-1.6 points of over-20w rate. Too small to change any conclusion here, but fixing it moves numbers already published in `docs/` and `FINDINGS.md`, which is the COS-9 shape. Total spend this session $2.4152 against ~$8. Merged via PR #5 (rebase) as `ac1a161`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-5.
- 2026-08-16 — session 5: resolved COS-5 on `feature/COS-5`. No drift at restore:
  `dev`, `main` and both remotes level at 092f3b4, clean tree, no leftover
  branches, no open PRs — the handover matched reality exactly.
  The budget question the handover flagged (re-run opus/sonnet on the full pool,
  ~$19.5, or state the case-count difference) was answered a third way: slice the
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
  Session 4's $0.18 probe reported Haiku at 16.6-word sentences and the project
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
  this session paid for was fixed, not merely recorded: `src/usage.mjs` now
  short-circuits any help-shaped argv before config is read, an unknown command
  exits 2, and 6 tests cover it — one of which shells out and asserts that
  `run --help` creates no results directory. Suite 47 → 52. Writing that test
  found a second hole: `parseArgs` only recognises `--` flags, so `-h` would have
  fallen through to a paid run.
  Left for the user to schedule: `run` still writes `rows.json` only after the
  entire matrix finishes, so a killed run loses every paid cell — `improve`
  flushes per style. That is a change to run semantics, not a guard, so it was
  not taken as scope here.
  Merged via PR #6 (rebase) as `14d72ea`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.
- 2026-08-16 — session 6: resolved COS-7 on `feature/COS-7`. No drift at restore:
  `dev`, `main` and both remotes level at 82d32e5, clean tree, no leftover
  branches, PRs #1–#6 all merged and pruned — the handover matched reality
  exactly, for the second session running.

  **The campaign's most expensive session, $14.4290, and the one where scoping
  paid best.** The handover's core advice — run Fable on the five shared case
  ids so the result drops into the existing table with no slicing — was followed
  and was right. The alternative, the full 13-case pool, prices at roughly $27 on
  Fable against $1.88 on Haiku, and would have bought a second, non-comparable
  table. Reuse of the other three columns was re-verified rather than assumed, as
  the handover insisted: the five case definitions are byte-identical across five
  SHAs, `checks.mjs` and all three style files are byte-identical 444b221→HEAD,
  and `contracts.json` *did* change once after `12-44-03` — which the offline
  re-score settled by reproducing all twelve published figures exactly. That
  contracts change is worth noting: the precondition check was not a formality
  this time, it actually found a difference and then disposed of it.

  **Both open questions closed, one against expectation.** Word-cap overrun does
  not track model tier. The two-model data made Opus look like the verbose end of
  a gradient; the four-tier data turns twice (Sonnet 0.961, Haiku 1.088, Fable
  1.229, Opus 1.300 words ÷ cap), and paired over 15 cells the *cheapest* model
  overruns significantly more than the second cheapest while the *top two* are
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
  `--variants`, so it ran five variants instead of one — $1.58 instead of ~$0.19.
  Every axis left unnamed takes its full default. It did buy the variant pricing
  on the top tier (long-prompt is 3.9× baseline), now in `harness/README.md`.
  Also deliberate: Fable was **not** added to `matrix.json`'s `models`, because
  that list is `improve`'s default too and the priciest tier would then be billed
  on every optimizer iteration — the same shape as the `run --help` footgun COS-5
  paid for.

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
  of writing new cases rather than moving existing ones. Five paid runs,
  **$13.3074** against ~$15. The session's durable output is two instrument
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
  3 of 6 on Haiku. `audit` exit 0; `lore check` exit 0. Six paid runs, $13.6567
  against ~$15. Merged via PR #8 (rebase) as `1c35697`; `dev` and `main` both
  pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-4.
- 2026-08-17 — session 8: took COS-4, the last item in the confirmed order, on
  `feature/COS-4`. No drift at restore: `dev`, `main` and both remotes level at
  f792b32, no leftover branches, PRs #1-#8 all merged and pruned. **ACs #2 and #3
  met and merged; AC #1 missed and parked**, so the task returned to To Do
  unassigned. Six paid arms, 144 cells, **$18.6813**, 0 errored cells.

  The session began by refusing the task's own baseline. 45.9 / 48.4 failed two
  independent checks — it predates COS-1's additions to the file, and its judge
  was told a 15-word sentence cap no style file states, cited by name in 13 of
  that run's 64 beginner violations. `3370e4d` had re-graded the rules offline
  and could not re-grade the judge. A clean before arm read 58.7 / 70.7.

  The diagnosis was contradiction, not omission: an 80-word budget scoped to
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
  nowhere in the data, a per-cell cost taken from the cheapest arm, and a
  sample-size claim that confused precision with a score. The central one was a
  miscount: "8 of 24 violations" was eyeballed rather than computed, and counting
  it gives 10 of 40. The eleventh finding's counter-claim was drawn from the
  superseded run this very task exists to stop quoting, so it was recorded rather
  than applied. Five defects in the shipped style text are recorded in the task
  rather than fixed: the budget is spent and shipping unmeasured text is what
  COS-1's precedent forbids.
- 2026-08-17 — after session 8, on the user's instruction "we have to get
  everything tested - no budget": opened twelve follow-up issues (COS-10 through
  COS-21) covering every defect and untested claim the campaign recorded but did
  not act on, and wired COS-1 and COS-4 to them as dependencies. The budget
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
  campaign 1 on blockers that now have owners and on a budget constraint the user
  has removed, so they queue last rather than sitting out.

  The user was offered two orders and chose the longer one — tools first, then
  the whole sweep, over a seven-session path straight to the two missed bars —
  and separately chose to keep COS-17 as its own session rather than folding it
  into COS-19. Both choices are recorded verbatim in the Cursor section.

  No spend this session. Cursor armed at COS-12, which is first precisely because
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

  AC #4 is the one that carried the rest — a real 4-cell paid run SIGKILLed
  after two cells, both survivors fully scored, `score` re-reading them at exit
  0 behind `PARTIAL run — 2 cells of 4 expected (2 never ran)`. $0.1812 across
  three runs, the third an `improve` loop run only because nothing else
  exercises that branch and this change moved it onto the shared writer. Re-scoring `12-44-03` still returned 81.0% at $7.517, so nothing
  published moved. `npm test` 64 → 77; `audit` exit 0; `lore check` exit 0.

  Two pieces of stale prose were fixed rather than left: `usage.mjs`'s
  `wantsHelp` comment stated the old once-at-the-end behaviour as a present
  fact, and the ledger's COS-5 caveat still said the CLI treats `run --help` as
  `run` when COS-5 itself added the guard. Also found while updating the
  ledger's total: its 26 rows sum to $83.34 against a stated $83.33 — a rounding
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
  `agentic-fix-verify` ($0.38) caught the exact sentence this project has quoted
  since session 6 — *"I'll look at the file first."* — in a row that now holds it
  in `trace` and not in `text`. Segmented three ways: the glued string reads one
  22-word opening sentence, over beginner's 20-word cap; `final` reads it at 17,
  under it; `trace` reads the narration as its own 6-word sentence. A check
  changes answer on a real cell, which is the defect in one line. A prior 1-cell
  Haiku run ($0.03) had made a tool call with no pre-tool text and returned the
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

  `npm test` 79 → 94; `audit` exit 0; `lore check` exit 0. Spend $0.4143.

- 2026-08-17 — session 11: **COS-11 resolved, $0.** Errored cells no longer bias
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
  cheap.** `01-03-21`'s row already read "43.6 with the errored cell excluded
  (45.9 if it is pooled)"; checking it took one command and it reproduced
  exactly. Four of the five affected runs needed nothing. Checking each figure
  against the run behind it, one at a time, is what separated the one that moved
  from the four that did not.

  `npm test` 94 → 104; `audit` exit 0; `lore check` exit 0. Spend $0.

- 2026-08-17 — session 12: **COS-13 resolved, $0.** Ran the fixture before
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
  Spend $0.

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

- 2026-08-17 — session 14: **COS-14 resolved, $0.** The change is small — one
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
  missing-`minReserveDelta` shape. An absent key has to fail cheap: this list is
  billed once per candidate per iteration, so the default is the one place a
  mistake multiplies hardest. `[]` is treated as absent rather than as zero
  models, which would otherwise be a loop that measures nothing and still pays
  the author model for every rewrite.

  Verification was free and end-to-end anyway, which is the transferable part:
  `improve --cases=__none__` reaches the model-resolution line, prints it, finds
  no baseline cell, and stops before buying a candidate. Running it with
  `improve.models` temporarily set to `['haiku']` while `matrix.models` still
  held three showed `models: haiku (matrix.improve.models)` and `3 models` from
  `run` in the same session — the decoupling demonstrated on the paid path at
  $0, rather than asserted from a unit test alone. `npm --prefix harness test`
  117 → 122; `audit` exit 0; `lore check` exit 0. Two docs stated the coupling
  as fact and were corrected with it: `harness/README.md`'s models bullet and
  `docs/stories/extend-measurement-coverage.md`'s notes.
