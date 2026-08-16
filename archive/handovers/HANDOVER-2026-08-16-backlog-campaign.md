# Handover — start the backlog campaign at COS-6 (COS-1..COS-8)

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `80bc691`, clean tree, 1 commit ahead of `origin/dev`, `main` 1 behind `dev` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-6 — document how output style names resolve in the README, so
an unresolvable outputStyle stops failing silently. Queue order confirmed by user
on 2026-08-16 (safety-first: COS-6, COS-3, COS-2, COS-8, COS-5, COS-7, COS-1,
COS-4); do not re-ask. Risk policy: record-and-park.

Locked decisions: default branch is dev and every issue merges there, then dev is
fast-forwarded into main — a session is not done until both are pushed. docs/ is
owned by the lore CLI; never hand-edit it and `lore check` must exit 0 before any
commit touching it. COS-6 is README-only and needs no docs/ change, so lore is
not in its path. No harness run is needed for COS-6 — it costs nothing.

Traps: the facts COS-6 must document are already verified and written up in
docs/reference/output-style-injection-mechanics.md and
docs/runbooks/install-and-switch-an-output-style.md. Do not re-derive them or
re-probe Claude Code; lift them into README.md in the README's own register.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `80bc691`, clean |
| Push state | `dev` 1 ahead of `origin/dev`; `main` 1 behind `dev`. Init's final push had not run when this was written |
| Cursor issue | COS-6 — To Do, unassigned, no plan recorded yet |
| Tracker | `doc-1`, cursor armed at COS-6, Resolved table empty, 8 issues queued |
| Feature branches | none, local or remote |
| Open PRs | none |
| Consumed handovers | `archive/handovers/` exists and is empty apart from `.gitkeep` |
| Campaign progress | 0 of 8 resolved. This is session 1 |

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`. Both should
   already be true if init's final push completed.
2. `git checkout -b feature/COS-6 dev`.
3. Read `backlog instructions task-execution`; mark COS-6 In Progress; record the
   plan on the task.
4. Edit `README.md` only. The three criteria are: the style name comes from
   frontmatter `name:` and falls back to the filename; how to confirm a style
   actually loaded; and that an unresolvable `outputStyle` silently falls back to
   Default. Source material is `docs/reference/output-style-injection-mechanics.md`
   (name resolution, the silent-failure gate) and
   `docs/runbooks/install-and-switch-an-output-style.md` (the canary
   confirmation procedure).
5. `backlog instructions task-finalization` before checking any criterion. For
   COS-6 the evidence is the README text itself against each criterion — quote
   the added lines in the task notes.
6. Update `doc-1` on the branch: move COS-6 to Resolved, advance the cursor to
   COS-3, append the session-log entry.
7. Commit with a `Refs: COS-6` trailer, review the branch diff with
   `/code-review`, push, open and rebase-merge the PR into `dev`, sync, promote
   to `main`, prune.

## Critical context / traps

- The README currently documents installing and selecting a style but says
  nothing about how the name resolves. That omission is the whole issue — a
  global `outputStyle` pointing at a name no file provided ran Default silently
  across every project but one, unnoticed, on this user's machine.
- Do not duplicate the full mechanics reference into the README. The README is
  the install-and-go surface; link to the deeper doc for the SDK recipe and the
  system-prompt placement findings.
- `.claude/handovers/` is gitignored on purpose — handovers may name machines or
  environments. Never copy handover content into anything committed.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- COS-6 has no measurement component. Do not open the harness for it.

## Do not repeat

Nothing has failed yet — this is the campaign's first session. Recorded so the
next handover does not read an empty section as an omission.
