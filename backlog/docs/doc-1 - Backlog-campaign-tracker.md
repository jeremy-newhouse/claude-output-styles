---
id: doc-1
title: Backlog campaign tracker
type: other
created_date: '2026-08-16 13:49'
updated_date: '2026-08-17 01:38'
---
# Backlog campaign tracker

One issue per session. Protocol: restore → take the cursor issue → feature-branch
lifecycle → advance cursor → append session log → write handover.

Default branch is `dev`; every issue merges there and `dev` is then
fast-forwarded into `main`. A session is not finished until both are pushed.

## Cursor

**Next issue: COS-4** — queue order confirmed by the user on 2026-08-16, who
chose the "Safety-first" option from a presented comparison: "COS-6 → COS-3 →
COS-2 → COS-8 → COS-5 → COS-7 → COS-1 → COS-4. Free doc task proves the loop,
then harness plumbing, then the caps guard, then measurement, then the two hard
style tasks last — after COS-2 has built the reserve split they need for honest
validation."

COS-1 was taken in session 7 and did **not** reach its bar. Under the risk
policy below it is parked in "Not queued" rather than resolved, and the cursor
advances past it to COS-4, the last item in the confirmed order.

Do not re-ask before taking the next item.

## Queue (confirmed order)

| # | Issue | Type | One-line note |
|---|---|---|---|
| 8 | COS-4 | styles | Beginner prose. Judge bar 70%, currently 45.9/48.4. Hardest. ~$20. |

Not queued yet: **COS-9** (raised session 3) and two harness defects raised in
sessions 5 and 6 — see "Raised, not queued" below. Deliberately left out of the
confirmed order, which is the user's to change.

Estimated remaining: ~$20, for COS-4 alone. Spent so far: **$34.31** — COS-6
nothing, COS-3 $0.7500, COS-2 $1.1800, COS-8 $2.4152, COS-5 $1.8770, COS-7
$14.4290 (the most expensive session, and the last measurement task), COS-1
$13.6567 against a ~$15 budget.

Note for anyone reconciling this against an earlier version: the pre-COS-7 total
was recorded here and in session 5's handover as $5.93, but the five per-session
figures those documents themselves state sum to **$6.2222**. The parts are the
evidence — each is quoted in its own Resolved row from that session's runs — so
the sum has been corrected rather than the parts. The $5.93 appears to have been
carried forward without re-adding.

Two spend caveats recorded under COS-5. Cells that abort on the turn limit carry
`costUsd: 0`, so `22-59-53`'s six failed cells burned tokens no row records. And
one aborted invocation — `node src/cli.mjs run --help`, which the CLI then
treated as `run` — ran about two minutes at concurrency 4 across the full matrix
before being killed. It wrote no `rows.json`, so its spend is real, unquantified,
and excluded. A third, smaller one under COS-7: a model-id probe that omitted
`--variants` ran five cells instead of one, $1.58 instead of ~$0.19. That spend
IS counted above.

## Resolved

| # | Issue | Status/date/session | Evidence summary |
|---|---|---|---|
| 1 | COS-6 | Task Done — 2026-08-16, session 1 | README-only. All 3 ACs checked against quoted README lines: name resolution from frontmatter `name:` with filename fallback, a "Confirm it loaded" section giving the behavioural check and the canary, and the silent-fallback statement. Scripted checks: all three frontmatter names appear verbatim in the README (3/3); both new doc links resolve. `npm --prefix harness test` 11/11; `lore check` 0 errors after `lore sync`. Review found 3 issues, all fixed on the branch. Merged as `0631c04`. |
| 2 | COS-3 | Task Done — 2026-08-16, session 2 | All 3 ACs proved against a real improve run on the reviewed code, `results/2026-08-16T15-04-22-436Z/` (beginner, Haiku, 2 cases, 1 iteration, 4 cells, $0.0919), after an earlier 18-cell run at `14-48-09` ($0.6097) established the same three identities on the first implementation. AC #1: all four per-iteration transcript files present including the reverted v1, and `rows.json` groups 1/1/1/1 across v0 and v1. AC #2: rows sum = `summary.json` totalCostUsd = `improve.json` spentUsd = 0.0919, the counter deleted in favour of `spendOf(rows)`. AC #3: `score --rows` reproduced the loop's logged 0.8 / 0.9 / 0.669 / 0.85 exactly, exit 0 with the API pointed at a dead socket and no new results directory; no-arg `score` finds an improve run unaided. Plain-run path unchanged (12-44-03 still 81.0% at $7.517). `npm --prefix harness test` 23/23 (12 new); `lore check` 0 errors. `/code-review high` found five issues, all real and all fixed on the branch. Merged as `1daff4d`. |
| 3 | COS-2 | Task Done — 2026-08-16, session 3 | All 4 ACs proved on real improve runs against the committed code, not unit tests alone. Six paid runs, $1.18 total against a ~$3 budget. The decisive one is `results/2026-08-16T20-57-54-086Z/` (beginner, Haiku, 1 train + 1 holdout + 2 reserve, 3 iterations, 12 cells, $0.30): the real optimizer produced a candidate that won train and beat holdout by 29.5 points (0.644 -> 0.99), and was **17.7 points worse on the reserve** (0.623 vs 0.800). The guard rejected it and rolled back — `best.md` came out byte-identical to the shipped `plain-english-beginner.md` (`diff -q`), with the rejected rewrite preserved at `v2.md`. Offline re-scoring shows the ADR's signature exactly: reserve rules flat 92.6 -> 89.6, judge collapsed 67.5 -> 35.0. AC #1 checked by scripted search of persisted rows — 0 reserve case ids in any train or holdout row, reserve files written for v0 and the winner only. AC #2's accept path proved in `20-50-12` (v1 0.582 vs v0 0.591, -0.009, ACCEPT); the no-adoption skip path in `20-47-28` and `20-55-37`. Case pool 9 -> 13 (5/4/4), new cases rather than carved out. `npm --prefix harness test` 34/34 (11 new); `lore check` 0 errors. `/code-review high` found six issues, all real: five fixed on the branch — including a config footgun where a missing `minReserveDelta` would have silently rolled back every run — and the sixth raised as COS-9. Merged via PR #4 (rebase) as `2d4bcb4`. |
| 4 | COS-8 | Task Done — 2026-08-16, session 4 | All 4 ACs verified; the caps question was settled by trying the change and measuring it, not by argument. AC #4 first and free: new `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`, exposed as `node src/cli.mjs audit` (exit 1 on disagreement) and 11 test cases; suite 34 -> 45. Proved by re-creating the divergence that actually shipped (contracts back to beginner 15/3, intermediate 18): 3 FAILs, CLI exit 1, `npm test` 43/45. AC #1: measured `results/2026-08-16T12-44-03-883Z/` — all three levels already write the same sentence length (beginner 12.3, intermediate 12.4, advanced 11.5 words), so the lower levels are not being served shorter sentences today; paragraph caps settled offline for free as inert (1.4-1.8 sentences against a cap of 4; re-scoring at cap 3 moves the check 0.000-0.017). A $0.18 Haiku probe (`22-18-53`) said a 12-word cap works — 16.6 -> 12.3 words, over-cap 30% -> 11% — and the user ratified tightening on it, conditional on both-model validation. AC #3 killed it: paired opus+sonnet run over 6 cases spanning all three splits (`22-27-15`, 24 cells, $2.24) moved mean sentence length **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter, judge 0.557 -> 0.532, reply length 105 -> 114. Reverted; `git status` clean on both files. AC #2 is checked but vacuous — nothing shipped tightened; the mechanism was exercised (file first, contracts second, audit caught the in-flight mismatch) before the revert. `/code-review high` found seven issues, all real and all fixed on the branch — including a fourth-consecutive-session prose-number defect (the spec quoted Haiku's over-20-word rate against an over-12-word metric) and the guard not being wired into the optimizer runbook's adopt step, where it would predictably have turned `npm test` red on a legitimately-won rewrite. Suite 34 -> 47. Total spend $2.4152 against ~$8. Merged via PR #5 (rebase) as `ac1a161`. |
| 5 | COS-5 | Task Done — 2026-08-16, session 5 | All 3 ACs verified against `results/2026-08-16T22-59-53-852Z` (3 styles x haiku x baseline x **13 cases** x 2 repeats = 78 cells, $1.8770). AC #1 ran the full pool, not the 5 cases the old baseline used. AC #2 was satisfied **without re-running opus/sonnet** (~$19.5 at 12-44-03's measured $0.1253/cell, against a ~$5 budget): the new haiku rows were sliced to the same 5 case ids `12-44-03` used, after verifying in git that those 5 case definitions are byte-identical across 444b221/8a76f13/49fd1fa/HEAD and that the style files, `checks.mjs` and `contracts.json` are unchanged between the runs; re-scoring `12-44-03` offline reproduced its 12 published FINDINGS figures to the tenth of a point. Zero errored cells in that slice on any model. Result: rules survive the drop to the cheapest tier (haiku 90.9–96.0, never more than 1.8 points behind the better of opus/sonnet, and ahead of opus on intermediate); judge does not (37.5–62.2, last on all three styles) — which also closed the one-style-file ADR's open item that the cheap tier was untested. AC #3's failure mode is **turn-limit exhaustion, not wording**: 6 of 78 cells returned no reply at all, every one a 12-turn abort on a case that edits a file then runs tests. Like-for-like on `agentic-fix-verify`, the one such case all three models have run: haiku 5 aborts in 6 cells, opus 0 in 6, sonnet 0 in 6. It hit all three styles, so no rewrite fixes it. Because an empty reply scores 0.0 on every rule, pooling those cells understates haiku's rule compliance ~10 points — FINDINGS.md now reports "replies only" and "counting no-reply as 0" separately. **The predicted failure mode was refuted**: measured with `checks.mjs`'s own `words()`, haiku averages 11.8w on the shared 5 and 12.0w on the full pool, and **sonnet** is the long-sentence model at 13.5w. The probe's arms re-derive exactly, but its 16.6 is not haiku's baseline — the same configuration measures 12.1w at 8 cells and 12.2w at 25. Decisively, the probe's case was a 12-word cap cutting the over-12 share 60.0% → 40.5%; haiku's *untightened* share is 38.4–43.0%, so 40.5% sits inside its own range. Stated as "the evidence for an effect is gone", not "there is no effect", since the tightened arm is also n=4. COS-8's revert stands and is strengthened; its mechanism is corrected in the ledger, the audience-level spec and `harness/README.md`. Also fixed rather than only documented: `run --help` launched the full paid matrix (new `src/usage.mjs` guard, unknown command now exits 2). `npm test` 47 → 52; `audit` exit 0; `lore check` exit 0. `/code-review high` raised 10 findings, all real and all addressed. Merged via PR #6 (rebase) as `14d72ea`. |
| 6 | COS-7 | Task Done — 2026-08-16, session 6 | All 4 ACs verified. Three paid runs, **$14.4290** against a ~$20 budget — the campaign's most expensive session and its last measurement task. `23-47-08` (5 cells, $1.58) confirmed the SDK accepts `claude-fable-5[1m]` before the matrix launched. `23-48-45` (30 cells, $7.04, **0 errors**) is the Fable baseline on the same five case ids, style text, scorer and variant as `12-44-03`. `23-53-02` (6 cells, $5.81, 0 errors) added `agentic-fix-verify`, the one case that discriminated the tiers. Reuse of `12-44-03`/`22-59-53` as the other three columns was re-verified, not assumed: the five case definitions are byte-identical across 444b221/3370e4d/8a76f13/49fd1fa/HEAD, `checks.mjs` and all three style files are byte-identical 444b221→HEAD, and because `contracts.json` did change once (3370e4d, after `12-44-03`) the question was settled by re-scoring both runs offline — all twelve published figures reproduced exactly. **AC #1**: advanced 97.9/78.3, intermediate 93.1/67.7, beginner 91.4/53.9. The top tier does not sweep — last of four on intermediate rules, behind Sonnet on intermediate judge. **AC #2**: FINDINGS.md's per-model table, the epic snapshot and the story's coverage table all carry four columns. **AC #3 — word-cap overrun does not track tier.** Mean reply words ÷ that style's own cap, counted with `checks.mjs`'s own `words()`: Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300; in tier order the sequence turns twice. Paired over the 15 (style × case) cells, the cheapest model overruns significantly MORE than the second cheapest (+0.127, 95% CI [+0.034, +0.219]) and the top two tiers are indistinguishable (+0.070, CI [−0.118, +0.259]). Sonnet is the outlier that keeps to the cap; there is no gradient. The doc's "roughly twice as often" is from a run whose style text has since been replaced — on the shipped files it is 1.44×. **AC #4 — one-file decision confirmed** at the top of the range: Fable drops the same rule subsets the others do, never more than 2.5 points behind the best of the other three, the eight rules it does not drop scoring 96.7–100.0 on all four tiers at once. One ADR overstatement corrected while confirming it (the ranking is identical for rules, but the judge's top two swap: Haiku/Sonnet rank intermediate above advanced, Opus/Fable the reverse — already present in the three-model data). Beyond the ACs: Fable aborts **0 of 6** on `agentic-fix-verify` where Haiku aborts 5 of 6, at $0.9681/cell, but its own compliance falls 94.1/66.6 → 79.5/41.2 there with `leads_with_conclusion` at 16.7 — on `agentic-read-report`, the one agentic case all four tiers ran under the current style text, `leads_with_conclusion` is sonnet 100.0, opus 50.0, haiku 16.7, **fable 16.7** — the top tier level with the cheapest and both far behind the middle two, which makes pre-tool narration a Claude Code habit rather than an Opus trait. Reading those transcripts found a harness defect, raised not patched (see below). Fable deliberately kept OUT of `matrix.json`'s `models`, which is `improve`'s default too. `npm test` **52 → 56** (new `harness/test/config.test.mjs`); `audit` exit 0; `lore check` exit 0. `/code-review high` raised 9 findings, all real and all addressed — the serious one being statistical over-claiming in my own word-cap section, where six paired comparisons on the same 15 units were run without multiplicity adjustment and three bolded as significant; under Bonferroni only one survives, and the units are 3 styles x the SAME 5 cases so the intervals were too narrow besides. The section was rewritten to rest on the point estimates instead, which need no inference and give the same answer. Merged via PR #7 (rebase) as `0747cc8`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. |

## Not queued — needs a human / blocked

- **COS-1** (session 7). ACs #1-#3 met and merged; **AC #4 not met and parked
  under the risk policy.** Two authoring passes were measured against a bar of
  judge > 65% on `agentic-fix-verify` and `conv-decision-holdout`, on Opus and
  Sonnet. Pass 1 ships: 46.2 / 42.0 / 51.2 / 54.7 (run `00-48-49`) against a
  first-ever current-text baseline of 50.0 / 40.0 / 48.3 / 46.7 (`00-44-03`).
  Pass 2 was more forceful and scored *below the original text* — arm mean judge
  43.6 against the baseline's 46.2 — and was reverted in full (`01-03-21`).

  Two things have to change before AC #4 is attemptable again, and neither is a
  style-file edit. **The agentic half is not measurable as written**: the judge
  is handed the whole turn rather than the final message, so
  `agentic-fix-verify`'s judge score is not a measure of the style file. That is
  the text-block seam already raised in session 6, now known to reach the judge
  and not only the two segmentation checks. **The conversational half is a
  length problem**, which is COS-4's subject — 70.8-82.6% of cells overrun their
  style's word cap in every arm, before and after (9/12, 17/24, 19/23), and no
  rule this task added touched that.

  Sequencing follows from that: COS-4 first, the seam fix before any retry of
  AC #4. Do not re-open COS-1 with an `improve` run — the rules now exist and
  the loop still has nothing to add, because what fails is length and an
  instrument defect, neither of which the optimizer can see.

## Raised, not queued — needs the user's call

- **COS-9** (session 3): `two_options_max` counts only literal option labels, so
  it cannot see prose option sprawl.
- **`run` does not flush rows incrementally** (session 5). `improve` persists
  after every style; `run` writes `rows.json` only after the entire matrix
  completes, so a killed or crashed run loses every cell it already paid for.
  Session 6 ran $12.84 of `run` invocations with this exposure live.
- **Assistant text blocks are concatenated with no separator** (session 6, new,
  and the largest of the three). `run.mjs` does `text += b.text`, so on an
  agentic turn the pre-tool narration is glued to the post-tool answer:
  `"I'll look at the file first.The bug is in ..."`. `sentences()` needs
  whitespace after the full stop and `paragraphs()` needs a blank line, so the
  run-on scores as one long sentence in one paragraph. Present in **0 of 131
  conversational cells** and most agentic ones (Opus 3/6, Sonnet 1/7, Haiku
  10/12, Fable 5/6, and 6/6 on Fable's `agentic-fix-verify`, where
  `paragraph_length` reads 16.7 and is measuring the harness). The four-tier
  baseline table is unaffected in practice and no affected figure was published,
  but `sentence_length` and `paragraph_length` are currently unquotable on
  agentic cells for every model. Fixing it moves agentic numbers already in
  `docs/` and `FINDINGS.md`. **Session 7 widened this and raised its priority:
  the judge reads the same concatenated text**, so every agentic judge score in
  the project is measured on the whole turn rather than the final message. In 16
  of 18 `agentic-fix-verify` cells the reply carries pre-update narration, and in
  all 16 a judge violation quotes it. This is now a blocker on COS-1's AC #4, not
  only a caveat on two checks — though it is not the whole story either, since 10
  of those 18 final updates are over the word cap on their own.
- **An errored cell scores 0 on rules and 1.0 on the judge** (session 7, new).
  `evaluate.mjs` skips the judge on an errored row and substitutes
  `{ score: 1 }`, so a cell that returned no text contributes a free 100% to
  every judge mean. The rules half is documented from COS-5; the judge half is
  the opposite bias, is not documented, and the two do not cancel. One turn-limit
  abort in `01-03-21` moved that run's `agentic-fix-verify`-on-Opus judge from
  33.0 to **44.2**. **Partly fixed in session 7, because COS-1 made it worse
  first**: adding a second agentic case to `reserve` put the most abort-prone
  case type inside `improve`'s adoption gate, where each one-sided abort moved
  the delta ~0.01 against a `minReserveDelta` of -0.02. The gate now compares
  only cases that produced a reply on both sides, names what it dropped, and
  rejects rather than adopting when nothing is comparable. The wider bias in
  `summarize()` — every judge mean anyone quotes — is untouched and still needs
  the user's call. Until then, filter on `!row.error` before quoting.
- **The agentic fixture contradicts itself** (session 7, from the branch review).
  `harness/fixtures/repo/test/pricing.test.mjs` asserts `applyDiscount(999, 15)`
  is 850 while its own comment computes 849. A model that correctly replaces
  `Math.floor` with rounding breaks a currently-passing test and has to decide
  unaided whether to edit the assertion, which is scoring noise on every agentic
  case — including the two now on the reserve gate. Pre-existing; fixing it moves
  published agentic numbers, so it is raised rather than patched.
- **`sentences()` merges a list header into its first item** (session 4). It does
  not split on a single newline, so "Here's why:\nYou're paying twice." scores as
  one long sentence. Measured at 12.2% of over-cap sentences. Fixing it also
  moves published numbers. Note this and the seam above are the same subsystem
  and would sensibly be one task.
- **`improve` inherits `run`'s model list** (session 6, from the branch review).
  `matrix.models` is the default for both, and `harness/README.md`'s own
  quick-start line is `improve --styles=… --iterations=4` with no `--models`, so
  any model added to that list is billed on every optimizer iteration of the
  documented invocation. COS-7 kept Fable out for exactly this reason, which
  documents the footgun rather than removing it. Giving `matrix.improve` its own
  `models` key would remove it. Small, and it makes the top tier safe to add.
- **The audit compares numbers, not conditions** (session 4). Beginner's file
  says "never show code *unless they ask*"; `maxCodeLines: 0` cannot express the
  condition. Documented in `harness/README.md` as a limit of the instrument.

## Risk policy (confirmed by the user on 2026-08-16)

"Record and park." If COS-4 or COS-1 cannot reach its measured judge-score bar,
the session records every attempt and the scores actually reached in the task
notes, moves the issue to "Not queued" with that evidence as the reason, advances
the cursor, and continues. Nothing merges that does not meet its acceptance
criteria, and no session stalls waiting for a human.

Both remaining issues carry known risk against that policy:

- **COS-4** asks beginner's judge score to exceed 70%. The best figure in the
  per-model baseline is **53.9, on Fable** (session 6) — the other three tiers sit
  at 37.5–48.4. Six optimizer rewrites have already failed at exactly this, so
  achievability is unproven even though the criterion is objectively testable.
  Session 6 also sharpened why it is hard: the most capable tier available does
  not write better beginner prose from this file, so the gap is a content problem
  and not a model one.
- **No ruling is needed on which models the bars apply to, despite the owning
  story's looser phrasing.** COS-1's AC #4 and COS-4's AC #1 both name "opus and
  sonnet" explicitly, so the two tiers added by COS-5 and COS-7 do not move
  either bar — beginner climbs to 70% from 45.9 and 48.4, not from Haiku's 37.5.
  The story said "on both models", written when two tiers were measured; COS-7
  reconciled it to say what the tasks say rather than widening anything.
- **COS-1** asks multi-tool sessions and open-ended decisions to reach 65%.
  Session 6 supplies the sharpest evidence yet on the first half: on
  `agentic-fix-verify` even the top tier scores judge 41.2, and
  `leads_with_conclusion` 16.7 — worse than any other model on any case. The gap
  is not a cheap-model gap.

## Session log

- 2026-08-16 — session 0 (init): inventoried COS-1 through COS-8, all eight
  classified agent-resolvable. Queue order and risk policy confirmed with the
  user. Tracker created as doc-1. `.claude/handovers/` gitignored and
  `archive/handovers/` created during skill adoption (aed40a2). Cursor armed at
  COS-6.
- 2026-08-16 — session 1: resolved COS-6 on `feature/COS-6`. No drift found at
  restore: `dev`, `main`, and both remotes were all level at 80bc691, no leftover
  branches, no open PRs. Rewrote README.md's Install section and added "How the
  style name resolves", "Confirm it loaded", and "Going deeper". Facts were
  lifted from the existing mechanics reference and install runbook rather than
  re-derived — no probing, no harness run, no cost. `lore sync` was needed after
  all: moving COS-6's status put the story's managed task block into drift, and
  `lore check` failed until it was reconciled (it also auto-commits the touched
  `backlog/` file — expect that commit on the branch). Cursor advanced to COS-3.
  `/code-review high` raised three issues, all real and all fixed before the PR:
  a `<PR_SHA>` placeholder committed into this tracker's resolved row; `/config`
  described as if it set the style globally when it writes a project-scoped
  `.claude/settings.local.json`; and the README's own level headings using an em
  dash where the literal style names use an ASCII hyphen — copying a heading
  would have produced exactly the silent Default fallback the section warns
  about. Worth carrying forward: reviewing docs against the failure they claim to
  prevent caught two traps that every automated gate passed.
  Merged via PR #1 (rebase) as `0631c04`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.
- 2026-08-16 — session 2: resolved COS-3 on `feature/COS-3`. No drift at restore:
  `dev`, `main`, and both remotes level at 325d2b0, no leftover branches, PR #1
  merged and pruned. The design question the handover flagged — where improve
  rows should live — resolved in favour of writing them at
  `results/<stamp>/rows.json`, the exact path `score`'s `newestRows()` already
  globs, so `score` needed no change at all to satisfy AC #3. Rows carry an
  `iteration` tag; reverted iterations are persisted too. `spentUsd` deleted in
  favour of summing the rows. `improveStyle` gained three optional parameters —
  `rows` (a caller-supplied sink), `onRows` (flush callback) and `deps`
  ({ evaluate, rewrite }) — so the persistence could be unit-tested without
  spend and could survive a crash; 12 new cases in `harness/test/improve.test.mjs`.
  `/code-review high` found five issues, all real and all fixed before the PR.
  The serious one is worth carrying forward: writing an improve run's
  `summary.json` and `report.md` at the same paths and shapes a plain `run` uses
  made the loop's pooled mean — baseline plus every rejected candidate — look
  like a style's score, and the first evidence run's report headlined 63.0% for a
  style whose real measured figure was 65.4/71.6. That is the same class of trap
  as session 1's: a number that every automated gate passes and only a reader
  catches. Fixed by labelling rather than by hiding the file. Also found: a
  by-iteration table that averaged two styles' traces together, no spend recorded
  for a style that crashed, and rows flushed only between styles. Two smaller
  lessons: the `npm test` script named `checks.test.mjs` explicitly and would
  have silently skipped the new file (now globs `test/*.test.mjs`), and three
  docs asserted "improve persists no rows" as standing fact — found by grepping
  the docs for what the change made false, not by any gate. Left for the user to
  rule on: a pre-existing comment/code disagreement at `harness/src/improve.mjs`
  about whether a reverted iteration briefs from the failed attempt or the
  incumbent — the code does the latter, the comment claims the former. Total
  spend this session $0.75 across three proving runs. Merged via PR #2 (rebase) as
  `1daff4d`; `dev` and `main` both pushed at that SHA, no branch litter, no open
  PRs. Cursor advanced to COS-2.
- 2026-08-16 — session 3: resolved COS-2 on `feature/COS-2`. No drift at restore: `dev`, `main` and both remotes level at cdfd153, no leftover branches, PR #1/#2/#3 all merged and pruned.

  The design call the handover flagged — where the reserve cases come from — went against the handover's own suggestion. It proposed reusing the four cases from the historical never-seen run, but those four are now IN train and holdout, so moving them would have cut train 5 -> 3 and holdout 4 -> 2 and shrunk the signal the loop depends on. Wrote four NEW cases instead, chosen as shapes no split contains, because the ADR's finding is that candidates overfit to case SHAPE rather than wording. Pool is 13 (5/4/4).

  Two decisions worth carrying forward. First, a reserve rejection is a ROLLBACK, not an annotation: `best.md` is documented as the winner and is the file a reader diffs and copies, so on rejection it holds the incumbent and the rejected rewrite stays at `v<N>.md`. Second, the verdict line was extracted from `cli.mjs` into `report.mjs` as `renderVerdict()` — AC #3 says a regressing candidate must be REPORTED as rejected, and leaving that in a `console.log` would have made the criterion unverifiable except by eye.

  The evidence took six runs because adoption is stochastic: the reserve pass only fires when the loop actually keeps a rewrite, and three of the six runs reverted everything. That is worth knowing before budgeting a session that needs an adopting run — expect roughly one in two, and prefer a low-scoring style with headroom.

  `/code-review high` found six issues, all real. The one worth remembering is the config footgun: `cfg.minReserveDelta` had no fallback, so a `matrix.json` naming a reserve split but omitting the threshold would evaluate `delta >= undefined` — false for every candidate — and silently roll back every run while logging an ordinary-looking REJECT. Also found: a new case whose judge rewarded exactly what one of its own deterministic checks scored 0 for (`leads_with_conclusion` vs a compliance reply opening "I'll…"), and README advice to compare splits in `BY SPLIT`, which on an improve run pools every iteration and so compares different version mixes. The sixth is COS-9: `two_options_max` counts only literal option labels, so it cannot see prose option sprawl — fixing it moves scores already quoted in `docs/` and `FINDINGS.md`, so it is its own task rather than scope creep here.

  Caught before the review returned, by re-reading my own runbook edit: the rejection example printed the rejected candidate's train and holdout on the REJECTED headline, when the code rolls `best` back before rendering and so prints v0's. Third session running that the only defect no automated gate caught was a plausible number in prose. Total spend this session $1.18. Merged via PR #4 (rebase) as `2d4bcb4`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-8.
- 2026-08-16 — session 4: resolved COS-8 on `feature/COS-8`. No drift at restore: `dev`, `main` and both remotes level at c2c83b2, no leftover branches, PRs #1-#4 merged and pruned.

  Took AC #4 first because it was free and unambiguous. `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`; `node src/cli.mjs audit` exits 1 on disagreement and the same comparison runs under `npm test` (suite 34 -> 45). The design decision that matters: an unrecognised phrasing reports as UNSTATED rather than being skipped, and a second test asserts every style states every field, so the guard cannot quietly shrink from four fields to three when someone rewords a style file. Proved by re-creating the exact divergence that shipped.

  The caps question went the opposite way from the cheap evidence, and that is the lesson. A $0.18 Haiku probe said stating a 12-word cap works: mean sentence 16.6 -> 12.3 words, over-cap 30% -> 11%, reply length flat, judge up. The user ratified tightening on it. The $2.24 paired validation on opus and sonnet then measured **+0.26 words, 95% CI [-0.77, +1.29]**, 6 of 12 pairs shorter and 6 longer, judge 0.557 -> 0.532, reply length up 105 -> 114. Reverted. The mechanism is clean and now documented in three places: a cap only bites where it binds — Haiku writes 16.6-word sentences and felt a 12-word cap, opus and sonnet already write 11-12 and had nothing to pull against. **Probe the cheap model to learn whether an instruction CAN bind; measure the target models before believing it DOES.** The Haiku effect sits 9.8 standard errors outside the opus/sonnet interval.

  Two process notes worth carrying. First, the question put to the user carried its own revert condition ("validate on both models and only keep it if it holds up"), so reverting after a failed validation executed their decision rather than overriding it — no second round trip. Second, the paired design mattered more than sample size: registering the pre-change file as a temporary contract entry and running old and new in the SAME run removed model, case and date as confounds, which is what made 24 cells enough to exclude the effect the probe had predicted.

  Also settled for free: paragraph caps are inert at every level (1.4-1.8 sentences against a cap of 4; re-scoring the same replies at cap 3 moves the check by 0.000-0.017), so there was never a differentiation to be had there. And the finding that actually matters for COS-4, recorded in the story: the binding constraint at the lower levels is reply length, not sentence length — beginner averages 119 words against its stated 80 with half its replies over, and where the two can be told apart the judge tracks reply length at -0.647 against sentence length's -0.368.

  Raised but not done, needs the user's call: `sentences()` in `checks.mjs` does not split on a single newline, so a list header ending in ':' merges with its first item — 9 of 74 over-cap sentences (12.2%), worth 1.2-1.6 points of over-20w rate. Too small to change any conclusion here, but fixing it moves numbers already published in `docs/` and `FINDINGS.md`, which is the COS-9 shape. Total spend this session $2.4152 against ~$8. Merged via PR #5 (rebase) as `ac1a161`; `dev` and `main` both pushed at that SHA, no branch litter, no open PRs. Cursor advanced to COS-5.
- 2026-08-16 — session 5: resolved COS-5 on `feature/COS-5`. No drift at restore:
  `dev`, `main` and both remotes level at 092f3b4, clean tree, no leftover
  branches, no open PRs — the handover matched reality exactly.
  The budget question the handover flagged (re-run opus/sonnet on the full pool,
  ~$19.5, or state the case-count difference) was answered a third way: slice the
  new haiku rows to the five case ids the old run used, after proving in git that
  the case definitions, style files, `checks.mjs` and `contracts.json` are all
  unchanged between the runs. That makes the table like-for-like on cases rather
  than merely captioned, costs nothing, and leaves the run/date difference as the
  only stated caveat. Re-scoring `12-44-03` offline first — free — reproduced all
  twelve published figures exactly, which is what made reuse defensible.
  **Two findings, one of them a correction to published work.** The measured
  Haiku failure mode is turn-limit exhaustion on fix-then-test cases, which
  forced a distinction the two-model data never needed: a cell that never
  answered is not a badly-styled cell, and pooling the two hid a ~10-point effect.
  The larger one is that this run refuted the hypothesis the handover handed it.
  Session 4's $0.18 probe reported Haiku at 16.6-word sentences and the project
  built its central "a cap only bites where it binds" explanation on that number.
  Haiku's actual baseline, at 6x the sample on an identical configuration, is
  12.1–12.2 words, and its *untightened* over-12 share (38.4–43.0%) contains the
  40.5% the probe credited to the tightened file. COS-8's decision survives —
  reverting was right, and for a simpler reason than it recorded: no model in the
  matrix sat far enough above the cap for it to have obvious room to work. The
  ledger, the audience-level spec and `harness/README.md` were corrected rather
  than deleted, both samples shown.
  Carry forward: **the free check was available at the time and nobody ran it.**
  Re-measuring a probe's own baseline from saved rows costs nothing, and it is
  the check that would have caught this before it reached four documents.
  `/code-review high` raised 10 findings, all real. The critical one was mine and
  is the sharpest lesson of the session: my analysis script measured sentence
  length with a plain `split(/\s+/)` instead of `checks.mjs`'s `words()`, which
  drops non-alphanumeric tokens. Every hand-computed sentence figure was inflated,
  and on the strength of that bug I had written into the ledger that session 4's
  "over-cap 30% → 11%" did not reproduce. It does, exactly. **A correction is a
  claim too, and needs the same verification as the thing it corrects — computed
  with the project's own instrument, not a convenient re-implementation of it.**
  The refutation itself survived recomputation unchanged. Four other findings were
  documents left contradicting the new result (the story's own Goal, the ADR, the
  harness README, the epic snapshot) and one was an argument that dismissed a
  4-cell arm as noise while trusting its 4-cell twin. The `run --help` footgun
  this session paid for was fixed, not merely recorded: `src/usage.mjs` now
  short-circuits any help-shaped argv before config is read, an unknown command
  exits 2, and 6 tests cover it — one of which shells out and asserts that
  `run --help` creates no results directory. Suite 47 → 52. Writing that test
  found a second hole: `parseArgs` only recognises `--` flags, so `-h` would have
  fallen through to a paid run.
  Left for the user to schedule: `run` still writes `rows.json` only after the
  entire matrix finishes, so a killed run loses every paid cell — `improve`
  flushes per style. That is a change to run semantics, not a guard, so it was
  not taken as scope here.
  Merged via PR #6 (rebase) as `14d72ea`; `dev` and `main` both pushed at that
  SHA, no branch litter, no open PRs.
- 2026-08-16 — session 6: resolved COS-7 on `feature/COS-7`. No drift at restore:
  `dev`, `main` and both remotes level at 82d32e5, clean tree, no leftover
  branches, PRs #1–#6 all merged and pruned — the handover matched reality
  exactly, for the second session running.

  **The campaign's most expensive session, $14.4290, and the one where scoping
  paid best.** The handover's core advice — run Fable on the five shared case
  ids so the result drops into the existing table with no slicing — was followed
  and was right. The alternative, the full 13-case pool, prices at roughly $27 on
  Fable against $1.88 on Haiku, and would have bought a second, non-comparable
  table. Reuse of the other three columns was re-verified rather than assumed, as
  the handover insisted: the five case definitions are byte-identical across five
  SHAs, `checks.mjs` and all three style files are byte-identical 444b221→HEAD,
  and `contracts.json` *did* change once after `12-44-03` — which the offline
  re-score settled by reproducing all twelve published figures exactly. That
  contracts change is worth noting: the precondition check was not a formality
  this time, it actually found a difference and then disposed of it.

  **Both open questions closed, one against expectation.** Word-cap overrun does
  not track model tier. The two-model data made Opus look like the verbose end of
  a gradient; the four-tier data turns twice (Sonnet 0.961, Haiku 1.088, Fable
  1.229, Opus 1.300 words ÷ cap), and paired over 15 cells the *cheapest* model
  overruns significantly more than the second cheapest while the *top two* are
  indistinguishable. Sonnet is the outlier that keeps to the cap. And the
  one-file decision holds at the top of the range, which completes it for four
  tiers of four across a tenfold cost spread.

  Two things worth carrying forward beyond the ACs. First, **the top tier's
  agentic result is the strongest evidence in the project that the opening
  narration failure is a Claude Code habit, not a model limitation** — Fable
  finishes `agentic-fix-verify` 6 times out of 6 where Haiku fails 5 of 6, and
  scores `leads_with_conclusion` 16.7 doing it, worse than any other model on any
  case. Capability removed the aborts and made the style compliance worse.
  Second, **reading the transcripts is still what finds the defects.** The
  text-block seam (`text += b.text` with no separator, so pre-tool narration
  fuses to the post-tool answer) was invisible to every gate and was found by
  looking at why `paragraph_length` read 16.7. It was bounded before anything was
  published — 0 of 131 conversational cells, most agentic ones — and no affected
  figure was quoted anywhere. Raised, not patched, because fixing it moves
  agentic numbers already in `docs/` and `FINDINGS.md`.

  One self-inflicted cost, recorded because the project documents footguns: the
  model-id probe named `--models`, `--styles`, `--cases` and `--repeats` but not
  `--variants`, so it ran five variants instead of one — $1.58 instead of ~$0.19.
  Every axis left unnamed takes its full default. It did buy the variant pricing
  on the top tier (long-prompt is 3.9× baseline), now in `harness/README.md`.
  Also deliberate: Fable was **not** added to `matrix.json`'s `models`, because
  that list is `improve`'s default too and the priciest tier would then be billed
  on every optimizer iteration — the same shape as the `run --help` footgun COS-5
  paid for.

  **The review earned its keep, and the lesson is new.** Five previous sessions
  found prose numbers that were wrong. This one's worst finding was a number that
  was *right* and an inference on top of it that was not: six paired comparisons
  on the same 15 units, three bolded significant, no multiplicity adjustment —
  and the units were 3 styles x the SAME 5 cases, so they were not independent
  either. Under Bonferroni only one of the three survives. The fix was to stop
  leaning on inference at all: a tier gradient predicts each step up the range
  overruns more than the step below, and two of the three adjacent steps go the
  wrong way. That is a fact about the means, and no sample size argument touches
  it. **Re-deriving a number is not the same as checking the claim built on it.**

  Also worth carrying: the review caught a gate claim that was false — the notes
  said `matrix.json`'s parse was covered by the existing suite, and nothing loads
  that file. Fixed rather than reworded (`harness/test/config.test.mjs`, suite
  52 → 56, proved by breaking the JSON and watching `npm test` go red). And it
  found that the four-tier table cannot be reproduced from `12-44-03`'s stored
  `rulesScore`, which predates 3370e4d; only re-scoring gives the published
  figures. That dependency is now stated beside the table, because the reviewer
  nearly filed it as a discrepancy.

  Merged via PR #7 (rebase) as `0747cc8`; `dev` and `main` both pushed at
  that SHA, no branch litter, no open PRs. Cursor advanced to COS-1, the
  first of the two hard style tasks.
- 2026-08-17 — session 7: took COS-1 on `feature/COS-1`. No drift at restore:
  `dev`, `main` and both remotes level at e48a48d, clean tree, no leftover
  branches, no open PRs. **The bar was not met and the issue is parked, not
  resolved** — the campaign's first negative result. ACs #1-#3 shipped: all three
  style files gained "Reporting a long/multi-tool session" and "When neither
  option is clearly better", and two cases were added on the `reserve` split
  (`reserve-agentic-session`, `reserve-decision-tie`) following COS-2's precedent
  of writing new cases rather than moving existing ones. Five paid runs,
  **$13.3074** against ~$15. The session's durable output is two instrument
  findings rather than a score: the text-block seam reaches the **judge**, and an
  errored cell scores 0 on rules but 1.0 on the judge. Both are in the ledger,
  `harness/README.md` and the raised list. Also closed a parse-guard gap of
  exactly the kind session 6's review found in `matrix.json`, one file over:
  `cases/cases.json` was read at CLI startup with nothing asserting it parsed.
  Suite 56 → **64**, and all five new case guards were proved to fire by breaking
  the file on purpose. The branch review returned 11 findings and every one was
  real: four wrong numbers in my own prose (all from counting words without
  `stripCode`, so the published over-cap range excluded the shipped arm), one
  withdrawn claim, and — the serious one — **a regression I introduced**, putting
  an abort-prone agentic case inside `improve`'s adoption gate while the diff
  documented that same error bias in three places and left the code alone. Fixed
  in the gate with six new tests, after `01-33-41` measured the case aborting
  3 of 6 on Haiku. `audit` exit 0; `lore check` exit 0. Six paid runs, $13.6567
  against ~$15. Cursor advanced to COS-4.
