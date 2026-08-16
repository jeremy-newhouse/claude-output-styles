---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-16 21:03'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-8** — queue order confirmed by the user on 2026-08-16, who
chose the "Safety-first" option from a presented comparison: "COS-6 → COS-3 →
COS-2 → COS-8 → COS-5 → COS-7 → COS-1 → COS-4. Free doc task proves the loop,
then harness plumbing, then the caps guard, then measurement, then the two hard
style tasks last — after COS-2 has built the reserve split they need for honest
validation."

Do not re-ask before taking the next item.

## Queue (confirmed order)

| # | Issue | Type | One-line note |
|---|---|---|---|
| 4 | COS-8 | styles | Caps decision + a guard catching a style file disagreeing with its contract. ~$8. |
| 5 | COS-5 | measure | Haiku across all three styles. ~$5. |
| 6 | COS-7 | measure | Fable across all three styles. Most expensive tier, ~$20. |
| 7 | COS-1 | styles | Multi-tool sessions and open-ended decisions. Judge bar 65%, currently ~48%. ~$15. |
| 8 | COS-4 | styles | Beginner prose. Judge bar 70%, currently 45.9/48.4. Hardest. ~$20. |

Not queued yet, raised during session 3: **COS-9** — make `two_options_max` see
prose option sprawl. Discovered by COS-2's review. Deliberately left out of the
confirmed order, which is the user's to change.

Estimated remaining: ~$68. Spent so far: $1.63 (COS-6 cost nothing; COS-3 came in
well under its ~$2 budget; COS-2 came in at $0.88 against ~$3).

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-6 | Task Done — 2026-08-16, session 1 | README-only. All 3 ACs checked against quoted README lines: name resolution from frontmatter `name:` with filename fallback, a "Confirm it loaded" section giving the behavioural check and the canary, and the silent-fallback statement. Scripted checks: all three frontmatter names appear verbatim in the README (3/3); both new doc links resolve. `npm --prefix harness test` 11/11; `lore check` 0 errors after `lore sync`. Review found 3 issues, all fixed on the branch. Merged as `0631c04`. |
| 2 | COS-3 | Task Done — 2026-08-16, session 2 | All 3 ACs proved against a real improve run on the reviewed code, `results/2026-08-16T15-04-22-436Z/` (beginner, Haiku, 2 cases, 1 iteration, 4 cells, $0.0919), after an earlier 18-cell run at `14-48-09` ($0.6097) established the same three identities on the first implementation. AC #1: all four per-iteration transcript files present including the reverted v1, and `rows.json` groups 1/1/1/1 across v0 and v1. AC #2: rows sum = `summary.json` totalCostUsd = `improve.json` spentUsd = 0.0919, the counter deleted in favour of `spendOf(rows)`. AC #3: `score --rows` reproduced the loop's logged 0.8 / 0.9 / 0.669 / 0.85 exactly, exit 0 with the API pointed at a dead socket and no new results directory; no-arg `score` finds an improve run unaided. Plain-run path unchanged (12-44-03 still 81.0% at $7.517). `npm --prefix harness test` 23/23 (12 new); `lore check` 0 errors. `/code-review high` found five issues, all real and all fixed on the branch. Merged as `1daff4d`. |
| 3 | COS-2 | Task Done — 2026-08-16, session 3 | All 4 ACs proved on real improve runs against the committed code, not unit tests alone. Six paid runs, $1.18 total against a ~$3 budget. The decisive one is `results/2026-08-16T20-57-54-086Z/` (beginner, Haiku, 1 train + 1 holdout + 2 reserve, 3 iterations, 12 cells, $0.30): the real optimizer produced a candidate that won train and beat holdout by 29.5 points (0.644 -> 0.99), and was **17.7 points worse on the reserve** (0.623 vs 0.800). The guard rejected it and rolled back — `best.md` came out byte-identical to the shipped `plain-english-beginner.md` (`diff -q`), with the rejected rewrite preserved at `v2.md`. Offline re-scoring shows the ADR's signature exactly: reserve rules flat 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. AC #1 checked by scripted search of persisted rows — 0 reserve case ids in any train or holdout row, reserve files written for v0 and the winner only. AC #2's accept path proved in `20-50-12` (v1 0.582 vs v0 0.591, -0.009, ACCEPT); the no-adoption skip path in `20-47-28` and `20-55-37`. Case pool 9 -> 13 (5/4/4), new cases rather than carved out. `npm --prefix harness test` 34/34 (11 new); `lore check` 0 errors. `/code-review high` found six issues, all real: five fixed on the branch — including a config footgun where a missing `minReserveDelta` would have silently rolled back every run — and the sixth raised as COS-9. |

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
- **COS-8** AC #1 is an audience judgement — whether a non-technical reader
  *should* get shorter sentences than a technical leader. A session can run the
  experiment and record a data-backed decision, but surface it for the user to
  ratify rather than deciding unilaterally.

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

  Caught before the review returned, by re-reading my own runbook edit: the rejection example printed the rejected candidate's train and holdout on the REJECTED headline, when the code rolls `best` back before rendering and so prints v0's. Third session running that the only defect no automated gate caught was a plausible number in prose. Total spend this session $1.18. Cursor advanced to COS-8.
