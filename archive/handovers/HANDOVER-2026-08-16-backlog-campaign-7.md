# Handover — close the multi-tool and open-ended decision gap (COS-1), campaign 6/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `0747cc8`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `0747cc8` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-1 — close the quality gap on multi-tool sessions and
open-ended decisions. Judge bar 65% on the two weak cases, currently ~48%.
Budget ~$15. Queue order confirmed by user on 2026-08-16 (COS-6 ✓, COS-3 ✓,
COS-2 ✓, COS-8 ✓, COS-5 ✓, COS-7 ✓, then COS-1, COS-4); do not re-ask.
Risk policy: record-and-park.

COS-1 is the first task in the campaign that must CHANGE the style files rather
than measure or instrument them. Two things make it different from the five
measurement/plumbing tasks before it, and both are traps.

First: the optimizer cannot do this. Six rewrites across three styles have
already failed, and the reason is recorded — the loop can only re-express rules
that already exist, and no style file says how to report a twelve-tool session
or how to handle a decision where neither option is right. This is new CONTENT,
authored by hand, not an `improve` run. Reaching for `improve` first would
repeat the campaign's most expensive settled mistake.

Second: the bar is measured, so it needs a paid run to check, and any style-file
change must keep `node src/cli.mjs audit` at exit 0 (see the locked decisions).

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to
harness/src/checks.mjs needs a matching case in harness/test/checks.test.mjs,
and any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `0747cc8`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `0747cc8` |
| Cursor issue | COS-1 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-1, 6 resolved, 2 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#7 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–6 (`-6.md` is this session's predecessor) |
| Campaign progress | 6 of 8 resolved. Next is session 7 |
| Spend so far | **$20.65** ($0.75 s2, $1.18 s3, $2.42 s4, $1.88 s5, $14.43 s6) |
| Test suite | 56/56 (`npm --prefix harness test`), was 52 |
| Measurement | **complete.** All four tiers measured. COS-1 and COS-4 are the only remaining tasks and both change style files |

Two spend caveats still stand (see the tracker): turn-limit aborts record
`costUsd: 0`, and one killed `run --help` invocation under COS-5 left no artifact
at all. Both are excluded from the $20.65.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-1 dev`.
3. Read `backlog instructions task-execution`; mark COS-1 In Progress; record the plan.
4. Read `docs/stories/close-the-style-quality-gaps.md` FIRST — it is COS-1's
   owning story and it now carries the four-tier evidence plus a ruling the user
   owes you (below).
5. Author the new content by hand in the three style files. The two gaps are
   named in the story: how to report a session containing a dozen tool calls, and
   how to handle a decision where neither option is clearly right.
6. `node src/cli.mjs audit` must stay exit 0 — if the new prose states a cap, it
   has to match `contracts.json`, and the audit parses the prose to check.
7. The story also asks for new harness cases covering both scenarios. New cases
   change the pool; read what COS-2 did (session 3, tracker) before choosing
   splits — it wrote NEW cases rather than moving existing ones, because moving
   them shrinks train and holdout.
8. Measure. The bar is judge > 65% on `agentic-fix-verify` and
   `conv-decision-holdout`. Budget ~$15.
9. Gates: `npm --prefix harness test` 56/56; `audit` exit 0; `lore check` exit 0
   after `lore sync`; add any run to the experiment ledger.
10. Update `doc-1` on the branch (COS-1 → Resolved, cursor → COS-4, session log),
    commit with `Refs: COS-1`, review with `/code-review high`, push, PR into
    `dev`, rebase-merge, sync, promote `main`, prune.

## The bar, and the baseline problem behind it

**No user ruling is needed on which models COS-1 is scored against.** Its AC #4
names "opus and sonnet" explicitly, as does COS-4's AC #1. The two tiers added by
COS-5 and COS-7 do not move either bar. (The owning story said "on both models",
which four tiers made ambiguous; COS-7 reconciled the story to the task text
rather than widening anything.)

**The real problem is that neither target case has a current-text Opus or Sonnet
baseline. Verify this yourself before planning the budget.** AC #4 asks for judge
> 65% on `agentic-fix-verify` and `conv-decision-holdout`, on Opus and Sonnet.
Neither case is in the shared five, so neither appears in `12-44-03`. Every
Opus/Sonnet cell for both comes from `20-10-29` and `23-36-59` — runs that
predate the advanced style rewrite:

| case | run | opus judge | sonnet judge |
|---|---|---|---|
| `conv-decision-holdout` | `20-10-29` | 58.5 (n=2) | 45.0 (n=2) |
| `conv-decision-holdout` | `23-36-59` | 54.3 (n=4) | 43.3 (n=4) |
| `agentic-fix-verify` | both | 0 aborts, scores on superseded text | — |

So the "~48%" the task description quotes is a pooled figure on style text that
no longer ships, and it is **not** a number you can claim to have moved.
Current-text figures that do exist: Haiku 37.5 on `conv-decision-holdout`
(`22-59-53`), Fable 41.2 on `agentic-fix-verify` (`23-53-02`). Both are useful
context and neither is the baseline the AC names.

**Budget for measuring the before as well as the after.** Two cases × 3 styles ×
2 models × 2 repeats is 24 cells; at the measured Opus and Sonnet rates the
conversational one is cheap and the write-then-verify one is not. Do the
arithmetic from `harness/README.md`'s cost table before launching, and say which
run every published number comes from.

## Critical context / traps

- **The optimizer has already failed at this six times, and the reason is not
  wording.** `improve` re-expresses rules that exist; these two gaps are missing
  content. Do not open with an `improve` run. If you use the loop at all, use it
  *after* authoring the new rules, to polish — and expect the reserve guard.
- **A style-file change must keep `audit` at exit 0.** `contract-audit.mjs`
  parses each style file's stated caps out of its own prose and compares them
  against `contracts.json`. New prose that states a number the contract does not
  have will turn `npm test` red. Change the file first, the contract second.
- **Measurement is finished; do not re-open it.** All four tiers are done. If you
  need a baseline for a case, `node src/cli.mjs score --rows=results/<stamp>/rows.json`
  re-grades saved transcripts for free. Never re-run the loop to re-check a figure.
- **`sentence_length` and `paragraph_length` are NOT quotable on agentic cells,
  for any model.** New this session: `run.mjs` accumulates assistant text blocks
  with `text += b.text` and no separator, so on an agentic turn the pre-tool
  narration fuses to the post-tool answer — a saved transcript literally reads
  `"I'll look at the file first.The bug is in ..."`. `sentences()` needs
  whitespace after the full stop and `paragraphs()` needs a blank line, so the
  run-on scores as one long sentence in one paragraph. 0 of 131 tool-free cells,
  most tool-using ones. **COS-1 is entirely about multi-tool sessions**, so this
  bites harder here than anywhere: if you quote either rule on an agentic cell
  you are measuring the harness. `leads_with_conclusion`, `total_length` and
  abort counts are unaffected. It is raised in the tracker, not fixed.
- **The four-tier table cannot be reproduced from `12-44-03`'s stored
  `rulesScore`.** That run predates `contracts.json`'s change at 3370e4d and
  gives 93.8/90.2/95.0/91.7 where FINDINGS says 94.2/91.5/95.6/92.3. Re-score
  before concluding a published number is wrong. This is stated beside the table
  now, but it caught the reviewer and it will catch you.
- **`--models='claude-fable-5[1m]'` — quote it** (the `[1m]` is a zsh glob), and
  **always name `--variants`**: every axis you omit takes its full default, which
  is how this session's one-cell probe became a five-cell $1.58 one.
- **Fable is deliberately not in `matrix.json`'s `models`.** That list is
  `improve`'s default too. Leave it out.
- `results/` is gitignored. The experiment ledger is the durable record.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Re-deriving a number is not the same as checking the claim built on it.**
  This session's sharpest lesson, and it is new. Five previous sessions found
  prose numbers that were *wrong*; the review here found a number that was right
  with a bad inference on top: six paired comparisons on the same 15 units, three
  bolded significant, no multiplicity adjustment — and the units were 3 styles ×
  the *same* 5 cases, so they were not independent either. Under Bonferroni only
  one of the three survived. The fix was to stop leaning on inference: the point
  estimates alone answer the question, because two of three adjacent tier steps
  go the wrong way. **Prefer a claim that needs no statistics to one that needs
  correct statistics.**
- **Do not assert a superlative you have not searched for.** Two got through this
  session's own drafting: "the best beginner judge score ever measured" (two-cell
  optimizer samples reach 70–100) and "worst at the top of the range" (Haiku
  scores 0.0 on two cases). Both were replaced by four-way comparisons that are
  stronger than the superlatives were.
- **Do not claim a gate covers something without checking.** The notes said
  `matrix.json`'s parse was asserted by the existing suite. Nothing loaded that
  file — `npm test` would have stayed green on a config with a stray comma while
  every command died at load. Fixed rather than reworded, and proved by breaking
  the JSON on purpose (`harness/test/config.test.mjs`, 52 → 56).
- **Do not quote a mean as a per-cell fact.** "$0.9681 each" was the mean of six
  cells spanning $0.7970 to $1.1315.
- **When you change a headline result, grep for every document that states the
  old one.** Sixth session running that this found real defects — here
  `docs/index.md` (the bundle's landing page) and the quality-gaps story, which
  is the story COS-1 itself will read.
- **A correction is a claim too** (COS-5). Compute with `checks.mjs`'s own
  `words()`/`sentences()`, never a hand-rolled `split(/\s+/)`.
- Do not skip `lore sync` because the change looks code-only. All six sessions
  needed it purely from moving a task's status.
- Do not write a placeholder into the tracker intending to fill it in later.
  Write the merge SHA in the post-merge housekeeping commit.

## Raised, not done — needs the user's call before anyone starts them

Five items now, all in the tracker with full detail. Two are newly relevant to
COS-1 and COS-4 specifically:

- **The `sentences()`/`paragraphs()` text-block seam** (new this session). The
  biggest of the three scorer defects, and the one that touches COS-1's subject
  matter directly. Fixing it moves agentic numbers already published.
- **`matrix.improve` inherits `run`'s model list** (new this session, from the
  review). Any model added to `matrix.models` is billed on every optimizer
  iteration of the invocation `harness/README.md` documents. Giving `improve` its
  own `models` key removes the footgun instead of documenting it — and would make
  the top tier safe to add.

The other three, unchanged: **COS-9** (`two_options_max` blind to prose option
sprawl), **`run` not flushing rows incrementally** (a killed run loses every paid
cell — this session ran $12.84 of `run` with that exposure live), and **the audit
comparing numbers, not conditions**.

## What COS-7 settled, worth saying out loud

The epic's central claim is now verified across the whole model range: one style
file per audience level serves four tiers spanning a **tenfold cost range**, with
rule compliance 90.9–97.9 everywhere and the same four rules the only ones any
tier drops. Prose quality is what a tier changes, and the styles' weaknesses are
not model weaknesses — the most capable tier available scores **16.7** on
`leads_with_conclusion` for agentic work, level with the cheapest, and **53.9**
on beginner prose against a 70% bar.

That is the argument COS-1 and COS-4 inherit: **the remaining gaps are content
gaps in the style files, and no model closes them.** It is now measured rather
than asserted, which is exactly what those two tasks need to justify hand-written
new rules over another optimizer run.
