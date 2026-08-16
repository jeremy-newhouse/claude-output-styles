---
id: COS-6
title: Document the install path that actually resolves
status: To Do
assignee: []
created_date: '2026-08-16 12:45'
updated_date: '2026-08-16 12:49'
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
- [ ] #1 README states that the style name comes from frontmatter name, falling back to the filename
- [ ] #2 README gives a way to confirm the active style is loaded, not just configured
- [ ] #3 README notes that an unresolvable outputStyle value falls back to Default with no error
<!-- AC:END -->
