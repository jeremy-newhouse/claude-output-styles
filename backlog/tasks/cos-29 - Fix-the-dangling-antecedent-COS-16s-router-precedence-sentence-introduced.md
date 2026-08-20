---
id: COS-29
title: Fix the dangling antecedent COS-16's router precedence sentence introduced
status: To Do
assignee: []
created_date: '2026-08-20 03:40'
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
- [ ] #1 The precedence sentence's referent is unambiguous — it names the router bullets or sits adjacent to them
- [ ] #2 The edit is measured on the five shared cases against `2026-08-20T03-03-26` at 150 cells per model, with no errored cell excluded silently
- [ ] #3 Rules stay at or above 99.16 / 97.38 and mean reply length does not rise above 62.87 / 58.69 words, the figures COS-16 shipped
- [ ] #4 node src/cli.mjs audit exits 0 and the shipped file is byte-identical by checksum to the measured text
<!-- AC:END -->
