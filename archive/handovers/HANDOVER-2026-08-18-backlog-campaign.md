# Handover — resume COS-16, campaign 2 item 9, still the cursor (COS-16)

**Date**: 2026-08-18 | **Grounded against**: `dev`/`main` both at `4bbff80`, both pushed, clean tree apart from an untracked `system-prompt.md` that is not ours | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-16 — it did NOT resolve last session and stays the cursor.
Queue order for campaign 2 was confirmed by the user on 2026-08-17; do not
re-ask.

COS-16 is blocked twice by Claude Code's 5-hour usage window, not by anything
that needs a decision. Everything already measured and decided is recorded in
the task's implementation notes — read `backlog task view COS-16 --plain` in
full before doing anything else. Do not re-derive the ablation design or the
five defect decisions; they are settled. The ONLY remaining work:

1. Rebuild the three-edit candidate (E1+E2+E3, dropping E4) — sha256 must read
   86451ddb16b273426eca5318d20169b6bfa1b0f6dd304872c3b9625da7a167c3. The exact
   three literal replacements are in the task notes under "THE CANDIDATE TEXT
   IS NOT SHIPPED" (adjusted to omit E4's replacement).
2. Measure it on the five shared cases, opus+sonnet, baseline variant, 30
   repeats, concurrency 12 — `node src/cli.mjs run --styles=plain-english-beginner
   --variants=baseline --models=opus,sonnet --cases=conv-status-auth,conv-explain-cache,
   agentic-read-report,conv-status-holdout,conv-followup-drift --repeats=30 --concurrency=12`.
   Confirm 0 errored cells before trusting anything — the last two attempts each
   hit the usage window partway through and left errored rows with the message
   "You've hit your monthly spend limit" (worded like a spend cap; it is
   actually the rolling 5-hour window). If you hit it again, STOP, do not
   thrash retrying, and tell the user — it resets on its own and burning a
   session's context polling for it is wasted.
3. If clean, check AC #2 and AC #4 against the `19-42-55` baseline (rules
   98.9/97.4, judge 66.8/60.9, words 63.0/59.7 at n=150/model — this is the
   number to compare against, not COS-4's superseded 35-cell figures, which
   this session already corrected in the docs).
4. If AC #2/#4 pass, measure the SAME three-edit candidate on the six reserve
   cases (25 repeats) — no reserve arm has run on any three-edit candidate yet;
   this is AC #5 and it has not been attempted.
5. Check AC #6 (audit exit 0, checksum match to what's measured), decide AC #1
   formally (already effectively decided: E1/E2/E3 fixed and ship, E4 retained-
   not-shipped because it has no individual measured benefit and is the one
   edit that adds rather than removes/bounds a rule, defect #5 retained because
   COS-15 already fixed its scoring consequence).
6. Then the normal lifecycle: gates, commit, `/code-review`, PR into `dev`,
   rebase-merge, sync `dev`, fast-forward `main`, push both, prune, advance the
   cursor to COS-18, write the next handover.

Locked decisions, unchanged from before: default branch `dev`; every issue
merges via PR (`gh pr merge --rebase --delete-branch`) then `dev` fast-forwards
into `main`; docs/ edited outside lore-managed regions, `lore sync` then
`lore check` exit 0 (`LORE_BACKLOG_TIMEOUT_MS=120000`); harness changes need
matching tests; a style file or `contracts.json` change needs `audit` exit 0;
never run `improve` on a style file.
```

## State

| Item | Status |
|---|---|
| `dev` / `main` | both `4bbff80` on origin, clean, pushed |
| Feature branches | none, local or remote |
| Open PRs | none |
| Cursor | **COS-16, still item 9** — did not resolve, did not advance |
| Test suite | 179/179 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files, 0 errors, 0 warnings) |
| `plain-english-beginner.md` | reverted to shipped bytes, sha256 `96fdbea4` — no prose changes shipped this session |
| Working tree | clean except untracked `system-prompt.md`, not ours |
| Cells persisted project-wide | 4540 (was 640 before this session) |

## What happened last session (session 20)

Took COS-16, priced the ablation (four defects become four edits — three
remove/bound, one adds; the fifth defect is retained because COS-15's gloss
fix already closed its scoring consequence), and measured the two baselines
clean at n=150/model with 0 errors. That re-measurement corrected a real
published figure: COS-4's judge score at n=35 (73.9 Opus, 58.1 Sonnet) reads
66.8/60.9 at n=150 — both inside COS-4's own interval, but it flips the bar
verdict from "missed on Sonnet only" to "missed on both". That correction is
merged (`9081f33`) across FINDINGS.md and four docs, with new ledger rows for
every arm this session ran.

The four-edit bundle measured as a null result on the judge but showed a real
Opus word regression (+1.71 [+0.27, +3.16], breaching AC #4). The single-edit
ablation needed to find which edit caused it hit Claude Code's 5-hour usage
window twice — first losing 1127 of 1200 cells, then (after a retry that
cleanly measured all four edits individually with zero harm from any of them)
losing 56 of 150 Sonnet cells on a three-edit follow-up that had isolated the
regression to E4, the one "add" edit. The user chose to park rather than wait
out a third window. Only the doc corrections and ledger rows — real, verified,
independent of the shipping decision — were merged.

## Next steps

See the paste-ready prompt above — it is complete and ordered. The short
version: rebuild the three-edit candidate, get a clean Sonnet read on it,
check AC #2/#4/#5/#6, ship, then run the normal PR lifecycle.

## Critical context / traps

- **The error message names the wrong limit.** "You've hit your monthly spend
  limit" is Claude Code's 5-hour rolling usage window, confirmed by the user.
  It resets on its own. Do not try to raise it, do not retry in a loop — check
  once, and if it's still hit, stop and tell the user rather than burning
  context on retries.
- **Every arm this session recorded 0 errors except the two that hit the
  window.** When a `run.json` says `complete: true` but the rows include the
  spend-limit error string, the completion count includes errored rows — check
  `rows.filter(r => r.error).length`, not just `manifest.complete`, before
  trusting an arm.
- **`gh pr merge --delete-branch` can partially fail and still report success
  on the remote.** Last session's PR #19 merged via the GitHub API before a
  local uncommitted-file conflict blocked `gh`'s local housekeeping; a commit
  pushed to the feature branch AFTER that merge point never made it into
  `dev` and had to be recovered by direct cherry-pick. If a retry says
  "already merged" after you expected a fresh merge, diff what's on `dev`
  against what's on the feature branch before assuming nothing was lost.
- **The style file must be reverted to shipped bytes (`96fdbea4`) between
  measurement arms and whenever nothing ships.** It was left on a candidate
  text at least twice last session by scripts that didn't restore it on exit;
  always `shasum -a 256 plain-english-beginner.md` before committing.
- **A judge figure must name its judge, and a style figure must name its
  sample size.** COS-4's 73.9/58.1 at n=35 and this session's 66.8/60.9 at
  n=150 are both correct readings of the same bytes — the lesson is that a
  35-cell arm's point estimate can sit anywhere in a ±8-point interval, not
  that either number is wrong.
- **`harness/results/` is gitignored.** The ledger
  (`docs/reference/experiment-ledger.md`) is the durable record; 90+ saved
  runs exist locally on this machine only, including all of session 20's.
- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.**
  Use `backlog doc update doc-1 --content "$(cat file)"`, stripping the
  frontmatter first. Write patch scripts to a file, not inline in `node -e`,
  and assert every replacement matched exactly once.
- **`lore sync` commits `backlog/` and rewrites `docs/log.md` on its own.**
  Run it before staging so the tree does not surprise you; expect a
  `chore(backlog): sync task changes` commit you did not author.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored. Stage files explicitly; never `git add -A`.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content
  into anything committed.

## Do not repeat

- **A bundle's aggregate result does not decompose into its parts, and this
  session proved it concretely, not just in principle.** The four-edit
  bundle's Opus word regression (+1.71) did not appear in ANY of the four
  individual edits measured separately (largest individual Opus word delta:
  +0.20). It only showed up when combined — an interaction effect. AC #3's
  "no bullet ships on the strength of the bundle alone" is not a formality;
  measure the exact combination that will ship, not just its parts.
- **"Adding a rule" is still the failure-prone shape, even for a small
  addition.** E4 added two router bullets — no new banned terms, no new caps
  — and it is still the prime suspect for the bundle's only regression. Three
  of four edits removed or bounded existing rules and showed no such effect.
- **A monthly-sounding error message can still be an hourly window.** Don't
  infer the retry cadence from the wording; ask if genuinely unsure, the way
  this session did.
- **Do not mark a task Done, or advance the cursor, for work that is not
  finished.** COS-16 stays In Progress and stays the cursor. The temptation
  after a large, mostly-successful measurement session is to call it close
  enough — it is not close enough until AC #2/#4/#5/#6 are checked against
  a clean arm.
