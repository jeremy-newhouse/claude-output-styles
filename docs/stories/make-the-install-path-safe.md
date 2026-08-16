---
type: Story
title: Make the install path safe
tags:
  - docs
summary: Document how style names resolve so an unresolvable outputStyle stops failing silently
tasks:
  - cos-6
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: done
---

# Make the install path safe

## Goal

A style whose name does not resolve fails silently. Claude Code runs Default and
says nothing.

This is not hypothetical. It was found live on the machine these styles were
written on: a global `settings.json` set `outputStyle` to a name no file
provided, because the candidate files carried no YAML frontmatter and so took
their names from their filenames. Every project except the one repo with a
correct local setting had been running Default, unnoticed.

The repo README explains how to copy the files and pick a style. It does not
explain how the name is resolved, that frontmatter `name:` overrides the
filename, or how to confirm a style actually loaded rather than merely being
configured. Anyone installing these three files can hit the same silent failure
and conclude the styles do not work.

## Acceptance criteria

- README states that the style name comes from frontmatter `name:`, falling back
  to the filename when frontmatter is absent.
- README gives a way to confirm the active style is loaded, not just configured.
- README notes that an unresolvable `outputStyle` value falls back to Default
  with no error.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-6](../../backlog/tasks/cos-6%20-%20Document-the-install-path-that-actually-resolves.md) | Document the install path that actually resolves | Done |
<!-- lore:tasks:end -->

## Notes

The cheap confirmation is a canary: add a distinctive instruction to the style
body, start a session, and see whether the reply obeys it. Asking the model to
describe its own system prompt is unreliable.

Full resolution and loading detail lives in the injection-mechanics reference,
including the Agent SDK recipe, which has its own separate set of silent-failure
modes.
