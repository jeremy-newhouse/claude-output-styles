---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-16 13:49'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-6** — queue order confirmed by the user on 2026-08-16, who
chose the "Safety-first" option from a presented comparison: "COS-6 → COS-3 →
COS-2 → COS-8 → COS-5 → COS-7 → COS-1 → COS-4. Free doc task proves the loop,
then harness plumbing, then the caps guard, then measurement, then the two hard
style tasks last — after COS-2 has built the reserve split they need for honest
validation."

Do not re-ask before taking the next item.

## Queue (confirmed order)

| # | Issue | Type | One-line note |
|---|---|---|---|
| 1 | COS-6 | docs | README: how style names resolve, and how to confirm one loaded. No cost. |
| 2 | COS-3 | harness | Persist improve-run transcripts so they can be re-graded offline. ~$2. |
| 3 | COS-2 | harness | Third split the optimizer never sees. The safety net later issues depend on. ~$3. |
| 4 | COS-8 | styles | Caps decision + a guard catching a style file disagreeing with its contract. ~$8. |
| 5 | COS-5 | measure | Haiku across all three styles. ~$5. |
| 6 | COS-7 | measure | Fable across all three styles. Most expensive tier, ~$20. |
| 7 | COS-1 | styles | Multi-tool sessions and open-ended decisions. Judge bar 65%, currently ~48%. ~$15. |
| 8 | COS-4 | styles | Beginner prose. Judge bar 70%, currently 45.9/48.4. Hardest. ~$20. |

Estimated campaign total: ~$73.

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|

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
