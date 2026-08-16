---
id: COS-6
title: Document the install path that actually resolves
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 12:45'
updated_date: '2026-08-16 14:14'
labels:
  - 'doc:stories/make-the-install-path-safe'
dependencies: []
references:
  - README.md
documentation:
  - docs/stories/make-the-install-path-safe.md
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A style file whose name does not resolve fails silently: Claude Code runs Default with no error. This was found live — a global settings.json set outputStyle to a name no file provided, because the style files in question had no YAML frontmatter and so took their names from their filenames.

The repo README explains how to copy the files and pick a style, but not how the name is resolved, that frontmatter name overrides the filename, or how to confirm a style is actually loaded. Anyone installing these three files can hit the same silent failure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README states that the style name comes from frontmatter name, falling back to the filename
- [x] #2 README gives a way to confirm the active style is loaded, not just configured
- [x] #3 README notes that an unresolvable outputStyle value falls back to Default with no error
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Rewrite the README Install section so the three names it must serve are explicit: the value in outputStyle is the frontmatter name:, the filename is only the fallback when a file has no frontmatter at all, and the three exact names are listed verbatim (AC #1).
2. Add a confirmation step to Install: configured is not loaded. Give the cheap behavioural check (ask for a status update, grade it against the three beats and the word cap) and name the canary as the decisive check, pointing at the runbook for the procedure (AC #2).
3. State the silent-failure fact where an installer will read it before it bites them: an outputStyle naming something no file provides produces no error and runs Default (AC #3).
4. Link out to docs/reference/output-style-injection-mechanics.md and docs/runbooks/install-and-switch-an-output-style.md rather than duplicating them. README stays the install-and-go surface.
5. Verify each criterion by quoting the added README lines against it in the task notes. README-only change: no docs/ edit, so no lore sync; no harness run, since nothing here asserts a number.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified by reading the added README.md text against each criterion, plus two scripted checks.

AC #1 - README.md:56: "A style's name comes from its **frontmatter \`name:\`**, and falls back to the filename only when the file has no YAML frontmatter at all." Followed by the three literal names. Scripted check: extracted \`name:\` from each of the three plain-english-*.md files and confirmed each appears verbatim in README.md - 3/3 OK (Advanced, Beginner, Intermediate).

AC #2 - new "### Confirm it loaded" section, README.md:70-76, plus Install step 4 at :50 ("Confirm it loaded - see below. Do not skip this."). Gives two checks: the cheap behavioural one (ask for a status update, grade against outcome-first / three beats / word cap, and re-check frontmatter name character for character if it reads like stock Claude Code) and the decisive canary (distinctive token in the style body, new session, see if it obeys). Notes that asking the model to describe its own system prompt is unreliable.

AC #3 - README.md:68: "**A name that no file provides fails silently.** Claude Code prints no error and no warning - it runs Default and says nothing." Carries the live incident as the motivation.

Also added a "## Going deeper" section linking the runbook and the mechanics reference rather than duplicating them; both relative paths confirmed to resolve from the repo root. Facts were lifted from docs/reference/output-style-injection-mechanics.md and docs/runbooks/install-and-switch-an-output-style.md, not re-derived.

Gates: npm --prefix harness test 11/11 pass. lore sync run to reconcile the story status/managed block that this task moving status put into drift; lore check exits 0 with 0 errors. No harness measurement run - nothing in this task asserts a number.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Documented the install path that actually resolves, in README.md only.

Rewrote the Install section and added two subsections. "How the style name resolves" states that a style name comes from frontmatter name: and only falls back to the filename when a file has no frontmatter at all, lists the three exact names, and states plainly that an outputStyle value no file provides fails silently - no error, no warning, Default runs. "Confirm it loaded" gives the behavioural check and the canary check, since configured is not loaded and settings alone cannot distinguish them. Install step 4 now makes confirmation an explicit step. A new "Going deeper" section links the runbook and the mechanics reference instead of duplicating them.

Verified by reading each added passage against its criterion (quoted with line numbers in the notes) and by two scripted checks: all three frontmatter name: values appear verbatim in the README (3/3), and both new relative doc links resolve. npm --prefix harness test 11/11 pass; lore check exits 0 after lore sync.
<!-- SECTION:FINAL_SUMMARY:END -->
