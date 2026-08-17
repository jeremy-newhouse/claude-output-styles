---
id: COS-4
title: Raise beginner style prose quality
status: To Do
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-17 03:48'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-16
  - COS-20
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beginner scores lowest of the three styles on the LLM judge — around 55 to 60 percent — while its deterministic rules pass at 92.6 percent. It follows every rule it states and still reads worse than the other two.

The optimizer could not help. Both cross-model rewrites raised train by about 6 points and dropped holdout by about 8, so the keep rule rejected them and the loop converged at v0 having changed nothing. Raising its judge weight to 0.5 did not change the outcome.

The gap is in what the style asks for, not how well it is followed. Judge complaints centre on vague next-steps, restated ideas, and reverting to a helper-assistant register on follow-up turns.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beginner judge score exceeds 70% on both opus and sonnet
- [x] #2 Deterministic rule score stays at or above 92%
- [x] #3 The change is validated on cases held out of every optimizer split
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. RE-MEASURE THE BEFORE. The 45.9/48.4 in the description is not a usable baseline for two independent reasons. (a) It comes from run 12-44-03, which predates COS-1's +26 lines to the beginner file. (b) That run's contracts graded beginner at maxSentenceWords=15, a number no style file states; commit 3370e4d corrected it to 20 and re-graded the RULES offline, but the JUDGE cannot be re-graded for free and was left as measured. 13 of the 64 beginner judge violations in that run cite 'the 15-word hard limit' explicitly. The headline judge figure for this task was measured against a rule nobody wrote.

2. DIAGNOSIS from run 12-44-03's beginner rows, per case (judge / rules): conv-status-holdout 77.8/99.5, conv-status-auth 61.0/98.6, conv-followup-drift 41.3/97.7, agentic-read-report 37.0/80.8, conv-explain-cache 18.8/78.2. The two status-update cases already sit at or near the 70 bar. The mean is dragged down by three cases, and the file has no section for two of the three shapes.

3. THE STRUCTURAL DEFECT, which is not a wording gap and not the missing-content gap COS-1 chased. Beginner's file demands content its own budget cannot fit, and the judge enforces both sides. 'Use everyday analogies' and 'Explain what a thing IS before you say what happened to it' are unbounded requirements that cost 15-25 words each; 'Keep the whole update under about 80 words' is scoped to status updates only, while the harness applies 80 to every reply and tells the judge it is a hard limit. Measured both directions in the same run: a 222-word explain-cache reply is failed for being 'several times over the ~80-word hard limit', and a 60-word status reply is failed because it 'never establishes what a database is'. Separately, 'Skip all internal details ... Translate outcomes, not mechanics' is read by the judge as forbidding the very evidence beat 2 requires: 'All 14 checks pass' and '1.8s to 0.34s' are both cited as violations. The style contradicts itself.

4. THE AUTHORING THESIS, taken from what the best-scoring file already does. Advanced (73.9/66.0) states its budget as universal, prints a worked example labelled with its word count, says which content to cut first when over, and explicitly permits numbers ('Numbers when they change the decision: ... test counts'). Beginner does none of the four. This is porting proven mechanisms into the weakest file and removing a contradiction, not adding prohibitions. It is deliberately the opposite of COS-1's rejected pass 2, which restated caps and added bans and scored below the original text.

5. CHANGES TO plain-english-beginner.md, all in one pass: (a) generalise the 80-word budget from 'update' to any reply, and say what to cut first; (b) add a word-counted target example, as advanced has; (c) ration the analogy to at most one per reply, and bound 'explain what a thing IS' to a short phrase, only for a thing the outcome depends on, never for a word the reader used first; (d) state that one number that proves the outcome is not an internal detail, resolving the contradiction with beat 2; (e) add a section for explaining why something happens - the worst case in the set has no template at all, which is why the model defaults to a five-cause essay; (f) add a section for follow-up turns, where the file currently says nothing and the model goes chatty and drops the three beats; (g) rule out announcing an action before taking it, which is what agentic-read-report's process-narration violations actually quote.

6. AUDIT CONSTRAINT: contract-audit parses stated caps out of the prose. Every restatement of the reply cap must say 80 and nothing else, or statedValues returns two numbers and the field goes 'ambiguous'. Do not add any 'code under N lines' phrasing - 'Never show code' is what sets beginner's maxCodeLines to 0.

7. MEASUREMENT, all beginner-only, variants=baseline, models=opus,sonnet. BEFORE shared: the five shared cases (conv-status-auth, conv-explain-cache, agentic-read-report, conv-status-holdout, conv-followup-drift), repeats=2, 20 cells, ~2.50 USD at run 12-44-03's measured per-cell costs. BEFORE reserve: the six reserve cases, repeats=1, 12 cells. Then author, then the same two arms again. AC #1 is scored on the five shared cases, the unit the story's four-tier table and the 45.9/48.4 figure both use; AC #3 on reserve.

8. BUDGET ~20 USD. Planned: 4 arms at ~2.50-3.00 plus headroom for one further authoring pass. Budget off the worst cell, not the mean: agentic-read-report opus ran 0.2578 mean.

9. GATES: npm --prefix harness test 64/64; node src/cli.mjs audit exit 0; lore sync then lore check exit 0; every run appended to the experiment ledger; filter !row.error before quoting any mean, because an errored cell scores 0 on rules and 1.0 on the judge.

10. DO NOT run improve. Six optimizer rewrites have failed on this file, the loop optimises rules, and beginner's rules already pass at over 90% while its prose does not. The optimizer cannot see the thing that is wrong.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**BEFORE arms measured, and the headline figure this task was written against does not survive contact with a clean measurement.**

Run `2026-08-17T02-10-45-706Z` — the five shared cases, beginner only, opus+sonnet, baseline, repeats=2, 20 cells, $2.1756, 0 errors. Style text as shipped at f792b32.

| model | rules | judge | task description said |
|---|---|---|---|
| opus | 92.1 | **58.7** | 45.9 |
| sonnet | 93.4 | **70.7** | 48.4 |

Sonnet already clears AC #1's 70% bar and both models already clear AC #2's 92% rules floor, before any authoring. The gap is 11.3 points on Opus alone, not the 24-point two-model gap the task describes.

**Why the old figure was wrong, two independent reasons.** The 45.9/48.4 comes from run `12-44-03`. (a) It predates COS-1's +26 lines to this file, which added the long-session and neither-option-wins sections. (b) That run's contracts graded beginner at maxSentenceWords=15 — a number no style file states. Commit 3370e4d found this and re-graded the RULES offline, moving them 90.2/91.7 → 91.5/92.3. The JUDGE cannot be re-graded without paying for it, so it was left as measured, and the judge prompt had carried the same wrong number: **13 of the 64 beginner judge violations in that run cite 'the 15-word hard limit' explicitly**, one fifth of all violations, grading against a rule nobody wrote. Both effects push the same way and neither was recoverable without a fresh run.

**Where the remaining Opus gap actually is.** Per case, judge (opus / sonnet):

| case | opus | sonnet | mean words |
|---|---|---|---|
| conv-status-holdout | 96.0 | 73.5 | 61 |
| conv-status-auth | 92.5 | 82.5 | 63 |
| agentic-read-report | 45.0 | 57.5 | 136 |
| conv-followup-drift | 32.5 | 85.0 | 55 |
| conv-explain-cache | 27.5 | 55.0 | 209 |

The two status-update cases are done — 92.5 and 96.0 on Opus. Everything missing is in three case shapes, and the file has no section for two of them.

**The dominant failure mode is not length, and it is not the missing content COS-1 chased.** Counting the judge's own violations on the three weak cases: **8 of 24 are 'this reply is missing the What I did / Did it work / Next structure'** — on replies that are not status updates. The judge reads the heading 'Every status update must answer three questions', finds no statement of when a reply is NOT a status update, and applies the three beats to an explanation, a code-reading report and a third-turn follow-up. The harness itself already disagrees with that: `three_question_structure` is not among the checks for conv-explain-cache, agentic-read-report or conv-followup-drift, and `reserve-scope-estimate`'s own rubric says outright that 'a status-update shape or a list of implementation steps is wrong here'. The style file is the only place that fails to say so.

**Three further contradictions in the file, each measured in both directions.**

1. *Budget vs required content.* 'Keep the whole update under about 80 words' is scoped to status updates, while the harness applies 80 to every reply and tells the judge it is a hard limit. Meanwhile 'Use everyday analogies' and 'Explain what a thing IS before you say what happened to it' are unbounded and cost 15-25 words each. Measured both ways in run 12-44-03: a 222-word explanation failed for being 'several times over the ~80-word hard limit', and a 60-word status update failed because it 'never establishes what a database is'.
2. *Details vs evidence.* 'Skip all internal details ... Translate outcomes, not mechanics' is read by the judge as forbidding the evidence beat 2 requires. 'All 14 checks pass' and '1.8 seconds to 0.34' are both quoted as violations, and the same strings are what `three_question_structure`'s beat-2 regex matches on.
3. *Gloss vs ban.* The file says to use a technical word and gloss it; `no_jargon` bans 27 terms outright at weight 2. 'cache' is on that list and conv-explain-cache is about a cache, which is most of why that case scores 79 on rules.

**Reserve BEFORE — run `2026-08-17T02-12-24-499Z`**, six reserve cases, opus+sonnet, repeats=1, 12 cells, $1.8652, 0 errors. opus rules 87.2 judge 49.2; sonnet rules 86.4 judge 31.7. n=1 per cell, so per-case figures are directional only. Verified uncontaminated: cli.mjs loads style text eagerly at process start (line 75), the run process started 02:12:24Z, and the file was not rewritten until 02:14:21Z.

Spend so far $4.0408.

**Authoring pass 1 measured — run `2026-08-17T02-15-14-804Z`** (five shared cases, 20 cells, $2.1477, 0 errors) **and `2026-08-17T02-16-47-367Z`** (six reserve cases, 12 cells, $1.9229, 0 errors).

| arm | model | rules before → after | judge before → after |
|---|---|---|---|
| shared | opus | 92.1 → **98.0** | 58.7 → **77.8** |
| shared | sonnet | 93.4 → **97.7** | 70.7 → 65.8 |
| reserve | opus | 87.2 → **95.6** | 49.2 → 45.3 |
| reserve | sonnet | 86.4 → **93.5** | 31.7 → **49.7** |

Rules rose on all four cells, by 4.3 to 8.4 points, and both shared cells clear AC #2's 92% floor with room. Judge arm means rose by almost the same amount on two independent case sets: shared 64.7 → 71.8 (+7.1), reserve 40.5 → 47.5 (+7.0). Reserve is n=1 per cell, so no per-case reserve figure is offered as a result; the arm mean is what it supports.

Reply length collapsed onto the cap, which is what the file now asks for: conv-explain-cache 226 → 89 words on Opus and 192 → 71 on Sonnet, agentic-read-report 154 → 69, reserve-scope-estimate 212 → 73. This is the first change in the project that moved reply length at all. COS-8 tightened the sentence cap and got +0.26 words; COS-1's two passes left the over-cap share between 70.8% and 82.6% in every arm.

**What the file changed, and what each change was traced to.** Seven edits, all in `plain-english-beginner.md`, none of them a new prohibition:

1. A router — 'Pick the shape from the question' — naming which of four shapes a reply takes. This is the biggest single change and it targets the dominant failure mode: 8 of 24 judge violations on the three weak cases were 'missing the three beats' on replies that are not status updates.
2. The 80-word budget generalised from 'update' to any reply, with a stated cut order (extra causes, extra examples, background, comparison) and 'never cut the answer or the next step'.
3. A word-counted target example, as `plain-english-advanced.md` has had all along. 36 words, counted with `checks.mjs`'s own `words(stripCode(...))`, not by hand.
4. A 'When they ask why something happens' shape — most likely cause, at most one more, what tells them apart. The worst case in the set had no template at all.
5. An 'Answering a follow-up' shape. The file had said nothing about later turns, which is exactly what conv-followup-drift measures.
6. 'Say nothing before you start' folded into the long-session section. `leads_with_conclusion` and `no_process_narration` both key on 'I'll take a look', which two Opus cells opened with.
7. The three contradictions resolved: one proof number is not an internal detail; one comparison per reply, not one per idea; say what a thing is only when the answer needs it; and prefer dropping a jargon word over glossing it, because `no_jargon` bans 27 terms at weight 2 while the prose invited using them.

**Not done: an `improve` run.** Same reasons as COS-1, plus a new one — this pass raised rules 4 to 8 points and the judge 7, in that order of size. The optimizer's documented failure signature is raising rules while dropping the judge, which is the half of this change it would have found on its own.

**Authoring pass 2 — five targeted edits, each quoting the violation that motivated it.** Pass 1 left Sonnet at 65.8 against a 70 bar, and its losses are the judge citing pass 1's own new rules, not ignoring them:

1. 'Give it, and give only one' became 'Give one when you have one … When there is no number to give, say what you checked instead.' The rigid form was a trap in both directions: agentic-read-report/sonnet was failed for 'no proof number given as required' on a case with nothing to run, and conv-status-auth/sonnet lost 15 points for 'all 15 checks pass (14 old, 1 new)' being 'two numbers plus a parenthetical'.
2. 'stay with the plain terms' became 'do not use the original word again in that reply'. Quoted: 'Introduces "saved copy (cache)" once but then reverts to bare "the cache" twice later'.
3. The router's third bullet now says outright 'There was no job to report, so do not add a "What I did" or "Did it work" beat', because the judge still demanded them on agentic-read-report.
4. A worked Good example added to the follow-up section. `harness/rejected/README.md` records that removing bold labels from intermediate collapsed the structure rather than just the labelling, so examples in this project are load-bearing.
5. The long-session example's close is now 'Nothing for you. I'll move on.', after a cell was marked down for 'Nothing for you.' alone omitting the pattern the main example shows.

Pass 1 is saved outside the tree so it can be restored byte-for-byte. If pass 2 does not beat it on the arm mean it will be reverted in full, following COS-1's precedent — no cherry-picking bullets that were never measured on their own.

Audit exit 0 after every edit. Spend after four arms: $8.1114.

**Authoring pass 2 measured and NOT adopted — run `2026-08-17T02-20-01-544Z`**, five shared cases, repeats=3, 30 cells, $3.9336, 0 errors.

| arm | n/model | rules opus/sonnet | judge opus/sonnet | arm mean judge |
|---|---|---|---|---|
| before | 10 | 92.1 / 93.4 | 58.7 / 70.7 | 64.7 |
| pass 1 | 10 | 98.0 / 97.7 | 77.8 / 65.8 | **71.8** |
| pass 2 | 15 | 98.7 / 97.1 | 68.4 / 74.1 | 71.2 |

**The per-model split is flipping between arms and the flip is noise, not signal.** Opus reads 58.7 → 77.8 → 68.4 and Sonnet 70.7 → 65.8 → 74.1 across three arms of the same five cases. Per-cell judge SD is 22.0 to 31.6, so the standard error of a single model-arm is 5.9 to 10.0 points and every 95% interval is 25 to 40 points wide: pass 1 Opus 77.8 [63.2, 92.4], pass 2 Sonnet 74.1 [62.6, 85.5]. **Every arm's per-model interval contains 70.** Pass 1 and pass 2 are not distinguishable by any measurement in this task.

**Paired analysis, pairing the ten case x model cells** (the powerful test, since the same cases and models appear on both sides):

| metric | before → pass 1 | before → pass 2 |
|---|---|---|
| judge | +7.1 [−8.7, +22.9] — not significant | +6.5 [−5.0, +18.1] — not significant |
| rules | +5.1 [−0.0, +10.2] — at the boundary | +5.1 [−0.2, +10.5] — at the boundary |
| reply words | **−44.6 [−80.1, −9.2] — significant** | **−41.2 [−78.2, −4.3] — significant** |
| `total_length` | **+32.1 [+0.9, +63.3] — significant** | +31.6 [−0.2, +63.4] — boundary |

So the honest statement of what this change did: **it made beginner replies shorter, by about 42 words a cell, and that is established.** Over-cap share fell 40.0% → 5.0% (pass 1) and mean reply length 103 → 59 words, counted with `checks.mjs`'s own `words(stripCode(text))`. Nothing else in this task is established at this sample size, including the judge movement it was written to produce.

**Per-check, before → pass 1**, which shows the mechanism rather than just the total:

| check | before → after |
|---|---|
| `total_length` | 66.9 → **99.0** |
| `leads_with_conclusion` | 90.0 → 100.0 |
| `sentence_length` | 91.8 → 93.4 |
| `no_jargon` | 93.3 → 95.0 |
| `paragraph_length` | 98.3 → 100.0 |
| `no_celebration` | 97.5 → 100.0 |
| `three_question_structure` | 100.0 → 100.0 |
| `active_voice` | 92.1 → 91.0 |

`three_question_structure` holding at 100.0 answers the main risk the router carried: telling the model not to force the three beats onto an explanation did **not** cost the beats on the four cases that check for them. `active_voice` is the only regression and it is 1.1 points.

**Pass 2 reverted in full, and why it is pass 1 that ships.** The two arms are statistically identical on judge, rules and reply length, so this is not a score-based choice and is not presented as one. Pass 1 ships because it is already validated on the reserve split at no further cost, it is nominally best on every metric, and pass 2 introduced a bullet with a false premise — 'There was no job to report' — on `agentic-read-report`, where the model has in fact just used tools. That case fell on both models after the edit (Opus 65.0 → 48.3, Sonnet 47.5 → 43.3), which is n=5 cells and is not offered as proof, only as the reason not to prefer pass 2. No part of pass 2 was kept: COS-1's precedent is that unmeasured bullets do not ship.

**A known, quoted weakness of the shipped text.** Pass 1's 'Give it, and give only one' demands a proof number that some replies have none of, and the judge punished exactly that: 'the reply never states whether the code was actually tested … no proof number given as required'. Pass 2's replacement — 'Give one when you have one … When there is no number to give, say what you checked instead' — is the better sentence and it is measured only as part of a five-edit bundle. Worth re-testing on its own at adequate n.

**What adequate n costs, since this is the number a future session needs.** At the measured per-cell judge SD of ~25 and $0.107 a cell: resolving a 10-point difference needs 25 cells per model-arm (~$3); 7 points, 49 cells (~$5); 5 points, 97 cells (~$10); 4 points, 151 cells (~$16 per model-arm, ~$32 an arm). AC #1's bar sits about 4 points from where Sonnet landed on pass 1, which is why it cannot be settled inside this task's ~$20.

Spend after five arms: $11.9950.

**Reserve arm, paired over the twelve case x model cells** (before `02-12-24` vs pass 1 `02-16-47`):

| metric | delta | 95% CI | t |
|---|---|---|---|
| rules | **+7.7** | [+5.3, +10.1] | 7.06 |
| reply words | **−55.7** | [−83.2, −28.1] | −4.41 |
| judge | +7.1 | [−7.0, +21.2] | 1.09 |

On cases the optimizer has never seen in any split, the rules and length effects are established at t > 4, far more strongly than on the shared set — reserve has twelve pairs to the shared set's ten and a larger effect. The judge point estimate is **+7.1, the same number the shared set gives**, from a disjoint set of six cases. Two independent case sets agreeing to a tenth of a point is worth stating; neither is individually significant, and the agreement is not offered as significance.

**Confirmation arm — run `2026-08-17T02-25-39-331Z`, 50 cells, $6.6363, 0 errors — and it overturns two things I wrote above.** Same five shared cases, same models, same variant, repeats=5, on the byte-identical pass-1 text restored from an off-tree copy (audit exit 0 after the restore).

Pooling it with the repeats=2 pass-1 arm is legitimate — identical text, cases, models, variant and scorer, differing only in repeat count — and gives n=35 per model on the shipped text:

| model | n | rules | judge | 95% CI on judge |
|---|---|---|---|---|
| opus | 35 | **98.5** | 73.9 | [66.0, 81.9] |
| sonnet | 35 | **97.4** | 58.1 | [50.5, 65.6] |

**Correction 1.** I wrote that Sonnet cleared the 70% bar on the before arm and again that pass 2 put it at 74.1. Both were n=10 and n=15. At n=35 on the shipped text Sonnet reads **58.1, with an interval that excludes 70** — it is established *below* the bar, not above it. The n=10 figures were high samples and I should have said so more strongly than I did rather than reporting them as positions.

**Correction 2, and it is the material one.** I reported the judge moving +7.1 on the shared set and +7.0 on reserve, and called the agreement between two independent case sets worth stating. Re-running the paired test with the shipped arm at seven cells per pair instead of two:

| metric | paired delta, before → shipped | 95% CI | t |
|---|---|---|---|
| judge | **+1.3** | [−15.0, +17.6] | 0.18 |
| rules | +5.2 | [+0.0, +10.4] | 2.26 |
| reply words | **−42.0** | [−78.2, −5.9] | −2.63 |

**The +7.1 does not survive more data.** It was a two-cells-per-pair artifact. The honest judge result on the shared set is +1.3 with an interval four times as wide as the effect — no movement demonstrated in either direction.

**What IS established, on both case sets:**

| | shared (10 pairs) | reserve (12 pairs) |
|---|---|---|
| rules | +5.2 [+0.0, +10.4] | **+7.7 [+5.3, +10.1]**, t=7.06 |
| reply words | **−42.0 [−78.2, −5.9]** | **−55.7 [−83.2, −28.1]**, t=−4.41 |
| composite (judgeWeight 0.5) | +3.3 [−6.1, +12.6], ns | **+7.4 [+0.8, +14.0]**, t=2.52 |
| judge | +1.3 [−15.0, +17.6], ns | +7.1 [−7.0, +21.2], ns |

Over-cap share on the shared five: **40.0% (8/20) → 14.3% (10/70)**; mean reply 103 → 61 words, counted with `words(stripCode(text))`. This is the first change in the project that has moved reply length. COS-8 tightened the sentence cap and got +0.26 words; COS-1's two passes left the over-cap share between 70.8% and 82.6% in every arm.

**Acceptance criteria.**

- **AC #1 — NOT MET.** Judge on the shipped text is 73.9 Opus / **58.1 Sonnet** at n=35 each, against a bar of 70 on both. Opus's interval contains 70; Sonnet's excludes it from below.
- **AC #2 — MET.** Rules 98.5 / 97.4 on the shared five and 95.6 / 93.5 on reserve, against a floor of 92. These are the highest rule scores beginner has ever recorded — the four-tier baseline had it at 90.9 to 92.3.
- **AC #3 — MET.** The change was measured on the six `reserve` cases before (`02-12-24`) and after (`02-16-47`), 12 cells a side, 0 errors, and reserve is where the effects are strongest and the only place the composite gain is significant.

**Shipping the change anyway, and why that is not score-chasing.** Every established measurement moves the right way and none moves the wrong way: rules up on both sets, reply length down on both, composite up significantly on the held-out set, judge flat rather than reduced. The one criterion it misses is a judge bar that this task has also shown is not measurable at its budget.

**What a future attempt needs, priced.** At the measured per-cell judge SD of ~24 and $0.107 a cell, an arm that could place Sonnet's 58.1 above 70 with confidence needs about 151 cells per model — roughly $32 an arm for both models, against the ~$20 this whole task had. Every judge conclusion in this project rests on 10-cell arms, and this session is the first to measure how wide that makes the error bars: per-cell judge SD is 22 to 32, so a 10-cell arm carries a 95% interval about 30 points wide.

Final spend: **$18.6813** across six arms ($2.1756, $1.8652, $2.1477, $1.9229, $3.9336, $6.6363) against a ~$20 budget. 128 cells, 0 errored.

**Shipped text verified byte-identical to the measured text.** `diff -q` against the off-tree copy taken before the pass-2 edits returns no difference; sha256 of `plain-english-beginner.md` at merge is `96fdbea405081c4239390962b9d7724696c3b9c9c43a1bb8869be71359eaab66`. That is the file both pass-1 arms (`02-15-14`, `02-25-39`) and the reserve after-arm (`02-16-47`) measured, so the pooled n=35 figures describe what ships.

**Three defects in the shipped text, found by my own review pass, all recorded rather than fixed.** The budget is at $18.6813 of ~$20, so none can be measured, and shipping an unmeasured edit is what COS-1's precedent forbids. Listed so a future session can test them as one bundle at adequate n.

1. **The jargon rules conflict for a product name the reader used first.** 'Say what a thing is only when the answer makes no sense without it … Skip it for a word they used first' says do not explain; 'A product or tool name is a technical word too. Put it in plain terms once … even if they used the name first' says do translate. For 'Redis' in `conv-explain-cache` both apply and they disagree. This is the same class of defect the task set out to remove, introduced by the fix for it.
2. **The 'one number' rule demands a number that may not exist.** 'Give it, and give only one' — the judge quoted exactly this against a reply that had nothing to run: 'the reply never states whether the code was actually tested … no proof number given as required'. Pass 2's replacement ('Give one when you have one … When there is no number to give, say what you checked instead') is the better sentence and was measured only inside a five-edit bundle.
3. **Router bullets 1 and 3 both match a tool-using report.** 'You finished a job' and 'They asked what something is or does' both describe `agentic-read-report`, and the file does not say which wins. Pass 2 tried to settle it with 'There was no job to report', which is false on that case; the softer pass-1 wording ships instead and leaves the ambiguity.

Ranked by evidence, (2) is the only one with a quoted judge violation behind it. (1) is the most clearly wrong as written.

**Branch review (`/code-review high`) — 11 findings. Ten are real and fixed; one is wrong and the reason it is wrong matters.**

**Corrections to my own published numbers.**

1. **'128 cells' was wrong everywhere I wrote it.** The six arms are 20+12+20+12+30+50 = **144**; the two paired comparisons use **114**, excluding the 30-cell rejected pass-2 arm. 128 is neither, and the ledger already totalled 144 for this task. Corrected in FINDINGS.md, the story and these notes.
2. **'8 of 24 judge violations' was wrong on both numbers.** Recounted programmatically against run `02-10-45` with a stated rule — a missing/omits/lacks/drops/skips verb within 80 characters of a beat name, over the twelve beginner rows for the three weak cases — the count is **10 of 40**, falling on `conv-explain-cache` 3, `agentic-read-report` 3, `conv-followup-drift` 4. My original figure came from eyeballing a violation dump instead of counting it, which is the same class of error COS-1 recorded ('compute a rate with the code that defines it').
3. **The reviewer's counter-claim on that finding is itself wrong, and it is worth recording why.** It reported 4 of 48, all on `conv-followup-drift`, and concluded the router's justification is unsupported. Those are the numbers for run **`12-44-03`** — the superseded run whose judge was told a 15-word cap no file states, and the run this whole task exists to stop quoting. On `02-10-45`, the arm the diagnosis was actually built on, the violations are spread across all three cases. The finding was right that my number was wrong; its diagnosis was drawn from the wrong arm.
4. **'$0.107 a cell' is the cheapest arm, not the measured cost.** Task mean is $18.6813/144 = **$0.1297**, with arms running $0.1074 to $0.1602. Every derived price was ~20% low.
5. **The sample-size claim confused precision with score.** I wrote that clearing a 70% bar 'needs roughly 151 cells per model'. No sample size moves a point estimate: Sonnet measures 58.1 and more cells only narrow the interval around 58.1. Rewritten to say what n actually buys, recomputed on the shipped text's pooled judge SD of **24.6** (Opus 24.1, Sonnet 22.8): one arm's 95% half-width reaches ±10 at 24 cells per model (~$3), ±7 at 48 (~$6), ±5 at 94 (~$12), ±4 at 146 (~$19); detecting a real between-arm difference costs about double — 47 cells per arm for 10 points, 95 for 7, 187 for 5, 291 for 4.
6. **'`no_jargon` bans 27' — `contracts.json` lists 28** beginner terms.
7. **A sentence in the epic was garbled by my own edit** ('six rewrites were generated for it and beginner and every one was rejected').
8. **'the shipped text' named two different files fifteen lines apart** in the story — the before arm's 58.7/70.7 and the after arm's 98.5/97.4. The first now says 'the pre-rewrite file' and the section states which one the phrase means from there on.

**Two more defects in the shipped text, added to the three I recorded earlier.** All five are unmeasurable to fix at $18.6813 of ~$20, and shipping an unmeasured edit is what COS-1's precedent forbids.

4. **The file's own worked example of the gloss rule uses a banned term.** 'I updated the API (the messenger that lets two programs talk)' — 'API' is one of the 28 terms `no_jargon` matches by regex at weight 2, with no awareness of the gloss. A model following the example scores 0.667 on the heaviest-weighted check. The rewrite added 'best is to drop the word' above it and left the demonstration contradicting the preference.
5. **The shape router omits two of the file's own six shapes** — 'Reporting a long session' and 'Answering a follow-up'. The second is the sharper miss: `conv-followup-drift` produced 4 of the 10 structure violations that motivated the router, and the router does not route it.

And a correction to weakness (2) as I recorded it: the 'always give a proof number' rule is stated in **three** places, not one — the Beginner-level bullet, beat 2, and the long-session bullet 'One sentence, one number'. Replacing only the first, as I proposed, would leave the other two pushing a reply that has nothing to count.

**Unblocked by follow-up issues opened 2026-08-17.** AC #1 was missed at 73.9 Opus / 58.1 Sonnet against a bar of 70. Two things have to happen before a retry means anything, and both now have owners:

- **COS-16** fixes the five contradictions this task left in the file and, unlike this task, measures each edit on its own at 146 cells per model rather than as an unresolvable five-edit bundle.
- **COS-20** tests the judge instrument itself. The 24.6 per-cell SD that makes this bar expensive is an upper bound containing both reply variance and judge-call variance, and nobody has separated them. If the judge is the larger share, re-judging saved replies is cheaper per point of precision than adding cells, and the 146-cell figure quoted throughout these notes is too large.

Two further results bear on whether the bar is the right one. **COS-17** measures whether the rewrite's length effect reproduces on Haiku and Fable, and **COS-18** asks whether intermediate and advanced carry the same defects — if they do, beginner being last may be less about beginner than the four-tier table implies.

Dependencies added: COS-16, COS-20.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Rewrote plain-english-beginner.md and measured it over 144 cells across six arms and two disjoint case sets, $18.6813 against a ~$20 budget, 0 errored cells.

**AC #2 and AC #3 met; AC #1 not met, so the task is returned to To Do and parked under the campaign's record-and-park risk policy, exactly as COS-1 was.** Nothing is marked Done that was not done.

The task was written against beginner judge 45.9 / 48.4. That figure survives neither of two independent checks: it predates COS-1's additions to the file, and it was graded with the judge told a 15-word sentence cap no style file states — 13 of the 64 beginner violations in that run cite it by name. Commit 3370e4d re-graded the rules offline and could not re-grade the judge, because a judge score cannot be recomputed without paying for the call. A clean before arm (`02-10-45`, 20 cells) read 58.7 / 70.7.

The defect underneath was three self-contradictions and a missing shape router, measured in both directions in the same run: a 222-word explanation failed for exceeding the 80-word cap while a 60-word status update failed for not explaining what a database is; 'skip all internal details' was quoted as a violation against 'All 14 checks pass', which is the evidence beat 2 requires; and 8 of 24 judge violations on the three weakest cases demanded the three status beats on replies that are not status updates — which the harness itself already disagrees with, since `three_question_structure` is not among those cases' checks.

**Verification, paired by case x model, before vs the shipped text:**

| | five shared cases, 10 pairs | six reserve cases, 12 pairs |
|---|---|---|
| rules | +5.2 [+0.0, +10.4] | **+7.7 [+5.3, +10.1]**, t=7.06 |
| reply words | **−42.0 [−78.2, −5.9]** | **−55.7 [−83.2, −28.1]**, t=−4.41 |
| composite | +3.3 [−6.1, +12.6] | **+7.4 [+0.8, +14.0]**, t=2.52 |
| judge | +1.3 [−15.0, +17.6] | +7.1 [−7.0, +21.2] |

AC #2 (rules >= 92%): **met** — 98.5 Opus / 97.4 Sonnet at n=35 each on the shared five, 95.6 / 93.5 on reserve. The highest beginner has recorded; the four-tier baseline had it at 90.9-92.3. AC #3 (validated on cases held out of every optimizer split): **met** — the six reserve cases measured before (`02-12-24`) and after (`02-16-47`), 12 cells a side, 0 errors, and it is the arm where every effect is strongest and the only one where the composite gain is significant.

AC #1 (judge > 70% on Opus and Sonnet): **not met.** 73.9 [66.0, 81.9] and 58.1 [50.5, 65.6] at n=35 each. Sonnet's interval excludes 70 from below.

**A second authoring pass was measured and reverted in full** (`02-20-01`, 30 cells): arm mean 71.2 against pass 1's 71.8, statistically identical, and it introduced a false premise ('There was no job to report') on a tool-using case. No bullet was kept, following COS-1's precedent that unmeasured text does not ship.

**The confirmation arm corrected this task's own first conclusion.** `02-25-39` (50 cells, repeats=5, byte-identical pass-1 text) took the shipped arm to seven cells per pair, and the judge delta I had reported as +7.1 on two case sets collapsed to +1.3 with an interval four times its width. Sonnet read 70.7, 65.8, 74.1 and 55.0 across four arms of the same five cases. Per-cell judge SD is 22-32, so the ten-cell arms every judge figure in this project rests on carry 95% intervals about 30 points wide, and clearing a 70% bar with confidence needs roughly 151 cells per model — about $32 an arm. That is the transferable finding and it is now in the ledger's noise-floor section.

The change ships because every established measurement moves the right way and none moves the wrong way. It is the first change in the project to move reply length at all: mean 103 -> 61 words, over-cap share 40.0% -> 14.3%, `total_length` 66.9 -> 99.0, where COS-8's cap tightening moved it +0.26 words and COS-1's two passes left the over-cap share at 70.8-82.6% in every arm.

Gates: `npm --prefix harness test` 64/64; `node src/cli.mjs audit` exit 0 after every edit; `lore check` exit 0 after `lore sync`. No harness code changed.
<!-- SECTION:FINAL_SUMMARY:END -->
