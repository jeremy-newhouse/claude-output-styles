---
id: COS-10
title: 'Score the final assistant message, not the whole turn'
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:44'
updated_date: '2026-08-17 06:26'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
dependencies: []
references:
  - harness/src/run.mjs
  - harness/src/checks.mjs
  - harness/src/evaluate.mjs
documentation:
  - docs/reference/experiment-ledger.md
  - docs/reference/harness-architecture.md
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`run.mjs` accumulates every assistant text block in a turn with `text += b.text` and no separator. On an agentic turn the model's pre-tool and inter-tool narration is glued to the answer that follows it: "I'll look at the file first.The bug is in ...". Everything downstream then scores the wrong string.

Three consequences, all measured:

- `sentences()` needs whitespace after a full stop and `paragraphs()` needs a blank line, so a run-on scores as one long sentence in one paragraph. Present in 0 of 131 conversational cells and most agentic ones — Opus 3/6, Sonnet 1/7, Haiku 10/12, Fable 5/6, and 6/6 on Fable's `agentic-fix-verify`, where `paragraph_length` reads 16.7 and is measuring the harness rather than the style.
- **The judge reads the same concatenated text.** Every agentic judge score in this project is a measure of the whole turn, not the final message the case rubrics ask about. In 16 of 18 `agentic-fix-verify` cells the saved reply carries pre-update narration, and in all 16 a judge violation quotes it.
- `sentences()` separately merges a list header into its first item, because it does not split on a single newline: "Here's why:\nYou're paying twice." scores as one long sentence. Measured at 12.2% of over-cap sentences. Same subsystem, so it belongs in this task.

This is the blocking defect under COS-1's AC #4, which cannot be measured until an agentic judge score means what it says. It also gates any re-measurement of the published baseline, because fixing it moves agentic numbers already in `docs/` and `FINDINGS.md`.

Note that the fix is not simply "take the last text block". Some rubrics ask about the whole turn on purpose — `agentic-read-report`'s rubric is 'no narration of the search process', which needs the narration to be visible. The right shape is to preserve both and let the scorer choose, not to throw the trace away.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Assistant text blocks are preserved separately rather than concatenated, and the saved row carries both the final message and the full trace
- [x] #2 Every check and the judge score the string its case rubric actually asks about, with the choice stated per check rather than implied
- [x] #3 sentences() splits on a single newline so a list header is not merged into its first item
- [x] #4 New tests in harness/test/checks.test.mjs cover the seam and the list-header case, and fail against the current implementation
- [x] #5 Every published agentic figure in docs/ and FINDINGS.md is re-derived on the fixed scorer and corrected, or explicitly marked as measured on the old one
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. run.mjs: stop gluing assistant text blocks. Collect blocks in order (text + tool_use), then derive two views per turn: `trace` (every text block, joined by a blank line) and `final` (the text blocks after the last tool_use; falls back to the last text block if the turn ended on a tool call). Row carries text=final of last turn, trace=trace of last turn, allTurns=per-turn trace, allFinals=per-turn final.
2. checks.mjs: every check declares `reads: 'final' | 'trace'`. Line: shape/quality-of-the-answer checks read final (sentence_length, paragraph_length, total_length, active_voice, no_filler, no_jargon, code_block_size, three_question_structure, two_options_max, leads_with_conclusion); forbidden-anywhere checks read trace (no_process_narration, no_celebration, no_emoji). scoreDeterministic takes {final,trace} and records the view on each check row.
3. judge.mjs: judge reads the view named by caseDef.judgeOn. agentic-read-report -> trace (its rubric grades narration of the search); the other three agentic cases name 'the final message' -> final. Conversational cases have identical views by construction.
4. checks.mjs sentences(): split on a single newline so a list header is not merged into its first item.
5. checks.mjs viewsOf(row): pre-COS-10 rows have no `trace`, so both views fall back to their glued `text` and the row is flagged legacy. cli.mjs `score` uses it and prints how many rows predate the fix.
6. Tests in harness/test/checks.test.mjs: the run.mjs seam (narration split from answer, fallback when the turn ends on a tool call, no-tool turns identical), the list-header case, per-check view routing, and every check declaring a valid reads. Assert each agentic case declares judgeOn.
7. AC #5: re-derive every published agentic figure. The newline fix is re-derivable offline from saved rows for all cells; the seam fix is NOT re-derivable for saved agentic cells (the glue is lossy), so those figures get marked as measured on the old scorer. Correct docs/ + FINDINGS.md accordingly.
8. Gates: npm --prefix harness test, node src/cli.mjs audit exit 0, lore sync + lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation

**The seam (AC #1).** `runTurn` now pushes every assistant block into an ordered array instead of `text += b.text`. New exported `splitTurn(blocks)` derives two strings: `trace` (all text blocks joined by a blank line) and `final` (the blocks after the last `tool_use`, falling back to the last block said if the turn ended on a tool call — '' would score 1.0 on every 'no X found' check and the whole trace would re-glue what the split exists to separate). The row carries `text` = final of the last turn, `trace` = trace of the last turn, plus `allTurns` (per-turn trace, same meaning it always had) and `allFinals`.

**Per-check view (AC #2).** Every entry in `CHECKS` declares `reads: 'final' | 'trace'`, and `scoreDeterministic` copies it onto each saved check row so a figure lifted from `rows.json` says which string produced it. The line is taken from the case rubrics, not taste: three of the four agentic rubrics say 'the final message ... in style', so checks measuring how the answer is written read `final`; rules the style states as outright bans (narration, celebration, emoji) read `trace`, because those are violations wherever they appear. `scoreDeterministic` now takes `{final, trace}` and throws a TypeError on a bare string so no caller can be missed silently.

**Per-case judge view (AC #2).** `judge` reads `views[caseDef.judgeOn]`. `agentic-read-report` -> `trace` (its rubric grades narration of the search); the other three agentic cases name 'the final message' -> `final`. `config.test.mjs` asserts every agentic case declares a valid value; conversational cases have identical views by construction and default. The chosen view is saved as `judgeReads` on the row.

**Backward compatibility.** `viewsOf(row)` serves a pre-COS-10 row's `text` as both views and flags `legacy: true`; gluing is lossy so nothing better is possible. `score` counts legacy rows and, separately, how many are agentic cells, and prints that their figures are measured on the old scorer.

**Not changed, deliberately.** `judge.mjs` and `improve.mjs` also accumulate blocks with `+=`. Both run with `allowedTools: []`, so there are no tool calls to split around and a separator would corrupt the JSON / markdown document each produces. Commented at both sites so the asymmetry is not read as an oversight.

## Verification

**AC #1 — measured, not read.** Run `06-21-53` (2 cells, $0.38, Opus and Sonnet on `agentic-fix-verify`). The Opus cell made 8 tool calls and opened *"I'll look at the file first."*. Its saved row: `trace` 642 chars, `text` 612 chars, the 30-char difference being exactly that narration. Segmented three ways with `checks.mjs`'s own `sentences()`:
- glued string the old code would have saved: first sentence 22 words (over beginner's 20-word cap)
- `final`: same sentence, 17 words (under cap)
- `trace`: narration as its own 6-word sentence
The Sonnet cell aborted on the 12-turn limit and wrote `trace: ''`, exercising the error path. Run `06-21-03` (1 cell, $0.03, Haiku on `agentic-read-report`) made a tool call but emitted no pre-tool text, and `trace` and `final` came back byte-identical — the case the fix must leave alone.

**AC #2 — saved on the row.** `06-21-03` carries `judgeReads: trace` (as `agentic-read-report` declares) and `06-21-53` carries `judgeReads: final`. Every check row carries its `reads`. Two tests enforce it: one asserts every check declares a valid view, one asserts every agentic case declares a valid `judgeOn`.

**AC #3/#4 — old vs new, on the same inputs.** Against HEAD's `checks.mjs`:
- "Here's why:\\nYou're paying twice." -> 1 sentence old, 2 new
- 'Two things:\\n- ...\\n- ...' -> 2 old, 3 new
- `sentence_length` at an 8-word cap on a header+item -> 0.0 old, 1.0 new
- `splitTurn`/`viewsOf`/`VIEWS` do not exist on HEAD, so the whole new test block fails to link against it (`node --test test/checks.test.mjs` with HEAD's `src/`: 0 pass, 1 fail)

**AC #5 — every published agentic figure re-derived.** All 61 saved runs were re-scored on old and new code and compared per run, per scope (conversational/agentic) and per check.
- *The seam half cannot be applied backwards.* Gluing is lossy, so no saved agentic figure can be re-derived onto the fix. Each one was re-scored to confirm it is unchanged by the half that can be applied, then explicitly labelled as measured on the glued turn in `FINDINGS.md`, `docs/reference/experiment-ledger.md`, `harness/README.md` and both story docs. Confirmed unchanged to the decimal: `paragraph_length` on `agentic-read-report` 100.0/100.0/100.0/95.8 by tier; Fable `agentic-fix-verify` `paragraph_length` 16.7, `leads_with_conclusion` 16.7, rules 79.5; `leads_with_conclusion` on `agentic-read-report` 50.0/100.0/16.7/16.7.
- *The newline half was re-derived and the figures corrected.* Rule totals move at most +1.07 points on any run and scope (`01-33-41` agentic, n=3) and 0.00-0.34 on every run behind a published four-tier figure — inside the three-point noise floor. Segmentation figures move more and were corrected in place: FINDINGS' per-model sentence table (Opus 10.6->10.2 words / 7.9->6.3%, Fable 11.1->10.7 / 9.6->8.8%, Haiku 11.3->10.1 / 10.0->8.1%, Sonnet 13.4->12.9 / 20.3->19.5%; Haiku full-pool 11.5->9.6 / 10.6->7.0%) and the ledger's probe table (16.6->15.5, 12.1->10.8, 12.2->10.4 words; 60.0->56.3%, 43.0->35.2%, 38.4->30.2% over 12 words), plus `22-18-53`'s 30.0->28.1% / 10.8->10.3% and `22-27-15`'s +0.26 [-0.77,+1.29] -> +0.25 [-0.83,+1.34].
- *Every pre-fix figure reproduced exactly before its replacement was quoted*, which is what makes the deltas trustworthy.
- *One published conclusion needed restating, not reversing.* The ledger argued the 12-word cap did nothing because the tightened arm's 40.5% over-12 share sat inside the untightened range 38.4-43.0%. Re-segmented, the tightened arm reads 38.5% against an untightened range of 30.2-35.2% — above it, not inside it. The conclusion holds and is slightly firmer (the cap now looks worse than no cap), and the paired CI moved from [0.06, 8.07] to [-0.17, 8.03], i.e. from barely excluding zero to including it. Restated in place rather than left standing.

**Gates.** `npm --prefix harness test` 90/90 (was 79). `node src/cli.mjs audit` exit 0, all 12 checks agree. `lore check` exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split the assistant's text blocks apart and made every scorer name the string it grades. `run.mjs` no longer concatenates blocks with `text += b.text`: it keeps them in order and `splitTurn` derives two views of a turn — `trace` (all text blocks, blank-line joined) and `final` (the blocks after the last tool call). Every check declares `reads: 'final' | 'trace'` and every agentic case declares `judgeOn`, both enforced by tests and both saved on the row, so a figure lifted from `rows.json` carries the string that produced it. The line follows the case rubrics: three of the four agentic rubrics grade 'the final message ... in style', while `agentic-read-report` grades narration of the search and so reads the whole turn. `sentences()` also splits on a single newline now, so a list header is no longer merged into its first item.

Verified on real cells, not on code reading. Run `06-21-53` (2 cells, $0.38) caught an Opus cell opening "I'll look at the file first." before 8 tool calls: the glued string the old code would have saved reads one 22-word opening sentence, over beginner's 20-word cap; `final` reads it at 17 words, under it; `trace` reads the narration as its own 6-word sentence. Run `06-21-03` (1 cell, $0.03) confirmed the no-narration case returns both views byte-identical. New tests were checked against HEAD's code and every one of them fails there.

The fix does not reach backwards, and that is stated rather than papered over. Gluing is lossy, so no saved agentic figure can be re-derived onto it; each was re-scored to confirm the applicable half leaves it unchanged and then explicitly labelled as measured on the glued turn in FINDINGS.md, the experiment ledger, harness/README.md and both story docs, and `score` now counts the rows it re-grades that predate the fix. The newline half is re-derivable and was re-derived across all 61 saved runs: rule totals move at most +1.07 points anywhere and 0.00-0.34 on every run behind a published four-tier figure, but segmentation figures move more and were corrected in place after each pre-fix figure was reproduced exactly. That check found one conclusion needing restatement — the ledger's argument that a 12-word cap did nothing rested on the tightened arm sitting inside the untightened range, and re-segmented it sits above it; same conclusion, firmer, rewritten rather than left standing.

Gates: npm --prefix harness test 79 -> 90, audit exit 0, lore check exit 0. Spend $0.4143.
<!-- SECTION:FINAL_SUMMARY:END -->
