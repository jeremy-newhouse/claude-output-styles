---
id: COS-31
title: Give intermediate and advanced a reply-shape router
status: To Do
assignee: []
created_date: '2026-08-20 12:41'
updated_date: '2026-08-31 19:42'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-18
references:
  - plain-english-intermediate.md
  - plain-english-advanced.md
  - plain-english-beginner.md
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-18 measured D3 — no statement of which shape a reply should take — on both files, and it is the cleanest of the four defects it found.

Run `2026-08-20T12-12-10-010Z`, 600 cells, 0 errored:

| style / model | D3 violations | share | on non-status cases |
|---|---|---|---|
| intermediate / sonnet | 47 | 16.2% | 47 (100%) |
| intermediate / opus | 39 | 11.8% | 39 (100%) |
| advanced / sonnet | 30 | 10.1% | 30 (100%) |
| advanced / opus | 22 | 8.3% | 22 (100%) |

All 138 land on non-status cases. Not one lands on a status update. The judge names the mechanism without being asked: 'the guide's status-update format is the only structure defined, and the reply instead reads as a lecture'.

Both files offer four shapes — status update, long-session report, decision, tie-break — and neither says which a given reply should take. COS-16 gave beginner `## Pick the shape from the question` (`plain-english-beginner.md:27-36`) for exactly this.

Two traps for whoever takes it.

**A router adds a rule.** COS-16 found that every regression it measured came from an edit that added rather than removed or bounded one, and its four-edit bundle showed an Opus reply-length regression that none of its parts showed alone. Measure the router by itself.

**Do not copy beginner's router's pre-fix placement.** COS-29 is resolved (session 38): the precedence sentence used to sit after the section's closing line, giving it that line — not the four bullets — as its nearest plural antecedent. It now sits directly under the four router bullets, above 'The shape changes with the question. The size never does.' Copy that placement, verbatim in spirit, when writing this router's own precedence sentence.

Advanced needs one extra thing intermediate does not: `plain-english-advanced.md:34` says 'Beat 3 always appears', making one status beat unconditional in a file that never says when the status shape applies. A router has to say whether 'always' survives outside a status update.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each file's router is measured on its own, not bundled with any other edit, at n >= 146 non-errored cells per model on the five shared cases
- [ ] #2 The D3 violation share is re-counted after the change with the same classifier COS-18 used, and the before/after counts are recorded
- [ ] #3 Advanced's 'Beat 3 always appears' is either scoped to status updates or deliberately left unconditional with the reason recorded
- [ ] #4 No paired interval on rules, judge, composite or words is negative and clear of zero for either style
- [ ] #5 Validated on the reserve split for each style whose text changes
- [ ] #6 The precedence wording does not reproduce COS-29's dangling antecedent
<!-- AC:END -->
