# Fleet-share prompt — backlog-handover workflow

Paste this to any teammate/agent adopting the workflow in another repo.

This file is deliberately generic. Repo-specific conventions — default branch,
downstream promotion, doc and test gates — belong in SKILL.md, not here.

---

Adopt the "backlog-handover" workflow: a multi-session backlog-burndown
campaign driver for any repo using the Backlog.md CLI.

SETUP (once per repo)
1. Install the skill: copy the backlog-handover skill folder into
   .claude/skills/ (or install backlog-handover.skill). Prereqs: git, the
   `backlog` CLI with `backlog init` already run, optionally a remote
   named origin.
2. Run `/backlog-handover init`. It inventories open issues, proposes a
   queue of the agent-resolvable ones (needs-human issues are parked in a
   "Not queued" section with reasons), asks you to confirm the order ONCE,
   then creates a "Backlog campaign tracker" doc (queue + cursor + session
   log) inside Backlog.md itself, gitignores .claude/handovers/, creates
   tracked archive/handovers/, and writes the first handover.

DRIVE (repeat until the queue is empty)
   /clear
   /backlog-handover restore

Each restore session does exactly ONE issue, end to end:
  drift-check the handover against live git/backlog state → branch
  feature/<KEY> off the default branch → implement with objective
  acceptance-criteria evidence (Backlog task-execution/finalization rules)
  → advance the tracker cursor on the branch so code + task status +
  cursor merge as one atomic unit → commit (Refs: <KEY>) → review the full
  branch diff and fix findings → push the branch → ff-only merge to the
  default branch → push → prune the branch locally and remotely → archive
  the consumed handover → write a fresh grounded handover for the next
  session. No branch litter, linear history, every merge is a small
  reviewed unit, and a fresh session needs zero context beyond the
  handover + tracker.

If a session must stop mid-issue: /backlog-handover write records the
branch and the exact lifecycle step; the cursor never advances for
unfinished work. /backlog-handover status is the read-only overview.

Why it works: durable state lives in the system of record (Backlog tasks
+ tracker doc), so handovers stay thin disposable pointers and quality
doesn't degrade as the campaign grows — each session starts near-empty,
grounded, and reviewed.
