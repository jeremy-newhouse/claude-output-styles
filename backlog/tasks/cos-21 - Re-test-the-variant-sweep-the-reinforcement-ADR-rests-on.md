---
id: COS-21
title: Re-test the variant sweep the reinforcement ADR rests on
status: To Do
assignee: []
created_date: '2026-08-17 03:48'
updated_date: '2026-08-17 03:51'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies:
  - COS-10
  - COS-11
  - COS-12
references:
  - harness/config/matrix.json
  - harness/src/workspace.mjs
documentation:
  - docs/adr/reject-harness-level-reinforcement-of-style-rules.md
  - FINDINGS.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ADR *Reject harness-level reinforcement of style rules* is Accepted and its evidence is run `20-12-55`: advanced style, Opus only, five cases per variant, one repeat. **That is five cells per arm** — half the size of the ten-cell arms COS-4 showed carry 95% intervals about 30 points wide, and the ADR's table quotes judge figures to the tenth of a point across a 23.8-point range.

The gaps it draws conclusions from are large — 9.4 points for the `CLAUDE.md` restatement, 4.5 for the forced long prompt — so some of this will survive. But at five cells nobody can currently say which parts, and the ADR is load-bearing: it is why no reinforcement layer exists anywhere in the project, and `FINDINGS.md` recommends deleting tone rules from any CLAUDE.md on the strength of it.

Three things were never varied and each could change the answer:

- **One style.** Only advanced was swept. Beginner is the style whose rules most nearly duplicate what a CLAUDE.md restatement would add, so it is the one where restatement might plausibly help rather than hurt.
- **One model.** Only Opus. The ADR notes the direction replicated on Sonnet for the combined variant alone, which is one variant of five on one extra tier.
- **Style text that no longer ships.** `20-12-55` predates the advanced rewrite that was adopted from the optimizer, and predates COS-1's and COS-4's hand edits entirely.

Re-run it properly and either confirm the ADR, narrow it to what the evidence supports, or supersede it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The five variants are swept at n >= 146 non-errored cells per arm, on current style text
- [ ] #2 The sweep covers more than one style and more than one model, with the choice of which argued from where reinforcement is most likely to help rather than from convenience
- [ ] #3 Every figure carries an interval, and each of the ADR's claims is confirmed, narrowed or withdrawn against them
- [ ] #4 The ADR is updated in place or superseded by a new one, and FINDINGS.md's recommendation to delete CLAUDE.md tone rules is re-stated to match whatever the evidence now supports
- [ ] #5 Costs per arm are recorded and the ledger total updated; note that long-prompt measured 3.9x baseline cost on Fable
<!-- AC:END -->
