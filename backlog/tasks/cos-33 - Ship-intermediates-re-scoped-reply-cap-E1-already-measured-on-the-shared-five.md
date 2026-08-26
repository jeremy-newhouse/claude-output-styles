---
id: COS-33
title: >-
  Ship intermediate's re-scoped reply cap (E1), already measured on the shared
  five
status: To Do
assignee: []
created_date: '2026-08-26 13:29'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-18
references:
  - plain-english-intermediate.md
  - plain-english-advanced.md
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-18 diagnosed the defect, authored the fix and measured it on the shared five. It did **not** ship it, because its AC #5 asks for reserve validation and the reserve arms could not be completed — the first was destroyed by the monthly spend limit (163 of 300 cells, all 150 Sonnet) and the retry was stopped at 141 of 300 when throughput fell to roughly 0.7 cells a minute. Nothing about the edit is in doubt; only the reserve split is unmeasured.

**The edit, exactly.** Applied to `plain-english-intermediate.md` at sha256 `bd326da7...`, producing `8ea1c01b...`:

- Delete from inside `## Every status update must answer three questions`: `Keep the whole update under about 100 words when things are normal.`
- Insert immediately before that same heading:

  `## How long a reply is`
  (blank line)
  `Keep the whole reply under 100 words. That is every reply, not only a status update. A long job does not earn a long answer.`
  (blank line)

Rebuild and check the hash before measuring anything — COS-18 rebuilt it from this recipe after a temp-directory wipe and it reproduced `8ea1c01b` byte for byte.

**What is already measured** (run `2026-08-20T12-30-35`, 300 cells, 0 errored, paired against `2026-08-20T12-12-10` filtered to intermediate — filter it, see COS-30):

| metric | paired delta, 95% CI |
|---|---|
| rules | **+3.0 [+0.1, +5.8]** |
| words | **−24.6 [−46.4, −2.8]** |
| judge | +2.5 [−2.8, +7.8] |
| composite | +2.8 [−0.9, +6.5] |

Non-status replies fall from 1.43× to 0.97× the cap on Opus and 1.13× to 0.85× on Sonnet; over-cap share 77% → 40% and 53% → 31%; arm rules 99.1 / 97.1, reaching parity with advanced's 99.4 / 97.3. Status updates were fully compliant before and after (0 of 120 over cap either side). The update-scoped phrasing vanishes from the grader's violations.

**Do not re-run the shared-five arm.** It is complete and clean at 150 cells a model. The only outstanding work is the reserve pair.

**Two cautions.** Reserve is the noisier split — COS-16 saw an Opus reserve word delta of +4.89 [−2.96, +12.73] on a candidate that was otherwise flat — so read a wide interval there as noise rather than as harm unless it clears zero. And `reserve-agentic-session` is the slowest case in the project at roughly 45 seconds a cell plus its judge call; size the wall-clock against that, not against a conversational cell.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The candidate rebuilds from the recipe above to sha256 8ea1c01b before any arm is run
- [ ] #2 A reserve before arm on the baseline text and a reserve after arm on the candidate both complete with no errored cells, at 25 repeats over the six reserve cases per model
- [ ] #3 Paired intervals on rules, judge, composite and words are recorded for the reserve pair, with the before file filtered to intermediate only
- [ ] #4 No reserve interval is negative and clear of zero; if one is, the edit does not ship and the reason is recorded
- [ ] #5 On shipping, the experiment ledger, the style story and FINDINGS are updated to say the intermediate figures measure the new text
<!-- AC:END -->
