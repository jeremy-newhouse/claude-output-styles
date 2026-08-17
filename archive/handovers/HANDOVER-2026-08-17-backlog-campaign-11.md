# Handover — take COS-15, campaign 2 item 8 (cursor: COS-15)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `b2291ac`, clean apart from an untracked `system-prompt.md` that is not ours; `dev` and `main` both at `0252a4e` on their remotes, with `b2291ac` (this session's archive commit) local-only until R5 pushes it | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-15 — make the contract audit express conditional caps. Queue
order for campaign 2 was confirmed by the user on 2026-08-17; do not re-ask.
COS-15 is item 8 of 19; items 1-7 are resolved.

Clean start. COS-20 merged as 0252a4e via PR #17; nothing half-finished, no
branch litter, no open PRs.

COS-15 is a DESIGN DECISION before it is code. Two style rules state a
conditional ("never show code UNLESS they ask"; gloss a jargon word and it is
allowed) and contracts.json can only hold an unconditional number
(maxCodeLines: 0; no_jargon's 28-term ban list). AC #1 says the choice —
extend the contract language, or restate the style files so no conditional
survives — must be ARGUED, not assumed. Decide that first; the code follows in
an afternoon either way.

AC #4 makes this a measuring task: any change to a style file has to be
measured, and both rules currently score. Budget for a real run. Free
re-scoring will not satisfy it — `score` re-derives checks on saved replies,
and a changed style file changes the replies.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required). `lore sync` needs LORE_BACKLOG_TIMEOUT_MS=120000. Any change to
harness/src/*.mjs needs matching tests; any change to a style file or
contracts.json must leave `node src/cli.mjs audit` at exit 0. Never run
`improve` on a style file — six optimizer rewrites across three styles have
failed and that is settled.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `0252a4e` on origin; local `dev` at `b2291ac` (archive commit, unpushed) |
| Feature branches | none, local or remote |
| Open PRs | none |
| COS-20 | **Done and merged** — PR #17, rebase-merged as `0252a4e` |
| Cursor | **COS-15**, campaign 2 item 8 |
| Test suite | 159/159 (`npm --prefix harness test`) — was 135 |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |

## What COS-15 asks for

`audit` compares numbers and cannot express a condition, and there are two
instances of the same defect pointing in opposite directions. Beginner's file
says "Never show code **unless they ask**" while `maxCodeLines: 0` drops the
second half, so `code_block_size` scores 0 on a code block the reader asked for
and the style permits. And beginner's core rules tell the writer to gloss a
technical word — with "I updated the API (the messenger that lets two programs
talk)" as the worked example — while `no_jargon` bans 28 terms unconditionally
at weight 2, so following the file's own example scores 0.667 on the heaviest
check. Four acceptance criteria: fix or restate both, with the choice argued;
re-read all three style files against the contract fields for other conditionals;
prove `audit` still exits 1 on a real disagreement by breaking one on purpose;
and measure any style-file change.

## Next steps

1. **Make the design call before touching code.** Extending `contracts.json` to
   hold a conditional means the audit has to parse one, and every check that
   reads the field has to honour it — `code_block_size` and `no_jargon` are
   different shapes of condition ("unless the user asked" is about the prompt;
   "unless glossed" is about the reply). Restating the style files is cheaper
   and loses a permission the style deliberately grants. AC #1 wants the
   argument on the record either way.
2. AC #2 is a reading task and is not satisfiable by running `audit` — the whole
   point is that `audit` says these agree. Read all three style files against
   their contract fields by hand.
3. AC #3 is a sabotage test: break a contract on purpose, watch the suite go red,
   restore. `harness/test/contract-audit.test.mjs` is where it belongs. Print the
   mutated line before believing a red or a green.
4. AC #4 needs a real run if a style file changes, and beginner is the style
   under both rules. Beginner's arms are the ones COS-20 sized: 148 cells per
   model for ±4 points, 95 for ±5, 49 for ±7, 24 for ±10.
5. Gates, commit, review, PR into `dev`, rebase-merge, sync `dev`,
   fast-forward `main`, push both, prune.
6. Re-arm: archive this handover, write the next one, advance the cursor to
   COS-16.

## Critical context / traps

- **COS-20 changed how a judge figure must be quoted, and COS-15 may produce
  one.** A bar is stated against a judge model, and this project never named
  one. Haiku grades beginner replies **+18.01 [+12.34, +23.68]** above Sonnet.
  If COS-15 measures a style change, say which judge scored it, and hold the
  judge fixed across the comparison.
- **Judge once, buy cells.** Repeat-judging beats adding cells only when a cell
  costs more than 10.9 judge calls, and a conversational Sonnet cell is 9.6s
  against a 6.1s judge call. Do not spend `--judge-repeats` on a scoring arm.
- **`node src/cli.mjs judge` is new and re-judges saved replies at no cell
  cost.** `--judgements=<path>` re-derives a finished judge run offline for
  nothing. Both were built under COS-20; the runbook documents them.
- **Sample sizes are per style, not a project constant.** ±4 costs 148 cells on
  beginner, 169 on intermediate, 207 on advanced. Quoting 148 for advanced
  understates it by 40%.
- **A judge call on Haiku takes 59.5s against Opus's 7.6s**, and Haiku returned
  unparseable JSON on 6 of 180 calls. It is neither the fast option nor the
  reliable one. Concurrency 16 held fine for 720 calls; the first two minutes
  look serialized and are just cold start.
- **`harness/results/` is gitignored.** The ledger
  (`docs/reference/experiment-ledger.md`) is the durable record. 83 saved runs
  exist locally on this machine only.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, stripping the frontmatter
  first since the CLI re-adds it. The body is ~133KB and passes fine. Write the
  patch script to a *file* rather than inlining it in `node -e`, and make each
  replacement assert that its pattern matched and was unique.
- **`lore sync` commits `backlog/` on its own** as `chore(backlog): sync task
  changes`. Expect commits you did not author on the branch, and run it before
  staging so the tree does not surprise you.
- **`lore sync` rewrites `docs/log.md`** and only records commits that already
  exist, so a branch's last commits are always missing and the SHAs it does
  record are destroyed by the rebase-merge. That is COS-23, queue item 17.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored. Stage files explicitly; never `git add -A`.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Sabotage every guard you add, and print the mutated line.** Eight mutations
  this session, one per guard; all eight went red on the intended test. The
  first pass found a real gap that way — removing `ok: false` from judge.mjs's
  unparseable-output return left the suite **green**, because the new tests
  inject a fake judge and never reach judge.mjs's own returns. A missing
  injection seam is invisible in a diff and obvious in a mutation.
- **A tool that prints a number must print it on the right basis.** The sizing
  table was built on the decomposition pooled across all three styles, which
  buries the gap *between* styles in the reply component and asked for 208 cells
  where the arm needs 148. Found by reading the tool's own output against the
  docs, not by any test.
- **A command that writes files must refuse the wrong file.**
  `judge --judgements=` rewrote `report.md` beside whatever path it was given;
  handed a run's `rows.json` it destroyed that run's report and reported only
  "5 of 5 judge calls returned no parseable score".
- **Re-derive a headline figure with arithmetic that imports nothing from the
  module under test.** The 10.17/22.58 split was recomputed from raw records in
  a standalone script and matched to the last digit. Using the module to check
  the module proves nothing.
- **A green sabotage run proves nothing until the sabotage is confirmed to have
  landed.** Two sabotage runs came back green in an earlier session and both
  were wrong. Assert the mutated string is present and the original absent.
- **"Saved score vs current code" and "old code vs new code" answer different
  questions.** Only the second is evidence about your change.
- **Do not mark a task Done before the review returns.** Session 15 did and had
  to walk it back. This session committed first, reviewed, fixed seven findings,
  then checked the ACs.
- **Do not stop reviewing after one round.** COS-25 took four; COS-9 took three.
  This session ran a self-review that found one defect before `/code-review`
  returned seven more.
- **A number in a comment, a doc or a commit message is a claim.** This session
  shipped "mean 10.5s over the five cases" for a mean that included an agentic
  case, and had to correct the docs and the commit.
- **Do not run `improve` on a style file.** Settled.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
6 ~~COS-9~~ · 7 ~~COS-20~~ · **8 COS-15 — the cursor.**
9 COS-16 · 10 COS-18 · 11 COS-17 · 12 COS-21 · 13 COS-19 ·
14 COS-4 · 15 COS-1 · 16 COS-22 · 17 COS-23 · 18 COS-24 · 19 COS-26.
COS-25 was out of band at the user's direction and is merged; COS-26 was opened
from its review and appended after item 18 rather than slotted into the
confirmed order.
