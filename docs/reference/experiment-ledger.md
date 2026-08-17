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

| stamp | cells | cost | scope | established |
|---|---|---|---|---|
| `20-09-49` | 4 | $0.43 | advanced, both models, 2 cases | Smoke test. Harness works end to end. |
| `20-10-29` | 36 | $5.89 | advanced, both models, baseline vs all-fixes, 9 cases | Opus obeys 91% of rules to Sonnet's 93%. Gap concentrated in length and pre-tool narration. Combined reinforcement lost ground on **both** models. |
| `20-12-55` | 25 | $4.49 | advanced, Opus, all five variants, 5 cases | Variant sweep. Bare style file wins at 90.2%. `CLAUDE.md` restatement costs 9.4 points, forced long prompt 4.5. |
| `20-53-04` | 20 | $2.59 | advanced release vs optimized, both models, 5 cases | The Opus-authored rewrite improved **both** models — Opus +6.9, Sonnet +5.9 — and narrowed the model gap. Basis for adopting it and for the one-file decision. |
| `21-10-34` | 20 | $2.13 | beginner and intermediate, release vs optimized, Sonnet, 5 cases | First sign of the rules-up/judge-down signature. Also exposed a judge grading against its own taste rather than the style guide. |
| `21-12-58` | 40 | $4.28 | same, Sonnet, 2 repeats, corrected judge | Reproduced the split on the fixed instrument. Intermediate candidate −3.0 net with judge −12.3. Both candidates rejected. |
| `23-36-59` | 32 | $4.93 | advanced and intermediate, in-use vs cross-model candidate, both models, 4 **never-seen** cases | The decisive reversal. Advanced candidate 6.8 points worse out of sample despite winning both in-loop splits. Basis for the out-of-sample ADR. |
| `12-44-03` | 60 | $7.52 | all three styles, both models, 5 cases, 2 repeats | The per-model baseline. Filled the beginner-on-Opus gap, which had never been measured in a saved run. |
| `22-18-53` | 8 | $0.18 | beginner 20-word vs 12-word cap, Haiku, 4 cases | A tighter stated cap appeared to change Haiku: mean sentence 16.6 → 12.3 words, over-cap 30.0% → 10.8%, reply length flat. Read alone it argues for tightening. Both arms re-derive exactly from the saved rows. What does not survive is reading the 16.6 arm as *Haiku's baseline* — see "A cheap-model probe can point the wrong way". |
| `22-27-15` | 24 | $2.24 | beginner 20-word vs 12-word cap, both models, 6 cases across all three splits, paired | **The change was rejected.** Mean sentence length moved +0.26 words, 95% CI [−0.77, +1.29], six of twelve pairs shorter. Judge 0.557 → 0.532, reply length 105 → 114 words. Basis for keeping one sentence cap for all three levels. |
| `22-59-53` | 78 | $1.88 | all three styles, Haiku, **full 13-case pool**, 2 repeats | The Haiku baseline, and the first run on the whole pool. Rule compliance holds at the third tier (90.9–96.0 on the five shared cases, never more than 1.8 points behind the better of Opus and Sonnet); the judge does not (37.5–62.2, last on all three styles). **Six cells returned no reply at all** — the 12-turn limit, only on cases that edit a file then run tests. Also refuted the 16.6-word sentence claim below. |
| `23-47-08` | 5 | $1.58 | advanced, Fable, all five variants, 1 case, 1 repeat | Model-id probe: the SDK accepts `claude-fable-5[1m]`. Meant to be one cell; `--variants` was omitted, so it ran five. The accident priced the variants on the top tier — baseline $0.1910, tail-reminder $0.1896, `claude-md` $0.1965, all-fixes $0.2686, **long-prompt $0.7384**, i.e. 3.9× baseline. |
| `23-48-45` | 30 | $7.04 | all three styles, Fable, same 5 cases as `12-44-03`, 2 repeats | The Fable baseline, and the fourth and last tier. **Zero errored cells.** Rules 91.4–97.9, never more than 2.5 points behind the best of the other three; judge 53.9–78.3, leading on advanced and beginner but behind Sonnet on intermediate, and last of four on intermediate *rules* (93.1). Settled the tier question: word-cap overrun does not track tier (Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300 words ÷ cap). Confirmed the one-file decision at the top of the range. |
| `23-53-02` | 6 | $5.81 | all three styles, Fable, `agentic-fix-verify` only, 2 repeats | The most expensive cells in the project: $0.9681 on average, $0.7970 to **$1.1315** across the six. Budget off the worst cell, not the mean. **Fable aborts 0 of 6** where Haiku aborts 5 of 6, so the top tier finishes write-then-verify work. It also stops obeying the style while doing it: rules 94.1 → 79.5 and judge 66.6 → 41.2 against its own shared-five figures, with `leads_with_conclusion` at 16.7. Reading these transcripts exposed the text-block seam described below. |
| `00-44-03` | 12 | $2.40 | all three styles, both models, the two COS-1 target cases, 1 repeat | The first current-text baseline either case has ever had. Judge pooled across styles: `agentic-fix-verify` 50.0 Opus / 40.0 Sonnet, `conv-decision-holdout` 48.3 / 46.7. The "~48%" COS-1 was written against came from `20-10-29` and `23-36-59`, both on style text that no longer ships. |
| `00-48-49` | 24 | $4.86 | same scope, 2 repeats, after COS-1's first authoring pass | **The shipped text.** 46.2 / 42.0 / 51.2 / 54.7 against a 65 bar — the gap is not closed. Arm mean judge 48.5 against the baseline's 46.2, inside the noise floor. Established that the judge does read the new rules: 13 violations across this run and `01-12-03` quote the new sections by name. |
| `01-03-21` | 24 | $4.37 | same scope, after a second authoring pass | **Rejected and reverted.** Arm mean judge 43.6 **with the errored cell excluded** (45.9 if it is pooled, which is the bias described below) — worse than the original text. Restating each style's own word cap, banning inter-tool narration and outlawing conditional recommendations lost ground on three of the four AC cells. Also produced the finding that an errored cell scores 0 on rules and **1.0 on the judge**. |
| `01-12-03` | 6 | $0.95 | all three styles, Sonnet, the two new reserve cases, 1 repeat | Validation that COS-1's new cases run. 0 errors, every cell scored. `reserve-agentic-session` drew 8-10 tool calls, which is **inside** `agentic-fix-verify`'s own 5-13 range — this run does not show the new case is the longer session, and Sonnet is not the model that aborts. See `01-33-41`. |
| `01-13-15` | 30 | $0.73 | all three styles, Haiku, the five shared cases, 2 repeats | Regression check on the shipped text against `22-59-53` filtered to the same five cases and model. Every delta inside the three-point noise floor: rules −1.3/−1.1/+0.8, judge +0.9/−2.6/−0.2 for advanced/intermediate/beginner, n=10 each side. Haiku bought a same-model like-for-like before for $0.73; nothing is concluded from it beyond "nothing broke". |
| `01-33-41` | 6 | $0.35 | all three styles, Haiku, `reserve-agentic-session` only, 2 repeats | Run because the branch review asked what the new case does on the model that aborts — `01-12-03` had only measured Sonnet. **It aborts 3 of 6 on the 12-turn limit.** The three cells that finished used 13, 17 and 17 tool calls, against the single `agentic-fix-verify` Haiku cell that ever finished, at 9 (`22-59-53`, 5 of 6 aborted). Suggestive that the new case really is the longer session, on n=3 against n=1 — not established, and Sonnet's 8-10 points the other way. What *is* established is that it is abort-prone, which is why the reserve gate was made error-aware in the same change. |
| `02-10-45` | 20 | $2.18 | beginner only, both models, the five shared cases, 2 repeats | COS-4's before arm, and the first clean beginner measurement in the project. Rules 92.1 / 93.4, judge 58.7 / 70.7 — 12.8 and 22.3 points above the four-tier table's 45.9 / 48.4, which predates both COS-1's added sections and the contract fix at `3370e4d`. Per case the gap is in three shapes: conv-status-holdout 96.0, conv-status-auth 92.5, then agentic-read-report 45.0, conv-followup-drift 32.5, conv-explain-cache 27.5 on Opus. |
| `02-12-24` | 12 | $1.87 | beginner only, both models, the six reserve cases, 1 repeat | The reserve before arm. Rules 87.2 / 86.4, judge 49.2 / 31.7, 0 errors. Verified uncontaminated by the style rewrite that followed: `cli.mjs` loads style text eagerly at process start, the run began 02:12:24Z and the file was not rewritten until 02:14:21Z. |
| `02-15-14` | 20 | $2.15 | same as `02-10-45`, after COS-4's authoring pass 1 | Rules 98.0 / 97.7, judge 77.8 / 65.8. `total_length` 66.9 → 99.0 and `leads_with_conclusion` 90.0 → 100.0 carry most of the rules gain; `three_question_structure` held at 100.0, so the new shape router did not cost the beats on the cases that check for them. |
| `02-16-47` | 12 | $1.92 | same as `02-12-24`, after pass 1 | The AC #3 validation. Rules 95.6 / 93.5, judge 45.3 / 49.7, 0 errors. Paired over the twelve cells this is the strongest arm in the task: rules **+7.7 [+5.3, +10.1]**, reply words **−55.7 [−83.2, −28.1]**, composite **+7.4 [+0.8, +14.0]**. |
| `02-20-01` | 30 | $3.93 | same shared five, 3 repeats, after a second authoring pass | **Rejected and reverted.** Rules 98.7 / 97.1, judge 68.4 / 74.1 — arm mean 71.2 against pass 1's 71.8, statistically identical. Its five edits each quoted a pass-1 violation, but one introduced a false premise ("There was no job to report") on a tool-using case, and that case fell on both models. No bullet was kept: COS-1's precedent is that unmeasured text does not ship. |
| `02-25-39` | 50 | $6.64 | same shared five, 5 repeats, byte-identical pass-1 text | **The arm that corrected this task's own conclusion.** Judge 72.4 Opus / **55.0 Sonnet**, against 77.8 / 65.8 from the same text at n=10. Pooled to n=35 a model the shipped text reads 73.9 [66.0, 81.9] and 58.1 [50.5, 65.6], and the paired judge delta against the before arm collapses from +7.1 to **+1.3 [−15.0, +17.6]**. Sonnet across four arms of the same five cases: 70.7, 65.8, 74.1, 55.0. |
| `05-29-31` | 2 | $0.07 | beginner, Haiku, baseline, 4 cases, SIGKILLed after cell 2 | **COS-12's evidence.** A run killed with SIGKILL — no handler, no graceful shutdown — left both completed cells fully scored in `rows.json` and a `run.json` reading `complete: false, completed: 2, expected: 4`. `score --rows=` re-read them at exit 0 behind the line `PARTIAL run — 2 cells of 4 expected (2 never ran)`. Under the previous code the same kill would have left the directory empty. |
| `05-31-40` | 1 | $0.02 | beginner, Haiku, baseline, 1 case | COS-12's happy path: a run allowed to finish writes `complete: true`, and `score` says so. Re-scoring `12-44-03` in the same session still reproduced 81.0% and $7.517, so the flush changed no published figure. |

Total persisted: 637 cells, $83.43. Improve-loop spend before COS-3 is additional
and was not tracked until late; from COS-3 onward it is carried on the rows.

Four accounting caveats on that total. Cells that error carry `costUsd: 0` — the
SDK's result message has no cost on a turn-limit abort — so `22-59-53`'s six
failed cells, `01-03-21`'s one and `01-33-41`'s three burned tokens that no row records. And one aborted invocation under
COS-5 (a `run --help` that the CLI then treated as `run`; COS-5 added the guard
that now short-circuits it before any config is read) ran for about two minutes
at concurrency 4 before being killed. It wrote no `rows.json`, so its spend is
real but unquantified and is not in the total above.

Third, the same gap survives the COS-12 flush in a much smaller form: the cell in
flight when a run is killed has already spent tokens and will never be written,
so `05-29-31`'s $0.07 is the two cells that landed and not what the process cost.
Flushing recovers the completed cells, not the interrupted one. Fourth, the total
is the sum of the per-run costs as rounded in the table above; the pre-COS-12
figure was carried as $83.33 while its own rows summed to $83.34.

`22-18-53`, `22-27-15` and `22-59-53` are one story and belong together.
`22-18-53` was a cheap Haiku probe run to decide whether a tighter sentence cap
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
| `14-48-09` | beginner, Haiku only, 1 iteration, repeats 1 — the first run under COS-3 | 18 cells, $0.61. v1 reverted (train −0.029, holdout −0.193). On holdout the rewrite showed the usual signature — rules 70.8 → 83.3, judge 72.5 → **21.2** — while on train both halves fell. Scope too small to conclude anything about Haiku; the run existed to prove persistence. First improve run whose transcripts survive, and re-scoring them offline reproduced all four in-loop numbers exactly. |
| `05-46-38` | beginner, Haiku only, `--iterations=0`, 1 train + 1 holdout case — under COS-12 | 4 cells, $0.09. Not a measurement and not an optimization: the loop measured its baseline and adopted v0. It exists because nothing else exercises `improve`'s persistence path, and COS-12 moved that path onto a shared writer. `run.json` reads `kind: "improve", complete: true, expected: null` — an improve loop's cell count is not known until it stops — and `report.md` still opens with the optimizer-trace warning. |

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
transcripts re-graded offline at no cost — which is the argument for persisting
transcripts.

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

**A cheap-model probe can point the wrong way.** `22-18-53` cost $0.18 and said a
tighter sentence cap works; `22-27-15` cost $2.24 and said it does nothing. The
$2.24 answer is the right one, and `22-59-53` later explained why more simply
than the original account did.

That original account said the cap bound on Haiku because Haiku writes 16.6-word
sentences while Opus and Sonnet write 11–12. The probe's own arms are sound — both
re-derive exactly from its saved rows. What fails is treating its 16.6 arm as
*Haiku's baseline*. `22-59-53` measured the same unchanged 20-word file, same
model, same variant, first over the probe's own four cases and then over all
thirteen. All figures below use `checks.mjs`'s `words()`, the tokenizer
`sentence_length` actually scores with:

| sample of the untightened 20-word file | cells | sentences | mean words | over 12 words |
|---|---|---|---|---|
| `22-18-53` — the probe's baseline arm | 4 | 30 | 16.6 | 60.0% |
| `22-59-53`, same 4 cases | 8 | 79 | 12.1 | 43.0% |
| `22-59-53`, beginner, all 13 cases | 25 | 268 | 12.2 | 38.4% |

The cell is the unit — sentences inside one reply are not independent. On cell
means the gap is +4.06 words, unpaired 95% CI [−0.43, 8.56], which includes zero;
paired by case, +4.06 with 95% CI [0.06, 8.07] at df=3, which excludes it by
0.06. Read together that is weak evidence at n=4, which is the point: two samples
of an identical configuration should not be this far apart, and the probe's arm
is the unstable one.

The last column carries more weight than the means. The probe's case was that the
tightened file cut Haiku's over-12 share from 60.0% to **40.5%**. Haiku's
*untightened* share, at two and six times the sample, is 43.0% and 38.4% — the
40.5% sits inside that range. So the probe's headline movement is fully explained
without the cap doing anything.

Be precise about what that does and does not establish. The tightened arm is
itself only 4 cells, so this is not proof that a 12-word cap has no effect on
Haiku; nobody has re-measured the tightened file at larger n. What it does
establish is that **the evidence for an effect has gone**: the gap the probe
reported is the distance between one small sample and the configuration's own
range, not a distance the cap created.

That leaves a simpler reading of the whole episode. Haiku writes ~12.0-word
sentences, Opus ~11.3, Sonnet ~13.5, so **no model in the matrix sat far enough
above a 12-word cap for one to have obvious room to work**, which is why the
paired validation measured nothing on Opus and Sonnet. There was probably never a
Haiku exception to explain. The decision to revert stands and is strengthened;
only its stated mechanism was doing work the data did not support.

The lesson survives, restated more usefully. The original version — probe the
cheap model to learn whether an instruction *can* bind, measure the target models
before believing it *does* — was built on a gap that a larger sample dissolved.
The durable version: **a probe small enough to be cheap is small enough that its
baseline arm may not reproduce.** Before explaining why a probe shows an effect,
re-measure its own baseline at a larger n. Here that check was available for free
in saved rows and would have cost nothing at the time.

**A cell that never answered is not a badly-styled cell.** `22-59-53` is the
first run where this mattered: six of 78 Haiku cells hit the 12-turn limit and
returned no text, and `scoreDeterministic` grades an empty reply as 0.0 on every
rule. Left pooled, that reads as a ten-point collapse in Haiku's rule compliance
(94.2 → 83.4 on advanced) when what actually happened is that Haiku could not
finish a fix-then-test task at all. Both numbers are worth having and they answer
different questions — how well the style is followed when the model speaks, and
what a user experiences. Report them in separate columns, and never quote the
pooled figure as a style score.

That distinction was carried into COS-7 in advance rather than rediscovered, and
in the event Fable did not need it: `23-48-45` and `23-53-02` errored on 0 of 36
cells between them, including 0 of 6 on the very case Haiku failed 5 of 6 times.
The precaution was still correct to take — the alternative was finding out from
a $7 run.

**Text blocks are concatenated with no separator, so two rules cannot be quoted
on agentic cells.** Found under COS-7 while reading Fable's `agentic-fix-verify`
transcripts. `run.mjs` accumulates the assistant's visible text with
`text += b.text`. On a conversational turn there is one text block and nothing
happens. On an agentic turn there are several, split around the tool calls, and
they are glued together without so much as a space — a saved transcript reads

    "I'll look at the file first.The bug is in `applyDiscount` — ..."

`sentences()` splits on `[.!?]` *followed by whitespace* and `paragraphs()`
splits on a blank line, so the run-on scores as one very long sentence inside one
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

Treat `sentence_length` and `paragraph_length` as unquotable on agentic cells for
every model until this is fixed. `leads_with_conclusion`, `total_length` and the
abort counts are unaffected: the first reads the genuine opening text, the second
counts words, and the third does not depend on segmentation. Fixing the seam
would move agentic figures already published in `FINDINGS.md` and in this ledger,
so it is deliberately raised rather than patched inside a measurement task — the
same handling as the `sentences()` newline gap and COS-9.

**The seam reaches the judge, not only the two segmentation checks.** Found
under COS-1, and it widens the entry above. The mechanism is one line of
`run.mjs` — `if (b.type === 'text') text += b.text`, accumulated over every
assistant message in the turn — so the text saved as a cell's reply is the
*whole turn*, not the final message. On a conversational cell those are the same
thing. On an agentic cell the model's pre-tool and inter-tool narration is
prepended to the status update the case rubric actually asks about, and the judge
is handed all of it.

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
judge score in this project is measured on the whole turn rather than the final
message, so it is not a clean measure of the style. **But the artifact does not
explain the scores away**: ten of eighteen updates are over the word cap on their
own, so a style-file fix still has real work to do. Do not use this entry to
dismiss a bad agentic number.

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
the same run, and the two do not cancel. Filter on `!row.error` before quoting
either.

One consumer of this bias is now fixed, because COS-1 made it worse before it
made it better. Adding a second agentic case to the `reserve` split put the most
abort-prone case type in the project inside `improve`'s adoption gate, which
compared `summary.overall` — an average that pools errored rows. At 36 reserve
cells a side, each one-sided abort moved the delta by roughly 0.01 against a
`minReserveDelta` of −0.02, so two of them could flip a verdict on the turn limit
rather than on the rewrite. The gate now compares only cases that produced a
reply on **both** sides, logs which cases it dropped, and rejects rather than
adopts when nothing is comparable. `01-33-41` measured why this mattered: the new
case aborts 3 of 6 on Haiku. The wider bias in `summarize()` is untouched and
still raised.

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
mean. And price the arm before agreeing to a bar. At COS-4's measured $0.1297 a
cell — its six arms ran $0.1074 to $0.1602 — narrowing one arm's 95% half-width
costs ~24 cells per model for ±10 points (~$3), 48 for ±7 (~$6), 94 for ±5
(~$12), 146 for ±4 (~$19). Detecting a real difference *between* two arms costs
about twice that: 47 cells per arm for 10 points, 95 for 7, 187 for 5, 291 for 4.
Note what this does and does not buy — sample size narrows an interval, it does
not move a point estimate above a bar. A judge bar stated to the point is not
affordable at this project's arm sizes, and two tasks have now been written
against one.
