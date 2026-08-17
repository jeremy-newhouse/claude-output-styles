---
id: COS-18
title: Test whether intermediate and advanced carry beginner's defects
status: To Do
assignee: []
created_date: '2026-08-17 03:46'
labels: []
dependencies:
  - COS-10
  - COS-11
references:
  - plain-english-intermediate.md
  - plain-english-advanced.md
  - plain-english-beginner.md
  - harness/rejected/README.md
documentation:
  - docs/specs/style-contracts-by-audience-level.md
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 found four structural defects in `plain-english-beginner.md` and fixing them moved rules 92.1/93.4 to 98.5/97.4 and mean reply length 103 words to 61. Nobody has looked for the same defects in the other two files.

The defects were:

- **A reply-length budget scoped to one reply shape** while the harness applies it to every reply. Beginner said "keep the whole update under about 80 words" inside its status-update section. `plain-english-intermediate.md` should be read for the same scoping. `plain-english-advanced.md` is the likely negative control — it states its cap as a universal at the end of the file, which is where the fix for beginner came from.
- **Unbounded content requirements that fight the budget.** "Use everyday analogies" and "explain what a thing IS before you say what happened to it" cost 15-25 words each and had no ration.
- **No statement of which shape a reply should take.** 10 of the 40 judge violations on beginner's three weakest cases demanded the three status beats on replies that are not status updates.
- **A rule that forbids what another rule requires.** "Skip all internal details" was quoted as a violation against "All 14 checks pass", which beat 2 requires.

There is a live reason to expect intermediate has at least the first: COS-7 measured it at 144 words against a 100-word cap on Opus and 121 on Fable, both worse in ratio than advanced. And `harness/rejected/README.md` records that intermediate's optimizer rewrite collapsed when bold beat labels were removed — the labels turned out to be load-bearing and the judge caught what the deterministic check could not, which is the same shape of finding as beginner's missing router.

This task is the read, the diagnosis and the measurement. If a file turns out to be clean, that is the result and it should be recorded as one — advanced scoring 97.8/96.8 on rules already suggests it may be.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three style files are read against the four defect patterns above, and every instance found is quoted with file and line
- [ ] #2 For each file, a statement of which patterns it carries and which it does not, supported by judge violations from a real arm rather than by reading alone
- [ ] #3 Any fix is measured against the current text at n >= 146 cells per model on the five shared cases, per style changed
- [ ] #4 A file found clean is recorded as clean, with the evidence, rather than left unmentioned
- [ ] #5 Validated on the reserve split for every style whose text changes
<!-- AC:END -->
