---
id: COS-1
title: Close the multi-tool session and open-ended decision quality gap
status: To Do
assignee:
  - '@claude'
created_date: '2026-08-16 12:44'
updated_date: '2026-08-17 01:21'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies: []
references:
  - harness/rejected/README.md
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two scenarios score around 48% on the LLM judge across every style, original and optimized alike: agentic-fix-verify (report a session with many tool calls) and conv-decision-holdout (an open-ended decision with no clean answer).

This is a content gap, not a wording gap. None of the three style files says anything about how to report a session containing a dozen tool calls, or how to handle a decision where neither option is clearly right. Six optimizer rewrites across two rounds all failed to close it, because the optimizer can only re-express rules that already exist.

Fixing this means adding guidance to the style files themselves, plus cases that measure it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each of the three style files states how to report a multi-tool session in a single final message
- [x] #2 Each style file states how to handle a decision where neither option is clearly better
- [x] #3 At least two new harness cases cover these scenarios, one per shape
- [ ] #4 Judge score on agentic-fix-verify and conv-decision-holdout exceeds 65% on both opus and sonnet
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Measure the BEFORE arm on current text: the two target cases (agentic-fix-verify, conv-decision-holdout) x 3 styles x opus+sonnet x baseline x repeats=1 = 12 cells. Neither case has a current-text Opus/Sonnet baseline; the ~48% in the description comes from runs 20-10-29 / 23-36-59 that predate the advanced rewrite, so it is not a claimable before.
2. Author new content by hand in all three style files. NOT an improve run: six optimizer rewrites already failed because the loop can only re-express rules that exist, and both gaps are missing content. Two new sections per file: (a) how to report a multi-tool session in one final message, (b) how to handle a decision where neither option is clearly better.
3. Keep 'node src/cli.mjs audit' at exit 0. contract-audit.mjs parses stated caps out of the prose; new text must not state a second, different number for maxSentenceWords / maxParagraphSentences / maxUpdateWords / maxCodeLines, and must not add a code-line count to beginner (its 'never show code' phrasing sets that cap to 0).
4. Add two new harness cases, one per shape, on split=reserve so they stay out of every optimizer split. Follow COS-2's precedent: write NEW cases rather than moving existing ones.
5. Measure the AFTER arm: same two cases x 3 styles x opus+sonnet x baseline x repeats=2 = 24 cells. AC #4 bar is judge > 65% on both cases on both models.
6. Smoke the two new cases on sonnet (6 cells) so an unmeasured case cannot ship broken.
7. Regression smoke on the five shared cases, sonnet, repeats=1 (15 cells), against run 12-44-03's sonnet columns as the free before. Changing all three style files could regress cases the ACs do not name.
8. Budget from measured per-cell cost, worst cell not mean: agentic-fix-verify opus $0.4462 / sonnet $0.3485; conv-decision-holdout opus $0.1791 / sonnet $0.0943. Planned total ~$10-12.5 against the ~$15 budget.
9. Gates: npm --prefix harness test green (56/56); audit exit 0; lore sync then lore check exit 0; append every run to the experiment ledger.
10. Do not quote sentence_length or paragraph_length on any agentic cell — run.mjs concatenates assistant text blocks with no separator, so a multi-tool turn scores as one run-on sentence. This task is entirely about multi-tool sessions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**BEFORE arm measured — run `2026-08-17T00-44-03`, 12 cells, $2.4027, 0 errors.** Two target cases x 3 styles x opus+sonnet x baseline x repeats=1, on the style text as it shipped at e48a48d.

This is the first current-text Opus/Sonnet baseline either case has ever had. The ~48% in the task description came from runs `20-10-29` and `23-36-59`, which predate the advanced rewrite, so it was not a claimable before.

Judge %, pooled across the three styles (the unit AC #4 names):

| case | opus | sonnet |
|---|---|---|
| agentic-fix-verify | 50.0 (n=3) | 40.0 (n=3) |
| conv-decision-holdout | 48.3 (n=3) | 46.7 (n=3) |

Per style, judge %: agentic-fix-verify opus 55.0/55.0/40.0 and sonnet 40.0/55.0/25.0 for advanced/intermediate/beginner; conv-decision-holdout opus 55.0/55.0/35.0 and sonnet 45.0/40.0/55.0. Beginner is last on three of the four columns, consistent with the story's four-tier table.

Cost per cell here is close to the ledger's figures: agentic-fix-verify opus $0.3003-$0.3898 (ledger mean $0.3658), sonnet $0.2427-$0.3338 ($0.2684); conv-decision-holdout opus $0.0907-$0.1004 ($0.1179), sonnet $0.0738-$0.0758 ($0.0900).

Not quotable from this run: sentence_length and paragraph_length on agentic-fix-verify. run.mjs concatenates assistant text blocks with no separator, so a tool-using turn scores as one run-on sentence. The rules column above is reported for completeness, not as a claim about those two checks on the agentic case.

**AFTER arm, authoring pass 1 — run `2026-08-17T00-48-49`, 24 cells, $4.8643, 0 errors. The bar was NOT met.**

Judge %, pooled across styles, against the before arm (`00-44-03`, n=3 per cell):

| case | model | before | after 1 | bar |
|---|---|---|---|---|
| agentic-fix-verify | opus | 50.0 | 46.2 | 65 |
| agentic-fix-verify | sonnet | 40.0 | 42.0 | 65 |
| conv-decision-holdout | opus | 48.3 | 51.2 | 65 |
| conv-decision-holdout | sonnet | 46.7 | 54.7 | 65 |

Movement is inside the noise the ledger already documents, and the before is n=3 against the after's n=6. The honest reading is that pass 1 did not close the gap, not that it moved anything by a specific amount.

**Why, from the judge's own violations rather than from guesswork.** The new rules are being read — the judge cites 'the When neither option wins section' by name and grades against it — but two failure modes dominate, and neither is the missing content the task description names.

1. **Length, on nearly every cell.** Beginner replies ran 101-256 words against its 80-word cap; intermediate 77-276 against 100. The single most common violation across all 24 cells is the reply being over cap. This is the constraint COS-8 identified and COS-4 owns.
2. **Conditional recommendations on the decision case.** 'Absorb if the new annual bill is under ~$75k', 'If it clears $150k...'. The judge reads a threshold-conditional pick as handing the decision back, and says so. Several replies also close by asking the user for spend or user-count figures.

**A harness artifact contaminates the agentic half, and this is new.** `run.mjs` accumulates every assistant text block in a turn (`text += b.text`), so the text scored as 'the final message' on an agentic cell is the whole turn: the model's pre-tool and inter-tool narration is prepended to its final status update. Measured over the 18 agentic cells in the before and after arms:

- 16 of 18 carry text before the final status update, isolated by the update's own `**What I did` label.
- In **16 of 16** of those, a judge violation quotes that pre-update text. The judge is grading narration the model emitted before the message the rubric asks about.
- The 2 cells with no pre-update text scored 87 and 55. n=2 is too small to be a comparison and is not offered as one.
- Contamination does not explain everything: 14 of 18 cells are over the word cap on the saved text, but **10 of 18 are still over cap counting only from the `**What I did` label to the end**. Those ten are real style failures.

This extends the seam defect already recorded under COS-7. That entry says the seam makes `sentence_length` and `paragraph_length` unquotable on agentic cells. It does not say the judge is affected, and the judge is: it reads the same concatenated text. Every agentic judge score in the project is measured on the whole turn rather than the final message.

**Instrument correction.** A first pass at attributing this used a seam detector of `[.!?](?=[A-Z\`*])`. It fired on 10 of 18 cells that made zero tool calls, where there is only one text block and a seam is impossible, so it was too loose to attribute anything and was discarded. The counts above come from locating the final update by its own beat label, which does not depend on detecting the seam at all.

**Authoring pass 2 — run `2026-08-17T01-03-21`, 24 cells, $4.3675, 1 errored cell. Rejected and reverted.**

Pass 2 targeted exactly what pass 1's judge violations named: it restated each style's own word cap inside the long-session section, banned narration emitted between tool calls, and ruled that a threshold-conditional recommendation ('absorb if the bill is under $75k') is not a recommendation.

It made things worse. Judge %, pooled across styles, errored cell excluded:

| case | model | before | pass 1 | pass 2 | bar |
|---|---|---|---|---|---|
| agentic-fix-verify | opus | 50.0 (n=3) | 46.2 (n=6) | 33.0 (n=5) | 65 |
| agentic-fix-verify | sonnet | 40.0 (n=3) | 42.0 (n=6) | 40.3 (n=6) | 65 |
| conv-decision-holdout | opus | 48.3 (n=3) | 51.2 (n=6) | 63.0 (n=6) | 65 |
| conv-decision-holdout | sonnet | 46.7 (n=3) | 54.7 (n=6) | 36.2 (n=6) | 65 |

Arm mean judge over all non-errored cells: before 46.2, **pass 1 48.5**, pass 2 43.6. Pass 2 is worse than the original text. Pass 1 is best on three of the four AC cells and on the arm mean, so pass 1 is what ships and the whole pass-2 delta was reverted. The style files now match the text run `00-48-49` measured, verified by diff (+26 lines per file, the pass-1 additions only) and by `audit` at exit 0. No attempt was made to keep part of pass 2: the individual bullets were never measured separately and there was no budget to do so.

**An errored cell scores 0 on rules and 1.0 on the judge, and only the first half is documented.** Pass 2's advanced/opus `agentic-fix-verify` rep1 hit the 12-turn limit and returned no text. `evaluate.mjs` line 47 skips the judge on an errored row and substitutes `{ score: 1 }`, so the cell contributed a free 100% to the judge mean: agentic-fix-verify on opus reads 44.2 with it and **33.0** without. The rules side (an empty reply grading 0.0 on every check) is already in the experiment ledger under COS-5; the judge side is not, and it biases in the opposite direction, so pooling errors inflates the judge while deflating rules. Raised for the tracker.

**What did not survive contact with the data.** I hypothesised that pass 2 regressed because prescribing more required content fights the word cap, and measured it. Mean reply words pass 1 → pass 2 go both ways: advanced 122→127 and 112→131, intermediate 152→148 and 182→181, beginner 194→126 and 158→169. The over-cap share does rise monotonically (before 9/12, pass 1 19/24, pass 2 19/23) but the per-cell means do not support the mechanism, so it is not claimed.

**What is solid is that length is the binding constraint and neither pass touched it.** Between 75% and 83% of cells are over their style's word cap in every arm, before and after. That is COS-8's finding reproduced on two cases it never covered, and it is COS-4's subject.

**Validation runs, and what each acceptance criterion rests on.**

AC #1 and #2 (checked). The three style files each gained two sections: 'Reporting a long session' / 'Reporting a multi-tool session', and 'When neither option is clearly better' / 'When neither option wins'. The evidence is not that the text is present — the judge is handed each style's body at run time, and it quotes the new rules back by name while grading: 'the \'When neither option wins\' section', 'State the assumption you resolved the tie on', 'Report the end state, not the path', 'No tool inventory'. 13 violations across runs `00-48-49` and `01-12-03` cite the new sections. The rules ship, reach the model, and are enforced by the instrument.

AC #3 (checked). Two cases added on the `reserve` split, following COS-2's precedent of writing new cases rather than moving existing ones. `reserve-agentic-session` withholds both the bug and the file that `agentic-fix-verify` names, forcing a longer session; `reserve-decision-tie` is a lose-lose with no numbers, so the reply cannot be rescued by arithmetic. Validated by run `2026-08-17T01-12-03` — 6 cells on sonnet, $0.9450, **0 errors**, every cell scored. The agentic case drew 8-10 tool calls per cell against `agentic-fix-verify`'s 5-13, so it does produce the longer session it was written for. Judge 15-85, low as expected for cases that exist to measure an open gap.

AC #4 (NOT checked, and not met). Best shipped figures, run `00-48-49`: agentic-fix-verify 46.2 opus / 42.0 sonnet, conv-decision-holdout 51.2 opus / 54.7 sonnet, against a bar of 65. Two authoring passes were measured; the second was worse than the original text and was reverted.

**No regression on the existing case set.** Run `2026-08-17T01-13-15` — haiku, the five shared cases, 2 repeats, 30 cells, $0.7279, 0 errors — against run `22-59-53` filtered to the same five cases and same model. Every delta is inside the ledger's stated three-point noise floor: advanced rules -1.3 judge +0.9, intermediate rules -1.1 judge -2.6, beginner rules +0.8 judge -0.2, all n=10 per cell both sides. Haiku was chosen because it makes a same-model like-for-like before available for $0.73; it is a regression smoke test and no effect is concluded from it.

**Session spend: $13.3074** across five runs against a ~$15 budget — `00-44-03` $2.4027, `00-48-49` $4.8643, `01-03-21` $4.3675, `01-12-03` $0.9450, `01-13-15` $0.7279. One cell errored (pass 2) and carries `costUsd: 0`, so the true figure is slightly higher.

**Gates:** `npm --prefix harness test` 58/58 (was 56; two new config tests). `node src/cli.mjs audit` exit 0.

**Status: parked, not done.** ACs #1-#3 are met and merged; AC #4 is a measured bar that two authoring passes did not reach. Returned to To Do and unassigned rather than marked Done, because Done with an unchecked acceptance criterion would misreport it.

What has to happen before AC #4 is attemptable again, in order:

1. **The agentic half is not measurable as written.** `run.mjs` hands the judge the whole turn, so `agentic-fix-verify`'s judge score is not a measure of the style file. No style-file wording can fix that. The seam fix is already on the tracker as a raised item; AC #4 depends on it.
2. **The conversational half is a length problem, which is COS-4's.** Length is the binding constraint on both cases, and COS-8 reached the same conclusion from the opposite direction. Attempting COS-1 again before COS-4 moves reply length would repeat what pass 2 already paid for.

Do not re-open this with an `improve` run. That was true before this session on the grounds that the loop can only re-express existing rules; it is now also true that the rules exist and the loop still has nothing to add, because what fails is length and an instrument defect, neither of which the optimizer can see.
<!-- SECTION:NOTES:END -->
