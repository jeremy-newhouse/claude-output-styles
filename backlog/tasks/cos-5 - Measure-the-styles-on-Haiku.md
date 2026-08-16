---
id: COS-5
title: Measure the styles on Haiku
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-16 23:20'
labels:
  - 'doc:stories/extend-measurement-coverage'
dependencies: []
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
matrix.json lists haiku as a target model but no style has ever been run against it. Every measurement in the project covers opus and sonnet only.

Haiku is the cheapest model and the most likely to drop instructions under load, so it is the strongest test of whether a style file carries its own weight. It may also expose rules that the larger models satisfy by disposition rather than instruction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All three styles measured on haiku across the standard case set
- [x] #2 Per-model comparison in FINDINGS.md covers haiku alongside opus and sonnet
- [x] #3 Any haiku-specific failure mode is recorded, or its absence stated
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Measure haiku on the FULL 13-case pool: all 3 styles x haiku x baseline x 13 cases x 2 repeats = 78 cells. AC #1's 'standard case set' is today's pool of 13, not the 5 that run 12-44-03 filtered to. Est ~$2 at the $0.022/cell haiku rate measured in session 4.

2. Do NOT re-run opus/sonnet on the full pool (~$19.5 at 12-44-03's measured $0.1253/cell for the opus+sonnet mix, against a ~$5 budget). Instead make the cross-model table like-for-like by SLICING the new haiku rows to the same 5 case ids 12-44-03 used. Verified prerequisites for that reuse: the 5 shared case definitions are byte-identical across 444b221/8a76f13/49fd1fa/HEAD; plain-english-*.md unchanged since 12-44-03; checks.mjs unchanged since 444b221; contracts.json unchanged since 3370e4d. So prompts, style text and scoring code are all constant — only the invocation and date differ, which the table will state.

3. Re-score 12-44-03's saved rows offline (free, 'score --rows=') to confirm the published opus/sonnet figures still hold under current checks before quoting them.

4. FINDINGS.md 'Per-model baseline, all three styles': add haiku. Give the like-for-like 5-case columns as the comparison, and haiku's full-13 figures separately and labelled, so no figure travels without its case count.

5. AC #3: derive any haiku-specific failure mode from the new rows via per-check aggregates, or state explicitly that none was found. Session 4's free probe (22-18-53, 8 beginner-only cells) predicts sentence_length as the candidate — treat that as a hypothesis to test on the full run, not as the answer.

6. Gates: npm --prefix harness test green; node src/cli.mjs audit exit 0; lore check exit 0 after lore sync; add the run to the experiment ledger. Every number quoted must come from this session's run or a re-score of cited saved rows.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Run: results/2026-08-16T22-59-53-852Z — 78 cells, $1.8770

3 styles x haiku x baseline x 13 cases x 2 repeats. Full pool, not filtered.
Comparison baseline is 12-44-03 (opus+sonnet, 60 cells), re-scored offline this
session: the re-score reproduced all 12 published FINDINGS figures to the tenth
of a point, so those numbers are still valid under current checks and are safe
to quote next to new haiku data.

### AC #2 method: like-for-like by case, not by re-running opus/sonnet

Rejected re-running opus+sonnet on the full 13 (~$19.5 at 12-44-03's measured
$0.1253/cell, against a ~$5 budget). Instead sliced the new haiku rows to the
same 5 case ids 12-44-03 used. Prerequisites verified, not assumed: those 5 case
definitions are byte-identical across 444b221 / 8a76f13 / 49fd1fa / HEAD;
plain-english-*.md unchanged since 12-44-03; checks.mjs unchanged since 444b221;
contracts.json unchanged since 3370e4d. Prompts, style text and scoring code are
therefore constant across the two runs — only the invocation and date differ,
which the FINDINGS table states. Zero errored cells on any model in that slice.

### Headline: 6 of 78 haiku cells returned NO REPLY

All six are 'Reached maximum number of turns (12)', all on agentic cases that
require editing a file and then running tests:
  agentic-fix-verify     5/6 cells
  reserve-agentic-write  1/6 cells
Across every saved run, opus is 0 errors in 21 agentic cells and sonnet 0 in 28.
Haiku's read-only agentic case (agentic-read-report) is also 0/8. So the failure
is specific to haiku AND to write-then-verify work, not to agentic work at all.
It occurs on all three styles (advanced 3, intermediate 2, beginner 1), so it is
a model capability limit, not a style-file defect.

Methodological consequence, and the reason the tables are built the way they are:
an errored cell scores rules 0.0 and drags the mean. Haiku's full-pool rule score
reads 83.4 / 85.2 / 83.3 with the zeros in, and 94.2 / 92.3 / 86.6 on replies
only. 'Did not answer' and 'answered badly' are different failures and are
reported separately.

### The inherited sentence-length hypothesis is REFUTED

The handover carried session 4's probe finding as the leading AC #3 candidate:
'Haiku writes markedly longer sentences than Opus or Sonnet — mean 16.6 words,
30% over the 20-word cap.' It does not reproduce.

Measured with the same sentences() the check uses, same style file, same model,
same variant, same four case ids:

  22-18-53 (session 4 probe)  4 cells, 30 sentences   mean 16.7w, 30.0% over 20w
  22-59-53 (this run)         8 cells, 79 sentences   mean 12.2w, 10.1% over 20w

Cell is the right unit — sentences inside one reply are not independent. On cell
means the gap is +4.10 words, SE 2.30, 95% CI [-0.40, 8.61], t=1.79; paired by
case, +4.10 with 95% CI [-0.11, 8.32] (df=3). Both intervals cross zero. The
probe's figure is consistent with sampling noise on four cells and is not
reproducible at 8, let alone at the 25 cells this run measured on beginner
(12.4w, 13.1% over cap).

Across the full pool haiku is NOT the long-sentence model:
  haiku  full 13   732 sentences  12.2w  12.7% over 20w
  haiku  shared 5  266 sentences  11.9w  12.0% over 20w
  sonnet shared 5  204 sentences  13.7w  21.1% over 20w
  opus   shared 5  330 sentences  11.4w  11.5% over 20w
Sonnet writes the longest sentences of the three, not haiku.

What this does and does not change. COS-8's DECISION (revert the 12-word cap)
stands and is strengthened: if haiku already writes ~12.2w, no model in the
matrix had headroom for a 12-word cap to exploit, which is exactly what the
$2.24 paired opus/sonnet validation found. What fails is the ledger's stated
MECHANISM — 'the cap binds on Haiku because Haiku writes 16.6-word sentences'.
That premise rests on 4 cells and does not survive a 6x larger sample of the
identical configuration. Ledger corrected rather than deleted, with both samples
and the interval shown, since the probe row is real data about that run.

## AC verification

**AC #1 — all three styles measured on haiku across the standard case set.**
results/2026-08-16T22-59-53-852Z: 78 cells = 3 styles x haiku x baseline x 13
cases x 2 repeats, $1.8770. Full pool, unfiltered — 'the standard case set' is
today's 13, not the 5 that 12-44-03 happened to use. 72 cells returned a reply;
the 6 that did not are reported rather than dropped.

**AC #2 — per-model comparison in FINDINGS.md covers haiku alongside opus and
sonnet.** FINDINGS.md 'Per-model baseline, all three styles' now carries three
model columns for rules and three for judge. Like-for-like: the haiku rows are
the new run sliced to the same 5 case ids opus/sonnet were measured on, with the
prerequisites for that reuse verified in git (see plan). Zero errored cells on
any model in that slice, so no column is polluted by a no-reply zero. The 13-case
haiku figures are given in their own labelled subsection, so no figure travels
without its case count.

**AC #3 — any haiku-specific failure mode recorded.** Recorded, and it is not the
one that was predicted. See below.

## Gates
npm --prefix harness test 47/47. node src/cli.mjs audit exit 0 (12 checks agree).
lore sync then lore check exit 0. Every figure quoted in FINDINGS.md, the story
doc, the spec and the ledger came from this session's run or from an offline
re-score of cited saved rows; nothing was carried over from a previous session's
prose.

## Numbers corrected during review of my own draft
Three claims I wrote did not survive checking against the data and were fixed
before commit: (a) 'the judge falls monotonically with model tier' — false,
sonnet beats opus on intermediate and beginner; (b) 'beginner sits 20 points
below advanced' — it is 15.4/17.6/28.0 depending on model; (c) 'haiku never loses
more than 1.4 points of rule score' — the advanced deficit is 1.8. Recording
these because a plausible-but-unchecked prose number has been the defect that
survived every automated gate in four consecutive sessions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured all three styles on Haiku across the full 13-case pool — results/2026-08-16T22-59-53-852Z, 78 cells, $1.8770 — and folded Haiku into FINDINGS.md's per-model comparison as a third model column.

The cross-model table is like-for-like rather than a re-run: the new Haiku rows are sliced to the same five case ids run 12-44-03 used, after verifying in git that those five case definitions, all three style files, checks.mjs and contracts.json are all unchanged between the two runs. Re-scoring 12-44-03 offline reproduced its twelve published figures to the tenth of a point, so the Opus/Sonnet columns are current, not stale. That saved roughly $19.5 against a ~$5 budget with no loss of comparability; the run/date difference is stated in the table.

Result: rule compliance survives the drop to the cheapest tier (Haiku 90.9-96.0, never more than 1.8 points behind the better of Opus and Sonnet, and ahead of Opus on intermediate), while judge score does not (37.5-62.2, last on all three styles). Beginner reads worst on all three models, which makes it a property of the style file rather than of one model's taste.

AC #3's Haiku-specific failure mode is turn-limit exhaustion, not anything about wording: six of 78 cells returned no reply at all, every one a 12-turn abort, every one on a case that edits a file and then runs tests (agentic-fix-verify 5/6, reserve-agentic-write 1/6, read-only agentic 0/6). Opus has never hit it in 21 saved agentic cells, Sonnet never in 28, and it struck all three styles, so no style rewrite addresses it. Because an empty reply scores 0.0 on every rule, pooling those cells understates Haiku's rule compliance by about ten points; FINDINGS.md now reports 'replies only' and 'counting no-reply as 0' as separate columns.

The predicted failure mode was refuted. The handover carried session 4's finding that Haiku writes 16.6-word sentences against Opus/Sonnet's 11-12. It does not reproduce: the same file, model, variant and four case ids measure 12.2 words at 8 cells and 12.4 at 25, and the cell-level gap is +4.10 words with 95% CI [-0.40, 8.61] (paired [-0.11, 8.32], df=3) — both crossing zero. Decisively, the probe's case was that a 12-word cap cut Haiku's over-12 share from 60.0% to 40.5%; Haiku's untightened share is 38.4-43.0%, so the cap did nothing on Haiku either and the 60.0% was a high draw. COS-8's decision to revert stands and is strengthened — no model in the matrix had headroom for a 12-word cap. Its stated mechanism was wrong and is corrected in the experiment ledger and in the audience-level spec, with both samples and the intervals shown.

Verified: npm --prefix harness test 47/47; node src/cli.mjs audit exit 0; lore check exit 0 after lore sync. Three numeric claims in my own draft failed checking against the data and were corrected before commit.
<!-- SECTION:FINAL_SUMMARY:END -->
