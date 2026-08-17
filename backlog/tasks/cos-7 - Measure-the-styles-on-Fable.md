---
id: COS-7
title: Measure the styles on Fable
status: Done
assignee:
  - '@claude'
created_date: '2026-08-16 13:07'
updated_date: '2026-08-17 00:14'
labels:
  - 'doc:stories/extend-measurement-coverage'
dependencies: []
documentation:
  - FINDINGS.md
  - docs/stories/extend-measurement-coverage.md
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fable is the top model tier and has never been measured. All coverage to date is Opus and Sonnet, plus a Haiku task that tests the opposite end.

The two ends test different things. Haiku asks whether a style file carries its own weight under a model likely to drop instructions. Fable asks whether a more capable model needs the file at all, and whether it drifts further from a stated cap in the direction it already leans — Opus already overruns word caps roughly twice as often as Sonnet, so tier and verbosity may be correlated rather than model-specific.

Fable is also the tier used for the longest-running agentic work, which is where the styles are weakest: agentic-fix-verify scores around 48% on the judge across every style and both measured models.

The SDK model value is claude-fable-5[1m]; there is no bare fable alias in the model list. Note Fable is the most expensive tier — scope the case set before running.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All three styles measured on Fable across the standard case set, rules and judge reported separately
- [x] #2 Per-model comparison in FINDINGS.md covers Fable alongside opus, sonnet, and haiku
- [x] #3 Whether word-cap overrun tracks model tier is answered from the Opus, Sonnet, and Fable figures
- [x] #4 The one-file-for-every-model decision is confirmed for Fable or amended
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Confirm the SDK accepts model id 'claude-fable-5[1m]' with ONE cheap cell (1 style x 1 conversational case x 1 repeat, --no-judge) before launching any matrix. A wrong id would burn the whole run.
2. Add Fable to config/matrix.json models so the id is recorded in config, not only in a shell history.
3. Scope the case set deliberately: run the FIVE case ids that run 12-44-03 used (conv-status-auth, conv-explain-cache, agentic-read-report, conv-status-holdout, conv-followup-drift) x 3 styles x 2 repeats x baseline = 30 cells. That drops straight into the existing four-column comparison with no slicing. Verify first, in git, that those case definitions, the style files, checks.mjs and contracts.json are unchanged since 12-44-03 and 22-59-53.
4. Check rows.filter(r => r.error) BEFORE computing any mean. Fable is the long-agentic tier; if it aborts on the 12-turn limit, report replies-only and counting-no-reply-as-0 separately as COS-5 did. Do not change maxTurns - that would break comparability.
5. AC #1: report rules and judge separately for all three styles on Fable.
6. AC #2: extend FINDINGS.md's per-model table to a fourth model, plus the epic status snapshot and the story's coverage table.
7. AC #3: answer whether word-cap overrun tracks model tier. total_length is the relevant check; measure reply length with checks.mjs's own words(), never a hand-rolled split.
8. AC #4: confirm or amend the one-style-file-for-every-model ADR for Fable.
9. Add the run to the experiment ledger.
10. Gates: npm --prefix harness test green; node src/cli.mjs audit exit 0; lore sync then lore check exit 0.
11. Update doc-1 on the branch (COS-7 resolved, cursor -> COS-1, session log), commit with Refs: COS-7, /code-review high, PR into dev, rebase-merge, promote main, prune.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Runs

Three paid runs, $14.4290 total against a ~$20 budget.

- `results/2026-08-16T23-47-08-329Z` — 5 cells, $1.5842. Model-id probe. Confirmed the SDK accepts `claude-fable-5[1m]`. **Cost more than it needed to:** the invocation named --models/--styles/--cases/--repeats but not --variants, so it ran all five variants instead of one cell. The five-variant spread is itself useful (baseline $0.1910/cell, long-prompt $0.7384 — 3.9x) but it was not the intent.
- `results/2026-08-16T23-48-45-195Z` — 30 cells, $7.0363, **0 errors**. 3 styles x Fable x baseline x the five shared case ids x 2 repeats. $0.2345/cell against opus $0.1493, sonnet $0.1013, haiku $0.0232.
- `results/2026-08-16T23-53-02-801Z` — 6 cells, $5.8085, **0 errors**. 3 styles x Fable x baseline x `agentic-fix-verify` x 2 repeats. $0.9681/cell — 4.1x a shared-five cell.

## Reuse preconditions re-verified before quoting the earlier runs

Required because the four-tier table reuses `12-44-03` (opus, sonnet) and `22-59-53` (haiku) rather than re-running them (~$11.5 to redo).

- The five shared case definitions are byte-identical across 444b221 / 3370e4d / 8a76f13 / 49fd1fa / HEAD.
- `checks.mjs` and all three style files are byte-identical from 444b221 through HEAD.
- `contracts.json` changed once, at 3370e4d, which lands after `12-44-03`. Settled by re-scoring: `12-44-03` and `22-59-53` re-scored offline with today's scorer reproduce all twelve published FINDINGS figures exactly (opus 97.8/94.2/91.5 rules, 73.9/63.9/45.9 judge; sonnet 96.8/95.6/92.3, 66.0/72.6/48.4; haiku 96.0/94.3/90.9, 52.9/62.2/37.5).

The only remaining difference between the columns is that they are separate invocations, which is what the table's caption already says.

## AC #1 evidence — Fable, shared five, baseline, 2 repeats, 0 errors

| style | rules | judge |
|---|---|---|
| advanced | 97.9 | 78.3 |
| intermediate | 93.1 | 67.7 |
| beginner | 91.4 | 53.9 |

Fable is best-of-four on advanced rules (97.9), on advanced judge (78.3) and on beginner judge (53.9). It is **last of four on intermediate rules** (93.1) and second on intermediate judge (67.7, behind Sonnet's 72.6). The top tier does not sweep.

## AC #3 evidence — word-cap overrun does not track model tier

The measure is mean reply words / that style's own cap, so all three levels pool
on one scale. Reply length uses `words(stripCode(text))` — `checks.mjs`'s own
tokenizer, not a hand-rolled split. Paired over 15 (style x case) cells, each the
mean of that cell's two repeats, which removes case and style as confounds.

| model | $/cell | mean words/cap | over-cap share | `total_length` |
|---|---|---|---|---|
| haiku | 0.0232 | 1.088 | 33.3% | 74.7 |
| sonnet | 0.1013 | **0.961** | 30.0% | 79.1 |
| opus | 0.1493 | **1.300** | 43.3% | 71.7 |
| fable | 0.2345 | 1.229 | 40.0% | 75.0 |

Tier order by measured cost is haiku < sonnet < opus < fable. Overrun in that
order is 1.088, 0.961, 1.300, 1.229 — non-monotonic at both ends.

Paired differences, 95% CI, n=15:

- haiku − sonnet **+0.127 [+0.034, +0.219]** — the cheapest model overruns MORE than the second cheapest. A tier gradient would need the opposite sign.
- opus − fable +0.070 [−0.118, +0.259] — the top two tiers are indistinguishable.
- sonnet − opus **−0.339 [−0.643, −0.034]**
- sonnet − fable **−0.268 [−0.434, −0.103]**
- haiku − opus −0.212 [−0.557, +0.133]; haiku − fable −0.142 [−0.350, +0.067] — both unresolved.

The only structure the data resolves is that **Sonnet keeps to the cap and the
other three do not.** That is one model, not a tier.

The story's premise was 'Opus overruns roughly twice as often as Sonnet, which
may be a property of that model or a property of the tier.' Answer: property of
the model. Also, on the current style files the ratio is 1.44x (43.3% vs 30.0%),
not 2x — the 'twice' figure came from run `20-10-29`, whose advanced style text
has since been replaced.

## AC #4 evidence — one file for every model, confirmed at the top tier

- **Rules ranking is identical on all four models**: advanced > intermediate > beginner (fable 97.9/93.1/91.4; opus 97.8/94.2/91.5; sonnet 96.8/95.6/92.3; haiku 96.0/94.3/90.9).
- Fable's rule compliance is 91.4–97.9, i.e. the top tier gives up nothing. It is never more than 2.5 points behind the best of the other three (its worst gap is intermediate, 93.1 against Sonnet's 95.6).
- Per-rule, Fable drops the same subsets the others do, not different ones: `total_length` 75.0, `leads_with_conclusion` 83.3, `sentence_length` 90.6, `no_process_narration` 91.7. Those four are exactly the rules the other tiers drop; the **remaining eight score 96.7–100.0 on all four models at once** — the binding minima are haiku `no_jargon` 96.7, sonnet `three_question_structure` 97.2 and opus `active_voice` 97.6.
- No rule is Fable's requirement and another model's exception, which is the ADR's actual test.

**One correction the fourth tier forces.** The ADR's COS-5 paragraph says 'the
ranking of styles is identical on every model'. That is true of rules and true of
beginner being last on the judge, but it is not true of the judge's top two: haiku
and sonnet both rank intermediate above advanced (62.2>52.9 and 72.6>66.0), while
opus and fable rank advanced above intermediate (73.9>63.9 and 78.3>67.7). The
swap was already present in the three-model data and the ADR overstated it. It
does not argue for per-model files — it is about which audience level reads best,
not about which rules a model needs — but the sentence has to say what was
measured.

## Fable on write-then-verify work, and a harness defect it exposed

`agentic-fix-verify` is the one write-then-verify case all four tiers have now
run. **Fable: 0 aborts in 6 cells** (Haiku 5 in 6, Opus 0 in 6, Sonnet 0 in 6).
The top tier finishes the task the cheapest tier cannot. It is also the most
expensive cell in the project at $0.9681 — 4.8x a conversational Fable cell
($0.1998) and 4.1x its five-case average.

Finishing is not obeying. Same model, same style files, same scorer, different case:

| | rules | judge |
|---|---|---|
| shared five (30 cells) | 94.1 | 66.6 |
| `agentic-fix-verify` (6 cells) | 79.5 | 41.2 |

`leads_with_conclusion` scores **16.7** on those six cells: five of six replies
open with a variant of 'I'll look at the file first.' before the first tool call.
That is the exact Opus failure this project opens with, measured one tier up and
worse, and no capability increase removed it.

**Harness defect found while reading those transcripts — raised, not fixed.**
`run.mjs` accumulates assistant text blocks with `text += b.text`, no separator.
On an agentic turn the pre-tool narration is therefore glued to the post-tool
answer with no whitespace: the saved text literally reads
`"I'll look at the file first.The bug is in ..."`. Downstream, `sentences()`
splits on `[.!?]` followed by whitespace, so the two merge into one long
sentence, and `paragraphs()` splits on a blank line, so the run-on counts as one
paragraph.

Measured prevalence, by presence of a no-whitespace seam after sentence-ending
punctuation (detection only — no score was recomputed from the heuristic):

| cells | with seam |
|---|---|
| conversational, all four models | **0 of 131** |
| agentic, opus | 3 of 6 |
| agentic, sonnet | 1 of 7 |
| agentic, haiku | 10 of 12 |
| agentic, fable (shared five) | 5 of 6 |
| fable `agentic-fix-verify` | 6 of 6 |

Blast radius is small for the published four-tier table and large for the agentic
figures. On `agentic-read-report`, `paragraph_length` still scores 95.8–100.0 on
every model, so the shared-five table is essentially unaffected; and the artifact
is identical across all four columns, so the comparison stays like-for-like.
On `agentic-fix-verify`, where the model interleaves ten tool calls with
narration, `paragraph_length` collapses to 16.7 and is not a style failure.

So Fable's `agentic-fix-verify` `paragraph_length` and `sentence_length` figures
are NOT reported as style results anywhere. `leads_with_conclusion`, `total_length`
and the abort count are unaffected and are what the finding rests on.

Not fixed here: repairing it changes agentic numbers already published in
`docs/` and `FINDINGS.md`, which is the same shape as COS-9 and the `sentences()`
newline gap. It is recorded in `harness/README.md` as a limit of the instrument
and raised in the campaign tracker for the user to schedule.

## Gates

- `npm --prefix harness test` — **52/52 pass**. No test added: `checks.mjs` was not touched. The only code-adjacent change is a comment block in `config/matrix.json`, whose parse is asserted by the existing suite loading it.
- `node src/cli.mjs audit` — **exit 0**, all 12 checks agree. No style file or contract changed, so the audit is confirming no drift was introduced.
- Offline re-score of `12-44-03` and `22-59-53` with today's scorer reproduces all twelve published figures exactly, which is what licenses reusing them as the opus/sonnet/haiku columns instead of re-running them (~$11.5).

## Deliberate non-change

Fable was NOT added to `config/matrix.json`'s `models`. That list is the default
for `improve` as well as `run`, so putting the priciest tier in it would bill
every optimizer iteration for it — a cost footgun of the same shape as the
`run --help` one COS-5 paid for and then fixed. The id, its measured per-cell
cost and the two invocation traps (quote the `[1m]`, name `--variants`) are
recorded in a `//models` note beside the list, in `harness/README.md` and in the
story's notes instead.

## Correction made before the PR, from re-deriving my own prose

Two claims in the first draft did not survive checking against the saved rows,
and both were the same mistake — a superlative asserted without a search.

1. 'Fable's 53.9 is the best beginner judge score ever measured.' False.
   Two-cell samples inside optimizer runs reach 70.0–100.0. It is the best in the
   per-model baseline table, which is the only comparable claim, and that is what
   is now published.
2. 'The narration failure is worst at the top of the range.' False. Haiku scores
   0.0 on `agentic-fix-verify` and on `reserve-agentic-write`. Replaced with the
   like-for-like comparison that does exist: on `agentic-read-report`, the one
   agentic case all four tiers ran under the current style text,
   `leads_with_conclusion` is **sonnet 100.0, opus 50.0, haiku 16.7, fable 16.7**
   — a stronger result than the one it replaces, because it is a four-way
   measurement rather than an unbounded superlative.

Two further arithmetic corrections in the same pass: the haiku rule gap is 1.9
points against the best of the other three (1.8 is right only against the better
of opus and sonnet, which is how COS-5 scoped it); and 'eight of twelve rules at
97.8–100.0' paired the right count with the wrong floor — at 97.8 only five rules
qualify, and the eight Fable does not drop bottom out at 96.7.

Also corrected while reconciling: the campaign tracker's running spend total said
$5.93 before this session, but the five per-session figures it states sum to
$6.2222. The parts are each evidenced in their own Resolved row, so the sum was
fixed. Campaign total is now $20.65.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Measured all three styles on Fable, the fourth and last model tier, and answered both open questions the two-model data could not settle.

Three paid runs, $14.4290 against a ~$20 budget, all verified before any figure was quoted. `results/2026-08-16T23-47-08-329Z` (5 cells, $1.58) confirmed the SDK accepts `claude-fable-5[1m]` before the matrix was launched. `23-48-45` (30 cells, $7.04, **0 errors**) is the baseline: the same five case ids, style text, scorer and variant as `12-44-03`, whose reuse preconditions were re-verified in git and settled by an offline re-score that reproduced all twelve published opus/sonnet/haiku figures exactly. `23-53-02` (6 cells, $5.81, 0 errors) added the one write-then-verify case that discriminated the tiers.

AC #1 — Fable rules/judge, reported separately: advanced 97.9/78.3, intermediate 93.1/67.7, beginner 91.4/53.9. The top tier does not sweep: it is last of four on intermediate rules and behind Sonnet on intermediate judge.

AC #2 — FINDINGS.md's per-model table, the epic status snapshot and the story's coverage table all now carry four columns.

AC #3 — **word-cap overrun does not track model tier.** Mean reply words divided by that style's own cap, counted with `checks.mjs`'s own `words()`: Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300. In tier order the sequence turns twice. Paired over the 15 (style x case) cells, the cheapest model overruns significantly MORE than the second cheapest (+0.127, 95% CI [+0.034, +0.219]) and the top two tiers are indistinguishable (+0.070, CI [-0.118, +0.259]). The only structure the data resolves is that Sonnet keeps to the cap and the other three do not — one model, not a gradient. The document's 'roughly twice as often' figure is from a run whose style text has since been replaced; on the shipped files it is 1.44x.

AC #4 — the one-file decision is **confirmed** at the top of the range. Fable drops the same rule subsets the others do, never more than 2.5 points behind the best of the other three, and the eight rules it does not drop scoring 96.7–100.0 on all four tiers at once. No rule is one tier's requirement and another's exception. One overstatement in the ADR was corrected while confirming it: the ranking of styles is identical on every model for rules, but the judge's top two swap (Haiku and Sonnet rank intermediate above advanced; Opus and Fable the reverse) — a swap already present in the three-model data.

Two findings beyond the ACs. Fable aborts 0 of 6 cells on `agentic-fix-verify` where Haiku aborts 5 of 6, at $0.9681 a cell — but its own compliance falls from rules 94.1 / judge 66.6 to 79.5 / 41.2 there, with `leads_with_conclusion` at 16.7 because five of six replies open with 'I'll look at the file first.' On `agentic-read-report`, the one agentic case all four tiers ran under the current style text, `leads_with_conclusion` is sonnet 100.0, opus 50.0, haiku 16.7, fable 16.7 — the top tier level with the cheapest, both far behind the middle two. Capability does not touch this rule, which makes pre-tool narration a Claude Code habit rather than an Opus trait.

Reading those transcripts exposed a harness defect, raised and not patched: `run.mjs` concatenates assistant text blocks with no separator, so on agentic turns pre-tool narration is glued to the post-tool answer and `sentences()`/`paragraphs()` under-split. Present in 0 of 131 conversational cells and most agentic ones. The four-tier table is unaffected in practice (`paragraph_length` still 95.8–100.0 on the one agentic case, and the artifact is identical in all four columns), but `sentence_length` and `paragraph_length` are not quotable on agentic cells for any model, and no such figure is published here. Fixing it moves agentic numbers already in `docs/` and `FINDINGS.md`, so it is handled like COS-9.

Fable was deliberately kept OUT of `matrix.json`'s `models`: that list is `improve`'s default too, and adding the priciest tier would bill every optimizer iteration for it.

Gates: `npm --prefix harness test` 52/52; `node src/cli.mjs audit` exit 0; `lore check` exit 0 after `lore sync`.
<!-- SECTION:FINAL_SUMMARY:END -->
