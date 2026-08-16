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
| `22-18-53` | 8 | $0.18 | beginner 20-word vs 12-word cap, Haiku, 4 cases | A tighter stated cap appeared to change Haiku: mean sentence 16.7 → 12.4 words, share over 20 words 30.0% → 13.5%, reply length flat. Read alone it argues for tightening. It replicates on neither the target models (row below) nor Haiku itself (`22-59-53`) — **superseded, see "A cheap-model probe can point the wrong way"**. Figures here are re-derived from the saved rows; the row previously read 16.6 → 12.3 and "over-cap 30% → 11%", and the 11% did not reproduce. |
| `22-27-15` | 24 | $2.24 | beginner 20-word vs 12-word cap, both models, 6 cases across all three splits, paired | **The change was rejected.** Mean sentence length moved +0.26 words, 95% CI [−0.77, +1.29], six of twelve pairs shorter. Judge 0.557 → 0.532, reply length 105 → 114 words. Basis for keeping one sentence cap for all three levels. |
| `22-59-53` | 78 | $1.88 | all three styles, Haiku, **full 13-case pool**, 2 repeats | The Haiku baseline, and the first run on the whole pool. Rule compliance holds at the third tier (90.9–96.0 on the five shared cases, never more than 1.8 points behind the better of Opus and Sonnet); the judge does not (37.5–62.2, last on all three styles). **Six cells returned no reply at all** — the 12-turn limit, only on cases that edit a file then run tests. Also refuted the 16.6-word sentence claim below. |

Total persisted: 347 cells, $36.56. Improve-loop spend before COS-3 is additional
and was not tracked until late; from COS-3 onward it is carried on the rows.

Two accounting caveats on that total. Cells that error carry `costUsd: 0` — the
SDK's result message has no cost on a turn-limit abort — so `22-59-53`'s six
failed cells burned tokens that no row records. And one aborted invocation under
COS-5 (a `run --help` that the CLI treats as `run`, since there is no help flag
on the subcommand) ran for about two minutes at concurrency 4 before being
killed. It wrote no `rows.json`, so its spend is real but unquantified and is not
in the total above.

The last two rows are a matched pair and belong together. `22-18-53` was a cheap
Haiku probe run to decide whether a tighter cap was worth validating; `22-27-15`
is the validation, and it reversed the probe's answer. Quoting either alone
misrepresents what was measured.

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
sentences while Opus and Sonnet write 11–12. **The 16.6 does not reproduce.**
Same style file, same model, same variant, same four case ids, measured with the
same `sentences()`:

| sample of the untightened 20-word file | cells | sentences | mean words | over 12 words |
|---|---|---|---|---|
| `22-18-53` (the probe's baseline) | 4 | 30 | 16.7 | 60.0% |
| `22-59-53`, same 4 cases | 8 | 79 | 12.2 | 43.0% |
| `22-59-53`, beginner, all 13 cases | 25 | 268 | 12.4 | 38.4% |

The cell is the unit — sentences inside one reply are not independent — and on
cell means the gap is +4.10 words, 95% CI [−0.40, 8.61]; paired by case, +4.10
with 95% CI [−0.11, 8.32] at df=3. Both intervals cross zero. Four cells was
simply too few.

The last column is the one that settles it. The probe's whole case was that the
tightened file cut Haiku's over-12 share from 60.0% to **40.5%**. Haiku's
*untightened* share is 38.4–43.0%. **The cap did nothing on Haiku either**; the
60.0% was a high draw and the "improvement" was regression to its own mean.

So the corrected reading is simpler than the one it replaces: Haiku writes
~12.2-word sentences, Opus ~11.4, Sonnet ~13.7, and **no model in the matrix had
headroom for a 12-word cap to exploit**. That is exactly why the paired
validation measured nothing on Opus and Sonnet — there was never a Haiku
exception to explain. The decision to revert stands and is strengthened; only its
explanation was wrong.

The lesson survives, restated more usefully. The original version — probe the
cheap model to learn whether an instruction *can* bind, measure the target models
before believing it *does* — was drawn from a difference that was not real. The
durable version: **a probe small enough to be cheap is small enough to hand you a
baseline that will not reproduce.** Before explaining why a probe shows an effect,
re-measure the probe's own baseline at a larger n. Here that check was available
for free, in saved rows, and would have cost nothing at the time.

**A cell that never answered is not a badly-styled cell.** `22-59-53` is the
first run where this mattered: six of 78 Haiku cells hit the 12-turn limit and
returned no text, and `scoreDeterministic` grades an empty reply as 0.0 on every
rule. Left pooled, that reads as a ten-point collapse in Haiku's rule compliance
(94.2 → 83.4 on advanced) when what actually happened is that Haiku could not
finish a fix-then-test task at all. Both numbers are worth having and they answer
different questions — how well the style is followed when the model speaks, and
what a user experiences. Report them in separate columns, and never quote the
pooled figure as a style score. This will matter more for Fable, not less: it is
the tier meant for the longest agentic runs.

**Noise floor.** At one repeat and five cases, a single case moves the mean by
about 0.03. Differences under three points are not real. `22-59-53` puts a
sharper number on the same warning from the other direction: at four cells, a
sentence-length mean was off by 4.5 words and an over-cap share by 17 points,
both large enough to have supported a confident and wrong explanation.
