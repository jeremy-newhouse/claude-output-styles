# Handover — Campaign 3, cell-free housekeeping (cursor: COS-23)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `d03a7db`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Active campaign: 3 (cell-free housekeeping). Cursor: COS-23 — docs/log.md
cites commit SHAs that gh pr merge --rebase destroys. Queue order for Campaign 3
(COS-23 -> COS-27 -> COS-22 -> COS-24 -> COS-26) was confirmed by the user on
2026-08-18; do not re-ask.

Campaign 2 is HELD, not abandoned: its own cursor is COS-16, which needs one
more clean measurement arm and is blocked by Claude Code's usage limits (both
the 5-hour window and a weekly cap hit on 2026-08-18). Do NOT take COS-16
instead of COS-23 unless the user explicitly asks you to check whether cell
budget is back — Campaign 3 exists specifically so the queue keeps moving
without spending any cells while that resets. If you do check and it's
available again, COS-16's full resume state is in its own task notes
(`backlog task view COS-16 --plain`) and the tracker's "Campaign 2 (held at
COS-16)" section — read those, not this handover, before touching it.

COS-23 itself: three prior sessions already found and partially diagnosed this
bug (COS-13's session found the first instance, COS-14's session found a
second defect — dead SHAs AND missing SHAs, not just dead ones). Read the task
in full before starting; it already names three candidate directions
(regenerate docs/log.md post-merge, drop SHAs, change merge strategy) and asks
whoever takes it to choose one and record why, not to re-litigate them from
scratch. AC #4 requires updating "the campaign protocol" — the task's own
References point at `.claude/skills/backlog-handover/SKILL.md`, meaning this
issue may need to edit the skill file itself, which no prior campaign issue
has done. That's unusual for this campaign; confirm with the user before
editing the skill if the direction chosen requires it, since a skill change
affects every future session, not just this repo.

Locked decisions, unchanged: default branch `dev`; every issue merges via PR
(`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards into `main`;
docs/ edited outside lore-managed regions, `lore sync` then `lore check` exit 0
(`LORE_BACKLOG_TIMEOUT_MS=120000`); harness changes need matching tests; never
run `improve` on a style file. Tracker/doc-only administration (like this
session's campaign-3 setup) can commit directly to `dev` with no branch or PR,
per the init lifecycle's own convention — but COS-23 itself is a real issue
with real acceptance criteria and gets the full branch → review → PR → merge
lifecycle like any other.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `d03a7db` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Active campaign | **3 (cell-free housekeeping)** — Campaign 2 held, not abandoned |
| Campaign 3 cursor | **COS-23**, item 1 of 5 |
| Campaign 2 cursor (held) | COS-16, item 9 of 21 — needs one clean Sonnet arm, blocked by usage limits |
| Test suite | 179/179 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What happened this session (session 21)

No issue lifecycle ran. The user asked what could be done given both the
5-hour usage window and a weekly limit were exhausted mid-COS-16. Five To Do
issues (COS-22, COS-23, COS-24, COS-26, COS-27) were confirmed to need no
harness `run` — their acceptance criteria are satisfied by tests, sabotage
verification, offline re-scoring of saved rows, or git reachability checks —
and the user confirmed pulling them into a new Campaign 3, ordered COS-23 (the
campaign's own log-provenance bug, since it affects every future session's
record) → COS-27 → COS-22 → COS-24 → COS-26.

The tracker was restructured: the Cursor section now names the active campaign
explicitly, Campaign 2's queue table rows for the five moved issues are
annotated with where they went, and a new "Campaign 3" section holds their
order and one-line notes. Committed directly to `dev` (three commits:
`ea48ed7` the tracker + log sync, plus the handover archive `d03a7db`) — no
branch or PR, per the init lifecycle's convention for tracker administration.

## Next steps

1. Take COS-23 through the normal per-issue lifecycle: branch, plan, implement,
   verify, update the tracker on the branch (advance Campaign 3's cursor to
   COS-27, move COS-23 to Resolved), commit, review, PR into `dev`, merge,
   sync, fast-forward `main`, prune.
2. Then COS-27, COS-22, COS-24, COS-26 in order, one per session as usual.
3. Periodically — or whenever the user says to check — try resuming COS-16
   per Campaign 2's held state. If a harness `run` completes without hitting
   a usage-limit error, Campaign 2 can resume properly; re-point the tracker's
   Cursor section back to `**Next issue: COS-16**` when that happens.

## Critical context / traps

- **Two campaigns are now tracked in one doc.** `restore` mode should read
  whichever campaign's cursor is marked ACTIVE at the top of the Cursor
  section — currently Campaign 3 / COS-23. Don't default to habit and look
  for `COS-16` first; the tracker's opening lines say which campaign is live.
- **COS-23's own scope may touch `.claude/skills/backlog-handover/SKILL.md`**
  (AC #4). No other campaign issue has edited the skill driving the campaign
  itself — treat that as worth flagging to the user before doing it, not as
  routine.
- **The usage-limit error message is misleading.** It reads "You've hit your
  monthly spend limit" but is actually the 5-hour rolling window (per the
  user); a separate weekly cap was also hit on 2026-08-18. Don't attempt any
  harness `run` this campaign without the user's go-ahead, and don't retry in
  a loop if one is attempted and fails — report and stop.
- **`harness/results/` is gitignored, single-machine, 21MB across 98 runs.**
  Flagged repeatedly across sessions as a durability risk; still unaddressed,
  not currently anyone's task. Worth raising with the user again if it comes
  up, but it is not in Campaign 3's scope.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored, no git history. Flagged to the user this session; no action taken
  pending their answer.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.**
  Use `backlog doc update doc-1 --content "$(cat file)"`, stripping
  frontmatter first. Write patch scripts to a file, assert every replacement
  matched exactly once.
- **`lore sync` commits `backlog/` and rewrites `docs/log.md` on its own.**
  Expect a `chore(backlog): sync task changes` commit you did not author, and
  a second commit of your own for the `docs/log.md` change it leaves staged.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content
  into anything committed.

## Do not repeat

- **Don't let a new campaign section silently orphan the old one's queue
  table.** The five issues moved to Campaign 3 were annotated in place in
  Campaign 2's table ("Moved to Campaign 3, item N") rather than deleted —
  a future session reading Campaign 2's table alone would otherwise see five
  items with no explanation of where they went.
- **Don't write a second handover file when a new campaign starts inside the
  same tracker.** One handover per topic; the old COS-16 handover was
  archived and this one supersedes it, with COS-16's resume state left in the
  tracker and the task rather than duplicated here.
