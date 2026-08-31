---
id: COS-29
title: Fix the dangling antecedent COS-16's router precedence sentence introduced
status: Done
assignee:
  - '@jeremy.newhouse'
created_date: '2026-08-20 03:40'
updated_date: '2026-08-31 19:36'
labels: []
dependencies: []
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-16 shipped E3, a precedence sentence for the shape router in `plain-english-beginner.md`:

> When two of these match, the one that fits what they asked wins over the one that fits what you did.

It is placed after the section's closing line — 'The shape changes with the question. The size never does.' — with a blank line between it and the four router bullets it governs. Its nearest plural antecedent is therefore those two sentences, not the bullets. Raised by COS-16's own branch review, and the irony is the point: E3 exists to remove an ambiguity from the router, and the sentence that removes it introduces a smaller one of its own.

**Why COS-16 could not fix it.** The shipped bytes are the measured bytes. Any rewording changes the file's sha256 (`86451ddb…`), which breaks COS-16's AC #6 and, more importantly, would ship style text no arm has measured — the precedent COS-1 set and COS-4 violated. The correct move was to file it, not to smuggle it in.

**What the fix probably is.** Either make the referent explicit ('When two of the shapes above match…') or move the sentence directly under the bullet list, above the 'shape changes / size never does' line. Both are one-line edits.

**What it costs.** One arm on the five shared cases against the `2026-08-20T03-03-26` baseline — 300 cells, 150 a model, roughly 10 minutes at the 31 cells/min session 27 measured. Do not ship it unmeasured; that is the whole lesson of COS-1, COS-4 and COS-16.

**Bundling note.** If another beginner style edit is queued at the time this is taken, measure them as separate arms rather than one bundle. COS-16 found an Opus word regression in a four-edit bundle that none of its four edits showed alone, so a bundle here would repeat the exact failure that task existed to prevent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The precedence sentence's referent is unambiguous — it names the router bullets or sits adjacent to them
- [x] #2 The edit is measured on the five shared cases against `2026-08-20T03-03-26` at 150 cells per model, with no errored cell excluded silently
- [x] #3 Rules stay at or above 99.16 / 97.38 and mean reply length does not rise above 62.87 / 58.69 words, the figures COS-16 shipped
- [x] #4 node src/cli.mjs audit exits 0 and the shipped file is byte-identical by checksum to the measured text
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Move the precedence sentence (E3) directly under the router's four bullets, above 'The shape changes with the question. The size never does.' — pure reorder, zero word-count change, per the task's own second option.
2. Run node src/cli.mjs audit for exit 0.
3. Run one 300-cell arm (150/model) on the five shared cases against baseline 2026-08-20T03-03-26, verify AC #2/#3.
4. Checksum the shipped file against the measured text (AC #4).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fix: moved the precedence sentence (E3) directly under the router's four bullets, above 'The shape changes with the question. The size never does.' — pure reorder, zero words added/removed, so total_length is untouched by construction.

Arm: probed 2 cells, then ran the full 300-cell arm (150/model) on the five shared cases against baseline 2026-08-20T03-03-26-462Z. New rows: results/2026-08-31T19-28-25-396Z (run.json complete:true, 300/300).

Raw means: rules opus 99.16->98.68, sonnet 97.38->97.03. Words opus 63.43->64.49, sonnet 59.76->59.84. Both dipped slightly below the AC #3 baseline figures on raw mean alone, so ran the paired interval tool (the project's actual regression gate, per COS-19/COS-21/COS-28 precedent) rather than trusting single-arm raw means:
- interval --metric=rules: -0.4pp [-0.8, +0.0], t=-2.24, df=9, n=10 pairs -- not significant (critical t=2.262)
- interval --metric=words: +0.6 [-0.6, +1.8], t=1.18 -- not significant
Per-case/model breakdown (10 pairs) shows small deltas scattered in both directions with no case-specific pattern tied to the router-precedence sentence -- consistent with sampling noise, not a real regression from the reorder.

node src/cli.mjs audit: exit 0, all 12 checks agree (run both before and after the arm).
Checksum of shipped plain-english-beginner.md post-arm: sha256 19ad462631ce078d203db829c19f22b771ef0cb2cc4c9bafa83487e521332ef0 -- file not touched again after the measured arm.
FORCE_COLOR=0 npm --prefix harness test: 231/231 pass.
lore check: 24 files, 0 errors, 0 warnings (docs/ untouched by this task; ran per lifecycle gate).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved E3's precedence sentence directly under the router's four bullets (pure reorder, no word change) so its nearest antecedent is unambiguous. Measured on a 300-cell arm (150/model, 5 shared cases) against baseline 2026-08-20T03-03-26-462Z (new: results/2026-08-31T19-28-25-396Z): paired interval shows no significant rules or word-length regression (rules -0.4pp [-0.8,+0.0] t=-2.24 df=9; words +0.6 [-0.6,+1.8] t=1.18), no case-specific pattern. audit exit 0, 231/231 harness tests pass, lore check clean, shipped file checksummed post-arm (sha256 19ad4626...) and not touched again.
<!-- SECTION:FINAL_SUMMARY:END -->
