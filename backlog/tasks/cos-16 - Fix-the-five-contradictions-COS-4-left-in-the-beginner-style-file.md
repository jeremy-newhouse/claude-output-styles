---
id: COS-16
title: Fix the five contradictions COS-4 left in the beginner style file
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:46'
updated_date: '2026-08-20 03:40'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-10
  - COS-11
  - COS-12
references:
  - plain-english-beginner.md
  - harness/config/contracts.json
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 rewrote `plain-english-beginner.md` to remove three self-contradictions and add a shape router. It succeeded on the deterministic side — rules 92.1/93.4 to 98.5/97.4, mean reply 103 words to 61, over-cap share 40.0% to 14.3% — and introduced five new defects of the same class, which were recorded rather than fixed because the budget was exhausted and shipping unmeasured style text is against the precedent COS-1 set.

All five are in the file as it ships at `31433b8`:

1. **The jargon rules conflict for a word the reader used first.** Line 17 says a product or tool name must be put in plain terms "even if they used the name first"; line 42 says to skip explaining "a word they used first". Asked "why is Redis slow?", the model gets opposite instructions for the same word.
2. **The proof-number rule demands a number that may not exist, and it is stated three times.** Line 44 ("Give it, and give only one"), line 49 ("then the one number that proves it") and line 58 ("One sentence, one number"). The judge already punished this: on `agentic-read-report`, a case with nothing to run, it quoted "the reply never states whether the code was actually tested … no proof number given as required". A replacement was measured only inside a five-edit bundle and never on its own.
3. **Router bullets 1 and 3 both match a tool-using report.** "You finished a job" and "They asked what something is or does" both describe `agentic-read-report`, and the file does not say which wins.
4. **The router omits two of the file's own six shapes** — "Reporting a long session" and "Answering a follow-up". The second is the sharper miss: `conv-followup-drift` produced 4 of the 10 structure violations that motivated the router in the first place.
5. **The file's worked example of the gloss rule uses a banned term.** "I updated the API (the messenger that lets two programs talk)" — "API" is one of the 28 terms `no_jargon` matches at weight 2, with no awareness of the gloss, so following the example scores 0.667 on the heaviest-weighted check. The contract side of this is COS-15; this task owns the prose.

Measure the bundle, then ablate. COS-4 could not tell its two authoring passes apart because each was a five-edit bundle measured once at ten cells a model, and the bundle-versus-bundle comparison was inside the noise. With adequate n, each bullet can be tested on its own, which is the only way to know which of the five earn their place.

Note the trap COS-1 and COS-4 both hit: adding rules to this file has repeatedly failed. Four of the five fixes above remove or bound a rule rather than adding one, which is the shape of the change that did work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each of the five defects is either fixed or explicitly retained, with the reason recorded
- [x] #2 The bundle is measured against the shipped text at n >= 146 cells per model on the five shared cases, which is what a 95% half-width of +/-4 points costs at the measured judge SD of 24.6
- [x] #3 Every individual edit that survives into the shipped file has its own measured effect, so no bullet ships on the strength of the bundle alone
- [x] #4 Deterministic rule score stays at or above the 98.5/97.4 the current file reaches, and mean reply length does not rise above 61 words
- [x] #5 Validated on the six reserve cases at the same sample size, before and after
- [x] #6 node src/cli.mjs audit exits 0 and the shipped file is verified byte-identical to the measured text by checksum
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. ABLATION DESIGN, priced before any prose was written. A cell costs ~29s wall including its judge call (measured on a 2-cell smoke, sonnet, concurrency 2). AC #2 needs >=146 cells per model per arm; 30 repeats x 5 shared cases x 2 models = 300 cells = 150/model, and 25 repeats x 6 reserve cases x 2 models = 300 = 150/model. Design is ADD-ONE-IN, not leave-one-out and not a fractional factorial: 6 arms on the shared five (baseline, bundle, and one arm per surviving edit added alone to the baseline) plus 2 reserve arms. 2400 cells, ~2h wall at concurrency 12. Add-one-in was chosen over a resolution-IV half fraction (8 arms, ~2x the power per effect for 2400 cells) because it degrades gracefully: arms are ordered so ACs #2/#4/#5 are satisfied first and only #3 is lost if the session dies. Each edit's effect is then baseline-vs-single at 150/model a side, a 95% between-arm half-width of about +/-5.7 points, and that is stated rather than hidden.
2. FIVE DEFECTS -> FOUR EDITS. Defect #5 (the worked gloss example uses the banned term API) is RETAINED under AC #1 with the reason recorded: COS-15 taught no_jargon to grade first use and forgive 'TERM (a phrase of three words or more)', so the example is now a correct demonstration of the compliant shape rather than a violation of it. Retaining it means no arm and no cells. Defects #1-#4 each become one edit: E1 removes the jargon conflict, E2 states the proof-number rule once and bounds it to a number that exists, E3 gives router bullets 1 and 3 a precedence, E4 adds the two missing router shapes. E1-E3 remove or bound; only E4 adds, which is the shape that has failed twice.
3. Measure baseline arms A0 (shared five) and R0 (reserve six) FIRST, on the untouched shipped file, sha256 96fdbea4. Then author, then bundle arms A5 (shared) and R1 (reserve), then the four single-edit arms A1-A4.
4. Every arm's text is checksummed and kept off-tree; AC #6 is checked by comparing the shipped file's sha256 to the bundle arm's recorded sha256.
5. Gates: npm --prefix harness test green, node src/cli.mjs audit exit 0, lore check exit 0 if docs change. Then commit, review, PR into dev, rebase-merge, sync dev, fast-forward main, push both, prune.

6. SIZING REVISED once real throughput was known. The harness sustains ~8 cells/min at concurrency 12 on this machine (generation is only 7s a cell; the judge call and API queuing are the rest), so the naive 8-arm x 300-cell design was ~5.5h of wall clock. The four single-edit arms drop to 15 repeats (150 cells, 75/model) while the two bundle arms and both baselines stay at 150/model. AC #2's 146-cell bar binds only the bundle-versus-shipped comparison and AC #3 states no size; each edit is compared against the same 150/model baseline, so the 95% between-arm half-width goes from +/-5.6 to +/-6.8 points and 750 cells are saved. Neither figure resolves a 2-point effect, which is the honest reason the extra cells buy nothing. Total 1800 cells.

7. SIZING CORRECTION, replacing item 6. The ~8 cells/min figure in item 6 was measured across the run's cold start and is wrong. A clean 120-second window on the steady-state arm gives 53 cells, i.e. 26.5 cells/min at concurrency 12. The full design is therefore ~90 minutes of wall clock, not 5.5 hours, and every arm keeps 30 repeats (150 cells per model). Item 6's trim to 15 repeats is reverted; the between-arm half-width stays +/-5.6 points. 2400 cells total.

8. SESSION 27 RESUME PLAN. Candidate rebuilt from the shipped text (96fdbea4) by E1 + E2a/b/c + E3, omitting E4; sha256 verified 86451ddb16b273426eca5318d20169b6bfa1b0f6dd304872c3b9625da7a167c3, matching the figure session 20 recorded. Two arms to buy, both on that candidate: (a) the five shared cases, opus+sonnet, baseline, 30 repeats, 300 cells, replacing 02-43-48 whose Sonnet half lost 56 of 150 to the usage window; (b) the six reserve cases, same models/variant, 25 repeats, 300 cells, for AC #5 — no reserve arm has run on any three-edit candidate. Both compare against the existing baselines 19-42-55 (shared) and 19-53-49 (reserve), which do not need re-running. ~600 cells, ~25 min at the 26.5 cells/min this machine sustained. Then AC #6 (audit exit 0 + checksum), then the review/PR lifecycle.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NOTE FROM COS-15 (session 19), not yet acted on. Two figures this task quotes moved when COS-15 taught `no_jargon` to forgive a glossed first use:

- AC #4's bar, 'at or above the 98.5/97.4 the current file reaches', is now **98.5 / 97.7** on the same saved rows. The Sonnet half rose 0.3. Read the bar as 98.5/97.7 or restate it; do not measure against 97.4.
- Defect #5 in the description is half closed. The CONTRACT side was COS-15's: `no_jargon` grades first use and forgives a gloss, so 'I updated the API (the messenger that lets two programs talk)' now scores **1.0**, not 0.667. The PROSE question this task owns is unchanged — whether the file's worked example should use a banned term at all — but the scoring consequence quoted in the description no longer holds, so it cannot be used as the reason.

Nothing else in this task is affected: no style file changed under COS-15.

BASELINE ARMS MEASURED, both complete and both on the shipped text at sha256 96fdbea4 (COS-4's pass-1 file as it ships at 31433b8). 0 cells dropped in either.

- Run `2026-08-17T19-42-55-135Z` — the five shared cases, beginner only, opus+sonnet, baseline variant, 30 repeats, 300 cells, 150 per model. Rules **98.9 / 97.4**, judge **66.8 / 60.9**, total 82.9 / 79.1, mean reply **63.0 / 59.7** words, over-cap share 0.7% / 18.7%.
- Run `2026-08-17T19-53-49-329Z` — the six reserve cases, same style/models/variant, 25 repeats, 300 cells, 150 per model. Rules **98.1 / 94.9**, judge 63.9 / 61.4, total 81.0 / 78.1, mean reply 74.5 / 82.4 words, over-cap 27.3% / 46.0%.

**These re-measurements move published COS-4 figures, and one of them materially.** COS-4 measured the same bytes at n=35 per model and published judge **73.9 Opus**; at n=150 the same text reads **66.8**, a 7.1-point fall. It sits inside COS-4's own stated interval [66.0, 81.9], so this is the interval closing rather than a contradiction — but the point estimate is what four documents quote, and 73.9 is above COS-4's 70% bar while 66.8 is below it. Sonnet moves the other way, 58.1 to 60.9, and stays below the bar. This is the first time beginner's judge score has been measured at the size its claims need, and it is directly relevant to queue item 14 (COS-4's parked AC #4).

Rules move much less, as expected of a deterministic score: 98.5/97.4 published against **98.9/97.4** here on the shared five, and 95.6/93.5 against **98.1/94.9** on reserve. Mean reply length pools to 61.35 words against the published 61. Sonnet's over-cap share on the shared five reads 18.7% against the published 14.3%.

AC #4's bar is therefore read against these freshly-sized numbers, not against COS-4's n=35 ones: rules must not fall below 98.9 / 97.4, and mean reply length must not rise above 63.0 / 59.7.

AC #1 — THE FIVE DECISIONS. Four defects become four edits; one is retained.

- **Defect 1, the jargon conflict: FIXED (E1).** Line 42's exemption 'Skip it for a word they used first' is deleted outright. It is the half of the pair that has to go: line 17's 'even if they used the name first' is the rule `no_jargon` actually grades, and the restraint the exemption carried is already carried by the sentence it sits in ('only when the answer makes no sense without it'). Narrowing it to 'an everyday word they used first' was rejected as a no-op — you would never explain an everyday word anyway, which is COS-15's own lesson about guards that cannot fail.
- **Defect 2, the proof number: FIXED (E2).** Stated once, where it belongs, and made conditional: 'If you have one, give it, and give only one ... If you ran nothing, say what you did not check. Never invent a number.' The two restatements are stripped — line 49 becomes 'Be direct.' and line 58 'One sentence.'
- **Defect 3, router bullets 1 and 3: FIXED (E3).** One precedence sentence after the router: 'When two of these match, the one that fits what they asked wins over the one that fits what you did.' It bounds the existing bullets rather than adding a shape.
- **Defect 4, the two missing router shapes: FIXED (E4).** Two bullets added, for the long session and the follow-up. The only one of the four that adds rather than removes or bounds.
- **Defect 5, the gloss example using 'API': RETAINED, with the reason.** COS-15 taught `no_jargon` to grade first use and to forgive 'TERM (a phrase of three words or more)'. 'I updated the API (the messenger that lets two programs talk)' is exactly that shape and now scores 1.0, so the file's worked example demonstrates the compliant form instead of violating it. The description's stated reason for changing it — that following the example scores 0.667 on the heaviest-weighted check — is no longer true, and no other reason survives on its own. Noted but not acted on: line 16 calls dropping the word 'best' and the example shows the fallback, which is a weakness of emphasis rather than a contradiction.

THE CANDIDATE TEXT IS NOT SHIPPED. It measured at sha256 07cca52fb053f289ea7ff5034eae342eb76036d23d8dd384e59bf6f8cc01d58e and is reconstructible from the shipped text (96fdbea4) by these four literal replacements, in any order:

E1: 'A few words in passing, not a sentence of its own. Skip it for a word they used first.' -> 'A few words in passing, not a sentence of its own.'
E2a: 'One number that proves the outcome is not an internal detail. Give it, and give only one.' -> 'One number that proves the outcome is not an internal detail. If you have one, give it, and give only one.' and append after the two quoted examples: ' If you ran nothing, say what you did not check. Never invent a number.'
E2b: '2. **Did it work** - yes, no, or partly. Be direct, then the one number that proves it.' -> '2. **Did it work** - yes, no, or partly. Be direct.'
E2c: '- Say what you checked and what it showed. One sentence, one number.' -> '- Say what you checked and what it showed. One sentence.'
E3: after 'The shape changes with the question. The size never does.' add a blank line and 'When two of these match, the one that fits what they asked wins over the one that fits what you did.'
E4: after '- They asked you to choose - use the decision shape.' add '- The work took many steps - report it once at the end, in whichever shape above fits.' and '- They asked one more thing about work you already reported - use the follow-up shape.'

(The dashes above are ASCII stand-ins; the file uses em dashes. Rebuild, then check the sha256 matches 07cca52f before measuring anything.)

BUNDLE MEASURED, AND THE ABLATION LOST TO A SPEND LIMIT.

Four arms are complete and clean — 300 cells each, 150 per model, **0 errored cells in any of them**:

| arm | run | rules O/S | judge O/S | words O/S | over-cap O/S |
|---|---|---|---|---|---|
| shipped, shared five | `2026-08-17T19-42-55-135Z` | 98.9 / 97.4 | 66.8 / 60.9 | 63.0 / 59.7 | 0.7% / 18.7% |
| bundle, shared five | `2026-08-17T20-05-05-619Z` | 98.7 / 97.2 | 63.8 / 61.1 | 64.7 / 57.5 | 4.0% / 14.7% |
| shipped, reserve six | `2026-08-17T19-53-49-329Z` | 98.1 / 94.9 | 63.9 / 61.4 | 74.5 / 82.4 | 27.3% / 46.0% |
| bundle, reserve six | `2026-08-17T20-14-45-004Z` | 98.3 / 95.4 | 64.6 / 60.8 | 73.9 / 79.4 | 27.3% / 46.7% |

Paired by (case x model), bundle minus shipped, 10 groups a comparison:

- **Shared five** — rules **-0.21 [-0.41, -0.00]**, judge **-1.36 [-4.95, +2.23]**, total -0.79 [-2.62, +1.05], words -0.28 [-2.14, +1.57] (Opus +1.71 [+0.27, +3.16], Sonnet -2.28 [-4.69, +0.13]).
- **Reserve six** — rules **+0.32 [-0.10, +0.74]**, judge **+0.06 [-3.41, +3.54]**, total +0.19 [-1.65, +2.04], words **-1.85 [-3.72, +0.01]** (Sonnet -3.07 [-4.85, -1.30]).

**The bundle is a null result.** The judge does not move on either split. Rules move by a fifth of a point on the shared five and a third of a point the other way on reserve — opposite signs on the two splits is the signature of noise, not of a regression, and neither figure is large enough to act on. The one effect whose interval clears zero on both counts is Sonnet's reply length on reserve, -3.07 words.

**Then the four single-edit arms died.** Partway through the E1 arm the account hit its monthly spend limit, and every subsequent cell returned 'Claude Code returned an error result: You've hit your monthly spend limit'. Of 1200 cells intended for the ablation, **73 are usable** — all Opus, covering only conv-status-auth (30), conv-explain-cache (30) and agentic-read-report (13 of 30). No Sonnet, no conv-status-holdout, no conv-followup-drift. That is not an arm and nothing is concluded from it. The E2, E3 and E4 arms returned 300 errored cells each and zero usable ones.

Runs: `2026-08-17T20-25-32-391Z` (E1, 73/300 usable), `20-29-03-409Z` (E2, 0), `20-30-22-644Z` (E3, 0), `20-31-34-769Z` (E4, 0). They are kept rather than deleted because COS-11's rule is that errored cells are excluded from means, not that they are erased.

**So AC #3 is not met, and AC #3 is the criterion that gates shipping the prose** — 'no bullet ships on the strength of the bundle alone' is the sentence this task exists for. COS-4 failed by adopting a five-edit bundle it could not decompose; adopting a four-edit bundle I cannot decompose would repeat it, and the bundle's own numbers give no independent reason to adopt it. The style file is therefore **reverted to the shipped text at 96fdbea4** and no prose ships from this session. The candidate is recorded above and is one rebuild away.

What the next session has to buy: four arms of 300 cells at 30 repeats on the five shared cases, opus+sonnet, baseline variant, concurrency 12. About 45 minutes at the 26.5 cells/min this machine sustained, against the same `19-42-55` baseline, which does not need re-running.

ABLATION RETRIED AND COMPLETE. The account's spend limit was raised and the four single-edit arms re-ran clean: 300 cells each, 150 per model, **0 errored cells in all four**. Runs `2026-08-18T02-02-28` (E1), `02-12-32` (E2), `02-22-33` (E3), `02-32-33` (E4), all against the same `19-42-55` shared-five baseline (rules 98.9/97.4, judge 66.8/60.9, words 63.0/59.7).

Paired deltas, arm minus baseline, both models pooled (10 groups):

| edit | rules | judge | words | notes |
|---|---|---|---|---|
| E1 (jargon conflict) | +0.10 [-0.25,+0.45] | -0.07 [-5.22,+5.07] | -0.65 [-1.83,+0.53] | Sonnet words **-1.41 [-1.86,-0.96]** clears zero; Sonnet rules +0.33 [+0.01,+0.66] barely clears zero |
| E2 (proof number bound) | -0.16 [-0.45,+0.14] | +0.53 [-1.92,+2.97] | -0.58 [-1.56,+0.39] | flat on every metric |
| E3 (router precedence) | -0.01 [-0.43,+0.41] | +0.69 [-4.66,+6.05] | **-1.42 [-2.49,-0.36]** | Sonnet words -1.97 [-3.80,-0.15] |
| E4 (two router shapes) | +0.09 [-0.21,+0.39] | -0.69 [-4.57,+3.18] | -0.94 [-2.43,+0.54] | flat on every metric |

**No single edit shows harm.** Where an interval clears zero it is a word-count drop (E1, E3 on Sonnet), never a rules or judge fall. AC #3 is met for all four: each has its own individual measurement now.

**But the four-edit bundle measured earlier (`20-05-05`) does not decompose into these.** Its Opus word delta was **+1.71 [+0.27, +3.16]** — a real, statistically significant rise, against a bar of not rising above 63.0 (AC #4). None of the four individual edits shows this; it is an interaction effect of combining them, and it is exactly the failure mode AC #3 exists to catch — a bundle effect no single bullet earns. E4 is the edit with the weakest individual case (every one of its deltas is a null, in either direction) and is the only one of the four that ADDS text rather than removing or bounding it, which is the shape the task's own note flags as having failed twice (COS-1, COS-4). Testing a three-edit bundle (E1+E2+E3, sha256 86451ddb) on the shared five before deciding whether to drop E4.

THREE-EDIT BUNDLE (E1+E2+E3, dropping E4) MEASURED, AND HIT THE SAME SPEND LIMIT AGAIN. Run `2026-08-18T02-43-48`, 300/300 cells written but **56 of 150 Sonnet cells errored** with the same monthly-spend-limit message; Opus is clean at n=150. Sonnet's arm mean (rules 96.3, judge 56.7, words 70.9) is built from the 94 cells that survived and is not comparable to any other arm's 150 — do not read it as a result.

**Opus alone is informative and clean:** rules -0.10 [-0.24, +0.05], judge -3.43 [-13.60, +6.73], words **+0.20 [-2.75, +3.15]**. This is the number the whole side-experiment was run for: dropping E4 takes Opus's word delta from the four-edit bundle's +1.71 [+0.27, +3.16] (a real rise, breaching AC #4) to +0.20 [-2.75, +3.15] (null, well inside noise). **Dropping E4 removes the AC #4 violation.**

Sonnet needs a clean re-run of this same arm before AC #2 or AC #4 can be checked on the three-edit bundle — the spend limit is blocking, not a design problem. Style file left at the E1E2E3 candidate (sha256 86451ddb) pending that.

SESSION PARKED, PER USER DIRECTION. The blocker across both spend-limit hits (20-25 through 20-31 the first time, then the Sonnet half of 02-43-48 the second) is Claude Code's 5-hour usage window, not the monthly account limit misread earlier — it resets on its own, not by anyone raising anything. The user chose to park rather than wait it out.

**What ships this session: nothing from the style file.** `plain-english-beginner.md` is reverted to the shipped bytes (sha256 96fdbea4). Only the doc corrections from the baseline re-measurement ship — see the next note.

**What remains, precisely, for whichever session resumes this:**
1. Re-run the E1+E2+E3 candidate (sha256 86451ddb, rebuildable from EDITS E1/E2/E3 in the recipe above, omitting E4) on the five shared cases, opus+sonnet, baseline, 30 repeats. Sonnet needs a full clean 150; the run at `02-43-48` gave Opus n=150 (clean) and Sonnet n=94 (56 errored) — Opus's arm is usable as-is if the retry only needs Sonnet, but re-running both together is simpler and cheaper than reconciling two partial files.
2. If AC #2 and #4 read clean on that (they were on Opus alone: rules -0.10, words +0.20, both null — the four-edit bundle's Opus word regression came from E4 and dropping it fixed it), measure the same three-edit candidate on the six reserve cases (AC #5). No reserve arm has run on any three-edit candidate yet.
3. Check AC #6 (audit exit 0, checksum match) once the final candidate is set, then the review -> PR -> merge lifecycle.
4. AC #1's decision record already covers all five defects, including retaining defect #5 and now dropping E4 (retained-not-shipped: no individual measured benefit, and it is the one edit that adds rather than removes/bounds, which the task's own note already flagged as the failure-prone shape).

None of the six acceptance criteria are checked. The task stays open.

CORRECTION to plan item 6's arithmetic: it claimed the 15-repeat trim 'saves 750 cells,' but 1200 cells (4 arms x 300) trimmed to 600 (4 arms x 150) saves 600, not 750. Item 6's trim was already reverted by item 7 before anything was measured, so no shipped figure used the wrong number — flagging it only because a stray number in this file is exactly the class of defect this task exists to remove.

SESSION 27: BOTH REMAINING ARMS MEASURED CLEAN. The three-edit candidate (E1+E2+E3, E4 dropped) was rebuilt from the shipped text and its sha256 verified as 86451ddb16b273426eca5318d20169b6bfa1b0f6dd304872c3b9625da7a167c3 — byte-identical to the candidate session 20 recorded, so nothing was re-authored.

Two arms, 300 cells each, 150 per model, **0 errored cells in either**:

| arm | run | rules O/S | judge O/S | words O/S |
|---|---|---|---|---|
| candidate, shared five (30 repeats) | `2026-08-20T03-03-26-462Z` | 99.16 / 97.38 | 66.15 / 60.93 | 62.87 / 58.69 |
| candidate, reserve six (25 repeats) | `2026-08-20T03-13-05-686Z` | 96.96 / 95.19 | 65.39 / 58.09 | 79.37 / 80.88 |

Compared against the same baselines session 20 measured on the shipped bytes — `19-42-55` (shared, 98.95/97.37, 66.77/60.85, 62.99/59.74) and `19-53-49` (reserve, 98.12/94.95, 63.88/61.36, 74.49/82.43). Neither baseline was re-run.

Pooled paired intervals, candidate minus shipped (`node src/cli.mjs interval`, pairs by case x model):

- **Shared five** — rules +0.1 [-0.3, +0.5], judge -0.3 [-3.5, +3.0], composite -0.1 [-1.8, +1.6], words -0.6 [-1.8, +0.7]. 10 pairs.
- **Reserve six** — rules -0.5 [-1.3, +0.4], judge -0.9 [-5.3, +3.6], composite -0.7 [-2.9, +1.5], words +1.7 [-2.6, +6.0]. 12 pairs.

Per-model, paired by case:

| split | model | rules | judge | words |
|---|---|---|---|---|
| shared | opus | +0.22 [-0.05, +0.48] | -0.63 [-6.93, +5.68] | **-0.12 [-2.28, +2.04]** |
| shared | sonnet | +0.00 [-0.92, +0.93] | +0.07 [-5.54, +5.68] | -1.05 [-3.31, +1.21] |
| reserve | opus | -1.17 [-2.86, +0.52] | +1.51 [-5.60, +8.63] | +4.89 [-2.96, +12.73] |
| reserve | sonnet | +0.24 [-0.10, +0.59] | -3.27 [-10.60, +4.07] | -1.55 [-6.21, +3.12] |

**Every one of the 20 intervals above contains zero.** Nothing clears it in either direction, on either split, on any metric.

**The result the whole side-experiment was run for.** The four-edit bundle's Opus word delta on the shared five was +1.71 [+0.27, +3.16] — a real rise that breached AC #4. Dropping E4 takes it to **-0.12 [-2.28, +2.04]**, a null. Session 20 had this on Opus alone (+0.20 [-2.75, +3.15]) with 56 of 150 Sonnet cells lost to the usage window; this run has both models clean at 150 and it holds. E4 was the sole source of the regression.

**One figure worth naming rather than burying:** Opus reserve words, +4.89 [-2.96, +12.73]. The interval is wide and contains zero, so it is not a finding, but the point estimate is the largest movement anywhere in the table and reserve is the noisier split (74.5 to 82.4 words at baseline against 63.0/59.7 on shared). It is recorded here so a later session comparing reserve arms does not read it as new.

**E4 is now RETAINED-NOT-SHIPPED, and that is the fifth AC #1 decision.** Its two router bullets (long session, follow-up) are not in the shipped file. Reasons, in order: its own single-edit arm was null on every metric (rules +0.09, judge -0.69, words -0.94, all straddling zero), so it has no individual case; it is the only one of the four that ADDS a rule rather than removing or bounding one, the shape the task description flags as having failed in both COS-1 and COS-4; and the four-edit bundle carrying it showed an Opus word regression that none of the four singles showed and that dropping E4 removes. Defect #4 (the router omitting two of the file's six shapes) therefore stands open in the file — it is a real gap, but no measured evidence supports closing it this way.

AC VERIFICATION, session 27. Every criterion below is checked against a command run in this session or a run stamp cited from it.

- **AC #1 — five decisions recorded.** Defects 1, 2 and 3 fixed as E1, E2, E3 and shipped. Defect 5 (the gloss example using 'API') retained, reason recorded in the session-20 note: COS-15 taught `no_jargon` to grade first use and forgive the gloss, so the example now scores 1.0 and demonstrates the compliant shape. Defect 4 retained-not-shipped, reason recorded in this session's note: E4's own arm is null on every metric, it is the only one of the four that adds a rule, and the bundle carrying it showed an Opus word regression that dropping it removes.
- **AC #2 — bundle at n >= 146/model on the shared five.** Run `2026-08-20T03-03-26-462Z`, 150 non-errored cells per model against baseline `19-42-55` at 150/model. Paired intervals in the note above.
- **AC #3 — every surviving edit individually measured.** E1 `2026-08-18T02-02-28`, E2 `02-12-32`, E3 `02-22-33`, each 150 cells a model with 0 errored, each paired against the same `19-42-55` baseline. The one edit with no individual case, E4, is not in the shipped file.
- **AC #4 — rules held, length not raised.** Rules 99.16 / 97.38 against the shipped file's 98.95 / 97.37 on the same cases: Opus up 0.21, Sonnet up 0.01. Stating the full precision on purpose — the criterion's '97.4' is the rounded reading of 97.37, and the candidate clears it by a hundredth, not by a margin. Mean reply 62.87 / 58.69 words against 62.99 / 59.74, under both the restated per-model bar (63.0 / 59.7) and the criterion's original pooled 61 (candidate pools to 60.78).
- **AC #5 — reserve validated before and after at the same size.** `19-53-49` (before) and `2026-08-20T03-13-05-686Z` (after), 150 cells a model each, 0 errored in either. Every reserve interval contains zero.
- **AC #6 — audit and checksum.** `node src/cli.mjs audit` exits **0**, all 12 style-vs-contract checks agreeing. The shipped `plain-english-beginner.md` hashes to `86451ddb16b273426eca5318d20169b6bfa1b0f6dd304872c3b9625da7a167c3`, byte-identical to the text both arms measured.

Correction to a claim made mid-session: an earlier audit invocation was piped to `tail`, so the exit code reported was the pipe's, not the audit's. Re-run unpiped, it is 0. No conclusion depended on the masked reading.

Gates: `npm --prefix harness test` 219/219 pass. `lore check` exits 0 on 24 files, 0 errors, 0 warnings.

DOCS UPDATED, because shipping these bytes moves what four published passages describe. `19-42-55` and `19-53-49` measured COS-4's pass-1 text; after this merge they no longer measure the file that ships, and five documents quoted them as 'the shipped text'. Corrected in `FINDINGS.md` (the four-tier table footnote, the pass-1 rules sentence, the judge-did-not-move section, and the sample-size paragraph), `docs/index.md`, `docs/epics/plain-english-output-styles.md`, and the stories `close-the-style-quality-gaps`, `extend-measurement-coverage` and `make-the-measurements-trustworthy`. Two rows added to `docs/reference/experiment-ledger.md` for the new runs, and its persisted-cell total moved 4540 -> 5140.

REVIEW FINDINGS (`/code-review high`, session 27) — twelve raised, eleven fixed on the branch, one deliberately not.

The review verified the measurement layer independently and found it sound: it re-scored both runs, recomputed every mean and all 24 possible paired intervals, re-checked the sha256, and re-ran audit/tests/lore check. Every defect it found was in the prose and record layer.

**Fixed:**
1. `FINDINGS.md` — an edit truncated a line and dropped the word 'Sonnet', leaving a rules figure with no model attached.
2. Three documents said the shipped file removes **four** of the five contradictions. It removes **three**; the fourth (the router's two missing shapes) is retained unfixed and the fifth was closed by COS-15 on the contract side. Corrected in `FINDINGS.md` twice and `make-the-measurements-trustworthy.md` once, and the passage now names what is retained rather than leaving the count to be inferred.
3. `FINDINGS.md` called E4 'a fifth change' in a sentence that twice says 'of the four'. Reworded.
4. **Opus judge on `03-03-26` was published as 66.2; the mean is 0.6614667, so it is 66.1.** A double-round through my own 2-dp intermediate (66.1467 -> 66.15 -> 66.2). `node src/cli.mjs score` prints 66.1. Corrected in all eight places it had propagated to. This is the exact defect class COS-16 exists to remove, introduced by COS-16's own record.
5. The tracker's new Resolved row sat one blank line below the Campaign 2 table, so GFM would have rendered the campaign's largest evidence entry as literal pipe-delimited text. Rejoined.
6. **The tracker claimed COS-16 'cost 3000 cells, 1244 lost'. Both were invented.** Counted from the saved runs: 4500 cells across sessions 20 and 27 (two baselines 600, bundle arms 600, interrupted ablation 1200, retried ablation 1200, first E1+E2+E3 attempt 300, the two clean arms 600) and 1183 lost (1127 + 56). Replaced with the counted figures and their breakdown.
7. **The tracker told the next session to size COS-18 against '26 cells a minute'** — session 20's estimate, not anything session 27 measured. Measured from the run stamps: two 300-cell arms at 9m39s each, 600 cells in 19m18s, **31 cells a minute**. Corrected in both the cursor section and the session log.
8. 'All twenty paired intervals — pooled and per-model, both splits, on rules, judge, composite and reply words' enumerates 24, not 20: per-model composite was never computed. The count of 20 is right and the enumeration was wrong, so the enumeration is now explicit about which 20. (The review computed the four missing per-model composite intervals and all four contain zero, so nothing turns on it.)
9. Four passages still asserted in the present tense that `19-42-55`/`19-53-49` measure 'the shipped text', with the correcting paragraph appended below rather than the sentence fixed — the document stating and denying the same fact two paragraphs apart. Rewritten to 'COS-4's pass-1 text — what shipped until COS-16' in `FINDINGS.md`, `docs/index.md`, the epic, `extend-measurement-coverage.md` and the ledger's `19-42-55` row.

**Raised and deliberately not fixed:** the review is right that E3's precedence sentence reads ambiguously — 'When two of **these** match' sits after the section's closing line, so its nearest plural antecedent is that line rather than the four router bullets, in the one edit whose job was to remove an ambiguity. **Changing it is not available to this task.** The shipped bytes are the measured bytes; any rewording changes the sha256 and breaks AC #6, and shipping unmeasured style text is the precedent COS-1 set and COS-4 violated. Filed as COS-29 rather than smuggled in.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped a three-edit rewrite of `plain-english-beginner.md` (sha256 `86451ddb`) that removes three of the five contradictions COS-4 left, and explicitly retains the other two with recorded reasons. Verified by two clean arms — 300 cells each, 150 per model, 0 errored: `2026-08-20T03-03-26` on the five shared cases and `03-13-05` on the six reserve cases, paired against the same-size baselines `19-42-55` and `19-53-49`. All twenty paired 95% intervals — the four pooled metrics on each split, plus rules, judge and reply words per model on each split — contain zero. AC #4's bars hold at full precision: rules 99.16 / 97.38 against 98.95 / 97.37, mean reply 62.87 / 58.69 words against 62.99 / 59.74. The result the task existed for: the four-edit bundle's Opus word regression of +1.71 [+0.27, +3.16] disappears to -0.12 [-2.28, +2.04] when E4 is dropped — an interaction effect visible only because each edit was also measured alone, which is what COS-4 could not do. Gates: audit exit 0 on 12 checks, 219/219 harness tests, lore check exit 0. Five documents and the experiment ledger updated, because after this merge `19-42-55` no longer measures the file that ships. Branch review raised twelve defects in the record layer: eleven fixed here, including a double-rounded judge figure (66.2 for 66.1) that had propagated to eight places and two invented cell counts in the tracker; the twelfth is filed as COS-29, because fixing it means changing measured bytes.
<!-- SECTION:FINAL_SUMMARY:END -->
