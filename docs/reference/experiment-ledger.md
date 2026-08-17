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
| `01-03-21` | 24 | $4.37 | same scope, after a second authoring pass | **Rejected and reverted.** Arm mean judge 43.6 — worse than the original text. Restating each style's own word cap, banning inter-tool narration and outlawing conditional recommendations lost ground on three of the four AC cells. Also produced the finding that an errored cell scores 0 on rules and **1.0 on the judge**. |
| `01-12-03` | 6 | $0.95 | all three styles, Sonnet, the two new reserve cases, 1 repeat | Validation that COS-1's new cases run. 0 errors, every cell scored. `reserve-agentic-session` drew 8-10 tool calls per cell, so it does force the longer session it was written for. |
| `01-13-15` | 30 | $0.73 | all three styles, Haiku, the five shared cases, 2 repeats | Regression check on the shipped text against `22-59-53` filtered to the same five cases and model. Every delta inside the three-point noise floor: rules −1.3/−1.1/+0.8, judge +0.9/−2.6/−0.2 for advanced/intermediate/beginner, n=10 each side. Haiku bought a same-model like-for-like before for $0.73; nothing is concluded from it beyond "nothing broke". |

Total persisted: 484 cells, $64.30. Improve-loop spend before COS-3 is additional
and was not tracked until late; from COS-3 onward it is carried on the rows.

Two accounting caveats on that total. Cells that error carry `costUsd: 0` — the
SDK's result message has no cost on a turn-limit abort — so `22-59-53`'s six
failed cells and `01-03-21`'s one burned tokens that no row records. And one aborted invocation under
COS-5 (a `run --help` that the CLI treats as `run`, since there is no help flag
on the subcommand) ran for about two minutes at concurrency 4 before being
killed. It wrote no `rows.json`, so its spend is real but unquantified and is not
in the total above.

`22-18-53`, `22-27-15` and `22-59-53` are one story and belong together.
`22-18-53` was a cheap Haiku probe run to decide whether a tighter sentence cap
was worth validating; `22-27-15` is the validation, and it reversed the probe's
answer on Opus and Sonnet; `22-59-53` then measured Haiku's own baseline at six
times the probe's sample and removed the reason the probe had been believed.
Quoting any one of the three alone misrepresents what was measured.

### Optimizer runs

Four `improve` invocations, eight candidate rewrites, one survivor.

| run | scope | outcome |
|---|---|---|
| first | advanced, Opus only, 2 iterations | v1 reverted, **v2 kept** and adopted. The only rewrite that ever survived. |
| second | intermediate then beginner, both models, patience 2 | Intermediate converged at v2 and was later rejected out of sample. Crashed into beginner on an unwrapped judge call at `maxTurns: 1`. |
| third | beginner and advanced, both models, after the crash fix | Beginner converged at **v0** — both rewrites raised train ~6 and dropped holdout ~8, rejected twice. Advanced kept a v2 that was later rejected out of sample. |
| `14-48-09` | beginner, Haiku only, 1 iteration, repeats 1 — the first run under COS-3 | 18 cells, $0.61. v1 reverted (train −0.029, holdout −0.193). On holdout the rewrite showed the usual signature — rules 70.8 → 83.3, judge 72.5 → **21.2** — while on train both halves fell. Scope too small to conclude anything about Haiku; the run existed to prove persistence. First improve run whose transcripts survive, and re-scoring them offline reproduced all four in-loop numbers exactly. |

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
| over the style's word cap on the saved text | 14 of 18 |
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

**Noise floor.** At one repeat and five cases, a single case moves the mean by
about 0.03. Differences under three points are not real. `22-59-53` puts a
sharper number on the same warning from the other direction: at four cells, a
sentence-length mean was off by 4.5 words and an over-cap share by 17 points,
both large enough to have supported a confident and wrong explanation.
