---
name: backlog-handover
description: "Drive a multi-session backlog-burndown campaign against a Backlog.md project: a tracker doc holds the queue + cursor, each session resolves exactly ONE backlog issue on its own feature branch (branch → commit → review → open a PR into the default branch → merge → prune), then writes a grounded handover so the next session continues with just '/clear' + '/backlog-handover restore'. Use whenever the user wants to work through backlog issues one per session, says 'backlog handover', 'restore the campaign', 'continue the backlog', 'take the next backlog issue', 'burn down the backlog', asks to set up a backlog tracker/queue/cursor, or ends a campaign session with the current issue unfinished. Do not use for ad-hoc handovers unrelated to a Backlog.md campaign — that is the plain 'handover' skill."
compatibility: "In this repo: default branch `dev`, promoted fast-forward to `main`; docs are driven by the `lore` CLI (`lore check` gates commits touching docs/); tests are `npm --prefix harness test`. Requires git and the Backlog.md CLI (`backlog`) in a repo where `backlog init` has been run. Optional: a remote named `origin` (push/prune steps are skipped without one) and the GitHub CLI (`gh`, authenticated) for the PR-based merge step — falls back to a local `git merge --ff-only` into the default branch when `gh` is unavailable or unauthenticated."
---

# Backlog Handover — one-issue-per-session campaign driver

Run down a Backlog.md backlog across many small sessions. Each session: restore
context → take exactly ONE issue from the queue → resolve it on its own feature
branch → review → open a PR into the default branch → merge it (rebase, linear
history) → prune → advance the cursor → write the next session's handover. The
user drives the whole campaign with only:

```
/clear  →  /backlog-handover restore  →  (repeat until the queue is empty)
```

Why one issue per session: every session starts on near-empty context from a
grounded handover, so quality does not degrade as the campaign grows; every
merge is a small, reviewed, self-contained unit; an interrupted session loses at
most one issue's work. Why a tracker doc instead of a fat handover: durable
facts live in the system of record (Backlog tasks + tracker doc); the handover
stays a thin, disposable pointer that can be regenerated from the tracker.

---

## Usage

```bash
/backlog-handover init      # one-time: build the tracker doc + queue from open issues, write the first handover
/backlog-handover restore   # THE DRIVER: verify ground truth, resolve the cursor issue end-to-end, re-arm
/backlog-handover write     # bailout: session is ending with the cursor issue unfinished — write a grounded handover
/backlog-handover status    # read-only: tracker, queue, cursor, active handover, branch state
```

Mode detection: first word of the arguments. Empty or unrecognized → `status`
(the only safe default — never mutate anything without an explicit mode).

---

## Conventions

| Thing | Convention |
| --- | --- |
| Tracker | Backlog doc titled `Backlog campaign tracker` — find via `backlog doc list --plain`, read via `backlog doc view <id> --plain` |
| Active handover | `.claude/handovers/HANDOVER-{YYYY-MM-DD}-{topic}.md` (gitignored — verify, see init) |
| Consumed handover | moved to `archive/handovers/` (tracked, committed). Always `ls` the destination first; on a name collision suffix `-2`, `-3`, … |
| Topic slug | `backlog-campaign` — but if `.claude/handovers/`/`archive/handovers/` already use an established campaign topic, keep that one (continuity beats naming purity) |
| Feature branch | `feature/<ISSUE-KEY>` off the default branch |
| Default branch | `dev` — confirmed via `git symbolic-ref --short refs/remotes/origin/HEAD`. This is the campaign's integration branch; every issue merges here |
| Downstream promotion | After the issue merges to `dev`, fast-forward it into `main` and push both: `git checkout main && git merge dev --ff-only && git push origin main && git checkout dev`. This repo keeps `main` in lockstep with `dev`, so a campaign session is not finished until both are pushed. A non-fast-forward means `main` has diverged — STOP and surface it rather than forcing it |
| PR merge | `gh pr merge feature/<KEY> --rebase --delete-branch` into the default branch — rebase-and-merge is the closest GitHub-native equivalent to a local `merge --ff-only` (linear history, no merge commit). No `gh` CLI (missing/unauthenticated) or no remote → fall back to a local `git merge --ff-only` straight to the default branch |
| PR review gate | None — the skill's own step-6 review (self or adversarial subagent) already ran before the PR is opened; the PR merges immediately after, as an audit trail, not a manual approval gate. Change this only if the user says otherwise |
| Commits | this repo writes a plain imperative subject and a body explaining what was measured or decided, not Conventional Commits. Add a `Refs: <ISSUE-KEY>` trailer and the project's `Co-Authored-By` trailer |
| Docs | never hand-edit `docs/`. Author prose outside lore-managed regions, then `lore sync`; `lore check` must exit 0 before the commit. Same rule as Backlog: the CLI owns its files |
| Tests | `npm --prefix harness test` must pass before the PR. Any change to `harness/src/checks.mjs` needs a matching case in `harness/test/checks.test.mjs` |
| Measurement claims | a number in a commit message, doc, or task must come from a run in this session or a cited `harness/results/<stamp>/`. Re-scoring saved rows offline (`node src/cli.mjs score`) is free — use it rather than quoting a stale figure |
| One active handover per topic | writing a new one archives the old one first |

Backlog data is only ever touched through the `backlog` CLI (task edit, doc
update) — never by editing its markdown files directly; the CLI keeps metadata,
IDs, and relationships consistent. Read `backlog instructions task-execution`
before working an issue and `backlog instructions task-finalization` before
checking acceptance criteria — the campaign inherits those rules, it does not
replace them.

### Tracker doc structure

Create with this skeleton; every section earns its keep across sessions:

```markdown
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

## Cursor
**Next issue: <KEY>** — queue order confirmed by the user on <date> ("<their words>");
do not re-ask before taking the next item.

## Queue (confirmed order)
| # | Issue | Type | One-line note |

## Resolved
| # | Issue | Status/date/session | Evidence summary |

## Not queued — needs a human / blocked
- <KEY>: <why an agent alone cannot finish it>

## Session log
- <date> — session N: <what happened, what was verified, merged SHA>
```

---

## Init mode

### I1: Inventory

`backlog task list --plain` for every non-terminal issue, then
`backlog task view <KEY> --plain` on each candidate. Classify honestly:
**agent-resolvable now** (goes in the queue) vs **needs a human physically
present / a product decision / blocked by another issue** (goes in "Not
queued" with the reason). An issue whose acceptance criteria cannot be
objectively verified by an agent alone does not belong in the queue — putting
it there just manufactures a stuck session later.

### I2: Confirm the queue with the user

Propose an order (lowest-risk/highest-information first is a good default:
doc-only → small code → spikes) and get explicit confirmation. Record the
confirmation verbatim in the tracker's Cursor section — future sessions rely on
it to proceed without re-asking, which is what makes the `/clear` → `restore`
loop unattended-friendly.

### I3: Create the tracker + directories

1. `backlog doc create "Backlog campaign tracker" -t other`, then
   `backlog doc update <id> --content "<skeleton above, filled in>"`.
2. Ensure `.claude/handovers/` is in `.gitignore` (append it if missing) and
   `mkdir -p archive/handovers`. Handovers may mention machine/env names, so
   the active ones stay untracked; only consumed ones get committed.
3. Commit the tracker + gitignore change on the default branch.

### I4: Write the first handover

Run Write mode (below) pointed at the cursor issue, then tell the user the
driver loop: `/clear` → `/backlog-handover restore`.

---

## Restore mode — the driver

### R1: Locate

Newest `.claude/handovers/HANDOVER-*-{topic}.md`. If no handover exists but the
tracker doc does, say so and proceed from the tracker alone — the handover is an
accelerator, the tracker is the record. Neither exists → suggest
`/backlog-handover init`; STOP.

### R2: Verify ground truth (drift check)

The handover reflects when it was written. Re-verify every grounded claim
before acting:

1. `git fetch` — has the default branch moved past the grounding SHA? Working
   tree clean? Unpushed commits?
2. Cursor issue status via `backlog task view` — already Done? Moved?
3. Tracker cursor vs handover's claim.
4. Leftover `feature/*` branches, local and remote. Also `gh pr list --head
   feature/<KEY> --state all` for the cursor issue — an open, unmerged PR
   means a prior session reached step 8 (opened the PR) but died before the
   merge completed.

Produce a short drift table (`claim → handover said → now`). If drift
invalidates the plan (issue already resolved, cursor moved), adapt and say so —
never execute stale instructions.

### R3: Reconcile

Completed-but-unrecorded work found in R2 goes into the owning records (task
notes, tracker resolved table/session log) before any new work starts.

### R4: Resolve exactly one issue

Run the per-issue lifecycle (next section) on the cursor issue. One issue.
Resist batching "quick" extra issues into the session — the loop's whole value
is that every session is small, reviewed, and cheap to restore from.

### R5: Re-arm for the next session

1. Archive the consumed handover: check the destination for a name collision
   (`ls archive/handovers/`), `mv` with a `-2`/`-3` suffix if needed, commit on
   the default branch (`docs(<KEY>): archive consumed backlog-campaign handover`).
2. Write the fresh handover for the new cursor issue (Write mode stages).
3. Push the default branch: `git push origin dev`, then promote and push `main` if the archive commit landed after step 9 (`git checkout main && git merge dev --ff-only && git push origin main && git checkout dev`). Unconditional — step
   8's PR merge (or its no-`gh` local-merge fallback) already updated
   `<default>` and step 9 synced the local checkout to match, but R5 step 1's
   archive commit (and any other housekeeping commit made after step 9) is
   new and still needs to go up. This campaign pushes every session; it does
   not wait for the user to ask (no remote `origin` → skip, per the
   lifecycle's own step 7 note).

### R6: Report

State what was resolved with its evidence and merged SHA, the new cursor issue,
and end with the literal next command for the user:
`/clear` then `/backlog-handover restore`.

**Queue empty instead?** Campaign complete: summarize the resolved table,
archive the final handover (no new one), and suggest `init` for a fresh queue.

---

## Per-issue lifecycle (the heart of R4)

0. **Preflight** — `git status --porcelain` must be clean; if dirty, STOP and
   surface it (never stash someone else's work silently). Sync:
   `git checkout <default> && git pull --ff-only` (skip pull without a remote).
   A leftover `feature/<KEY>` matching the cursor issue → inspect and resume it
   (a prior session died mid-lifecycle; the handover/tracker say where). Any
   other leftover branch → report it, do not delete it, continue. If a leftover
   branch has an open PR (`gh pr list --head feature/<KEY>`), that PR reached
   step 8 but never merged — resume from there rather than re-opening a second
   PR for the same branch.
1. **Branch**: `git checkout -b feature/<KEY> <default>`.
2. **Plan**: read `backlog instructions task-execution`; view the task; mark it
   In Progress + assign; record the implementation plan in the task.
3. **Implement + verify**: work in small slices. Follow
   `backlog instructions task-finalization` before checking any acceptance
   criterion — objective evidence only (command output, tests, live checks),
   never code-presence or intent. Record notes/evidence in the task; mark Done
   with a final summary naming the verification.
   Gates before the criterion is checked, whichever apply:
   `npm --prefix harness test` green; `lore check` exit 0 if `docs/` changed;
   a measurement actually run if the criterion asserts a number. An acceptance
   criterion about model behaviour is not satisfiable by reading code — it needs
   a harness run, and the run's stamp goes in the task notes.
4. **Update the tracker on the branch**: advance the cursor to the next queue
   item, move this issue's row to Resolved, append the session-log entry — via
   `backlog doc update`. Doing this on the branch makes code + task metadata +
   cursor advance merge as one atomic unit: the default branch never shows a
   cursor pointing at an issue that is already merged-Done.
5. **Commit** on the branch — small logical commits, project conventions,
   `Refs: <KEY>` trailer.
6. **Review**: review the full branch diff (`git diff <default>...HEAD`) with
   fresh eyes — bugs, unverified ACs, scope creep, convention violations. This
   project has `/code-review`; use it. Fix findings, commit; record any blocking
   finding and its resolution in the task.
   Two failure modes this project has actually hit, worth looking for
   specifically: a scoring change that moves numbers already quoted in `docs/`
   or `FINDINGS.md` without those being updated, and a `harness/config/`
   threshold that no style file states. Both passed every automated check and
   were caught only by reading.
7. **Publish the branch**: `git push -u origin feature/<KEY>` (no remote → skip
   7/8/9/10's remote halves and do a local `git merge --ff-only` straight to
   `<default>` instead, then skip to step 10's local half).
8. **Open and merge a PR into `<default>`** — requires the `gh` CLI
   authenticated; no `gh`, or `gh` unavailable → fall back to a local
   `git merge --ff-only feature/<KEY>` into `<default>` (note the fallback in
   the handover) and skip to step 9:
   - `gh pr create --base <default> --head feature/<KEY> --title "<KEY>: <task title>" --body "<final summary + AC evidence>"`.
   - Step 6's review already happened before this point — that pass *is* the
     review; the PR is an audit trail, not a manual approval gate (see the
     Conventions table's "PR review gate" row — don't add a wait-for-approval
     step unless the user asks for one). Merge immediately:
     `gh pr merge feature/<KEY> --rebase --delete-branch`. Rebase-and-merge is
     deliberate: it's the closest GitHub-native equivalent to the old local
     `merge --ff-only` — linear history, the exact reviewed commits land on
     `<default>` (only their SHAs are rewritten), no merge commit. If it fails
     (`<default>` moved under the PR): `git fetch`, rebase the feature branch
     onto `origin/<default>`, re-run the verification the rebase could have
     invalidated, `git push -f` the feature branch, retry `gh pr merge`.
9. **Sync local `<default>`, then promote to `main`**:
   `git checkout <default> && git pull --ff-only origin <default>` brings the
   local checkout in line with what `gh pr merge` (or the fallback) already did.
   Then promote, per the Conventions table:
   `git checkout main && git merge dev --ff-only && git push origin main && git checkout dev`.
   A non-fast-forward means `main` diverged — STOP, report it, do not force.
10. **Prune**: `--delete-branch` on `gh pr merge` already removed the remote
    `feature/<KEY>` (skip if the no-`gh` fallback path was used — delete it
    manually: `git push origin --delete feature/<KEY>`). Remove the local
    copy too: `git branch -d feature/<KEY>`. A campaign leaves no branch
    litter and no open PRs — the next session's preflight treats either as a
    crashed session's evidence.

If the issue turns out not agent-finishable mid-flight (needs a human at
hardware, a product decision): record exactly what remains in the task, move it
to the tracker's "Not queued" section with the reason, advance the cursor past
it, and continue the lifecycle from step 4 with whatever partial work is
legitimately mergeable (or abandon the branch cleanly if none is).

---

## Write mode (bailout / init's W-stages)

### W1: Ground truth

Verify with commands, never memory: branch + HEAD SHA, `git status
--porcelain`, unpushed commits, cursor issue status, tracker cursor, leftover
`feature/*` branches.

### W2: Flush durable facts first

Implementation decisions/evidence → the task (notes, AC checks). Campaign
state → the tracker (cursor, session log). Reusable cross-project lessons →
auto-memory if available. The handover holds pointers, not the facts.

### W3: Write the handover

Path: `.claude/handovers/HANDOVER-{YYYY-MM-DD}-{topic}.md` (UTC date). Existing
active handover for the topic → archive it first (collision rule applies).

```markdown
# Handover — {one-line goal} ({issue keys})

**Date**: {YYYY-MM-DD} | **Grounded against**: {branch @ SHA, clean/dirty, ahead/behind origin} | **Tracker**: {doc id}

## Paste-ready prompt for the next session

​```
Run /backlog-handover restore in {repo path}. Tracker: {doc id}. Cursor:
{KEY} — {one-line issue summary}. Queue order confirmed by user on {date};
do not re-ask. {Locked decisions, traps, exactly where the lifecycle
stopped if mid-issue.}
​```

## State
| Item | Status |

## Next steps
1. {ordered, concrete, with file:line / issue references}

## Critical context / traps
- {non-obvious constraints; if mid-lifecycle: branch name + last completed step number}

## Do not repeat
- {failed approaches: "tried X, failed because Y"}
```

Rules: no invented content — every SHA/status verified in W1, gaps stated as
gaps. Failed approaches are mandatory when anything failed. Never advance the
cursor for unfinished work. No secrets; machine/env names only because the file
is gitignored — never copy them into anything committed.

### W4: Confirm

Output the path, topic, cursor issue, and the driver-loop reminder.

---

## Status mode

Read-only report: tracker doc id + cursor + queue remaining + resolved count,
active handover file(s), leftover `feature/*` branches, any open PRs
(`gh pr list --state open`), default branch ahead/behind origin, dirty files.
Flag convention violations (handovers outside `.claude/handovers/`, an
untracked-but-should-be-ignored handovers dir, branch litter, an open PR with
no corresponding leftover branch or vice versa) with the canonical fix.

---

## Error handling

| Condition | Behavior |
| --- | --- |
| `backlog` CLI missing / no Backlog project | STOP; point at Backlog.md's `backlog init` |
| Dirty working tree at preflight | STOP; show `git status`; let the user decide |
| PR merge fails (base moved under it) | Rebase path in lifecycle step 8 — never a regular merge commit or `merge --no-ff` around it |
| `gh` CLI missing or unauthenticated | Fall back to a local `git merge --ff-only` into `<default>` (lifecycle step 8's fallback); note it in the handover |
| Review finds a blocking defect | Fix before opening/merging the PR; truly unfixable → leave the branch pushed and unmerged (no PR, or PR left open), write a bailout handover naming the finding |
| Cursor issue already Done (drift) | Advance cursor, log it, take the next issue |
| Archive move name collision | Suffix `-2`, `-3`, …; note it |
| Ground-truth command fails | Record the gap explicitly in the handover — never substitute memory |
| No remote `origin` | Skip push/PR/remote-prune halves; note in the handover |
| `lore check` non-zero after a docs change | Fix before committing; exit 6 is drift or a broken link, not a warning to carry |
| `main` will not fast-forward from `dev` | STOP and report. Never force-push `main` or resolve it with a merge commit |
| An AC asserts a number with no run behind it | Not satisfiable. Run the harness or re-score saved rows; quoting a prior session's figure is not evidence |
