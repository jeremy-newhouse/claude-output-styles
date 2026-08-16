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

Total persisted: 237 cells, $32.26. Improve-loop spend before COS-3 is additional
and was not tracked until late; from COS-3 onward it is carried on the rows.

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
correction.

**Noise floor.** At one repeat and five cases, a single case moves the mean by
about 0.03. Differences under three points are not real.
