---
id: COS-21
title: Re-test the variant sweep the reinforcement ADR rests on
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:48'
updated_date: '2026-08-27 23:31'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies:
  - COS-10
  - COS-11
  - COS-12
references:
  - harness/config/matrix.json
  - harness/src/workspace.mjs
documentation:
  - docs/adr/reject-harness-level-reinforcement-of-style-rules.md
  - FINDINGS.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ADR *Reject harness-level reinforcement of style rules* is Accepted and its evidence is run `20-12-55`: advanced style, Opus only, five cases per variant, one repeat. **That is five cells per arm** — half the size of the ten-cell arms COS-4 showed carry 95% intervals about 30 points wide, and the ADR's table quotes judge figures to the tenth of a point across a 23.8-point range.

The gaps it draws conclusions from are large — 9.4 points for the `CLAUDE.md` restatement, 4.5 for the forced long prompt — so some of this will survive. But at five cells nobody can currently say which parts, and the ADR is load-bearing: it is why no reinforcement layer exists anywhere in the project, and `FINDINGS.md` recommends deleting tone rules from any CLAUDE.md on the strength of it.

Three things were never varied and each could change the answer:

- **One style.** Only advanced was swept. Beginner is the style whose rules most nearly duplicate what a CLAUDE.md restatement would add, so it is the one where restatement might plausibly help rather than hurt.
- **One model.** Only Opus. The ADR notes the direction replicated on Sonnet for the combined variant alone, which is one variant of five on one extra tier.
- **Style text that no longer ships.** `20-12-55` predates the advanced rewrite that was adopted from the optimizer, and predates COS-1's and COS-4's hand edits entirely.

Re-run it properly and either confirm the ADR, narrow it to what the evidence supports, or supersede it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The five variants are swept at n >= 146 non-errored cells per arm, on current style text
- [ ] #2 The sweep covers more than one style and more than one model, with the choice of which argued from where reinforcement is most likely to help rather than from convenience
- [ ] #3 Every figure carries an interval, and each of the ADR's claims is confirmed, narrowed or withdrawn against them
- [ ] #4 The ADR is updated in place or superseded by a new one, and FINDINGS.md's recommendation to delete CLAUDE.md tone rules is re-stated to match whatever the evidence now supports
- [ ] #5 AMENDED 2026-08-27 (user-approved): wall-clock elapsed and non-errored cell count are recorded per arm, and the ledger's cell total is corrected by counting rows.json on disk rather than by adding to the recorded figure. The original criterion asked for per-arm dollar costs and quoted a 3.9x long-prompt figure; COS-25 deliberately deleted cost tracking from the harness on the user's judgement that subscription-run dollar figures were meaningless, so no field exists to satisfy it. Wall-clock is the substitute the harness actually emits (elapsedMs per row).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Design (session 30)

**Grid — 3 legs, 15 arms, 2250 cells.** Each arm = one (style, model, variant) at 15 cases x 10 repeats = 150 non-errored-target cells, clearing AC #1's 146 floor with headroom for errors.

| leg | why it is in the grid |
|---|---|
| beginner x opus | AC #2's argued choice. Beginner's rules most nearly duplicate what a CLAUDE.md restatement adds, so it is the style where reinforcement could plausibly help rather than hurt. Opus is the ADR's own model. |
| beginner x haiku | Second model. Tests whether the ADR's direction is tier-dependent on the style most likely to break it. |
| advanced x opus | Reproduces the ADR's exact cell (advanced, Opus, 5 variants) at 30x its n, on style text that has since been rewritten. This is the direct confirm/narrow/withdraw test. |

advanced x haiku is deliberately excluded: it answers nothing the other three do not, and costs 750 cells at the slower advanced rate.

**Pacing — user directive 2026-08-27: never exceed ~25% of any 5-hour usage window.** Budget is therefore ~75 minutes of cell running per session; COS-21 spans several sessions and that is expected. Measured rates (tracker, session 29): beginner ~10 cells/min at concurrency 4, advanced ~5/min. So beginner legs are ~75 min each and advanced x opus splits across two sessions. Roughly: s30 beginner x opus, s31 beginner x haiku, s32-s33 advanced x opus, s34 analysis + ADR + FINDINGS.

**Per-session loop.** 2-cell probe to confirm ceilings are clear and to measure this leg's actual rate before committing; then run variant by variant (150 cells each) so the budget can be cut at a variant boundary; record stamp, elapsed and errored count per arm in the notes; stop at budget and hand over.

**Analysis (final session).** interval must be filtered to ONE style and ONE variant per side before use — interval.mjs pairs on caseId|model and ignores both styleId and variantId (COS-30, unfixed). Compare each variant arm against the baseline arm of the same style and model. Then confirm / narrow / withdraw each ADR claim, update the ADR in place or supersede it, and re-state FINDINGS.md's CLAUDE.md-tone-rules recommendation to match.

**AC #5 amended** with user approval: wall-clock + non-errored cell count per arm, and the ledger total corrected by counting rows.json on disk (session 29 flagged the recorded figure 82 short).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Session 30 — leg 1 (beginner x opus), arm 1 of 5

**Usage probe** `2026-08-27T14-44-59-156Z` — 2 cells, 0 errored, 34.4s wall at concurrency 2. Ceilings clear before committing the arm. Per-cell elapsed ~30s at that concurrency, which read three times slower than session 29's Haiku beginner cells and turned out to be startup overhead: the real arm ran at 13.3s a cell.

**Arm: beginner x opus x baseline** — `2026-08-27T14-45-48-462Z`, 15 cases x 10 repeats = **150 cells, 0 errored**. 14:45:48Z to 15:00:28Z = **14m40s, 10.2 cells a minute**, mean cell 13.3s, concurrency 4.

| metric | value |
|---|---|
| rules | **98.34** |
| judge | **67.81** |
| composite | 83.07 |
| mean reply | 72.5 words (0.906x the 80-word cap) |

By split: holdout 86.0, train 84.1, reserve 80.2 composite — reserve is the weakest, consistent with the ledger's note that it is the noisier and longer split. Worst rules on the arm are `no_jargon` 66.7 (n=12, 'cache' and 'repository'), `total_length` 72.0 (n=31) and `sentence_length` 82.5 (n=29).

Throughput note for AC #5 and for sizing the rest: **beginner x opus runs at ~10 cells a minute**, the same rate session 29 measured for beginner on Haiku and Fable, not the ~5 session 28 measured on intermediate and advanced. The 2-cell probe's apparent 30s-a-cell was node startup, not the cell — do not size an arm off a 2-cell probe's wall clock.

## Session 30 — leg 1 arm 2 of 5

**Arm: beginner x opus x long-prompt** — `2026-08-27T15-00-47-276Z`, **150 cells, 0 errored**. 15:00:47Z to 15:15:45Z = **14m58s, 10.0 cells a minute**, mean cell 12.8s.

Rules 97.61, judge 66.07, composite 81.84, mean reply 76.4 words.

**Paired against the baseline arm** (`node src/cli.mjs interval`, 15 case pairs, 10 repeats averaged within each pair; each run directory holds exactly one style, one model and one variant, so the COS-30 pooling trap cannot bite):

| metric | delta | 95% CI | t |
|---|---|---|---|
| rules | −0.7 | [−1.5, +0.1] | −1.94 |
| judge | −1.7 | [−7.2, +3.7] | −0.68 |
| composite | −1.2 | [−4.0, +1.5] | −0.97 |
| words | +3.4 | [−1.6, +8.4] | +1.45 |

**Every interval contains zero.** The ADR's claim for this variant is that forcing the long system prompt 'cost 4.5 points' — measured on advanced x Opus at five cells an arm. On beginner x Opus at 150 cells the point estimate is −1.2 composite and the interval does not exclude no effect. That is one style x model leg of three; nothing is concluded until advanced x opus (the ADR's own cell) is run.

## Session 30 — arm 3 lost to the monthly spend limit, then retried

**`2026-08-27T15-15-54-247Z` — beginner x opus x tail-reminder, LOST.** 150 attempted, **121 errored**, all with `You've hit your monthly spend limit`. Ran 15:15:54Z to 15:19:14Z — 3m20s, which is the tell: a healthy 150-cell beginner arm takes ~15 minutes, so an arm that finishes in three has mostly not run. 29 usable cells is below AC #1's 146 floor, so **no figure uses this directory.** Kept on disk under COS-11's rule that errored cells are excluded from means, not erased. This is the fourth arm this campaign has lost to a usage ceiling (ledger: `20-25-32`, `12-39-16`, `13-21-42`).

**The ceiling then cleared during a ~6-hour pause.** Probe `2026-08-27T21-10-10-825Z`, 2 cells, 0 errored, 37s wall at 21:10Z. Same two-cell practice as sessions 28, 29 and this session's opening probe; it is what established the retry was worth launching.

Cells run before the ceiling bit: 34 minutes' worth (14:44:59Z to 15:19:14Z), well inside the ~75-minute-per-window budget the user set on 2026-08-27 ('never exceed 25% of any given 5 hour limit; I'd rather it take 24+ hours than max out a limit'). **The limit that bit was the monthly spend limit, not the 5-hour window** — the two are different, as the tracker already records, and pacing against the 5-hour window does not protect against the monthly one.

## Session 30 — leg 1 arm 3 of 5 (retried, clean)

**Arm: beginner x opus x tail-reminder** — `2026-08-27T21-10-56-122Z`, **150 cells, 0 errored**. 21:10:56Z to 21:24:51Z = **13m55s, 10.8 cells a minute**, mean cell 12.3s.

Rules 97.69, judge 64.31, composite 81.00, mean reply 75.3 words.

**Paired against the baseline arm**, 15 case pairs:

| metric | delta | 95% CI | t |
|---|---|---|---|
| rules | −0.6 | [−1.4, +0.2] | −1.74 |
| judge | −3.5 | [−11.2, +4.2] | −0.98 |
| composite | −2.1 | [−6.1, +1.9] | −1.12 |
| words | +2.6 | [−1.8, +6.9] | +1.27 |

Every interval contains zero. The ADR put this variant at −0.7 composite and called it 'inside the noise band for five cases'; at 150 cells on beginner x Opus the point estimate is −2.1 and the interval still straddles zero, so the ADR's reading of this variant survives in substance — no measurable effect — with a wider point estimate than it reported.

## Session 30 — leg 1 arm 4 of 5

**Arm: beginner x opus x claude-md** — `2026-08-27T21-25-00-988Z`, **150 cells, 0 errored**. 21:25:00Z to 21:39:55Z = **14m55s, 10.1 cells a minute**, mean cell 12.7s.

Rules 97.98, judge 64.74, composite 81.36, mean reply 72.5 words.

**Paired against the baseline arm**, 15 case pairs:

| metric | delta | 95% CI | t |
|---|---|---|---|
| rules | −0.4 | [−1.2, +0.5] | −0.91 |
| judge | −3.1 | [−9.0, +2.9] | −1.10 |
| composite | −1.7 | [−4.5, +1.1] | −1.33 |
| words | −0.2 | [−3.8, +3.4] | −0.10 |

**This is the ADR's headline claim and the load-bearing one for FINDINGS.md.** The ADR reports restating the rules in `CLAUDE.md` as 'the most damaging at 9.4 points', and FINDINGS.md recommends deleting tone rules from any project `CLAUDE.md` on the strength of it. On beginner x Opus at 150 cells the point estimate is **−1.7 composite with a 95% interval of [−4.5, +1.1]** — a fifth the size, and the interval contains zero. Note that the ADR's 9.4-point figure is a composite arm-mean difference at five cells an arm, not a paired interval, so the comparison is like-for-like only in sign.

Beginner is the style where the task argued restatement was *most* likely to help, so this leg cannot on its own overturn a claim measured on advanced. **advanced x opus is the leg that tests the ADR's own cell and it is not yet run.** No claim is confirmed, narrowed or withdrawn until it is.

## Session 30 — leg 1 arm 5 of 5, and leg 1 summary

**Arm: beginner x opus x all-fixes** — `2026-08-27T21-40-04-356Z`, **150 cells, 0 errored**. 21:40:04Z to 21:54:51Z = **14m47s, 10.1 cells a minute**, mean cell 12.3s. Rules 97.40, judge 63.08, composite 80.24, mean reply 74.3 words.

Paired against baseline, 15 case pairs: rules −0.9 [−2.1, +0.3]; judge **−4.7 [−9.1, −0.4]**, t=−2.32; composite **−2.8 [−5.2, −0.5]**, t=−2.59; words +1.5 [−6.1, +9.2].

### Leg 1 complete: beginner x opus, five variants, 150 non-errored cells each

| variant | rules | judge | composite | words | composite delta vs baseline (95% CI) |
|---|---|---|---|---|---|
| baseline | 98.34 | 67.81 | **83.07** | 72.5 | — |
| long-prompt | 97.61 | 66.07 | 81.84 | 76.4 | −1.2 [−4.0, +1.5] |
| claude-md | 97.98 | 64.74 | 81.36 | 72.5 | −1.7 [−4.5, +1.1] |
| tail-reminder | 97.69 | 64.31 | 81.00 | 75.3 | −2.1 [−6.1, +1.9] |
| all-fixes | 97.40 | 63.08 | 80.24 | 74.3 | **−2.8 [−5.2, −0.5]** |

750 non-errored cells, 0 errored across all five arms, 73 minutes of wall clock.

**Three readings, all provisional until legs 2 and 3 are run:**

1. **Baseline is still best.** Every variant sits below it on composite, judge and rules, and the ordering is monotone in how much reinforcement is stacked. The ADR's *direction* reproduces at 30x its n on a second style.
2. **Only stacking all three layers is measurable.** all-fixes is the one arm whose composite and judge intervals exclude zero. Each layer on its own — long prompt, tail reminder, CLAUDE.md restatement — has an interval that contains zero at 150 cells.
3. **The ADR's per-variant magnitudes and its ranking do not reproduce here.** It has claude-md worst at −9.4 and all-fixes second at −8.7; beginner x Opus has all-fixes worst at −2.8 and claude-md third at −1.7. Every delta is a third to a fifth of the ADR's. Whether that is a style difference or the ADR's five-cell arms is exactly what leg 3 (advanced x opus, the ADR's own cell) settles.

**Wall-clock and cell counts for AC #5**, this session: probe 2 cells / 34.4s; probe 2 cells / 37s; five clean arms 750 cells / 73m17s; one lost arm 150 attempted / 3m20s. **904 cells attempted, 754 non-errored, 121 errored to the monthly spend limit and 29 usable-but-orphaned.**

## Session 30 — review correction

Self-review of the branch diff caught one arithmetic defect in my own leg-1 summary above, corrected here and in the ledger before the PR.

**The session's cell accounting is 904 attempted, 783 non-errored, 121 errored.** The earlier line in these notes reads '754 non-errored ... and 29 usable-but-orphaned', which treats the 29 survivors of the lost arm as something other than non-errored. They are non-errored; they are merely orphaned, because their arm finished 121 cells short of AC #1's floor and no figure can use it. The correct split of the 783 is **750 load-bearing** (the five clean arms), **4 probe cells**, and **29 orphaned**.

Also corrected: the five clean arms total **73m15s** of wall clock (880 + 898 + 835 + 895 + 887 seconds), not the 73m17s written above.

Nothing downstream moves — no published figure, interval or arm mean used either number. Recorded rather than silently edited, per the project's own convention on withdrawn figures.

## Session 31 — leg 2 (beginner x haiku), arm 1 of 5

**Usage probe** `2026-08-27T22-23-51-555Z` — 2 cells, 0 errored, 12.6s wall at concurrency 2. Ceilings clear before committing the arm.

**Arm: beginner x haiku x baseline** — `2026-08-27T22-24-10-642Z`, 15 cases x 10 repeats = **150 cells, 0 errored**. 22:24:10Z to 22:41:28Z = **17m18s, 8.7 cells a minute**, mean cell 17.0s, concurrency 4.

| metric | value |
|---|---|
| rules | **93.31** |
| judge | **44.08** |
| composite | 68.69 |
| mean reply | 87.3 words (1.09x the 80-word cap) |

Haiku sits far below leg 1's Opus baseline (83.07 composite) on the same style and variant: judge 44.08 vs 67.81, rules 93.31 vs 98.34. Mean reply runs **over** the 80-word cap rather than under it (87.3 vs 72.5), and `total_length` is the worst rule on the arm at 51.5 (n=76) — roughly half the cells break the cap. Other weak rules: `code_block_size` 0.0 (n=3), `no_process_narration` 45.0 (n=10), `three_question_structure` 55.6 (n=12), `no_jargon` 64.3 (n=56).

**Leg 2 runs slower than leg 1.** 8.7 cells a minute against leg 1's 10.2, so five arms is ~87 minutes, over the ~75-minute pacing budget. Expect leg 2 to spill an arm into the next session.

## Session 31 — leg 2 arm 2 of 5

**Arm: beginner x haiku x long-prompt** — `2026-08-27T22-41-46-049Z`, **150 attempted, 149 non-errored, 1 errored**. 22:41:46Z to 22:58:55Z = **17m09s, 8.7 cells a minute**, mean cell 18.4s, concurrency 4. 149 clears AC #1's 146 floor.

| metric | value | vs baseline arm | 95% paired interval (n=15 case-pairs) |
|---|---|---|---|
| rules | 93.95 | +0.6 | [-0.4, +1.6] — contains zero |
| judge | **53.51** | **+9.7** | **[+3.9, +15.6] — clears zero** |
| composite | **73.73** | **+5.2** | **[+2.1, +8.2] — clears zero** |
| mean reply | 86.5 words | -1.5 | [-7.5, +4.6] — contains zero |

**This is the first arm in COS-21 where a reinforcement variant helps, and it helps clearly.** On beginner x Opus (leg 1) long-prompt scored 81.84 against an 83.07 baseline — 1.2 down, interval containing zero. On beginner x Haiku the same variant is **5.2 composite up with the interval clear of zero**, driven entirely by judge (+9.7); rules and reply length are both flat.

The mechanism is visible in arm 1's rule breakdown: Haiku's baseline replies run **over** the 80-word cap (87.3 words) and `total_length` is its worst rule at 51.5. Long-prompt does not shorten the replies — words are flat at -1.5 — so the gain is not the cap. It is judged quality at the same length.

**Provisional read, not a conclusion:** the ADR's direction may be tier-dependent, with reinforcement paying off on a weaker model that is failing the style more often to begin with. Leg 3 (advanced x Opus) is still the ADR's own cell and decides its claims. Nothing is narrowed or withdrawn on this arm.

## Session 31 — leg 2 arm 3 of 5

**Arm: beginner x haiku x tail-reminder** — `2026-08-27T22-59-12-594Z`, **150 attempted, 149 non-errored, 1 errored**. 22:59:12Z to 23:15:00Z = **15m48s, 9.4 cells a minute**, mean cell 17.0s, concurrency 4.

| metric | value | vs baseline arm | 95% paired interval (n=15 case-pairs) |
|---|---|---|---|
| rules | 93.96 | +0.6 | [-0.0, +1.2] — touches zero |
| judge | **49.70** | **+6.0** | **[+1.7, +10.3] — clears zero** |
| composite | **71.83** | **+3.3** | **[+1.1, +5.4] — clears zero** |
| mean reply | 85.6 words | -2.3 | [-7.1, +2.6] — contains zero |

**Second consecutive positive arm on Haiku.** Same shape as long-prompt: the gain is judge-side (+6.0), rules is flat-to-marginal and reply length does not move. Tail-reminder is the weaker of the two so far — +3.3 against long-prompt's +5.2 — and their intervals overlap heavily, so this arm does not rank them.

On beginner x Opus (leg 1) tail-reminder scored 81.00 against an 83.07 baseline: 2.1 **down**, interval containing zero. The sign flip between tiers now holds for two of the three reinforcement variants measured on Haiku.

**Note on the run:** a first attempt at this arm was launched from the repo root instead of `harness/` and exited immediately with `MODULE_NOT_FOUND`. It wrote no results directory and cost no cells. The arm above is the only tail-reminder run for leg 2.

## Session 31 — leg 2 arm 4 of 5

**Arm: beginner x haiku x claude-md** — `2026-08-27T23-15-05-218Z`, 15 cases x 10 repeats = **150 cells, 0 errored**. 23:15:05Z to 23:30:30Z = **15m25s, 9.7 cells a minute**, mean cell 16.1s, concurrency 4.

| metric | value | vs baseline arm | 95% paired interval (n=15 case-pairs) |
|---|---|---|---|
| rules | 94.45 | +1.1 | [-0.2, +2.4] — contains zero |
| judge | 46.97 | +2.9 | [-4.1, +9.9] — contains zero |
| composite | 70.70 | +2.0 | [-1.6, +5.6] — contains zero |
| mean reply | **70.6 words** | **-15.9** | **[-22.4, -9.3] — clears zero** |

**The one arm so far whose effect is on length rather than quality, and the effect is large.** The CLAUDE.md restatement pulls Haiku's mean reply from 87.3 words — *over* the 80-word cap — down to 70.6, comfortably under it. That is a 15.9-word drop with the interval nowhere near zero, the largest word-count move measured anywhere in COS-21.

It buys almost nothing on score. Composite +2.0 and judge +2.9 both contain zero, and rules gains only +1.1 despite `total_length` being arm 1's second-worst rule at 51.5. **Shortening the replies did not translate into a better score**, which is worth stating plainly because it is the opposite of what the length rule's weight would predict.

**Ranking so far on beginner x Haiku** (all against the same baseline arm): long-prompt +5.2 (clears), tail-reminder +3.3 (clears), claude-md +2.0 (null). `all-fixes` is unmeasured — it is arm 5 and does not fit this session's pacing budget.

## Session 31 — leg 2 partial summary (4 of 5 arms) and stop

**Stopped at a variant boundary, on budget.** Four arms ran: 17m18s + 17m09s + 15m48s + 15m25s = **65m40s of cell running**, plus a 12.6s probe. A fifth arm is ~16 minutes and would land at ~82 minutes, past the user's ~75-minute (25%-of-window) rule. `all-fixes` is deferred to session 32.

**600 cells attempted, 598 non-errored, 2 errored.** Every arm clears AC #1's 146 floor.

| variant | stamp (2026-08-27) | cells ok/err | rules | judge | composite | words |
|---|---|---|---|---|---|---|
| baseline | `22-24-10` | 150/0 | 93.31 | 44.08 | 68.69 | 87.3 |
| long-prompt | `22-41-46` | 149/1 | 93.95 | 53.51 | **73.73** | 86.5 |
| tail-reminder | `22-59-12` | 149/1 | 93.96 | 49.70 | 71.83 | 85.6 |
| claude-md | `23-15-05` | 150/0 | 94.45 | 46.97 | 70.70 | **70.6** |
| all-fixes | — | not run | — | — | — | — |

**Paired 95% intervals against the baseline arm** (n=15 case-pairs each):

| variant | composite | judge | words |
|---|---|---|---|
| long-prompt | **+5.2 [+2.1, +8.2]** | **+9.7 [+3.9, +15.6]** | -1.5 [-7.5, +4.6] |
| tail-reminder | **+3.3 [+1.1, +5.4]** | **+6.0 [+1.7, +10.3]** | -2.3 [-7.1, +2.6] |
| claude-md | +2.0 [-1.6, +5.6] | +2.9 [-4.1, +9.9] | **-15.9 [-22.4, -9.3]** |

**The sign flips between tiers.** On beginner x Opus (leg 1) every reinforcement variant scored *below* baseline, and only `all-fixes` cleared zero — downward. On beginner x Haiku the same style and the same variants go the other way: two of three clear zero **upward**, and none is negative. Reinforcement appears to help a model that is failing the style more often to begin with, and to cost a model that is already complying.

That is a hypothesis this leg supports, not a finding COS-21 can act on. **Two of its three legs are now in and the ADR is still untouched, deliberately** — the ADR was measured on advanced x Opus, and leg 3 is that exact cell. Nothing is confirmed, narrowed or withdrawn until leg 3 runs.

**Remaining work:** leg 2 arm 5 (`all-fixes`, ~16 min), then leg 3 (advanced x Opus, 5 arms at the slower advanced rate — the plan budgets two sessions for it), then the analysis session that updates the ADR and FINDINGS.md.
<!-- SECTION:NOTES:END -->
