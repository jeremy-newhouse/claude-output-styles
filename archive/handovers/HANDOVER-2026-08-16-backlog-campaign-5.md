# Handover — measure the styles on Haiku (COS-5), campaign 4/8 done

**Date**: 2026-08-16 | **Grounded against**: `dev` @ `092f3b4`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `092f3b4` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-5 — measure all three styles on Haiku, fold Haiku into
FINDINGS.md's per-model comparison, and record any Haiku-specific failure mode
or state its absence. Queue order confirmed by user on 2026-08-16 (COS-6 ✓,
COS-3 ✓, COS-2 ✓, COS-8 ✓, then COS-5, COS-7, COS-1, COS-4); do not re-ask.
Risk policy: record-and-park.

COS-5 is a pure measurement task — all three ACs are objectively checkable and
none needs a design decision. Budget ~$5. A Haiku cell measured $0.022 this
session (8 cells, $0.1788), so the full 3 styles x 13 cases x 2 repeats = 78
cells lands near $1.7 plus judge. That is comfortably inside budget: run the
FULL case pool rather than filtering, so the numbers are comparable with the
13-case era rather than the retired 9-case one.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to
harness/src/checks.mjs needs a matching case in harness/test/checks.test.mjs,
and any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.

You already have real Haiku data from this session — see "Free head start".
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `092f3b4`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `092f3b4` |
| Cursor issue | COS-5 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-5, 4 resolved, 4 queued |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#5 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–4 (`-4.md` is this session's predecessor) |
| Campaign progress | 4 of 8 resolved. Next is session 5 |
| Spend so far | $4.05 total ($0.75 s2, $1.18 s3, $2.42 s4) |
| Raised but NOT queued | COS-9 (`two_options_max` blind to prose option sprawl); the `sentences()` newline artifact (below); the `code_block_size` conditional-rule gap (below) |
| Test suite | 47/47 (`npm --prefix harness test`) |
| New this session | `node src/cli.mjs audit` — style file vs contract, exit 1 on disagreement |

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-5 dev`.
3. Read `backlog instructions task-execution`; mark COS-5 In Progress; record the plan.
4. Run the full pool on Haiku:
   `node src/cli.mjs run --styles=plain-english-beginner,plain-english-intermediate,plain-english-advanced --models=haiku --variants=baseline --repeats=2`
   78 cells, roughly $1.7–2.5 with judge. Do NOT filter cases — AC #1 says "the
   standard case set", and the pool is 13.
5. AC #2 wants Haiku *alongside* opus and sonnet in FINDINGS.md. The comparable
   opus/sonnet numbers come from `12-44-03`, which used **5 cases**, not 13. Either
   re-run opus/sonnet on the full pool (expensive, ~$10) or state the case-count
   difference explicitly in the table. **Say which you did** — the ledger's own
   rule is that a figure carries its case count.
6. AC #3: a Haiku-specific failure mode, or an explicit statement that none was
   found. See the head start below — you already have one candidate signal.
7. Gates: `npm --prefix harness test` 47/47; `node src/cli.mjs audit` exit 0;
   `lore check` exit 0 after `lore sync`; every number from a run in the session.
8. Update `doc-1` on the branch (COS-5 → Resolved, cursor → COS-7, session log),
   commit with `Refs: COS-5`, review with `/code-review high`, push, PR into `dev`,
   rebase-merge, sync, promote `main`, prune.

## Free head start — Haiku data already measured

`results/2026-08-16T22-18-53-074Z/` holds 8 real Haiku cells on beginner
(4 cases, baseline variant, judge on). Re-score it for free with
`node src/cli.mjs score --rows=results/2026-08-16T22-18-53-074Z/rows.json`.
It is beginner-only and half of it used a non-shipped 12-word variant, so it is
**not** an AC #1 answer — but it is a free look at Haiku's shape:

- **Haiku writes markedly longer sentences than Opus or Sonnet.** Mean 16.6 words
  on the shipped beginner file, against 12.3 on Opus/Sonnet at `12-44-03`.
  30% of its sentences exceed the 20-word cap, versus 15% on the larger models.
  This is the strongest AC #3 candidate: the sentence cap binds on Haiku and
  does not bind on the other two.
- Haiku also missed `three_question_structure` outright on one case (score 0.0,
  missing beats 1 and 2) and produced a 226-word reply against an 80-word cap.

## Critical context / traps

- **A cap only bites where it binds — this session's central finding.** Haiku
  writes 16.6-word sentences and visibly obeyed a tightened 12-word cap; Opus and
  Sonnet already write 11–12 words and ignored the same change entirely. Expect
  Haiku to differ from the larger models on *length* rules specifically, and do
  not assume a rule that looks satisfied on Opus is carrying its weight.
- **Do not conclude from a cheap-model probe.** That is the mistake this session
  made and caught: a $0.18 Haiku probe pointed the opposite way from a $2.24
  validation on the target models. COS-5 is the inverse situation — Haiku IS the
  subject here, so its numbers are the answer, not a proxy.
- **The case pool is 13, not 9, and `12-44-03` used 5.** Any cross-model table
  must say which count each column used.
- **`node src/cli.mjs audit` is now a gate.** If you touch a style file or
  `contracts.json`, the prose and the numbers must agree or `npm test` goes red.
  Recognised phrasings are listed in `harness/README.md`.
- **The audit fires after adopting an optimizer candidate.** The rewriter is told
  to delete instructions the measurements show are already satisfied, and
  `sentence_length` sits near 1.0 — so a candidate that drops "Keep sentences
  under 20 words" is normal output, and adopting it breaks the audit. The
  runbook's adopt step now says so and says which side to fix. Not COS-5's
  problem unless you run `improve`.
- Re-scoring saved rows is free:
  `node src/cli.mjs score --rows=results/<stamp>/rows.json`. Never re-run the
  loop to re-check a figure.
- `results/` is gitignored. The experiment ledger is the durable record — add
  COS-5's run to it.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Four sessions running, the only defect no automated gate caught was a
  plausible number in prose.** This session's was the worst kind: the spec set up
  "share of sentences over 12 words" as its metric, then quoted Haiku's
  over-*twenty*-word rate against it. Every test passed. Re-read your own numbers
  against the metric the sentence before them declares.
- Do not paste a rendered sample you assembled from two runs. This session's
  README sample paired an `ok` line from one invocation with a `FAIL` line from
  another; the review caught that it contradicted the paragraph introducing it.
  Reproduce the exact scenario and paste what it actually printed.
- Do not skip `lore sync` because the change looks code-only. All four sessions
  needed it purely from moving a task's status.
- Do not write a placeholder into the tracker intending to fill it in later.
  Session 1 committed a literal `<PR_SHA>`. Write the merge SHA in the
  post-merge housekeeping commit, which is what sessions 3 and 4 did.
- Do not let a diagnostic command die on the condition it diagnoses. `audit`
  originally threw a raw ENOENT when a `styleFile` path was wrong — the exact
  drift it exists to report. Review finding; fixed.

## Raised, not done — needs the user's call before anyone starts them

- **COS-9**: `two_options_max` counts only literal option labels, so it cannot
  see prose option sprawl. From session 3's review.
- **`sentences()` merges a list header into its first item.** It does not split on
  a single newline, so "Here's why:\nYou're paying twice." scores as one long
  sentence. Measured at 9 of 74 over-cap sentences (12.2%), worth 1.2–1.6 points
  of over-20w rate. Too small to have changed any COS-8 conclusion, but it
  inflates every `sentence_length` figure in the project, and **it will matter
  more on Haiku**, whose replies are longer and more list-heavy. Fixing it moves
  numbers already published in `docs/` and `FINDINGS.md` — the COS-9 shape.
- **The audit compares numbers, not conditions.** Beginner's file says "never show
  code *unless they ask*"; `maxCodeLines: 0` cannot express the condition, and
  `code_block_size` scores 0 for any block regardless of whether the user asked.
  So beginner can follow its own style file and take the heaviest single penalty
  in its contract while `audit` reports agreement. Documented in
  `harness/README.md` as a limit of the instrument rather than fixed.

## Worth knowing: how COS-8 actually resolved

The user was asked to ratify tightening beginner's sentence cap, and the question
carried its own revert condition — "validate on both models and only keep it if
it holds up". It did not hold up, so reverting *executed* their decision instead
of overriding it, with no second round trip. Reuse that shape when a ratification
depends on a measurement you have not taken yet.

The other reusable piece is the paired design: registering the pre-change style
file as a temporary contract entry and running old and new in the *same*
invocation removed model, case and date as confounds. That is what let 24 cells
exclude an effect the probe had predicted at −4.3 words. Remove the temporary
entry afterwards and verify with `git status` — the audit will also flag it if a
temp entry's file and numbers ever disagree.
