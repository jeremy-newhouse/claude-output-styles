---
type: Story
title: Extend measurement coverage
tags:
  - harness
  - models
summary: Measure all three styles at both ends of the model range — Haiku and Fable — not just the two tiers in the middle
tasks:
  - cos-5
  - cos-7
  - cos-17
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:50:00.000Z
lore_task_status: done
---

# Extend measurement coverage

## Goal

This story opened with every measurement in the project covering Opus and Sonnet
only: `config/matrix.json` listed `haiku` as a target that no style had ever been
run against, and Fable, the top tier, was not in the matrix at all.

That matters for a claim already made: that one style file serves every model. It
was verified for two adjacent tiers and stated as though it were general.

**Both ends have since been measured** — Haiku under COS-5 (run `22-59-53`) and
Fable under COS-7 (runs `23-48-45` and `23-53-02`) — so the table below spans all
four tiers and the claim now covers the full range.

The two ends were untested for different reasons, and they answer different
questions.

**Haiku** is the smallest model and the most likely to drop instructions under
load, so a rule that survives there is a rule the file is genuinely carrying
rather than one the larger models satisfy by disposition. Rules that Opus and
Sonnet both score at 1.00 are invisible in the current data — Haiku is the only
way to tell which of them the style file is actually enforcing.

**Fable** is the most capable tier and the one used for the longest-running
agentic work, which is where the styles are weakest: `agentic-fix-verify` scores
50.0 on Opus and 40.0 on Sonnet, judge, pooled across the three styles on the
text that ships today (run `00-44-03`; the "around 48%" this paragraph used to
quote came from runs measuring advanced style text that no longer ships). It also
tested a suspicion the two-model data raised but could not settle. Opus overruns
word caps more often than Sonnet, which may be a property of that model or a
property of the tier. Four points on the curve tell them apart — see below.

Coverage, five shared cases. All four tiers measured, no errored cells in any
column. Advanced and intermediate are ten cells a pair; **beginner is 150**.

| style | haiku | sonnet | opus | fable |
|---|---|---|---|---|
| advanced | rules 96.0 / judge 52.9 | rules 96.8 / judge 66.0 | rules 97.8 / judge 73.9 | rules 97.9 / judge 78.3 |
| intermediate | rules 94.3 / judge 62.2 | rules 95.6 / judge 72.6 | rules 94.2 / judge 63.9 | rules 93.1 / judge 67.7 |
| beginner | rules **95.8** / judge **48.2** | rules **97.4** / judge **60.9** | rules **99.2** / judge **66.1** | rules **99.3** / judge **65.2** |

**COS-17 completed the beginner row and this story's own goal with it.** The row
now measures the file that ships (sha256 `86451ddb`) on all four tiers at 150
non-errored cells a model: Opus and Sonnet from run `2026-08-20T03-03-26`
(COS-16), Haiku and Fable from `2026-08-27T12-35-06` and `2026-08-27T12-50-55`.
The two pairs are seven days apart and still comparable, because every input that
could separate them last changed before the earlier run — `checks.mjs` and
`contracts.json` at 2026-08-17, `judge.mjs` and `run.mjs` at 2026-08-18,
`cases.json` at 2026-08-17.

The figures it replaced (rules 90.9 / 92.3 / 91.5 / 91.4, judge 37.5 / 48.4 /
45.9 / 53.9) are removed rather than footnoted: they measured text two hand
rewrites have replaced, and their Opus and Sonnet judge cells were graded against
a 15-word sentence cap the file never stated (`FINDINGS.md`, *The judge column
carries a defect the rules column had corrected*). COS-4's pass-1 text read rules
98.9 / 97.4 and judge 66.8 / 60.9 on Opus and Sonnet at 150 cells (COS-16, run
`19-42-55`), superseding COS-4's own 73.9 / 58.1 at 35; the shipped bytes are
statistically identical to it.

**Beginner's rules column moved from last of three on every tier to ahead of
advanced on three of four**, losing only on Haiku by 0.2. Its judge column rose
10.7 / 12.5 / 20.2 / 11.3 points on Haiku / Sonnet / Opus / Fable and is still
last of the three styles everywhere.

**Word-cap overrun does not track tier.** Mean reply words divided by that
style's own cap: Sonnet 0.961, Haiku 1.088, Fable 1.229, Opus 1.300. In tier
order that sequence turns twice. Paired over the 15 (style × case) cells, the
smallest model overruns significantly *more* than the second smallest
(haiku − sonnet +0.127, 95% CI [+0.034, +0.219]) and the top two tiers are
indistinguishable (opus − fable +0.070, CI [−0.118, +0.259]). The only structure
the data resolves is that Sonnet keeps to the cap and the other three do not —
one model, not a gradient.

**COS-17 re-asked that question on one style at fifteen times the sample, and the
answer held.** Beginner alone, mean reply words ÷ its 80-word cap, before the hand
rewrites and after: Haiku 1.406 → 0.899, Sonnet 1.284 → 0.734, Opus 1.686 →
0.786, Fable 1.648 → 0.830. In tier order the after column reads 0.899, 0.734,
0.786, 0.830 — Sonnet again keeps best to the cap, and the smallest model is now
the *worst* overrunner of the four. The sequence turns in a different place than
the pooled one above, which is the point: it is not the capability ordering, and
it does not survive a change of style text. **The rewrite moved every tier by 0.507
to 0.900, where the largest adjacent-tier difference measured here is 0.339** —
length is a property of the file, not of the model. All four means are now under
the cap, and all ten of the arms' case × model cells fell.

**Fable finishes the agentic work and stops obeying the style.** On
`agentic-fix-verify` it aborted 0 of 6 cells against Haiku's 5 of 6, on cells
averaging 4.8× a conversational Fable cell. Its own compliance falls from
rules 94.1 / judge 66.6 on the shared five to 79.5 / 41.2 there, with
`leads_with_conclusion` at 16.7: five of six replies open with "I'll look at the
file first." No amount of capability removed the narration habit.

Haiku was additionally run across the full 13-case pool (78 cells), which no
other tier has had. Twelve of those cells are the two write-then-verify cases,
the largest kind, so the full pool is a much heavier run than the five-case
table on any tier — but **how much heavier on another tier has not been
measured.** This line previously said Fable would run "an order of magnitude
more tokens"; that was the deleted cost table read as a token span, and per-token
prices differ across tiers by about the factor the costs did.
Two results from that wider run shaped how COS-7 was run:

- **Reserve a column for "no reply".** Six of Haiku's 78 cells hit the 12-turn
  limit and returned nothing, all on cases that edit a file and then run tests.
  Averaging those in as zeros costs Haiku about 10 points of apparent rule score.
  The distinction was built into COS-7 from the start rather than rediscovered —
  and in the event it was not needed: Fable errored on 0 of its 36 cells, so its
  "replies only" and "counting no-reply as 0" figures are the same number.
- **Do not carry a probe's number into a conclusion.** The claim that Haiku
  writes long sentences came from four cells and did not survive a larger sample
  of the same configuration; see the experiment ledger.

One limit of the instrument surfaced under COS-7 and was fixed under COS-10, but
not retroactively. `run.mjs` concatenated assistant text blocks with no
separator, so on agentic turns the pre-tool narration was glued to the post-tool
answer and `sentences()` and `paragraphs()` both under-split. It affects 0 of the
131 cells that made no tool call and most of those that did, so `sentence_length`
and `paragraph_length` are not quotable on the agentic cells **of the runs behind
this story**, for any tier — the glue cannot be undone offline, so COS-10 fixes
future runs and leaves these ones as measured. The four-tier table above is
unaffected in practice: one of its five cases is agentic, `paragraph_length`
still scores 95.8–100.0 there on every model, and the artifact is identical in
all four columns.

A second limit of the same kind was fixed under COS-13 and is equally
non-retroactive: the fixture every agentic case works in shipped a test suite
that failed on a clean checkout, because its `priceOrder` assertion expected 966
where the code returns 965. Three of the four agentic cases ask the model to run
the tests, so the runs behind this story were measured against a model meeting an
unexplained failure it had not caused — and a second assertion broke the moment
the model correctly fixed the bug it was sent to fix. `npm test` did not work at
all, since the fixture shipped without a `package.json` and is copied to the
workspace root. Neither is anything the
style text governs, and both landed hardest on the models that did the most work.
This one shapes what the model wrote rather than what the scorer read, so no
re-score can undo it — and unlike the glued turn it cannot be narrowed to a set
of checks, because a cell that met the failure can move on any of them. Every
conversational case is untouched, since those prompts never involve the repo;
`agentic-read-report` is the least exposed of the four, asking for a reading
rather than a test run, but a model that ran the suite anyway still met it.

COS-10 also changed `sentences()` to split on a single newline, and that half
*does* apply to saved rows. It moved this story's per-model sentence figures —
Opus 10.6 → 10.2 words, Fable 11.1 → 10.7, Haiku 11.3 → 10.1, Sonnet 13.4 → 12.9
— without changing the conclusion; Sonnet's lead over the field grew. The
corrected figures are in `FINDINGS.md`.

## Acceptance criteria

- All three styles measured on Haiku and on Fable across the standard case set,
  rules and judge reported separately.
- The per-model comparison in the findings spans all four tiers.
- Any model-specific failure mode is recorded, or its absence stated explicitly.
- Whether word-cap overrun tracks model tier is answered from the four-tier
  figures — answered twice, on the pooled three-style data and again on beginner
  alone after its rewrite. No, both times.
- The one-file-for-every-model decision is confirmed across the range or amended.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [COS-5](../../backlog/tasks/cos-5%20-%20Measure-the-styles-on-Haiku.md) | Measure the styles on Haiku | Done |
| [COS-7](../../backlog/tasks/cos-7%20-%20Measure-the-styles-on-Fable.md) | Measure the styles on Fable | Done |
| [COS-17](../../backlog/tasks/cos-17%20-%20Re-measure-beginner-on-Haiku-and-Fable-after-the-rewrite.md) | Re-measure beginner on Haiku and Fable after the rewrite | Done |
<!-- lore:tasks:end -->

## Notes

Cell size is asymmetric. Three styles, one model, five cases, two repeats is
thirty cells, and a single write-then-verify agentic cell is 4.8× a conversational
one on Fable — a within-model ratio, which is what makes it sound. **How the same
thirty cells compare across tiers is not measured**; the retraction above applies
here too. Scope the Fable case set before running rather than reusing the full
matrix.

SDK model values: `haiku` and `claude-fable-5[1m]`. There is no bare `fable`
alias in the model list. Fable is kept out of `config/matrix.json`'s `models` on
run length alone; since COS-14 that list is `run`'s only, and `improve` runs its
own `improve.models`, so a model added there no longer multiplies through every
optimizer iteration. Pass the id explicitly, quoted, and name `--variants` while
you are there: omitting it runs all five variants, which is how COS-7's one-cell
model-id probe became a five-cell one.

If Haiku exposes rules that the larger models satisfy without being told, those
rules are candidates for deletion under the removing-beats-adding principle — but
only after confirming the larger models still hold them once the rule is gone.
