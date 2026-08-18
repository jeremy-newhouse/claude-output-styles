# Handover — take COS-16, campaign 2 item 9 (cursor: COS-16)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `62eb6a9`, clean apart from an untracked `system-prompt.md` that is not ours; `dev` and `main` both at `606ee23` on their remotes, with `8d78fa5` (archive) and `62eb6a9` (the COS-16 note) local-only until R5 pushes them | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-16 — fix the five contradictions COS-4 left in the beginner
style file. Queue order for campaign 2 was confirmed by the user on 2026-08-17;
do not re-ask. COS-16 is item 9 of 21; items 1-8 are resolved.

Clean start. COS-15 merged as 606ee23 via PR #18; nothing half-finished, no
branch litter, no open PRs.

COS-16 IS THE FIRST SESSION IN CAMPAIGN 2 THAT SPENDS REAL CELLS, AND ITS
ACCEPTANCE CRITERIA ARE EXPENSIVE. AC #2 wants >=146 cells per model on the
shared five. AC #3 wants every surviving edit measured on its OWN, not just in
the bundle. AC #5 wants the six reserve cases at the same sample size, before
and after. Read those three together and price the whole thing BEFORE editing
the style file — five edits ablated individually at 148 cells each is not the
same task as one bundle at 148, and COS-4 failed precisely because it measured
a five-edit bundle once and could not tell its own edits apart. Decide the
ablation design first and put it in the plan.

COS-15 moved two figures COS-16 quotes, and a note on the task says so:
AC #4's bar reads 98.5/97.4 and the same saved rows now score 98.5/97.7; and
defect #5's stated consequence (the gloss example scoring 0.667) is no longer
true, because COS-15 closed the contract half. The prose question is unchanged.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required). `lore sync` needs LORE_BACKLOG_TIMEOUT_MS=120000. Any change to
harness/src/*.mjs needs matching tests; any change to a style file or
contracts.json must leave `node src/cli.mjs audit` at exit 0. Never run
`improve` on a style file — six optimizer rewrites across three styles have
failed and that is settled. Adding rules to the beginner file has failed twice
(COS-1, COS-4); four of COS-16's five fixes REMOVE or BOUND a rule, which is
the shape that worked.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `606ee23` on origin; local `dev` at `62eb6a9`, two commits unpushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| COS-15 | **Done and merged** — PR #18, rebase-merged as `606ee23` |
| Cursor | **COS-16**, campaign 2 item 9 |
| Test suite | 179/179 (`npm --prefix harness test`) — was 159 |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| Working tree | clean except untracked `system-prompt.md`, not ours |
| New tasks | COS-27 and COS-28, opened by COS-15, appended as queue items 20 and 21 |

## What COS-16 asks for

COS-4 rewrote `plain-english-beginner.md`, moved the deterministic numbers a lot,
and left five new defects of the same class it was fixing. They ship at `31433b8`:
the jargon rules conflict for a word the reader used first (line 17 vs line 42);
the proof-number rule demands a number that may not exist and is stated three
times (lines 44, 49, 58); router bullets 1 and 3 both match a tool-using report;
the router omits two of the file's own six shapes, including the follow-up shape
that produced 4 of the 10 structure violations that motivated the router; and the
worked example of the gloss rule uses a banned term.

Six acceptance criteria. The three that set the cost are #2 (>=146 cells per
model), #3 (every surviving edit measured on its own) and #5 (reserve validation
at the same size, before and after).

## Next steps

1. **Price the ablation before writing any prose.** Five edits measured
   individually plus a bundle plus a reserve arm, before and after, is a large
   multiple of 148 cells. There may be a cheaper valid design — a paired
   before/after per edit on a shared arm, or dropping edits that measurement
   cannot distinguish — but AC #3 is explicit that no bullet ships on the
   strength of the bundle alone. Put the design in the task plan and price it.
2. Decide each of the five: fix or explicitly retain with the reason (AC #1).
   Defect #5's prose question survives COS-15 even though its scoring
   consequence does not.
3. `audit` must exit 0 and the shipped file must be checksum-identical to the
   measured text (AC #6). The checksum step is the one COS-4's precedent exists
   for — text that ships unmeasured is against COS-1's precedent.
4. Gates, commit, review, PR into `dev`, rebase-merge, sync `dev`,
   fast-forward `main`, push both, prune.
5. Re-arm: archive this handover, write the next one, advance the cursor to
   COS-18.

## Critical context / traps

- **A judge figure must name its judge, and a style figure must name its style.**
  Haiku grades beginner replies **+18.01 [+12.34, +23.68]** above Sonnet, and
  sample sizes are per style: ±4 points costs 148 cells on beginner, 169 on
  intermediate, 207 on advanced. Quoting 148 for advanced understates it by 40%.
- **`node src/cli.mjs judge` re-judges saved replies at no cell cost**, and
  `--judgements=<path>` re-derives a finished judge run offline for nothing.
  Both were built under COS-20. Judge-once-buy-cells: repeat-judging beats
  adding cells only when a cell costs more than 10.9 judge calls, and a
  conversational Sonnet cell is 9.6s against a 6.1s judge call.
- **A judge call on Haiku takes 59.5s against Opus's 7.6s**, and Haiku returned
  unparseable JSON on 6 of 180 calls. Concurrency 16 held for 720 calls; the
  first two minutes look serialized and are just cold start.
- **`no_jargon` changed under COS-15 and the beginner ban list is where it
  bites.** It now grades FIRST USE and forgives two gloss forms — `TERM (a
  phrase of three words or more)` and `a two-word-or-longer phrase (TERM)`. The
  em-dash appositive is deliberately not recognised. If COS-16 edits the gloss
  rule, the check will already forgive the compliant shape, so an edit aimed at
  the old scoring behaviour is aimed at nothing.
- **`codeOnRequest` exists now and lifts the whole code cap on a case that sets
  `requestsCode`.** No shipped case sets it. If COS-16 adds one, that changes
  the matrix denominator and every published figure's sample — do not add a case
  casually.
- **`harness/results/` is gitignored.** The ledger
  (`docs/reference/experiment-ledger.md`) is the durable record. 84 saved runs
  exist locally on this machine only.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, stripping the frontmatter
  first since the CLI re-adds it. The body is ~139KB and passes fine. Write the
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

- **A rule you invent in the scorer is the defect, even when it looks
  conservative.** COS-15 first made `codeOnRequest` lift only a zero cap,
  reasoning that a ban and a size cap are different things. That ran backwards:
  intermediate's "only when asked, OR when a snippet under 5 lines" attaches the
  5 to the second trigger, so keeping the cap on the asked branch applied a
  number no reader of the style could find — and left the flag inert while the
  audit printed "both lift it on request". Read the prose's grammar before
  encoding it.
- **A "fix" that is a no-op is worse than no fix.** COS-15 wrote a bound
  requiring the gloss to sit within the last N words of the clause, then removed
  it: the words immediately before the bracket ARE the last N by construction.
  Check that a guard can fail before shipping it.
- **`stripCode` leaves `**` in place.** Any check whose logic depends on two
  things being adjacent will miss the bold-label shape beginner's own file uses
  throughout. Found by review, not by any test.
- **Sabotage every guard you add, and print the mutated line.** Six mutations
  under COS-15, each asserted to have landed before its red was believed, each
  red only on its intended test. Two sabotage runs in an earlier session came
  back green and both were wrong.
- **"Saved score vs current code" and "old code vs new code" answer different
  questions.** Only the second is evidence about your change. COS-15 extracted
  the pre-change modules to a temp dir and imported both.
- **Reproduce a published figure under the OLD code before replacing it.** COS-15
  reproduced every arm mean in the ledger to the last digit and did NOT
  reproduce the paired intervals — which is what made the interval gap a method
  difference rather than a data difference, and is why the intervals were
  footnoted instead of overwritten. That gap is COS-27.
- **Grep the docs for what your change makes false.** COS-15's FINDINGS still
  asserted "no_jargon bans 28 of them outright ... scores 0.667" as standing
  fact after the change closed it. Caught by reading, not by any gate.
- **Do not mark a task Done before the review returns.** Session 15 did and had
  to walk it back. This session committed, self-reviewed (3 findings), ran
  `/code-review high` (6 more, 2 of them behaviour), fixed all nine, then
  checked the ACs.
- **A number in a comment, a doc or a commit message is a claim.** COS-15 wrote
  "five of them in these arms" for a count that was four, and two under the
  narrower reading the footnote attaches to.
- **Do not run `improve` on a style file.** Settled.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
6 ~~COS-9~~ · 7 ~~COS-20~~ · 8 ~~COS-15~~ · **9 COS-16 — the cursor.**
10 COS-18 · 11 COS-17 · 12 COS-21 · 13 COS-19 ·
14 COS-4 · 15 COS-1 · 16 COS-22 · 17 COS-23 · 18 COS-24 · 19 COS-26 ·
20 COS-27 · 21 COS-28.
COS-25 was out of band at the user's direction and is merged. Items 19-21 were
opened by the sessions that found them and are appended after item 18 rather
than slotted into the confirmed order.
