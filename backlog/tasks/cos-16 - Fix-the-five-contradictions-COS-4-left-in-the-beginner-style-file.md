---
id: COS-16
title: Fix the five contradictions COS-4 left in the beginner style file
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:46'
updated_date: '2026-08-18 01:56'
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
- [ ] #1 Each of the five defects is either fixed or explicitly retained, with the reason recorded
- [ ] #2 The bundle is measured against the shipped text at n >= 146 cells per model on the five shared cases, which is what a 95% half-width of +/-4 points costs at the measured judge SD of 24.6
- [ ] #3 Every individual edit that survives into the shipped file has its own measured effect, so no bullet ships on the strength of the bundle alone
- [ ] #4 Deterministic rule score stays at or above the 98.5/97.4 the current file reaches, and mean reply length does not rise above 61 words
- [ ] #5 Validated on the six reserve cases at the same sample size, before and after
- [ ] #6 node src/cli.mjs audit exits 0 and the shipped file is verified byte-identical to the measured text by checksum
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
<!-- SECTION:NOTES:END -->
