---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Experiment ledger
tags:
  - measurement
  - evidence
summary: Every measurement run, what it tested, and what it established
generated:
  by: lore/0.2.0
  at: 2026-08-16T13:05:00.000Z
---

# Experiment ledger

What each run tested and what it settled. Transcripts live under
`harness/results/<stamp>/`, which is git-ignored, so this ledger is the durable
record of what was learned even when the raw rows are gone.

## Details

### Runs that persisted transcripts

Every `run` invocation writes `rows.json`, `summary.json`, and `report.md`.
`improve` wrote candidates but no rows until COS-3, which is why its cells are
absent from the runs below; from `2026-08-16T14-48-09` onward an improve run
persists the same three files, with an `iteration` on every row.

From COS-12 onward both commands also write a fourth file, `run.json`. `run`
re-writes all four after every completed cell rather than once at the end;
`improve` re-writes them once per measured split, as it has since COS-3. Read
`run.json` before quoting anything from a run directory: `complete: false` means
the process died partway and the rows beside it are the cells that survived, not
the matrix that was requested. Runs recorded before COS-12 have no `run.json`,
and their completeness is not knowable from the directory alone — that is what
`score` means when it says completeness is unknown.

**Do not add an improve run to the table above.** Its headline pools the baseline
with every rejected candidate, so it is not a score for anything and is not
comparable with the rows here. Its `report.md` is titled *Optimizer trace* and
its `summary.json` carries `kind: "improve"` for exactly this reason; improve
runs belong in the optimizer table below.

| stamp | cells | scope | established |
|---|---|---|---|
| `20-09-49` | 4 | advanced, both models, 2 cases | Smoke test. Harness works end to end. |
| `20-10-29` | 36 | advanced, both models, baseline vs all-fixes, 9 cases | Opus obeys 91% of rules to Sonnet's 93%. Gap concentrated in length and pre-tool narration. Combined reinforcement lost ground on **both** models. |
| `20-12-55` | 25 | advanced, Opus, all five variants, 5 cases | Variant sweep. Bare style file wins at 90.2%. `CLAUDE.md` restatement costs 9.4 points, forced long prompt 4.5. |
| `20-53-04` | 20 | advanced release vs optimized, both models, 5 cases | The Opus-authored rewrite improved **both** models — Opus +6.9, Sonnet +5.9 — and narrowed the model gap. Basis for adopting it and for the one-file decision. |
| `21-10-34` | 20 | beginner and intermediate, release vs optimized, Sonnet, 5 cases | First sign of the rules-up/judge-down signature. Also exposed a judge grading against its own taste rather than the style guide. |
| `21-12-58` | 40 | same, Sonnet, 2 repeats, corrected judge | Reproduced the split on the fixed instrument. Intermediate candidate −3.0 net with judge −12.3. Both candidates rejected. |
| `23-36-59` | 32 | advanced and intermediate, in-use vs cross-model candidate, both models, 4 **never-seen** cases | The decisive reversal. Advanced candidate 6.8 points worse out of sample despite winning both in-loop splits. Basis for the out-of-sample ADR. |
| `12-44-03` | 60 | all three styles, both models, 5 cases, 2 repeats | The per-model baseline. Filled the beginner-on-Opus gap, which had never been measured in a saved run. |
| `22-18-53` | 8 | beginner 20-word vs 12-word cap, Haiku, 4 cases | A tighter stated cap appeared to change Haiku: mean sentence 15.5 → 11.6 words, over 20 words 28.1% → 10.3%, reply length flat (16.6 → 12.3 and 30.0% → 10.8% before COS-10 re-segmented the rows). Read alone it argues for tightening. Both arms re-derive exactly from the saved rows on either segmentation. What does not survive is reading the 15.5 arm as *Haiku's baseline* — see "A small-model probe can point the wrong way". |
| `22-27-15` | 24 | beginner 20-word vs 12-word cap, both models, 6 cases across all three splits, paired | **The change was rejected.** Mean sentence length moved +0.25 words, 95% CI [−0.83, +1.34], six of twelve pairs shorter (+0.26, [−0.77, +1.29] before COS-10 re-segmented the same rows; the verdict is identical either way). Judge 0.557 → 0.532, reply length 105 → 114 words. Basis for keeping one sentence cap for all three levels. |
| `22-59-53` | 78 | all three styles, Haiku, **full 13-case pool**, 2 repeats | The Haiku baseline, and the first run on the whole pool. Rule compliance holds at the third tier (90.9–96.0 on the five shared cases, never more than 1.8 points behind the better of Opus and Sonnet); the judge does not (37.5–62.2, last on all three styles). **Six cells returned no reply at all** — the 12-turn limit, only on cases that edit a file then run tests. Also refuted the 16.6-word sentence claim below. |
| `23-47-08` | 5 | advanced, Fable, all five variants, 1 case, 1 repeat | Model-id probe: the SDK accepts `claude-fable-5[1m]`. Meant to be one cell; `--variants` was omitted, so it ran five. The accident sized the variants on the top tier: tail-reminder and `claude-md` land within a few percent of baseline and all-fixes about 1.4×, while **long-prompt runs 3.9× baseline** — the one variant that materially enlarges a cell. |
| `23-48-45` | 30 | all three styles, Fable, same 5 cases as `12-44-03`, 2 repeats | The Fable baseline, and the fourth and last tier. **Zero errored cells.** Rules 91.4–97.9, never more than 2.5 points behind the best of the other three; judge 53.9–78.3, leading on advanced and beginner but behind Sonnet on intermediate, and last of four on intermediate *rules* (93.1). Settled the tier question: word-cap overrun does not track tier (Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300 words ÷ cap). Confirmed the one-file decision at the top of the range. |
| `23-53-02` | 6 | all three styles, Fable, `agentic-fix-verify` only, 2 repeats | The largest cells in the project: roughly 4.8× a conversational Fable cell, and **1.4× from the smallest of the six to the largest**. Size an arm off the worst cell, not the mean. **Fable aborts 0 of 6** where Haiku aborts 5 of 6, so the top tier finishes write-then-verify work. It also stops obeying the style while doing it: rules 94.1 → 79.5 and judge 66.6 → 41.2 against its own shared-five figures, with `leads_with_conclusion` at 16.7. Reading these transcripts exposed the text-block seam described below, and **every figure in this row is measured on the glued turn** — re-scoring the saved rows moves none of them, but the seam fix would, and it cannot be applied backwards. |
| `00-44-03` | 12 | all three styles, both models, the two COS-1 target cases, 1 repeat | The first current-text baseline either case has ever had. Judge pooled across styles: `agentic-fix-verify` 50.0 Opus / 40.0 Sonnet, `conv-decision-holdout` 48.3 / 46.7. The "~48%" COS-1 was written against came from `20-10-29` and `23-36-59`, both on style text that no longer ships. |
| `00-48-49` | 24 | same scope, 2 repeats, after COS-1's first authoring pass | **The shipped text.** 46.2 / 42.0 / 51.2 / 54.7 against a 65 bar — the gap is not closed. Arm mean judge 48.5 against the baseline's 46.2, inside the noise floor. Established that the judge does read the new rules: 13 violations across this run and `01-12-03` quote the new sections by name. |
| `01-03-21` | 24 | same scope, after a second authoring pass | **Rejected and reverted.** Arm mean judge 43.6 **with the errored cell excluded** (45.9 if it is pooled, which is the bias described below) — worse than the original text. Restating each style's own word cap, banning inter-tool narration and outlawing conditional recommendations lost ground on three of the four AC cells. Also produced the finding that an errored cell scores 0 on rules and **1.0 on the judge**. |
| `01-12-03` | 6 | all three styles, Sonnet, the two new reserve cases, 1 repeat | Validation that COS-1's new cases run. 0 errors, every cell scored. `reserve-agentic-session` drew 8-10 tool calls, which is **inside** `agentic-fix-verify`'s own 5-13 range — this run does not show the new case is the longer session, and Sonnet is not the model that aborts. See `01-33-41`. |
| `01-13-15` | 30 | all three styles, Haiku, the five shared cases, 2 repeats | Regression check on the shipped text against `22-59-53` filtered to the same five cases and model. Every delta inside the three-point noise floor: rules −1.3/−1.1/+0.8, judge +0.9/−2.6/−0.2 for advanced/intermediate/beginner, n=10 each side. Haiku gave a same-model like-for-like across 30 cells; nothing is concluded from it beyond "nothing broke". |
| `01-33-41` | 6 | all three styles, Haiku, `reserve-agentic-session` only, 2 repeats | Run because the branch review asked what the new case does on the model that aborts — `01-12-03` had only measured Sonnet. **It aborts 3 of 6 on the 12-turn limit.** The three cells that finished used 13, 17 and 17 tool calls, against the single `agentic-fix-verify` Haiku cell that ever finished, at 9 (`22-59-53`, 5 of 6 aborted). Suggestive that the new case really is the longer session, on n=3 against n=1 — not established, and Sonnet's 8-10 points the other way. What *is* established is that it is abort-prone, which is why the reserve gate was made error-aware in the same change. |
| `02-10-45` | 20 | beginner only, both models, the five shared cases, 2 repeats | COS-4's before arm, and the first clean beginner measurement in the project. Rules 92.1 / 93.4, judge 58.7 / 70.7 — 12.8 and 22.3 points above the four-tier table's 45.9 / 48.4, which predates both COS-1's added sections and the contract fix at `3370e4d`. Per case the gap is in three shapes: conv-status-holdout 96.0, conv-status-auth 92.5, then agentic-read-report 45.0, conv-followup-drift 32.5, conv-explain-cache 27.5 on Opus. |
| `02-12-24` | 12 | beginner only, both models, the six reserve cases, 1 repeat | The reserve before arm. Rules **88.1** / 86.4 (87.2 / 86.4 before COS-15), judge 49.2 / 31.7, 0 errors. Verified uncontaminated by the style rewrite that followed: `cli.mjs` loads style text eagerly at process start, the run began 02:12:24Z and the file was not rewritten until 02:14:21Z. |
| `02-15-14` | 20 | same as `02-10-45`, after COS-4's authoring pass 1 | Rules 98.0 / **98.2** (97.7 on Sonnet before COS-15), judge 77.8 / 65.8. `total_length` 66.9 → 99.0 and `leads_with_conclusion` 90.0 → 100.0 carry most of the rules gain; `three_question_structure` held at 100.0, so the new shape router did not cost the beats on the cases that check for them. |
| `02-16-47` | 12 | same as `02-12-24`, after pass 1 | The AC #3 validation. Rules 95.6 / 93.5, judge 45.3 / 49.7, 0 errors. Paired over the twelve cells this is the strongest arm in the task: rules **+7.7 [+5.3, +10.1]**, t=7.06; reply words **−54.7 [−82.0, −27.3]**, t=−4.40; composite **+7.4 [+0.9, +13.8]**, t=2.52. **COS-27 found and implemented the method** (`node src/cli.mjs interval`, `harness/src/interval.mjs`): pair by case + model, average repeats, paired-t interval. It reproduces the published rules figure to the last digit and the published composite/judge means and t-statistics exactly (their intervals shifted 0.1–0.2 from a likely hand-rounding slip in the original table). Reply words did not reproduce — the method's −54.7 replaces the originally published −55.7, with no cause found for the ~1-word gap; see FINDINGS.md's footnote for the full accounting. **COS-15 separately moves the rules delta by about −0.5** — this arm is unchanged, but its before arm `02-12-24` rose 0.9 on Opus, a fact about what today's checks.mjs would score, not about the method above. The conclusion is unchanged either way. |
| `02-20-01` | 30 | same shared five, 3 repeats, after a second authoring pass | **Rejected and reverted.** Rules 98.7 / **97.4** (97.1 on Sonnet before COS-15), judge 68.4 / 74.1 — arm mean 71.2 against pass 1's 71.8, statistically identical. Its five edits each quoted a pass-1 violation, but one introduced a false premise ("There was no job to report") on a tool-using case, and that case fell on both models. No bullet was kept: COS-1's precedent is that unmeasured text does not ship. |
| `02-25-39` | 50 | same shared five, 5 repeats, byte-identical pass-1 text | **The arm that corrected this task's own conclusion.** Judge 72.4 Opus / **55.0 Sonnet**, against 77.8 / 65.8 from the same text at n=10. Pooled to n=35 a model the shipped text reads 73.9 [66.0, 81.9] and 58.1 [50.5, 65.6], and the paired judge delta against the before arm collapses from +7.1 to **+1.3 [−15.0, +17.6]**. Sonnet across four arms of the same five cases: 70.7, 65.8, 74.1, 55.0. |
| `19-42-55` | 300 | beginner only, both models, the five shared cases, 30 repeats — COS-16's before arm | The largest arm on the shipped text: rules **98.9 / 97.4**, judge **66.8 / 60.9**, 0 errors. Opus falls 7.1 from COS-4's 35-cell reading of 73.9; Sonnet rises 2.8 from 58.1. Both land inside COS-4's stated interval — the 35-cell estimate was imprecise, not wrong. |
| `19-53-49` | 300 | beginner only, both models, the six reserve cases, 25 repeats — COS-16's before arm | Rules **98.1 / 94.9**, judge 63.9 / 61.4, 0 errors. First reserve reading at this size; COS-4's own reserve arm was 12 cells. |
| `20-05-05` | 300 | beginner only, both models, the five shared cases, 30 repeats, COS-16's four-edit bundle | Paired against `19-42-55`: rules **−0.21 [−0.41, −0.00]**, judge **−1.36 [−4.95, +2.23]**, words −0.28 [−2.14, +1.57]. A null result — the judge interval straddles zero on both models and rules moves under a quarter point. 0 errors. |
| `20-14-45` | 300 | beginner only, both models, the six reserve cases, 25 repeats, same bundle | Paired against `19-53-49`: rules **+0.32 [−0.10, +0.74]**, judge +0.06 [−3.41, +3.54], words **−1.85 [−3.72, +0.01]** (Sonnet alone **−3.07 [−4.85, −1.30]**). Opposite sign from the shared-five rules delta above — the signature of noise on an effect too small for either arm to resolve, not a regression. 0 errors. |
| `20-25-32` through `20-31-34` | 1200 attempted, 73 usable | beginner, the four single-edit arms (one edit each, added to the shipped text) — COS-16's ablation | **Lost to the account's monthly spend limit partway through the first arm.** Only 73 of 1200 cells returned a reply, all Opus, covering three of five shared cases and none of the six on `conv-status-holdout` or `conv-followup-drift`; the other three arms returned 0 usable cells. Kept rather than deleted per COS-11's rule that errored cells are excluded from means, not erased. **No edit was individually measured, so AC #3 is not met and the candidate text did not ship.** The rebuild recipe and the arm design are in the task notes. |
| `02-02-28` through `02-32-33` | 1200 | beginner, the four single-edit arms retried, both models, the five shared cases, 30 repeats each | **The retry, and it landed clean — 0 errored cells across all four.** Paired against `19-42-55`: E1 (jargon-conflict removal) rules +0.10 [−0.25,+0.45], judge −0.07 [−5.22,+5.07], words −0.65 [−1.83,+0.53] (Sonnet alone **−1.41 [−1.86,−0.96]**); E2 (proof-number bound) flat on every metric; E3 (router precedence) rules −0.01 [−0.43,+0.41], judge +0.69 [−4.66,+6.05], words **−1.42 [−2.49,−0.36]**; E4 (two added router shapes) flat on every metric, judge −0.69 [−4.57,+3.18]. No edit shows harm on its own — every interval that clears zero is a word-count drop, never a rules or judge fall. |
| `02-43-48` | 300 attempted, Opus 150 usable / Sonnet 94 usable | beginner, both models, the five shared cases, 30 repeats, E1+E2+E3 with E4 dropped | **Half of it hit the same spend limit again**, 56 of 150 Sonnet cells errored; Sonnet's arm mean is not comparable to any other arm and is not used. **Opus alone is clean and answers the question the arm was run for:** paired against `19-42-55`, words **+0.20 [−2.75,+3.15]** — against the four-edit bundle's Opus word delta of +1.71 [+0.27,+3.16] (`20-05-05`, a real rise that breached the not-above-63.0 reading of AC #4). Dropping E4 removes that regression on the model where it appeared. Sonnet needs a clean re-run before this candidate can ship. |
| `05-29-31` | 2 | beginner, Haiku, baseline, 4 cases, SIGKILLed after cell 2 | **COS-12's evidence.** A run killed with SIGKILL — no handler, no graceful shutdown — left both completed cells fully scored in `rows.json` and a `run.json` reading `complete: false, completed: 2, expected: 4`. `score --rows=` re-read them at exit 0 behind the line `PARTIAL run — 2 cells of 4 expected (2 never ran)`. Under the previous code the same kill would have left the directory empty. |
| `05-31-40` | 1 | beginner, Haiku, baseline, 1 case | COS-12's happy path: a run allowed to finish writes `complete: true`, and `score` says so. Re-scoring `12-44-03` in the same session still reproduced 81.0%, so the flush changed no published figure. |
| `06-21-03` | 1 | beginner, Haiku, baseline, `agentic-read-report`, 1 repeat | COS-10's first post-fix cell. It made a tool call and emitted **no** pre-tool text, so `trace` and `final` came back byte-identical — the case the fix has to leave alone. `judgeReads: trace`, as `agentic-read-report` declares. |
| `06-21-53` | 2 | beginner, Opus and Sonnet, baseline, `agentic-fix-verify`, 1 repeat | **COS-10's evidence.** The Opus cell made 8 tool calls and opened *"I'll look at the file first."* — the exact sentence this project has quoted since COS-7. The row now carries it in `trace` (642 chars) and not in `text` (612). Segmenting the two: the glued string the old code would have saved reads one 22-word opening sentence, over beginner's 20-word cap; `final` reads the same sentence at 17 words, under it; `trace` reads the narration as its own 6-word sentence. One check changed answer on one cell, which is the whole defect in miniature. The Sonnet cell aborted on the 12-turn limit and wrote `trace: ''`, confirming the error path. |

Total persisted: 4540 cells — 640 before COS-16, plus 2400 from its first two arms and interrupted ablation, plus 1500 from the retried single-edit arms and the E1+E2+E3 candidate (every attempted cell writes a row, errored or not; see `20-25-32` and `02-02-28` above). Improve-loop cells before COS-3 are additional and
were not saved at all; from COS-3 onward every one of them is on disk.

One completeness caveat on that count. An aborted invocation under COS-5 (a
`run --help` that the CLI then treated as `run`; COS-5 added the guard that now
short-circuits it before any config is read) ran for about two minutes at
concurrency 4 before being killed. It wrote no `rows.json` at all, so nothing it
measured is in the count above.

Eleven cells — `22-59-53`'s six, `01-03-21`'s one, `01-33-41`'s three and
`06-21-53`'s one — ran a real turn and left a row with no usable reply in it.
Those rows **are** on disk and **are** inside the 640, so they are not a gap in
the count; they are excluded from every mean instead, by `producedReply`. This
used to be a second completeness caveat because the cells had spent a real
`costUsd` that no figure reflected. With cost gone the caveat no longer applies
to the count, only to the means, where COS-11 already handles it.

The same gap survives the COS-12 flush in a much smaller form: the cell in flight
when a run is killed will never be written, so `05-29-31` shows the two cells
that landed and not the three the process actually started. Flushing recovers the
completed cells, not the interrupted one.

`22-18-53`, `22-27-15` and `22-59-53` are one story and belong together.
`22-18-53` was a small Haiku probe run to decide whether a tighter sentence cap
was worth validating; `22-27-15` is the validation, and it reversed the probe's
answer on Opus and Sonnet; `22-59-53` then measured Haiku's own baseline at six
times the probe's sample and removed the reason the probe had been believed.
Quoting any one of the three alone misrepresents what was measured.

### Optimizer runs

Five `improve` invocations, eight candidate rewrites, one survivor.

| run | scope | outcome |
|---|---|---|
| first | advanced, Opus only, 2 iterations | v1 reverted, **v2 kept** and adopted. The only rewrite that ever survived. |
| second | intermediate then beginner, both models, patience 2 | Intermediate converged at v2 and was later rejected out of sample. Crashed into beginner on an unwrapped judge call at `maxTurns: 1`. |
| third | beginner and advanced, both models, after the crash fix | Beginner converged at **v0** — both rewrites raised train ~6 and dropped holdout ~8, rejected twice. Advanced kept a v2 that was later rejected out of sample. |
| `14-48-09` | beginner, Haiku only, 1 iteration, repeats 1 — the first run under COS-3 | 18 cells. v1 reverted. **Restated under COS-11**, which found one of the four v0 holdout cells was an `agentic-fix-verify` abort scored 0 on rules and 1.0 on the judge. The in-loop verdict used the pooled figures and read the *usual* signature on holdout — rules 70.8 → 83.3, judge 72.5 → **21.2**, deltas train **−0.035** (−0.029 before COS-15, whose gloss fix raised v0's train arm 89.9 → 91.0 on rules; holdout is untouched) holdout −0.193. Excluding the silent cell, v0 holdout is rules **94.3** and judge **63.3**, so the rewrite dropped rules 94.3 → 83.3 as well: **both halves fell on both splits**, and the holdout delta is −0.265, not −0.193. The reverted verdict is unchanged and was never in doubt; the "rules up, judge down" reading of this run was an artifact of one aborted cell. Scope was always too small to conclude anything about Haiku — the run existed to prove persistence. First improve run whose transcripts survive; re-scoring reproduced all four in-loop numbers exactly at the time, and no longer does, because `score` now reports the error-excluded reading and the in-loop numbers were pooled. |
| `05-46-38` | beginner, Haiku only, `--iterations=0`, 1 train + 1 holdout case — under COS-12 | 4 cells. Not a measurement and not an optimization: the loop measured its baseline and adopted v0. It exists because nothing else exercises `improve`'s persistence path, and COS-12 moved that path onto a shared writer. `run.json` reads `kind: "improve", complete: true, expected: null` — an improve loop's cell count is not known until it stops — and `report.md` still opens with the optimizer-trace warning. |

### Judge validation runs

A third kind of run, and it belongs in neither table above. `node src/cli.mjs
judge` re-grades the replies a finished run already saved, several times and with
several judge models, and runs no cell. Its directory holds `judgements.json`,
`analysis.json` and a `judge.json` manifest whose `kind` is `judge`; there is no
`rows.json`, so `score` will not pick one up.

| stamp | calls | scope | established |
|---|---|---|---|
| `16-47-17` | 720 | the 60 saved replies of `12-44-03`, judged by Sonnet, Opus, Haiku and Fable, 3 times each | **The judge, characterised.** Judge-call SD 10.17 points against reply SD 22.58 on beginner under Sonnet, so 83% of what a cell's judge score varies by is the reply. **Sonnet is the noisiest of the four judges tested** — judge SD 10.17 against Opus 5.49, Haiku 7.29, Fable 4.18. Opus agrees with Sonnet in level (+2.36 [−1.43, +6.14]); Haiku (+10.80) and Fable (+6.89) mark higher, most on the lowest-scoring style. Rank agreement with Sonnet is 0.83 to 0.89 overall and collapses to **0.007** on `conv-followup-drift`. Haiku returned unparseable output on 6 of its 180 calls and took 59.5s per call against Opus's 7.6s. |

Two qualifications travel with that row, and neither reaches its conclusions,
because both are constant across the four judges. The replies are pre-COS-10
rows, so `agentic-read-report` is graded on the glued turn. And the style files
have been rewritten since `12-44-03` ran, so this grades those replies against
today's guide — the same convention `score` follows for checks, and the style
SHAs are recorded in the manifest.

**What a change of judge would move, and what it would not.** The style ranking
survives: advanced > intermediate > beginner under all four judges, and the
intermediate-to-beginner gap narrows from 25.2 points under Sonnet to 13.0 under
Haiku without closing. Three things do not survive. The four-tier table's
Opus-vs-Sonnet ordering flips — Sonnet-generated replies lead under the Sonnet
and Opus judges, Opus-generated ones under Haiku and Fable, every delta inside
the noise floor, which says the ordering was never resolvable. The
advanced-to-intermediate gap is 2.7 points under Sonnet and 10.0 under Opus and
Fable, so the judge moves it by more than Sonnet's own figure. And beginner's
verdict against its 70 bar is judge-dependent: the published Sonnet figure of
58.1 misses the bar by 11.9 points, and Haiku's measured level shift on beginner
is +18.01 [+12.34, +23.68] — an interval that lies entirely beyond the gap.

### What the sequence taught

**The failure signature is consistent.** Every rejected candidate raised
deterministic rule scores and lowered the judge. Six of seven did this. Rules are
what the optimizer can see and optimize against; the judge is what it cannot game
as easily.

**Two splits were not enough.** Train and holdout came from the same five-case
pool, so a rewrite could win both and still degrade elsewhere. Only cases held
out of every split caught it — twice.

**Instruments needed fixing mid-project, twice.** `two_options_max` demanded
literal "Option A / Option B" labels and penalised a reply that led with the
recommendation instead. `three_question_structure` matched keywords anywhere and
so survived a structural collapse the judge caught. Both were fixed and the saved
transcripts re-graded offline without re-running a cell — which is the argument for persisting
transcripts.

**And the first fix went one step too far, which took a third pass to see.**
Dropping the label requirement left `two_options_max` with no option cap at all
for a reply that never writes a label: three alternatives walked through in prose
scored a clean 1.0. COS-9 restored the cap from the signals that *assert* a count
rather than merely imply one — a reply stating how many it has ("three ways
to…"), and the phrases claiming an additional item ("another option", "a third
approach") — taking the largest of those and the literal label count. The reply
the original fix protected is untouched, guarded by its own regression test.

Re-scoring all 62 saved runs moved exactly one row. 106 saved rows carry this
check; 96 are re-scorable, the other 10 naming optimizer-candidate styles that no
longer have a contract. The one that moved is `22-59-53`, beginner on Haiku,
`reserve-three-options`, 1.00 → 0.70. That reply labels two options, tells the
reader they "have three paths", then names the third in prose in its closing line
— the exact blind spot, on the one case written to provoke it.

The published figures are settled by the model split rather than by tracing each
claim to its run: **0 of 34 Opus rows and 0 of 32 Sonnet rows move**, and the
single moved row is one of the 30 Haiku rows. Both published `two_options_max`
figures — the one-style-file ADR's `1.00 / 0.85` Opus-versus-Sonnet row, and
FINDINGS' account of the Sonnet regression that prompted the original label fix —
are Opus/Sonnet numbers, so neither can move whichever run backs it. Nothing
outside `22-59-53` changed at all.

**The connectives were tried and taken back out, which is the more useful
lesson.** "Alternatively" and "or you could" look like option markers and are
not: they introduce *an* alternative, singular, and a compliant two-option reply
reaches for both. Counting each as its own option scored the very reply the
label-blindness rewrite existed to protect at 0.70 — the original defect,
rebuilt, on the third attempt to fix it. The corpus said the same thing from the
other direction: the connective set matches **zero** of those 96 rows, while the
stated count matches the two `reserve-three-options` replies and nothing else. An
estimator with no observed true positive and a live false-positive path is worse
than no estimator, so counting alternatives now requires a claim, not a pivot.

What the check still cannot see is sprawl that never asserts a count. That is the
judge's to catch. Counting alternatives semantically would re-break the reply the
first fix was for, and that trade stays refused.

**Comparability has limits.** Deterministic scores are comparable across the
whole history because rows can be re-graded. Judge scores are not: the judge was
revised twice, once to receive the style body and once to raise `maxTurns`. Case
prompts also changed — three status cases were reframed early to stop models
correcting the premise, and `conv-explain-cache` was rewritten to stop every
style hunting for a repo that was not there.

**Contracts can grade rules nobody wrote.** Beginner and intermediate were held
to sentence and paragraph caps stricter than their own style files state, for
every run in the table above. Found by review, not by any check. Corrected; the
saved rows were re-graded offline and rule scores moved 0.4 to 1.3 points with no
conclusion changed. All figures quoted elsewhere in the bundle are post-
correction. `node src/cli.mjs audit` now catches this class of drift, and the
same comparison runs under `npm test`.

**A small-model probe can point the wrong way.** `22-18-53` ran 8 cells on Haiku
alone and said a tighter sentence cap works; `22-27-15` ran 24 across both models
and said it does nothing. The 24-cell answer is the right one, and `22-59-53`
later explained why more simply than the original account did.

That original account said the cap bound on Haiku because Haiku writes 16.6-word
sentences while Opus and Sonnet write 11–12. The probe's own arms are sound — both
re-derive exactly from its saved rows. What fails is treating its 16.6 arm as
*Haiku's baseline*. `22-59-53` measured the same unchanged 20-word file, same
model, same variant, first over the probe's own four cases and then over all
thirteen. All figures below use `checks.mjs`'s `words()` and `sentences()`, the
tokenizer and the segmenter `sentence_length` actually scores with, **as they
stand after COS-10** — which changed `sentences()` to split on a single newline
and so re-segmented every saved reply. The pre-COS-10 figures are given beside
each one, because they are what earlier revisions of this ledger published:

| sample of the untightened 20-word file | cells | sentences | mean words | over 12 words |
|---|---|---|---|---|
| `22-18-53` — the probe's baseline arm | 4 | 32 (was 30) | **15.5** (was 16.6) | **56.3%** (was 60.0%) |
| `22-59-53`, same 4 cases | 8 | 88 (was 79) | **10.8** (was 12.1) | **35.2%** (was 43.0%) |
| `22-59-53`, beginner, all 13 cases | 25 | 315 (was 268) | **10.4** (was 12.2) | **30.2%** (was 38.4%) |

The cell is the unit — sentences inside one reply are not independent. On cell
means the gap is +3.93 words (was +4.06), unpaired 95% CI including zero; paired
by case, +3.93 with 95% CI [−0.17, 8.03] at df=3, which now includes zero where
the pre-COS-10 segmentation excluded it by 0.06. Read together that is weak
evidence at n=4, which is the point: two samples of an identical configuration
should not be this far apart, and the probe's arm is the unstable one. The
re-segmentation moved this from "just barely significant" to "not", which
strengthens the reading rather than changing it.

The last column carries more weight than the means. The probe's case was that the
tightened file cut Haiku's over-12 share from 60.0% to 40.5% — **56.3% to 38.5%**
after re-segmentation. Haiku's *untightened* share, at two and six times the
sample, is 35.2% and 30.2%. The tightened arm's 38.5% is not below that range but
**above** it, so the probe's headline movement is still fully explained without
the cap doing anything — and now points, if anything, the other way. On the
pre-COS-10 segmentation the same comparison read 40.5% against 38.4–43.0%, i.e.
inside the range; the conclusion is the same and slightly firmer.

Be precise about what that does and does not establish. The tightened arm is
itself only 4 cells, so this is not proof that a 12-word cap has no effect on
Haiku; nobody has re-measured the tightened file at larger n. What it does
establish is that **the evidence for an effect has gone**: the gap the probe
reported is the distance between one small sample and the configuration's own
range, not a distance the cap created.

That leaves a simpler reading of the whole episode. Haiku writes ~10.4-word
sentences, Opus ~10.7, Sonnet ~12.9 — ~12.0, ~11.3 and ~13.5 before COS-10
re-segmented them — so **no model in the matrix sat far enough
above a 12-word cap for one to have obvious room to work**, which is why the
paired validation measured nothing on Opus and Sonnet. There was probably never a
Haiku exception to explain. The decision to revert stands and is strengthened;
only its stated mechanism was doing work the data did not support.

The lesson survives, restated more usefully. The original version — probe the
small model to learn whether an instruction *can* bind, measure the target models
before believing it *does* — was built on a gap that a larger sample dissolved.
The durable version: **a probe small enough to run quickly is small enough that
its baseline arm may not reproduce.** Before explaining why a probe shows an
effect, re-measure its own baseline at a larger n. Here that check was already
sitting in saved rows and needed no new cells at the time.

**A cell that never answered is not a badly-styled cell.** `22-59-53` is the
first run where this mattered: six of 78 Haiku cells hit the 12-turn limit and
returned no text, and `scoreDeterministic` grades an empty reply as 0.0 on every
rule. Left pooled, that reads as a ten-point collapse in Haiku's rule compliance
(94.2 → 83.4 on advanced) when what actually happened is that Haiku could not
finish a fix-then-test task at all. Both numbers are worth having and they answer
different questions — how well the style is followed when the model speaks, and
what a user experiences.

**Since COS-11 the tool reports them separately and there is nothing to
remember.** Every mean is taken over the cells that replied, and every figure
states its own `n`, `noReply` and `cells` beside it, so the two questions can no
longer be confused for one. This paragraph stood for three sessions as a
discipline instead — *filter `!row.error` before quoting anything* — and a
discipline that must be remembered is a defect that has not been fixed yet: one
session forgot it and published four wrong figures.

That distinction was carried into COS-7 in advance rather than rediscovered, and
in the event Fable did not need it: `23-48-45` and `23-53-02` errored on 0 of 36
cells between them, including 0 of 6 on the very case Haiku failed 5 of 6 times.
The precaution was still correct to take — the alternative was finding out from
a 30-cell run.

**Text blocks were concatenated with no separator, so two rules could not be
quoted on agentic cells.** Found under COS-7 while reading Fable's
`agentic-fix-verify` transcripts, and fixed under COS-10 — but every run in the
table above predates that fix, so the entry describes them as they stand.
`run.mjs` accumulated the assistant's visible text with `text += b.text`. On a
conversational turn there is one text block and nothing happens. On an agentic
turn there are several, split around the tool calls, and they were glued together
without so much as a space — a saved transcript reads

    "I'll look at the file first.The bug is in `applyDiscount` — ..."

`sentences()` split on `[.!?]` *followed by whitespace* and `paragraphs()` splits
on a blank line, so the run-on scored as one very long sentence inside one
paragraph. Prevalence, measured by searching for a no-whitespace seam after
sentence-ending punctuation. Cells are split by whether the model actually made a
tool call, not by which case they ran — that is the condition that produces
multiple text blocks, and one conversational Sonnet cell reached for a tool:

| cells | with a seam |
|---|---|
| **no tool call**, all four tiers | **0 of 131** |
| ≥1 tool call — Opus | 3 of 6 |
| ≥1 tool call — Sonnet | 1 of 7 |
| ≥1 tool call — Haiku | 10 of 12 |
| ≥1 tool call — Fable, shared five | 5 of 6 |
| Fable, `agentic-fix-verify` | 6 of 6 |

The damage is concentrated where the model interleaves many tool calls with
narration. On `agentic-read-report`, a read-only case, `paragraph_length` still
scores 95.8–100.0 on every tier, so the four-tier baseline table is unaffected in
practice — and the artifact is identical in all four columns, so the comparison
stays like-for-like either way. On `agentic-fix-verify`, where Fable made ten
tool calls per cell, `paragraph_length` reads 16.7 and is measuring the harness.
Both figures were re-scored on the post-COS-10 code and are unchanged to the
decimal — the newline split does not touch them — so they stand as published and
stand as measurements of the glued turn.

`leads_with_conclusion`, `total_length` and the abort counts are unaffected: the
first reads the genuine opening text, the second counts words, and the third does
not depend on segmentation.

**COS-10 fixed this, and the fix does not reach backwards.** `run.mjs` now keeps
the assistant's blocks in order and saves two strings per turn: `trace`, every
text block joined by a blank line, and `final`, the blocks after the last tool
call. Each check names the one it grades in `CHECKS[].reads`, each case names the
one its rubric asks about in `judgeOn`, and on a conversational turn the two are
the same string. What cannot be undone is the glue itself — `"first.The bug"` is
not separable from a typo — so **no run in the table above can be re-scored onto
the fix.** `score` says so: it counts the rows that predate COS-10 and how many
of them are agentic cells. Every agentic figure in this ledger and in
`FINDINGS.md` is therefore still measured on the glued turn and is labelled where
it appears. Replacing one costs a re-run, not a re-score.

**A second caveat with the same shape: every agentic run in the table above met a
fixture whose test suite failed on arrival.** `fixtures/repo` is copied into every
workspace and three of the four agentic cases ask the model to run its tests.
Until COS-13 the suite was red on a clean checkout, because the `priceOrder`
assertion expected 966 — the value you get taxing *before* discounting — where
the code returns 965. A second assertion expected 850, the truncating value,
while its own comment computed 849, the rounded one, so a model that correctly
fixed the bug broke a passing test. A third sat one command earlier: the fixture
had no `package.json`, and it is copied to the workspace root with nothing above
it, so `npm test` died with `ENOENT` before any test ran and only `node --test`
worked. None of the three is anything the style file governs, and all landed
hardest on the models that did the most work. COS-13 made the suite green before
and after a correct fix and gave the fixture a `package.json`. This caveat is narrower than
the glued turn but must not be reasoned about the same way. The glued turn was a
scoring artifact and could be traced to the checks that re-segment, leaving the
others provably clear; this one changed what the model wrote, so on a cell that
met it any check can move, the judge included. What bounds it is reach, not
check: every conversational case is untouched, since those prompts never involve
the repo, and `agentic-read-report` is the least exposed of the four because it
asks for a reading rather than a test run — though a model that ran the suite
anyway would still have met the failure. It is as irreversible as the glue: no
re-score can undo it, only a re-run.

Re-scoring the saved rows on the post-COS-10 scorer does isolate the *other* half
of that change — `sentences()` now splitting on a single newline — and that half
was re-derived across all 61 saved runs. It moves rule totals by at most 1.50
points on any run and scope (`01-33-41` agentic, n=3), and by 0.00 to 0.34 on
every run backing a published four-tier figure, all of it well inside the
three-point noise floor.

**Three checks move, not one.** `sentence_length` carries most of it, but
`paragraph_length` counts sentences per paragraph and `active_voice` iterates
sentences, so both re-segment too — `active_voice` on 53 of 634 saved rows, for a
mean of +0.14 points. `paragraph_length` needed a repair rather than a
re-derivation: its list exemption tested only a paragraph's first character, so a
lead-in line followed by bullets in one block was graded as prose, and once the
bullets became separate sentences a five-item list failed a cap of four. The
exemption now tests every line. Published `paragraph_length` figures are
unchanged either way — 100.0/100.0/100.0/95.8 on `agentic-read-report` by tier,
16.7 on Fable's `agentic-fix-verify` — and the repair's whole effect across the
540 rows the check scores is a mean of 97.21 to 97.44, on five rows.

Segmentation figures do move materially, and those are corrected below and in
`FINDINGS.md`.

**The seam reached the judge, not only the two segmentation checks.** Found
under COS-1, and it widens the entry above. The mechanism was one line of
`run.mjs` — `if (b.type === 'text') text += b.text`, accumulated over every
assistant message in the turn — so the text saved as a cell's reply was the
*whole turn*, not the final message. On a conversational cell those are the same
thing. On an agentic cell the model's pre-tool and inter-tool narration was
prepended to the status update the case rubric actually asks about, and the judge
was handed all of it.

Measured over the 18 `agentic-fix-verify` cells in `00-44-03` and `00-48-49`,
isolating the final update by its own `**What I did` label:

| | |
|---|---|
| cells carrying text before the final update | 16 of 18 |
| of those, cells where a judge violation **quotes that pre-update text** | 16 of 16 |
| over the style's word cap on the saved text | 12 of 18 |
| over the cap counting **only from the label to the end** | 10 of 18 |

The judge diagnosed the artifact itself without being asked, in a violation that
reads: *"Run-together sentences with no space ('first.Test results') show the
trace was pasted in raw rather than composed as the polished single final
message the guide requires."*

Two things follow, and the second matters as much as the first. Every agentic
judge score saved in this project is measured on the whole turn rather than the
final message, so it is not a clean measure of the style. **But the artifact does
not explain the scores away**: ten of eighteen updates are over the word cap on
their own, so a style-file fix still has real work to do. Do not use this entry to
dismiss a bad agentic number.

COS-10 closed the mechanism: the judge now reads the view its case rubric names.
Three of the four agentic rubrics say "the final message", so they grade the
blocks after the last tool call; `agentic-read-report` says "no narration of the
search process", which needs the narration present, so it alone grades the whole
turn. That is a per-case declaration in `cases.json`, asserted by a test, rather
than a default nobody can see. The judge scores already recorded above are not
recoverable onto it — a judge score is not re-derivable offline at all, and the
string it graded is glued besides.

*Instrument note.* A first attempt at attributing this used a seam detector,
`[.!?](?=[A-Z`*])`. It fired on 10 of 18 cells that made **zero** tool calls,
where there is one text block and a seam is impossible — ordinary markdown
matches it. It was discarded rather than tuned. The counts above locate the final
update by its own beat label and do not depend on detecting a seam at all.

**An errored cell scores 0 on rules and 1.0 on the judge.** The rules half is
recorded above under COS-5. The judge half is the opposite bias and was not:
`evaluate.mjs` skips the judge call on an errored row and substitutes
`{ score: 1 }`, so a cell that returned no text at all contributes a free 100% to
every judge mean it lands in. Found in `01-03-21`, where one advanced/Opus cell
hit the 12-turn limit: `agentic-fix-verify` on Opus reads **44.2 with it and 33.0
without**. Pooling errors therefore inflates the judge while deflating rules, in
the same run, and the two do not cancel.

**Fixed in COS-11**, at the one place every figure comes from: `summarize()`
averages only the cells that produced a reply. The row still carries its
substituted 1.0 — `total` is computed from it — but no mean pools it, and
`judgeReads: null` marks it as a call that never happened. The 44.2 above is now
what the tool refuses to print, and 33.0 is what it reports.

One consumer of this bias is now fixed, because COS-1 made it worse before it
made it better. Adding a second agentic case to the `reserve` split put the most
abort-prone case type in the project inside `improve`'s adoption gate, which
compared `summary.overall` — an average that pools errored rows. At 36 reserve
cells a side, each one-sided abort moved the delta by roughly 0.01 against a
`minReserveDelta` of −0.02, so two of them could flip a verdict on the turn limit
rather than on the rewrite. The gate now compares only cases that produced a
reply on **both** sides, logs which cases it dropped, and rejects rather than
adopts when nothing is comparable. `01-33-41` measured why this mattered: the new
case aborts 3 of 6 on Haiku. COS-11 then closed the wider bias in `summarize()`
and widened this gate's own test from `row.error` to `producedReply(row)`, so a
cell that goes silent without the flag drops its case here too.

**Noise floor.** At one repeat and five cases, a single case moves the mean by
about 0.03. Differences under three points are not real. `22-59-53` puts a
sharper number on the same warning from the other direction: at four cells, a
sentence-length mean was off by 4.5 words and an over-cap share by 17 points,
both large enough to have supported a confident and wrong explanation.

**The judge's noise floor is far wider than that, and COS-4 measured it.** Those
figures are about deterministic checks, whose per-cell variance is small. The
judge's is not: per-cell judge SD across COS-4's six arms is **22 to 32 points**,
so a ten-cell arm — the size of every per-model judge figure in this project —
carries a 95% interval about 30 points wide. Beginner on Sonnet, measured four
times on the same five cases with only the repeat count differing, read 70.7
(n=10), 65.8 (n=10), 74.1 (n=15) and 55.0 (n=25). A paired judge delta of +7.1
computed at two cells per pair became **+1.3 [−15.0, +17.6]** at seven.

Two rules follow. Pair by case × model and report the interval, never a bare arm
mean. And size the arm before agreeing to a bar. Narrowing one arm's 95%
half-width takes 24 cells per model for ±10 points, 49 for ±7, 95 for ±5 and
148 for ±4. Detecting a real difference *between* two arms takes twice
that: 48 cells per arm for 10 points, 97 for 7, 189 for 5, 295 for 4.
Note what this does and does not give you — sample size narrows an interval, it
does not move a point estimate above a bar. A judge bar stated to the point is not
resolvable at this project's arm sizes, and two tasks have now been written
against one.

**COS-20 split that noise floor into its two halves, and the reply is the larger
one.** Re-judging the same saved reply three times separates judge-call variance
from reply variance by one-way random-effects ANOVA. On beginner under the
Sonnet judge — the arm COS-4's 24.6 describes — the per-cell SD of 24.76
decomposes into **10.17 points of judge and 22.58 points of reply**: the judge is
16.9% of the variance and 41% of the SD, the reply 83.1% (ICC 0.831). That the
total reproduces 24.6 on a different arm, and that the per-style-per-model
spread runs 22.33 to 31.31, are independent confirmations of both figures above.

The sizes in the paragraph before this one are the recomputed ones, and they moved
by at most two cells from what a single pooled SD gave. What the split adds is a
**floor**: repeat-judging shrinks only the judge's share, so ±4 costs 148 cells at
one judge call each, 135 at two, 131 at three, and **never fewer than 123 however
many times each cell is judged**. Buying precision past that point means buying
cells.

Those figures are beginner's, which is the pairing 24.6 was measured on, and they
are the smallest of the three. Under the same judge, ±4 costs **169 cells on
intermediate and 207 on advanced** — a judge that spreads replies further needs
more of them to place the mean. Size on the style being measured. And size on one
style at a time: pooling all three puts the gap *between* styles into the reply
component, which reads as 208 cells for an arm that needs 148.
