---
id: COS-25
title: Remove cost and budget tracking from the harness and its record
status: In Progress
assignee:
  - '@jeremy'
created_date: '2026-08-17 14:43'
updated_date: '2026-08-17 15:28'
labels: []
dependencies: []
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The project runs on a Claude subscription, so the dollar figures the harness records and the docs quote are notional — a list-price valuation of tokens that nobody was ever charged. Cost never enters a style's score (checks.mjs plus the judge do that), so every dollar figure is telemetry about the test rig rather than a finding about the styles. Carrying it invites budget reasoning into decisions that should be driven by statistical power alone.

Remove the cost instrumentation from the harness, the cost columns and dollar figures from the published record, and the budget framing from the campaign tracker. Sample-size claims keep their statistical basis and lose their price annotations.

matrix.json's `run.maxBudgetUsd` is the one live consumer: it is passed to the Agent SDK at run.mjs:59 and hard-stops a runaway cell. Deleting it without a replacement removes the only runaway guard. The SDK exposes three bounds (verified in sdk.d.ts): `abortController` (wall-clock, hard stop), `taskBudget` (tokens, advisory only, alpha), and `maxTurns` (tool rounds, already set to 12). Only abortController is a true circuit breaker, so the guard becomes a per-cell wall-clock timeout.

Done Backlog task bodies are deliberately out of scope: they are the immutable evidence record of what each session measured.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No dollar figure, cost column, or budget framing remains in docs/, FINDINGS.md, README.md, or harness/README.md
- [x] #2 The campaign tracker doc-1 carries no spend figures or no-spend/cost annotations in its cursor, queue, resolved, or session-log sections
- [x] #3 costUsd, totalCostUsd, spentUsd and spendOf are gone from harness/src and harness/test; no rows.json, summary.json, run.json or report output carries a cost field
- [x] #4 matrix.json no longer sets maxBudgetUsd and run.mjs no longer passes it to the SDK
- [x] #5 A per-cell wall-clock timeout replaces it as the runaway guard, driven by an AbortController, configured in matrix.json, and proven to actually abort a cell by an executed test
- [x] #6 Sample-size claims that were priced (the 146-cell figure and its siblings) keep their statistical basis and lose only the dollar annotations
- [x] #7 npm --prefix harness test passes, node src/cli.mjs audit exits 0, and lore check exits 0
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Harness code: delete costUsd from run.mjs (runTurn/runCell), evaluate.mjs (per-model + summary aggregation), results.mjs (manifest), report.mjs (both cost lines); delete spendOf and spentUsd from improve.mjs and their consumers in cli.mjs.
2. Runaway guard: replace matrix.json run.maxBudgetUsd with run.maxCellSeconds. In run.mjs, build an AbortController per cell, arm a timer, pass it as options.abortController, and clear the timer in a finally. An aborted cell must return the same error-row shape runCell already produces so the existing errored-cell handling (COS-11) still applies.
3. Tests: strip cost assertions from results.test.mjs and improve.test.mjs; swap maxBudgetUsd for maxCellSeconds in config.test.mjs and results.test.mjs OPTS. Add a test that arms the timeout and observes an actual abort - a guard never seen to fire is not evidence (the campaign's own do-not-repeat list).
4. Docs: drop the ledger's cost column and its per-row dollar prose; strip dollar figures from FINDINGS.md, keeping the statistical basis of the sample-size passage at 760-763 and dropping only the price annotations; sweep the runbook, three stories, the epic, README.md and harness/README.md. Also strip the cost prose from matrix.json's //models and //improve comment blocks.
5. Tracker: rewrite doc-1 via backlog doc update - remove spend figures from the resolved rows, no-spend annotations from the queue, and the budget framing from the cursor and session log. Advance the cursor and log this session in the same edit.
6. Gates: npm --prefix harness test, node src/cli.mjs audit, LORE_BACKLOG_TIMEOUT_MS=120000 lore sync then lore check.
7. Commit with Refs COS-25, review the full branch diff with /code-review high and wait for it, then PR into dev, rebase-merge, promote main, prune.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Code layer done and exercised, not just compiled.

Guard: matrix.json run.maxBudgetUsd -> run.maxCellSeconds (600), enforced by an AbortController in runCell. The timer covers the whole cell, not each turn, so a multi-turn case cannot run N x the limit. A tripped cell returns error 'error_timeout' and is excluded from every mean like any other errored cell.

Two hazards found while writing the guard, both fixed:
- undefined * 1000 is NaN and setTimeout treats NaN as 0, so a config missing the key would have aborted every cell in the matrix on the next tick and labelled each one a timeout - a whole run of fabricated timeouts that no completeness check would flag. runCell now validates and throws instead of defaulting.
- An abort can end the SDK iterator quietly instead of throwing. On that path result stays null and the row would come back error: null with empty text, indistinguishable from a model that said nothing. A timedOut flag is the authority on the error, not the thrown exception.

New harness/test/run.test.mjs drives runCell to a real abort through an injected query seam: wedge-then-throw, wedge-then-quiet-end, a control that finishes in time, and the NaN/invalid config rejection. Verified these can fail - sabotaging the timedOut authority reds exactly the quiet test, and replacing the validation with a silent default reds exactly the config test.

Suite 124 -> 126 (removed 2 cost-only tests, added 4 guard tests). audit exit 0.

End-to-end on real saved data, no new cells: score --rows on the published 12-44-03 arm reproduces 81.0% exactly and the cost line is gone from the output. improve --cases=__none__ --iterations=0 runs the whole loop path at 0 cells and prints 'measured 0 cells' / '0 saved cells'. Written run.json and summary.json carry no cost field.

Verification of every criterion, run rather than inspected.

AC #1/#2 — 0 dollar figures across docs/, FINDINGS.md, README.md, harness/README.md and doc-1. The one $ left in FINDINGS.md (line 647, 'under $75k') is a case-fixture example of style content, not a testing figure. Verbatim user quotes in the tracker were left intact: altering an attributed quote falsifies the record, and two of them are the decisions that set the campaign's scope.

AC #3 — costUsd/totalCostUsd/spentUsd/spendOf return zero hits across harness/src and harness/test. Verified on written output, not just source: writeResults on a real row produced rows.json, summary.json, run.json and report.md with no cost/spend/$ match in any of the four.

AC #4 — maxBudgetUsd count is 0 in matrix.json and 0 in run.mjs. The single repo-wide mention left is the comment in run.test.mjs explaining what the guard replaced.

AC #5 — harness/test/run.test.mjs, 4/4 passing, driving runCell to a real abort through an injected query seam. Sabotage-verified: removing the timedOut authority reds exactly the quiet-abort test and nothing else; replacing the config validation with a silent default reds exactly the config test and nothing else.

AC #6 — the 146-cell figure survives in all four places that carried it (FINDINGS.md, the ledger, and two stories), now stated as what a 95% half-width of +/-4 points requires at SD 24.6 rather than as a price.

AC #7 — npm --prefix harness test 126/126; node src/cli.mjs audit exit 0; lore check exit 0 across 24 files, 0 errors, 0 warnings.

Story coupling: left uncoupled deliberately, on the precedent the tracker set for COS-23. No story covers removing a decision-irrelevant metric from the record, and filing it under measurement trustworthiness would misdescribe it — cost never entered any score, so removing it moved no figure. lore orphans reports it alongside COS-23; lore check is unaffected and exits 0.

Guard verified against the real Agent SDK, not only the injected fake.

The unit tests prove runCell's own logic through a stubbed query. They cannot prove the SDK actually honours abortController — that came from sdk.d.ts, which is a type declaration, not an observation. Closed with a controlled pair on one real Haiku cell, same style, same case, only the limit differing:

  maxCellSeconds=3    elapsed 5.0s   error "error_timeout"   reply 0 chars
  maxCellSeconds=600  elapsed 6.6s   error null              reply 480 chars

The cell naturally takes ~6.6s, so the 3s abort is unambiguous rather than a race. The ~2s between the timer firing at 3s and runCell returning at 5.0s is SDK teardown after the abort, which is worth knowing: maxCellSeconds bounds when the stop is requested, not when the process is fully unwound.

REVIEW RETURNED — /code-review high, 5 findings, NONE FIXED YET. Status moved back from Done: finding 1 is a real defect I introduced and the task is not finishable until it is fixed. PR not opened; branch not pushed.

FINDING 1 (medium, run.mjs:151) — CONFIRMED, must fix. On the throwing abort path, `turns` is declared inside the try, so the catch cannot see it and returns text:'', trace:'', allTurns:[], allFinals:[], toolCalls:[]. A multiTurn case such as reserve-agentic-session whose turns 1 and 2 completed and whose turn 3 wedges loses both completed transcripts. The quiet-abort path KEEPS them, so identical events produce structurally different rows depending on SDK internals — the exact inconsistency my own timedOut comment claims to handle. The empty-catch behaviour is pre-existing, but before this change only an unexpected exception reached it; the timeout is now a routine event routed down the same path, so the blast radius is mine. Fix: hoist `const turns = []` above the try, and consider catching inside runTurn so partial blocks survive.

FINDING 2 (medium, judge.mjs:66) — CONFIRMED, scope call needed. The judge's query gets no abortController and no timeout, and after this change it is the only unbounded model call left on the run path; improve.mjs rewrite() has the same gap. A judge that stalls mid-stream hangs the run forever with no flush and no ceiling, because runCell's guard has already returned and cleared its timer. This is PRE-EXISTING — maxBudgetUsd never bounded the judge either — so it is not a regression, but my docs overclaim by calling maxCellSeconds 'the runaway guard' without qualification. Minimum fix: narrow the wording in matrix.json, harness/README.md and docs/reference/harness-architecture.md to say it bounds a cell, not a run. Bounding the judge and rewrite calls is a real improvement but widens scope past this task's ACs — ask the user.

FINDING 3 (low, run.mjs:119) — CONFIRMED. Nothing in the harness records how long a cell takes: no Date.now, hrtime, durationMs or elapsed anywhere in src/, and rows carry no timing field. Yet matrix.json says 'Lower it only against measured cell durations' and harness/README.md says 600 is 'sized well above any cell observed here'. Neither is supported by anything in the record, and this same change deleted costUsd, which was the only per-cell size proxy the project had. This is the campaign's own 'a comment that carries a number is carrying a claim' lesson. Fix: record elapsedMs on the row — it closes an observability hole this change opened — and/or soften both claims to what is actually supported.

FINDING 4 (low, run.mjs:112) — CONFIRMED. maxCellSeconds is validated per cell inside runCell rather than once at config load. Under improve the throw is swallowed by cli.mjs's per-style catch and recorded as a style failure once per style, leaving a complete:false improve.json that reads like an optimizer crash rather than a config typo; under run it surfaces as an unhandled top-level rejection after an empty results/<stamp>/ has already been created. Fix: validate alongside the opts construction at cli.mjs:78, keeping the runCell check as a backstop for direct callers such as the tests.

FINDING 5 (low, run.mjs:155) — NOT ACCEPTED AS STATED; needs one command to settle. The claim is that wsp.cleanup() deletes the workspace before the SDK subprocess dies, orphaning subprocesses that write into deleted directories at concurrency 4. Evidence against it: the SDK's own spawnClaudeCodeProcess doc says the signal 'aborts only AFTER the SDK's stdin-EOF + ~2 s grace window', and this session's real-SDK probe returned at 5.0s for a 3s limit — 3s plus exactly that grace window — which indicates the async iterator stays open through shutdown, so finally runs after the child has had its graceful chance. The verification (count claude processes and osh-* workspaces before and after a timeout probe, and check for any process holding a deleted cwd) was interrupted before it ran. Settle it before acting; do not fix on the review's say-so alone.

REVIEW FINDINGS RESOLVED. All five settled, each with evidence rather than assent.

FINDING 1 (run.mjs, turns lost on the throwing abort path) — FIXED. `const turns = []` and a shared `base` row object are hoisted above the try, and the catch now populates allTurns/allFinals/toolCalls from them. text/trace stay '' on that path deliberately, matching the quiet path: there the wedged turn returns an empty turn object whose final is '', so both paths now say the same thing about the turn that failed and disagree only in that the quiet path carries a trailing empty entry the throwing path never received.
New test 'a timeout keeps the turns that finished, on both abort paths' drives the same two-turn cell down both paths and asserts they report the same completed turns. Sabotage-verified: restoring the empty-array catch reds exactly that test and nothing else (6 pass / 1 fail in run.test.mjs).

FINDING 2 (judge and rewrite unbounded) — SCOPE DECISION TAKEN BY THE USER. Asked and answered: narrow the wording here, file the fix. matrix.json's //run block, harness/README.md and docs/reference/harness-architecture.md now state that maxCellSeconds bounds a cell and not a run, name judge.mjs and improve.mjs's rewrite() as the two calls still unbounded, and record that the gap predates this guard because maxBudgetUsd never covered them either. Created COS-26 to close it, cited by key in all three places.

FINDING 3 (numbers with nothing behind them) — FIXED by recording the measurement, not by softening the claim. Every row now carries elapsedMs, started with the timer rather than at the top of runCell so it measures the same span the guard bounds. Verified end to end, not just at runCell's return: a scripted evaluate -> writeResults run put elapsedMs on the row and in rows.json on disk. New test asserts it is a number on a completed cell and >= the limit on an aborted one; sabotage-verified by deleting the field, which reds exactly that test. The two unsupported claims are rewritten: matrix.json now says 600 is a backstop and to lower it against the elapsedMs durations once a run has produced some, and harness/README.md states outright that nothing recorded a cell duration before this field, so no earlier figure supports a tighter value.

FINDING 4 (per-cell validation of a config key) — FIXED. Extracted `cellLimitMs(maxCellSeconds)` from runCell and exported it; cli.mjs calls it once at startup for `run` and `improve`, before either creates results/<stamp>/. `score` is exempt — it re-grades saved rows and never runs a cell, so holding it to a cell-guard key would be over-strict. runCell still calls it as the backstop for direct callers such as the tests. config.test.mjs now asserts the shipped matrix.json passes the shipped validator, so config and check cannot drift. Sabotage-verified: making cellLimitMs default to 600000 instead of throwing reds exactly the two tests that assert it throws.

FINDING 5 (cleanup orphaning subprocesses) — MEASURED, REAL, AND SMALLER THAN CLAIMED. Settled with the probe the review's author never ran: baseline sample, one real 3s-limit Haiku cell, then five samples after runCell returned, counting claude processes, osh-* workspaces, and any process holding an osh-/deleted cwd.

  BASELINE            claude_procs=22  osh_workspaces=5  deleted_or_osh_cwd=0
  runCell returned    elapsed=5.0s  error=error_timeout  replyChars=0
  T+0s                claude_procs=23  osh_workspaces=5  deleted_or_osh_cwd=1
  T+2s / +5s / +10s / +20s   back to 22 / 5 / 0

So one claude subprocess does outlive wsp.cleanup() holding the just-unlinked workspace as its cwd — the review was right that the window exists — but it is gone inside two seconds, no workspace leaks (the count returns to baseline immediately, so the rmSync succeeded), and cells never share a directory, so concurrency 4 does not compound it. No behaviour change: waiting for the child would cost every timed-out cell that delay for no measured benefit. The measurement is recorded as a comment on the cleanup call so the next reader does not re-derive it.

Suite 126 -> 129. Gates re-run after all of it: npm --prefix harness test 129/129, node src/cli.mjs audit exit 0, lore check exit 0 across 24 files with 0 errors and 0 warnings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
IN PROGRESS — do not treat the earlier summary as final. The implementation is complete and all 7 ACs were verified, but /code-review high then returned five findings and finding 1 is a real defect introduced by this change: on the throwing abort path every completed turn of a multi-turn cell is discarded, while the quiet abort path keeps them. The branch is committed but unpushed, no PR is open, and the task is not finishable until that is fixed. See the implementation notes for all five findings, which is confirmed, which is pre-existing, and which one is disputed on evidence.
<!-- SECTION:FINAL_SUMMARY:END -->
