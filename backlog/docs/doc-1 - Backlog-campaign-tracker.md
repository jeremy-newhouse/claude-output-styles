---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-16 23:37'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-7** — queue order confirmed by the user on 2026-08-16, who
chose the "Safety-first" option from a presented comparison: "COS-6 → COS-3 →
COS-2 → COS-8 → COS-5 → COS-7 → COS-1 → COS-4. Free doc task proves the loop,
then harness plumbing, then the caps guard, then measurement, then the two hard
style tasks last — after COS-2 has built the reserve split they need for honest
validation."

Do not re-ask before taking the next item.

## Queue (confirmed order)

| # | Issue | Type | One-line note |
|---|---|---|---|
| 6 | COS-7 | measure | Fable across all three styles. Most expensive tier, ~$20. |
| 7 | COS-1 | styles | Multi-tool sessions and open-ended decisions. Judge bar 65%, currently ~48%. ~$15. |
| 8 | COS-4 | styles | Beginner prose. Judge bar 70%, currently 45.9/48.4. Hardest. ~$20. |

Not queued yet, raised during session 3: **COS-9** — make `two_options_max` see
prose option sprawl. Discovered by COS-2's review. Deliberately left out of the
confirmed order, which is the user's to change.

Estimated remaining: ~$55. Spent so far: $5.93 (COS-6 cost nothing; COS-3 came in
well under its ~$2 budget; COS-2 came in at $0.88 against ~$3; COS-8 at $2.42
against ~$8; COS-5 at $1.88 against ~$5).

Two spend caveats recorded under COS-5. Cells that abort on the turn limit carry
`costUsd: 0`, so `22-59-53`'s six failed cells burned tokens no row records. And
one aborted invocation — `node src/cli.mjs run --help`, which the CLI treats as
`run` because the subcommand has no help flag — ran about two minutes at
concurrency 4 across the full matrix before being killed. It wrote no
`rows.json`, so its spend is real, unquantified, and excluded from the $5.93.

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-6 | Task Done — 2026-08-16, session 1 | README-only. All 3 ACs checked against quoted README lines: name resolution from frontmatter `name:` with filename fallback, a "Confirm it loaded" section giving the behavioural check and the canary, and the silent-fallback statement. Scripted checks: all three frontmatter names appear verbatim in the README (3/3); both new doc links resolve. `npm --prefix harness test` 11/11; `lore check` 0 errors after `lore sync`. Review found 3 issues, all fixed on the branch. Merged as `0631c04`. |
| 2 | COS-3 | Task Done — 2026-08-16, session 2 | All 3 ACs proved against a real improve run on the reviewed code, `results/2026-08-16T15-04-22-436Z/` (beginner, Haiku, 2 cases, 1 iteration, 4 cells, $0.0919), after an earlier 18-cell run at `14-48-09` ($0.6097) established the same three identities on the first implementation. AC #1: all four per-iteration transcript files present including the reverted v1, and `rows.json` groups 1/1/1/1 across v0 and v1. AC #2: rows sum = `summary.json` totalCostUsd = `improve.json` spentUsd = 0.0919, the counter deleted in favour of `spendOf(rows)`. AC #3: `score --rows` reproduced the loop's logged 0.8 / 0.9 / 0.669 / 0.85 exactly, exit 0 with the API pointed at a dead socket and no new results directory; no-arg `score` finds an improve run unaided. Plain-run path unchanged (12-44-03 still 81.0% at $7.517). `npm --prefix harness test` 23/23 (12 new); `lore check` 0 errors. `/code-review high` found five issues, all real and all fixed on the branch. Merged as `1daff4d`. |
| 3 | COS-2 | Task Done — 2026-08-16, session 3 | All 4 ACs proved on real improve runs against the committed code, not unit tests alone. Six paid runs, $1.18 total against a ~$3 budget. The decisive one is `results/2026-08-16T20-57-54-086Z/` (beginner, Haiku, 1 train + 1 holdout + 2 reserve, 3 iterations, 12 cells, $0.30): the real optimizer produced a candidate that won train and beat holdout by 29.5 points (0.644 -> 0.99), and was **17.7 points worse on the reserve** (0.623 vs 0.800). The guard rejected it and rolled back — `best.md` came out byte-identical to the shipped `plain-english-beginner.md` (`diff -q`), with the rejected rewrite preserved at `v2.md`. Offline re-scoring shows the ADR's signature exactly: reserve rules flat 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. AC #1 checked by scripted search of persisted rows — 0 reserve case ids in any train or holdout row, reserve files written for v0 and the winner only. AC #2's accept path proved in `20-50-12` (v1 0.582 vs v0 0.591, -0.009, ACCEPT); the no-adoption skip path in `20-47-28` and `20-55-37`. Case pool 9 -> 13 (5/4/4), new cases rather than carved out. `npm --prefix harness test` 34/34 (11 new); `lore check` 0 errors. `/code-review high` found six issues, all real: five fixed on the branch — including a config footgun where a missing `minReserveDelta` would have silently rolled back every run — and the sixth raised as COS-9. Merged via PR #4 (rebase) as `2d4bcb4`. |
| 4 | COS-8 | Task Done — 2026-08-16, session 4 | All 4 ACs verified; the caps question was settled by trying the change and measuring it, not by argument. AC #4 first and free: new `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`, exposed as `node src/cli.mjs audit` (exit 1 on disagreement) and 11 test cases; suite 34 -> 45. Proved by re-creating the divergence that actually shipped (contracts back to beginner 15/3, intermediate 18): 3 FAILs, CLI exit 1, `npm test` 43/45. AC #1: measured `results/2026-08-16T12-44-03-883Z/` — all three levels already write the same sentence length (beginner 12.3, intermediate 12.4, advanced 11.5 words), so the lower levels are not being served shorter sentences today; paragraph caps settled offline for free as inert (1.4-1.8 sentences against a cap of 4; re-scoring at cap 3 moves the check 0.000-0.017). A $0.18 Haiku probe (`22-18-53`) said a 12-word cap works — 16.6 -> 12.3 words, over-cap 30% -> 11% — and the user ratified tightening on it, conditional on both-model validation. AC #3 killed it: paired opus+sonnet run over 6 cases spanning all three splits (`22-27-15`, 24 cells, $2.24) moved mean sentence length **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter, judge 0.557 -> 0.532, reply length 105 -> 114. Reverted; `git status` clean on both files. AC #2 is checked but vacuous — nothing shipped tightened; the mechanism was exercised (file first, contracts second, audit caught the in-flight mismatch) before the revert. `/code-review high` found seven issues, all real and all fixed on the branch — including a fourth-consecutive-session prose-number defect (the spec quoted Haiku's over-20-word rate against an over-12-word metric) and the guard not being wired into the optimizer runbook's adopt step, where it would predictably have turned `npm test` red on a legitimately-won rewrite. Suite 34 -> 47. Total spend $2.4152 against ~$8. Merged via PR #5 (rebase) as `ac1a161`. |
| 5 | COS-5 | Task Done — 2026-08-16, session 5 | All 3 ACs verified against `results/2026-08-16T22-59-53-852Z` (3 styles x haiku x baseline x **13 cases** x 2 repeats = 78 cells, $1.8770). AC #1 ran the full pool, not the 5 cases the old baseline used. AC #2 was satisfied **without re-running opus/sonnet** (~$19.5 at 12-44-03's measured $0.1253/cell, against a ~$5 budget): the new haiku rows were sliced to the same 5 case ids `12-44-03` used, after verifying in git that those 5 case definitions are byte-identical across 444b221/8a76f13/49fd1fa/HEAD and that the style files, `checks.mjs` and `contracts.json` are unchanged between the runs; re-scoring `12-44-03` offline reproduced its 12 published FINDINGS figures to the tenth of a point. Zero errored cells in that slice on any model. Result: rules survive the drop to the cheapest tier (haiku 90.9–96.0, never more than 1.8 points behind the better of opus/sonnet, and ahead of opus on intermediate); judge does not (37.5–62.2, last on all three styles) — which also closed the one-style-file ADR's open item that the cheap tier was untested. AC #3's failure mode is **turn-limit exhaustion, not wording**: 6 of 78 cells returned no reply at all, every one a 12-turn abort on a case that edits a file then runs tests. Like-for-like on `agentic-fix-verify`, the one such case all three models have run: haiku 5 aborts in 6 cells, opus 0 in 6, sonnet 0 in 6. It hit all three styles, so no rewrite fixes it. Because an empty reply scores 0.0 on every rule, pooling those cells understates haiku's rule compliance ~10 points — FINDINGS.md now reports "replies only" and "counting no-reply as 0" separately. **The predicted failure mode was refuted**: measured with `checks.mjs`'s own `words()`, haiku averages 11.8w on the shared 5 and 12.0w on the full pool, and **sonnet** is the long-sentence model at 13.5w. The probe's arms re-derive exactly, but its 16.6 is not haiku's baseline — the same configuration measures 12.1w at 8 cells and 12.2w at 25. Decisively, the probe's case was a 12-word cap cutting the over-12 share 60.0% → 40.5%; haiku's *untightened* share is 38.4–43.0%, so 40.5% sits inside its own range. Stated as "the evidence for an effect is gone", not "there is no effect", since the tightened arm is also n=4. COS-8's revert stands and is strengthened; its mechanism is corrected in the ledger, the audience-level spec and `harness/README.md`. Also fixed rather than only documented: `run --help` launched the full paid matrix (new `src/usage.mjs` guard, unknown command now exits 2). `npm test` 47 → 52; `audit` exit 0; `lore check` exit 0. `/code-review high` raised 10 findings, all real and all addressed. |

## Not queued — needs a human / blocked

None yet. See the risk policy below for how issues arrive here.

## Risk policy (confirmed by the user on 2026-08-16)

"Record and park." If COS-4 or COS-1 cannot reach its measured judge-score bar,
the session records every attempt and the scores actually reached in the task
notes, moves the issue to "Not queued" with that evidence as the reason, advances
the cursor, and continues. Nothing merges that does not meet its acceptance
criteria, and no session stalls waiting for a human.

Two issues carry known risk against that policy:

- **COS-4** asks beginner's judge score to exceed 70%. It measures 45.9 on Opus
  and 48.4 on Sonnet. Six optimizer rewrites have already failed at exactly this,
  so achievability is unproven even though the criterion is objectively testable.
- **COS-8** (discharged, session 4). AC #1 was an audience judgement. The session
  measured, brought numbers, and the user ratified tightening beginner — on the
  stated condition that it be validated on both models and kept only if it held
  up. It did not, and it was reverted. The pattern is worth reusing: put the
  revert condition in the question, so a failed validation executes the user's
  instruction instead of overriding it.

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
  Merge SHA is appended to this entry after the merge.
