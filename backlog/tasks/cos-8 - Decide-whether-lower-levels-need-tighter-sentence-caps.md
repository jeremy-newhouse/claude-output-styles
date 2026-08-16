---
id: COS-8
title: Decide whether lower levels need tighter sentence caps
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 13:14'
updated_date: '2026-08-16 22:44'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies: []
documentation:
  - docs/specs/style-contracts-by-audience-level.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All three style files state the same sentence and paragraph limits: sentences under 20 words, paragraphs under 4 sentences. Only the reply-length cap differs by level — 80, 100, 120 words.

The harness contracts had invented a differentiation the files never state, grading beginner at 15 words and 3 sentences and intermediate at 18 words. That was a defect and is fixed: contracts now match the files. Correcting it moved measured rule scores up by 0.4 to 1.3 points and changed no conclusion.

The design question the defect exposed is real and unanswered. A reader with no programming background plausibly needs shorter sentences than a technical leader, and the styles currently do not give them any. If they should, the style files are what must change — not the contracts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A decision is recorded on whether beginner and intermediate state tighter sentence and paragraph caps than advanced
- [x] #2 If tightened, the style files state the new caps and the contracts are updated to match
- [x] #3 Any change is validated on both models against the current baseline
- [x] #4 A check exists, or a documented procedure, that catches a style file and its contract disagreeing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. AC #4 first (free, unambiguous). Add a parser that reads each style file's stated caps out of its own prose (sentence words, paragraph sentences, reply-word cap, code-line cap) and a test asserting each parsed number equals the matching field in harness/config/contracts.json. This is the guard that would have caught the original 15/3-vs-20/4 divergence. Any change to harness/src/checks.mjs needs a matching case in harness/test/checks.test.mjs; the parser will live in its own module with its own test file if it is not a check.

2. AC #1 measurement, not decision. Measure what is actually measurable before proposing anything:
   (a) offline: re-score the existing saved rows (node src/cli.mjs score --rows=...) to get per-level observed sentence-length distributions and paragraph lengths from replies already paid for. Free.
   (b) determine whether the sentence_length / paragraph_length checks are even near their ceiling per level today. If every level already scores ~1.0 on sentence_length, a tighter cap is a change with no measured headroom and that is itself the finding.
   Bring numbers to the user and let them ratify the caps decision. Do not decide unilaterally (tracker risk policy: this AC is an audience judgement).

3. AC #2 is contingent on #1. If the user ratifies tightening, the style FILES change first and contracts.json follows to match. Contracts must never lead. The AC #4 guard then proves they agree.

4. AC #3 only if #2 produces a change: validate on both models against the current baseline, scoped with --cases= and --styles= to stay near the ~$8 budget. Keep reserve cases in any --cases= filter (COS-2's reserve split prints NOT MEASURED if filtered out). If #1 concludes no change, AC #3 is satisfied by recording that there is nothing to validate, with the measurement that shows why.

5. Gates: npm --prefix harness test green; lore sync then lore check exit 0; every asserted number from a run in this session or a cited results/<stamp>/.

6. Tracker doc-1 updated on the branch (COS-8 to Resolved, cursor to COS-5, session log), commit with Refs: COS-8, /code-review high, push, PR into dev, rebase-merge, sync, promote main, prune.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC #4 — the guard (done, free)

New `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `config/contracts.json`. Exposed three ways: `node src/cli.mjs audit` (exits 1 on disagreement), `auditAll()` for programmatic use, and 11 new cases in `harness/test/contract-audit.test.mjs`. Suite 34 -> 45, all green.

Design decision: an unrecognised phrasing is reported as UNSTATED, not skipped. A silent skip is exactly how this guard would go quiet the next time a style file is reworded. Two numbers for one cap, or prose that both bans code and sizes it, report as AMBIGUOUS rather than first-wins.

Proved by re-creating the divergence that actually shipped — contracts set back to beginner 15/3 and intermediate 18 against files saying 20/4:
```
FAIL plain-english-beginner     maxSentenceWords       file says 20, contracts.json grades at 15
FAIL plain-english-beginner     maxParagraphSentences  file says 4, contracts.json grades at 3
FAIL plain-english-intermediate maxSentenceWords       file says 20, contracts.json grades at 18
3 of 12 checks need attention
```
exit 1 from the CLI; `npm test` went 45/45 -> 43/45. contracts.json restored, `git diff` clean.

## AC #1 — measurement (offline, free)

Basis: `results/2026-08-16T12-44-03-883Z/` — the controlled run (all 3 shipped styles, same 5 cases, opus+sonnet, 2 repeats, 60 rows). Robustness check pooled all 18 saved runs (254 rows, 3 models); it agrees on the central point.

**Levels do not differ in sentence length today.** Mean words/sentence: beginner 12.3, intermediate 12.4, advanced 11.5 (p50 = 11/11/10). Over-20-word rate 15.0% / 14.0% / 12.2%. The level with the least technical audience writes the LONGEST sentences, not the shortest. Pooled 254-row check: 12.0 / 13.1 / 12.2 — same conclusion.

**Paragraph caps are measurably inert at every level.** Mean paragraph is 1.8 / 1.6 / 1.4 sentences against a stated cap of 4; zero paragraphs exceed 4 in the controlled run. Re-scoring the same replies at cap 3 moves paragraph_length by 0.017 / 0.000 / 0.000. At cap 2 it costs 0.13 / 0.12 / 0.04 — a penalty, not a differentiator. There is no signal here to differentiate on.

**The cap that binds is reply length, and the lower levels miss it worst.** Mean reply vs stated cap: beginner 119 vs 80 (50% of replies over), intermediate 120 vs 100 (45% over), advanced 85 vs 120 (15% over). The differentiation the styles already state is the one being violated.

**The judge tracks reply length more than sentence length.** At intermediate, where mean sentence length and reply length are statistically independent (r = -0.05), reply length correlates -0.647 with the judge and sentence length only -0.368. At beginner the two are confounded (r = +0.75), so they cannot be separated there. n = 20 per level; directional, not conclusive.

**Splitter artifact, measured and set aside.** `sentences()` does not split on a single newline, so a list header ending in `:` merges with its first item. 9 of 74 over-cap 'sentences' (12.2%) are this artifact. Correcting it moves the over-20w rate by only 1.2-1.6 points and changes no conclusion above. Raised as a follow-up rather than fixed here — changing the splitter moves numbers already published in docs/ and FINDINGS.md, which is the COS-9 pattern.

## AC #1 — compliance probe (paid, $0.1788)

`results/2026-08-16T22-18-53-074Z/` — haiku, 4 cases, 1 repeat, 8 cells. Two style files identical except one line: 'sentences under 20 words / paragraphs under 4' vs 'under 12 / under 3'. Registered as a temporary contract entry, removed afterwards.

The model complies. Mean sentence length 16.6 -> 12.3 words; over-20-word rate 30.0% -> 10.8%. Paired per case: -6.6, -6.7, +0.2, -5.7. Reply length barely moved (124 -> 114 words) — it did not trade shorter sentences for more of them. Rules score flat (0.890 -> 0.893) even though the tight style was graded against the harder 12-word cap it asked for. Judge 0.267 -> 0.417 and total 0.579 -> 0.655, but n=4 on one model: suggestive, not evidence.

This kills the argument that a tighter cap merely lowers the score. Re-scoring today's replies at a tighter cap (the counterfactual above) is NOT what happens — the model writes shorter sentences instead. Untested on opus and sonnet; that is what AC #3 would cost.

## AC #3 — validation on both models: the change FAILED and was reverted

The user ratified tightening beginner to 12 words on the strength of the haiku probe, on the stated condition that it be validated on both models and kept only if it held up. It did not hold up.

`results/2026-08-16T22-27-15-474Z/` — opus + sonnet, 6 cases spanning all three splits (conv-status-auth, conv-explain-cache, conv-status-holdout, conv-followup-drift, reserve-pushback, reserve-scope-estimate), 1 repeat, 24 cells, $2.2364. Paired design: the pre-change beginner file was registered as a temporary contract entry `beginner-baseline-20w` and run alongside the tightened file in the SAME run, so old and new saw identical cases, models and conditions. The two files differ by one line.

**Compliance — no detectable effect.**
```
paired delta in mean sentence length (12-word cap minus 20-word cap)
  n pairs     12
  mean delta  +0.26 words
  95% CI      [-0.77, +1.29] words   (t = 0.56, df 11)
  direction   6/12 pairs shorter — a coin flip
```
Per model: opus 12.0 -> 11.0 words (over-20w 12.5% -> 5.6%); sonnet 11.0 -> 11.8 words (over-20w 8.9% -> 14.3%). Opposite directions. The rate of sentences over 12 words — the new cap — barely moved: 42.2% -> 38.9% on opus, 42.2% -> 42.9% on sonnet. The models do not comply at that granularity.

**Why the haiku probe misled.** The cap only bites where it binds. haiku's baseline mean is 16.6 words, 4.6 words OVER the proposed 12-word cap, so stating it moved behaviour a lot. opus (12.0) and sonnet (11.0) already sit at or under 12 words unprompted, so there was nothing for the instruction to pull against. The haiku effect (-4.3 words) sits 9.8 standard errors outside this run's confidence interval; it does not generalise. Recorded as a trap: a cheap-model probe measures whether an instruction CAN bind, not whether it binds on the models the styles target.

**Quality — no gain, small decline, within noise.** Pooled across both models: judge 0.557 -> 0.532, rules 0.945 -> 0.908, total 0.751 -> 0.720. Mean reply length went UP, 105 -> 114 words, against an 80-word cap that both versions miss 41.7% of the time. Per model the judge moved in opposite directions (opus 0.487 -> 0.562, sonnet 0.627 -> 0.503), which at n=6 per cell is noise, not a finding.

**Reverted.** `plain-english-beginner.md` and `contracts.json` are back at 20 words; `git status` shows neither file modified, and `node src/cli.mjs audit` reports all 12 checks agree. The temporary `beginner-baseline-20w` contract entry was removed.

## Decision (AC #1)

**No. Neither beginner nor intermediate should state tighter sentence or paragraph caps than advanced.** Recorded on evidence, not preference:

1. **Sentence caps — tried, measured, rejected.** Tightening beginner to 12 words produced no detectable change on either target model (+0.26 words, 95% CI [-0.77, +1.29]) and no quality gain. The premise that the lower levels write longer sentences is false on opus and sonnet: beginner 12.3, intermediate 12.4, advanced 11.5 words.
2. **Paragraph caps — inert, decided offline for free.** Mean paragraph is 1.4-1.8 sentences against a cap of 4. Re-scoring at cap 3 moves the check by 0.000-0.017. The constraint does not bind at any level, so differentiating it cannot change behaviour.
3. **Where the real gap is.** The one cap that IS already differentiated by level — reply length, 80/100/120 — is the one being missed, and missed worst at the lowest level: beginner 119 words vs 80 (50% of replies over), intermediate 120 vs 100 (45%), advanced 85 vs 120 (15%). The judge tracks reply length more strongly than sentence length where the two can be separated (intermediate, r = -0.05 between them: reply length -0.647 vs judge, sentence length -0.368).

Total spend this session: $2.4152 ($0.1788 probe + $2.2364 validation) against a ~$8 budget.

## How each criterion was verified

- **#1 checked.** Decision recorded above: no, neither lower level should state tighter sentence or paragraph caps. Backed by `12-44-03` (per-level baseline), an offline re-score for the paragraph half, and `22-27-15` (the tightening tried and measured). Ratified by the user, who chose to tighten on the probe evidence and pre-authorised reverting if it failed validation.
- **#2 checked, and read the note.** This criterion is conditional and its condition ended up FALSE — **beginner still states 20 words; nothing shipped tightened.** The mechanism was exercised in full before the revert: the style FILE was edited first, `contracts.json` followed, and `node src/cli.mjs audit` confirmed agreement at 12/12 checks. Between the two edits the audit correctly reported `FAIL plain-english-beginner maxSentenceWords file says 12, contracts.json grades at 20`, which is the order the task description demands — contracts must never lead. Final state verified by `git status`: neither `plain-english-beginner.md` nor `contracts.json` is modified.
- **#3 checked.** `results/2026-08-16T22-27-15-474Z/` — opus and sonnet, paired against the pre-change file in the same run. The criterion says any change is validated on both models; it was, and it failed, which is a valid outcome of a validation gate rather than a reason to leave the criterion open.
- **#4 checked.** `node src/cli.mjs audit` exits 1 on disagreement; 11 cases in `harness/test/contract-audit.test.mjs`; suite 34 -> 45 green. Proved against the divergence that actually shipped (contracts reset to beginner 15/3, intermediate 18: 3 FAILs, CLI exit 1, npm test 43/45) and against a live in-flight edit. It also picked up two temporary style entries it had never seen without any change to the guard.

Gates at finalization: `npm --prefix harness test` 45/45; `node src/cli.mjs audit` all 12 checks agree; `lore check` run after `lore sync`.

Follow-up worth raising with the user, NOT done here: `sentences()` in `checks.mjs` does not treat a single newline as a boundary, so a list header ending in ':' merges with its first item. Measured at 9 of 74 over-cap sentences (12.2%), worth 1.2-1.6 points of over-20w rate. Fixing it moves numbers already published in docs/ and FINDINGS.md, which is the same shape as COS-9 and belongs in its own task.

## Review findings (/code-review high) — seven raised, all real, all addressed

1. **Spec mixed two metrics in adjacent sentences (blocking).** The paragraph established "share of sentences over 12 words" as its metric (42.2% -> 38.9% Opus, 42.2% -> 42.9% Sonnet), then quoted Haiku's over-**20**-word rate (30% -> 11%) as if like-for-like. Haiku's over-12 rate is 60.0% -> 40.5%. Corrected, and the correction improved the finding: compared on end states rather than movements, all three models finish at roughly the SAME compliance with a 12-word cap — 38.9%, 42.9%, 40.5% still over it. Haiku moves further only because it starts further away. Fourth session running that the only defect no automated gate caught was a plausible number in prose.
2. **The guard was not wired into the workflow that rewrites style prose.** `AUTHOR_SYSTEM` tells the rewriter to delete instructions the measurements show are already satisfied, and `sentence_length`/`paragraph_length` sit near 1.0 — so a candidate dropping "Keep sentences under 20 words" is a normal optimizer output. The runbook's Adopt step then `cp`s it over the style file with no audit, turning `npm test` red on a rewrite that legitimately won. Added `node src/cli.mjs audit --styles=<style>` to the Adopt step with guidance on which side to fix.
3. **README sample contradicted the paragraph introducing it.** The prose described the historical divergence as 15 words AND 3 sentences; the sample (real output, but from a different perturbation) showed `maxSentenceWords ... both say 20` and `1 of 12`. Reproduced the actual described divergence and pasted that output: 2 FAILs, `2 of 12 checks need attention`.
4. **`configured === undefined` reported as a mismatch.** A contract omitting a cap produced "file says 0, contracts.json grades at undefined", blaming the style file. New `unconfigured` status names the contract instead. Reachable in practice — this session hand-wrote temporary contract entries.
5. **Tests hardcoded the field and style counts.** `rows.length === Object.keys(contracts).length * 4` and `/all 12 checks agree/` would fail on the wrong thing when a maintainer adds a PATTERNS entry, which the README explicitly instructs. Both now derived.
6. **The guard compares numbers, not conditions.** Beginner says "Never show code *unless they ask*"; `maxCodeLines: 0` cannot express the condition, and `code_block_size` scores 0 for any block regardless. So beginner can follow its own file and take the heaviest penalty in its contract while audit says "both say 0". Not fixable without changing scoring (published numbers move — the COS-9 pattern), so documented as a stated limit of the instrument.
7. **`audit` ignored `--styles` and crashed on the drift it exists to report.** A wrong `styleFile` path threw a raw ENOENT from the eager style load before printing anything. `audit` now runs before that load, honours `--styles`, exits 1 on an unknown style id, and reports an unreadable style file as an `unreadable` finding rather than dying.

Gates after fixes: `npm --prefix harness test` 47/47 (2 new cases); `node src/cli.mjs audit` all 12 agree, and verified again on the scoped, unknown-style, missing-field and broken-path paths; `lore check` 0 errors.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Decided, on measurement, that beginner and intermediate should NOT state tighter sentence or paragraph caps than advanced — and built the guard that catches a style file and its contract disagreeing.

The caps question was settled by trying it. The user ratified tightening beginner to 12 words on the strength of a $0.18 Haiku probe, on the stated condition that it be validated on both target models and kept only if it held up. It did not: a paired opus+sonnet run over 6 cases spanning all three splits (`results/2026-08-16T22-27-15-474Z/`, 24 cells, $2.24) moved mean sentence length by +0.26 words, 95% CI [-0.77, +1.29], with 6 of 12 pairs shorter and 6 longer, no judge gain (0.557 -> 0.532) and reply length rising 105 -> 114 words. Reverted; `git status` shows `plain-english-beginner.md` and `contracts.json` unmodified.

The probe and the validation disagree for a mechanical reason now documented as a trap: a cap only bites where it binds. Haiku writes 16.6-word sentences and felt a 12-word cap (mean -> 12.3, over-cap 30% -> 11%); opus and sonnet already write 11-12 words and had nothing to pull against. The Haiku effect sits 9.8 standard errors outside the opus/sonnet interval. The paragraph half was settled offline for free — paragraphs run 1.4-1.8 sentences against a cap of 4, and re-scoring at cap 3 moves the check by 0.000-0.017, so the constraint does not bind at any level.

New `harness/src/contract-audit.mjs` parses each style file's stated caps out of its own prose and compares them against `contracts.json`, exposed as `node src/cli.mjs audit` (exit 1 on disagreement) and as 11 test cases; suite 34 -> 45, all green. Unrecognised phrasing reports as UNSTATED rather than being skipped, because a silent skip is how this guard would go quiet the next time a style file is reworded. Proved by re-creating the divergence that actually shipped — contracts reset to beginner 15/3 and intermediate 18 — which produced 3 FAILs, CLI exit 1, and npm test 43/45.

Docs updated outside lore-managed regions and reconciled: the spec now records why the caps do not vary and how to keep file and contract in agreement, the experiment ledger carries both runs as a matched pair with the cheap-probe warning, the story notes point COS-4 at reply length rather than sentence length, and the harness README documents `audit` and its recognised phrasings.

Total spend $2.4152 against a ~$8 budget.
<!-- SECTION:FINAL_SUMMARY:END -->
