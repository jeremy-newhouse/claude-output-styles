# Why output styles look ignored on Opus

Measured against Claude Code 2.1.233 and Agent SDK 0.3.233 on 2026-08-15, using
the harness in `harness/`. Raw transcripts are in `harness/results/`.

## Summary

Opus does not ignore output styles. It obeys 91% of the measurable rules in
`plain-english-advanced.md`, against Sonnet's 93%. The gap is small and it is
concentrated in two rules, both of which are documented Opus 5 behaviors:

1. **Response length.** 16 of 25 Opus replies overran the style's 120-word cap.
   Median overrun ~175 words, worst 241. Sonnet overruns too, but half as often.
2. **Pre-tool-call narration.** On agentic cases Opus opens with
   "I'll look at the repo first." before its first tool call — scoring 0% on
   `leads_with_conclusion`, which the style explicitly forbids. Sonnet did not
   do this in any run.

Everything else — active voice, no filler, no emoji, two-option decisions, the
three-question status structure — Opus holds about as well as Sonnet.

The felt experience of "ignored" comes from those two failures landing on the
first thing you read in every message.

Both numbers above are from run `20-10-29`, on an advanced style file that has
since been replaced. Two later results qualify them, and neither softens the
conclusion. On the shipped files Opus overruns 1.44× as often as Sonnet, not
twice. And **neither failure is an Opus trait.** All four tiers overrun the word
cap, on 30% to 43% of replies. Three of the four narrate before the first tool
call — `leads_with_conclusion` scores 83.3 on Haiku, 83.3 on Fable and 90.0 on
Opus, against Sonnet's 100.0 — so the top tier is joint worst at it and Sonnet,
not Opus, is the outlier in both halves. See the per-model baseline below.

## Three separate causes

### 1. Your global setting points at a style that does not exist

`~/.claude/settings.json` contains `"outputStyle": "standard"`.

No style resolves to that name. The three `evolv-*.md` files in
`~/.claude/output-styles/` have **no YAML frontmatter**, so their names come
from their filenames — `evolv-standard`, not `standard`. Claude Code fails soft
here: no error, it just runs Default.

The three `plain-english-*.md` files do have frontmatter and do resolve. This
repo works because `.claude/settings.local.json` names one of them correctly.
Everywhere else you have been running plain Default, not a custom style at all.

### 2. Opus gets a shorter system prompt than Sonnet

Confirmed by direct probe:

| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` | top-level sections in the system prompt |
|---|---|
| `1` | 8 |
| `0` | 12 |

The gate is in the 2.1.233 binary: a truthy value forces the short prompt on, an
explicit `"0"` or `"false"` forces it off, and otherwise the choice is made per
model. Opus gets the short one by default. The long one carries explicit
anti-verbosity rules that the short one drops.

This is the cause most often cited online as the fix. **It measured worse**, see
below.

### 3. The style is not at the end of the prompt

The docs state that Claude Code "adds each output style's custom instructions to
the end of the system prompt." Observed in a live Opus session, the
`# Output Style:` section sits mid-prompt with five sections after it —
harness rules, session guidance, memory, environment, delivery and correction
policy. Anthropic's own Opus 5 prompting guide says length and tone rules placed
only at the top of a long prompt get diluted, and recommends repeating one line
near the end.

The docs also state that "all output styles trigger reminders for Claude to
adhere to the output style instructions during the conversation." No such
reminder appeared in a live session transcript, and no matching string appears
in the 2.1.233 binary. Treat the style as stated once, at session start, and
never repeated.

## What actually helps — measured

Advanced style, Opus, 5 cases per variant, one run each. Higher is better.

| variant | score | rules | judge |
|---|---|---|---|
| **baseline** (style file only) | **90.2%** | 93.7% | 82.2% |
| tail-reminder (one line at end of style) | 89.5% | 92.5% | 82.6% |
| long-prompt (`SIMPLE_SYSTEM_PROMPT=0`) | 85.7% | 90.4% | 74.6% |
| all three together | 81.5% | 89.2% | 63.4% |
| claude-md (rules restated in CLAUDE.md) | 80.8% | 90.3% | 58.4% |

**Update (COS-21, 2026-08-28): re-tested at 30x this table's n, with a paired
interval per figure, on the exact cell above (advanced, Opus) plus two more
legs. The 9.4- and 4.5-point figures did not reproduce — both are withdrawn.**
On advanced x Opus, every variant above is a null: composite deltas of −0.7 to
−1.7, no interval excluding zero. On a second Opus leg (beginner style) only
one of four variants — all three layers stacked — cleared zero, and it cleared
downward (−2.8 points). On a Haiku leg, three of four layers instead cleared
zero **upward** (+3.3 to +5.2 points): a model missing baseline far more often
(judge 44% vs Opus's 82%) measurably benefited from the same layers that cost
Opus nothing measurable. Full detail: `docs/adr/reject-harness-level-reinforcement-of-style-rules.md`.

The result still matches Anthropic's guidance for Opus 5 in direction —
instructions stack on top of what the model already does, so redundant
guardrails cost tokens and length without confirmed adherence gains on a
model already complying — but the claimed magnitudes above should not be
quoted, and the conclusion does not extend to a weaker or struggling model.

## Recommended changes

**Fix the config.** Set `outputStyle` in `~/.claude/settings.json` to a name that
exists, or add `name:` frontmatter to the `evolv-*.md` files. Right now the
global setting is inert.

**Withdrawn (COS-21):** the earlier advice here — that a CLAUDE.md style
section measurably hurts, and deleting one is an improvement — rested on a
five-cell arm that did not reproduce at 150 cells on the same cell. Treat a
CLAUDE.md restatement as unproven, not as confirmed harm; do not delete one
on the strength of this document.

**Do not set `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=0`** on a model already
complying with the style (Opus, here) — no benefit measured across two Opus
legs, though the cost is also not statistically confirmed. On a model missing
baseline more often (Haiku), the re-test measured this as a clear net
*positive* (+5.2 [+2.1, +8.2]) — do not apply this advice to a weaker model
without measuring that cell.

**Fix the two failing rules inside the style file itself**, since that is the
only lever that measured neutral-to-positive:

- Make the length rule the last line of the file, not a mid-file bullet.
- Replace prohibitions with one short good/bad example pair. Anthropic's guide
  is explicit that positive examples of the wanted style beat instructions about
  what not to do.
- Add an explicit rule for the pre-tool-call sentence, which is currently
  unaddressed: Opus will narrate before its first tool call unless told what
  that sentence should look like.
- Delete any instruction telling the model to verify or double-check its work.
  Opus 5 already does, and the instruction compounds into longer output.

`harness/src/cli.mjs improve` automates exactly this rewrite-and-measure loop,
with a holdout split so the rewrite cannot game the training prompts, and a
reserve split — held out of the loop entirely — that the winner must clear
before it is presented as one.

## The loop, run once

Advanced style, Opus, 3 train cases and 2 holdout cases, 2 iterations:

| version | train | holdout | outcome |
|---|---|---|---|
| v0 (current file) | 0.914 | 0.846 | baseline |
| v1 | 0.893 | 0.870 | reverted — train fell |
| v2 | 0.923 | 0.881 | **kept** |

The winner was adopted into `plain-english-advanced.md`. It is 32 words *shorter*
than the original and makes four changes, all of which the measurements asked
for:

- Deletes the "Bad:" example and keeps only a "Good:" one, labelled with its
  word count.
- Adds an explicit rule for beat 3 of the status update, which Opus was dropping.
- Merges the duplicated rule sections and deletes "reply with the minimum that
  is needed," which measured as doing nothing.
- **Ends the file with the enforceable length rule**: "Count the words. Keep the
  whole reply under 120, headers and code included. Over the cap, cut caveats
  and trade-off detail first."

A caveat on precision: at 3 train cases and one run each, a single case swings
the mean by ~0.03. Both the variant sweep and this loop show directions, not
tight estimates. Raise `run.repeats` and add cases before treating any gap under
about 3 points as real.

## One file, not one per model

The optimized style was authored from Opus-only failures, so the obvious worry is
that it overfits to Opus. It does not. Both styles, both models, 5 cases each:

| style | model | score | rules |
|---|---|---|---|
| optimized | sonnet | **94.9%** | 97.5% |
| optimized | opus | **92.8%** | 98.2% |
| original | sonnet | 89.0% | 92.3% |
| original | opus | 85.9% | 92.8% |

The Opus-tuned file improved Opus by 6.9 points and Sonnet by 5.9, and narrowed
the gap between the models from 3.1 points to 2.1. The rule that drove it:

| rule | Opus | Sonnet |
|---|---|---|
| `total_length` | 0.61 → 0.91 | 0.86 → 0.99 |
| `sentence_length` | 0.89 → 1.00 | 0.70 → 0.85 |
| `three_question_structure` | 1.00 → 1.00 | 0.50 → 0.83 |

Four of five Opus replies went from over the 120-word cap to under it. Only the
bad-news case still overruns, at 173 words against 222 before.

**Per-model style files are not needed and would not work well anyway.** The two
models drop *different subsets of the same rules* — Opus loses length control and
narrates before its first tool call; Sonnet writes longer sentences and skips
status beats. Neither needs a rule the other should not follow, so a per-model
file would duplicate 11 of 13 rules to differentiate 2. Separately, `outputStyle`
is a single string with no per-model key, and the style is read once at session
start — switching model mid-session does not reload it, so you would silently run
the wrong file until the next `/clear`.

Two tiers later this still holds, and the argument is now stronger than
"different subsets". Across all four models the *same four rules* are the only
ones anyone drops — `total_length`, `leads_with_conclusion`, `sentence_length`
and `no_process_narration` — and the remaining eight score 96.7 to 100.0 on every
tier at once. There is no rule that one model needs and another should be spared,
which is what a per-model file would have to be built on.

### One harness fix this run produced

The comparison first showed `two_options_max` regressing on Sonnet, 1.00 → 0.50.
That was a scorer artifact. The optimized reply led with the recommendation and
named both alternatives in prose without the literal "Option A / Option B"
labels, and the check required the labels. The check now scores the structure —
at most two options, compared, one recommendation — and the regression
disappears. Re-graded offline from the saved transcripts, with no new cells run.

## Converged state

Ran the optimizer to convergence on all three styles with cross-model fitness
(`--models=opus,sonnet`), per-style judge weights, and a patience-2 stop.

| style | in use | loop outcome |
|---|---|---|
| advanced | round-1 optimized version | round-2 candidate rejected out of sample |
| intermediate | original | both candidates rejected |
| beginner | original | loop kept nothing; converged at v0 |

**The loop has stopped improving these styles.** Every rewrite after the first
advanced one raised deterministic-rule scores and lowered judge scores, and
degraded on cases held out of every split. Six rewrites across three styles, one
survived.

Beginner never produced a keeper: both attempts raised train ~6 points and
dropped holdout ~8. That is overfitting to three training cases, and the keep
rule caught it both times.

Where the remaining headroom actually is: `agentic-fix-verify` and
`conv-decision-holdout`. Multi-tool sessions and open-ended decisions are handled
poorly by all three styles. That is a content gap, not a wording gap — rewriting
the same rules will not close it.

Both cases now have a current-text baseline, from run `00-44-03` — judge pooled
across the three styles, 3 cells per figure:

| case | opus | sonnet |
|---|---|---|
| `agentic-fix-verify` | 50.0 | 40.0 |
| `conv-decision-holdout` | 48.3 | 46.7 |

Earlier drafts of this page put both at "~48% across every style, old and new".
The number was close but its provenance was not: it pooled runs `20-10-29` and
`23-36-59`, which measured advanced style text that no longer ships. Writing the
new rules did not close the gap either — see *A content gap that new content did
not close* below.

## Per-model baseline, all four tiers

Baseline variant, 2 repeats, five cases, 10 cells per pair. Every cell in this
table answered the *same five prompts* under the *same style text* and was graded
by the *same scoring code*, so the columns are directly comparable. Opus and
Sonnet come from run `12-44-03`, Haiku from `22-59-53`, Fable from `23-48-45`;
the three runs are separate invocations on the same day, which is the only
difference between the columns. No cell in any column errored.

**Reproducing these figures requires re-scoring, not reading `rows.json`.**
`contracts.json` changed at `3370e4d`, after `12-44-03` ran, so that run's stored
`rulesScore` values are graded against the older contract and give 93.8 / 90.2 /
95.0 / 91.7 where this table says 94.2 / 91.5 / 95.6 / 92.3. The table is on
today's scorer throughout. Regrade with `node src/cli.mjs score --rows=…`, which
is free, before concluding that a number here is wrong.

**The beginner row below is history. The current one is here, and it is now
complete across all four tiers.** COS-4 rewrote `plain-english-beginner.md` after
those runs and COS-16 replaced its bytes again with the three-edit candidate that
ships today (sha256 `86451ddb`). COS-17 finished the picture by measuring that
file on the two tiers COS-16 skipped:

| model | rules | judge | mean reply words | words ÷ 80-word cap |
|---|---|---|---|---|
| haiku | 95.8 | 48.2 | 71.9 | 0.899 |
| sonnet | 97.4 | 60.9 | 58.7 | 0.734 |
| opus | 99.2 | 66.1 | 62.9 | 0.786 |
| fable | 99.3 | 65.2 | 66.4 | 0.830 |

**150 non-errored cells a model, 0 errored in every column.** Opus and Sonnet from
run `2026-08-20T03-03-26`, Haiku from `2026-08-27T12-35-06`, Fable from
`2026-08-27T12-50-55` — the same five shared cases and the same style bytes in all
four. The runs are seven days apart, which matters less than it looks: every
input that could make them incomparable last changed *before* the earliest of
them. `checks.mjs` and `contracts.json` at `606ee23` and `72abcc7` (2026-08-17),
`judge.mjs` and `run.mjs` at `b96a293` (2026-08-18), `cases.json` at `2319902`
(2026-08-17). Same scorer, same contract, same judge prompt, same runner, same
cases, same bytes — the model is the only thing that differs between columns.

Read that table against the ten-cell one below and **every one of the eight rules
and judge cells rises** — Haiku's judge by 10.7 points and Fable's by 11.3, and
beginner's rules column from 90.9–92.3 to 95.8–99.3. Two hand rewrites and a
contract fix are stacked in that gap and no arm separates them, so it is not one
change's effect size; what it is, is the whole distance beginner has travelled
since the baseline was taken.

**The rises are paired, not arm-mean subtraction.** Pairing by case × model and
averaging repeats within a pair — COS-27's method, `node src/cli.mjs interval` —
the two new tiers against the pre-rewrite arms they replace, over 10 pairs:

| metric | pooled, 10 pairs | haiku, 5 pairs | fable, 5 pairs |
|---|---|---|---|
| rules | +6.4 [−0.7, +13.5] | +5.0 [−6.2, +16.1] | +7.9 [−6.6, +22.3] |
| judge | **+11.0 [+3.4, +18.7]** | +10.7 [−1.0, +22.5] | +11.3 [−4.8, +27.4] |
| words | **−53.0 [−91.4, −14.6]** | −40.6 [−86.0, +4.8] | −65.4 [−151.1, +20.3] |
| composite | **+8.7 [+1.8, +15.6]** | +7.8 [−2.4, +18.1] | +9.6 [−5.0, +24.2] |

**Read those as directional and read the arm means as the result.** One confound
sits on the before side and one does not, and which is which matters.

**The judge halves are clean.** `3370e4d` landed at 13:14 UTC on 2026-08-16; the
Haiku and Fable baselines ran at 22:59 and 23:48 the same day, so both were graded
*after* the cap was corrected. The defect described below reaches the Opus and
Sonnet columns of the historical row and not these two — the two rises above are
the only before-and-after judge comparison on beginner that the cap drift never
touched.

**The rules halves need a re-score first.** `checks.mjs` and `contracts.json`
changed again on 2026-08-17, after both baselines, so their stored `rulesScore`
is graded by an older scorer; re-deriving offline reads Haiku 91.1 and Fable 91.6
against the published 90.9 and 91.4. That is free (`node src/cli.mjs score
--rows=…`) and it does not move the sign.

**The seam reaches both.** All 20 before-side rows predate the COS-10 text-block
fix, 4 of them on the agentic case, so their word counts read high and their
sentences under-split. Dropping that case — the same exclusion the sentence-length
table below makes, for the same reason — keeps every sign and clears none of the
three intervals at 8 pairs: words −45.2 [−93.1, +2.8], rules +2.9 [−3.3, +9.0],
judge +9.6 [−0.1, +19.4]. The four arm means above carry no confound between
them.

**No cell was aborted or excluded.** Both new arms returned 150 of 150 with a
reply; the 2-cell usage probe that preceded them returned 2 of 2. Every mean here
is over the whole arm, and there is nothing held out of it.

On COS-4's pass-1 text — what shipped between COS-4 and COS-16 — beginner read
rules 98.9 / 97.4 and judge 66.8 / 60.9 on Opus and Sonnet at 150 cells a model
(COS-16, run `19-42-55`); COS-4's own 73.9 / 58.1 at 35 cells is superseded on the
judge halves by that larger arm. The shipped bytes are statistically identical to
it. Read `19-42-55` as measuring COS-4's pass-1 file, not today's.

**COS-18 re-measured the advanced and intermediate rows on Opus and Sonnet at 150
cells a model, and they no longer rest on ten.** Run `2026-08-20T12-12-10`, the
shared five, 0 errored. Advanced and intermediate's Haiku halves were raised the
same way by COS-19 (`2026-08-28T02-58-38-491Z` and `2026-08-28T13-31-38-172Z`,
150 cells each, 0 errored). **Only advanced × Fable and intermediate × Fable
still rest on ten** — COS-19 tried to raise them the same way and lost 45 of 150
cells to repeated session-limit errors on `claude-fable-5[1m]` (run
`2026-08-28T03-13-14-527Z`, 105 non-errored, one case (`conv-followup-drift`)
entirely lost); raising them is COS-34. The table below stands as the four-tier
picture, current on ten of twelve cells; the two Fable cells' figures are
unchanged from the historical baseline and their interval is wide accordingly.

| style | rules sonnet | rules opus | judge sonnet | judge opus |
|---|---|---|---|---|
| advanced | 96.8 → **97.3** | 97.8 → **99.4** | 66.0 → **68.1** | 73.9 → **74.3** |
| intermediate | 95.6 → **94.7** | 94.2 → **95.6** | 72.6 → **72.7** | 63.9 → **69.5** |

Every move is small except intermediate's Opus judge, which rises 5.6 points.
The arm means still rank Sonnet's intermediate above its advanced (72.7 > 68.1)
and Opus's advanced above its intermediate (74.3 > 69.5) — **but whether that
direction is distinguishable from case-to-case noise was never actually
tested with a paired interval until COS-19; see the "clean split" re-check
below, which finds it is not, on any of the four models.**

COS-18 also authored and measured a fix for intermediate — re-scoping its cap out
of its status-update section — which reads rules **99.1 / 97.1** and judge
**75.3 / 71.9** at the same sample (run `2026-08-20T12-30-35`). **It has not
shipped**: its reserve validation could not be completed, and it waits in COS-33.
The intermediate row here measures the file that ships today.

**COS-19 raised the Haiku halves the same way** (run `2026-08-28T02-58-38-491Z`
for advanced, `2026-08-28T13-31-38-172Z` for intermediate, 150 cells each,
0 errored), paired against the same `22-59-53` ten cells COS-18 pairs Opus and
Sonnet against:

| style | rules Δ (5 pairs) | judge Δ (5 pairs) |
|---|---|---|
| advanced | +0.6 [−4.7, +5.8] | +4.2 [−18.2, +26.5] |
| intermediate | +1.3 [−2.2, +4.7] | −3.5 [−24.1, +17.1] |

Both intervals contain zero at 5 pairs — read the arm means below as the load-
bearing figures, same caveat as every paired delta in this section.

**Every judge figure below now carries a 95% interval** — `interval --rows=…`'s
single-sample mode (COS-19 AC #2). **It is computed over case means, not raw
cells**: five shared cases, repeats averaged within each case first, then a
Student-t interval over the resulting five numbers (n=5, df=4 on every row
regardless of repeat count). A first version of this tool treated all 150
rows as independent and reported spuriously tight bands (roughly ±5 points);
review caught it before it shipped. Repeats are not independent draws of
*which case got asked* — only of the model's answer to a fixed prompt — so a
30-repeat arm still carries only 5 independent data points for this question,
the same as a 2-repeat arm:

| style | model | n cases | rules | judge | judge 95% CI |
|---|---|---|---|---|---|
| advanced | haiku | 5 | 96.6 | 57.1 | [18.5, 95.6] |
| advanced | sonnet | 5 | 97.3 | 68.1 | [33.6, 102.6] |
| advanced | opus | 5 | 99.4 | 74.3 | [47.0, 101.6] |
| advanced | fable | 5 | 97.9 | 78.3 | [60.3, 96.3] |
| intermediate | haiku | 5 | 95.5 | 58.7 | [23.1, 94.3] |
| intermediate | sonnet | 5 | 94.7 | 72.7 | [46.5, 98.9] |
| intermediate | opus | 5 | 95.6 | 69.5 | [39.1, 99.9] |
| intermediate | fable | 5 | 93.1 | 67.7 | [33.5, 101.9] |
| beginner | haiku | 5 | 95.8 | 48.2 | [24.9, 71.5] |
| beginner | sonnet | 5 | 97.4 | 60.9 | [38.9, 82.9] |
| beginner | opus | 5 | 99.2 | 66.1 | [48.2, 84.1] |
| beginner | fable | 5 | 99.3 | 65.2 | [43.0, 87.5] |

**These intervals do not narrow between the n=10 and n=150 cells** — every
row shows n=5, because case count, not cell count, is what this particular
interval is sized on. That does not mean the extra cells bought nothing:
raising repeats per case shrinks the SE of a *paired* comparison (below),
because pairing removes case-to-case spread and what is left — within-case,
across-repeat noise — is exactly what more repeats reduces. AC #1's
"±4-point half-width at n≥146" plan was about that reproducibility question
(would this arm's own mean move if re-run), not about generalizing past
these five specific cases; this table answers the second, harder question
honestly, which is why its bands are wide on every row, old and new alike.

The composite score is deliberately omitted: each style carries a different
`judgeWeight` (0.3 / 0.4 / 0.5), so composites are not comparable across rows.
Rules and judge are.

Three things this settles. Rule compliance is high everywhere and roughly
model-independent — across all twelve cells it now runs 93.1 to 99.4, and it
holds across **the whole released capability range**, from Haiku to Fable. Prose
quality is not: beginner still sits 7.2 to 13.1 points below advanced on the
judge depending on the model, and it is the style where the two halves disagree
most. And the two ends of the range fail in opposite halves — Haiku is last on the
judge for all three styles while never giving up more than 3.5 points of rule
score against the best of the other three, and Fable is last on *intermediate
rules* (93.1) while leading the judge on advanced. Whatever a tier gives up, it is
not rule-following.

**Beginner's rules column is roughly at parity with advanced, not ahead of it —
COS-19's re-check withdraws the "three tiers of four" reading.** That reading
used advanced's old ten-cell Sonnet and Opus figures (96.8, 97.8); at 150 cells
(COS-18) advanced reads 97.3 and 99.4, which flips Opus and nearly closes Sonnet.
Measured today: beginner wins on Sonnet (97.4 vs 97.3, +0.1) and Fable (99.3 vs
97.9, +1.4), and loses on Haiku (95.8 vs 96.6, −0.8) and Opus (99.2 vs 99.4,
−0.2). Every gap is inside or barely outside the ~1–5 point rules SD these arms
carry at n=150 — this is parity, not a three-of-four win. On the historical row
beginner was the weakest style on every tier; that much still holds. The hand
rewrites (COS-4, COS-16) are still real, they just landed beginner at advanced's
level rather than above it.

The judge column is *not* a tier ranking. Fable leads on advanced, Opus on
beginner by 0.9 over Fable, and Sonnet — two tiers down — beats every other model
on intermediate, 72.7. The only stable fact is at the bottom: Haiku is last
every time, confirmed again at n=150 on all three styles it was re-measured on.

**None of the "clean split" survives a properly paired test — including the
two halves this project already called confirmed.** Published as: Haiku and
Sonnet rank intermediate above advanced on the judge (62.2 > 52.9 and
72.6 > 66.0); Opus and Fable rank advanced above intermediate (73.9 > 63.9 and
78.3 > 67.7). Every one of those four readings is an arm-mean subtraction —
this project's own paired-interval method (COS-27, used throughout for
before/after comparisons) had never actually been pointed at this specific
claim. COS-19 did that: pair each model's advanced and intermediate rows by
case (repeats averaged within a case first, same as any other paired
interval here), for all four models:

| model | n pairs | judge Δ (intermediate − advanced) |
|---|---|---|
| haiku, old (n=10/side) | 5 | +9.3 [−11.2, +29.8] |
| haiku, new (n=150/side) | 5 | +1.6 [−1.8, +5.0] |
| sonnet (n=150/side) | 5 | +4.6 [−5.3, +14.5] |
| opus (n=150/side) | 5 | −4.8 [−15.1, +5.6] |
| fable (n=10/side) | 5 | −10.6 [−30.5, +9.3] |

**Every interval contains zero.** Sonnet and Opus's gaps — the two this
project's own text called "confirmed" after COS-18 — were confirmed by
arm-mean subtraction alone and had never been paired. Tested the way this
project tests everything else, neither clears zero: Sonnet's mean point
estimate is +4.6 but the 95% band is 20 points wide; Opus's is −4.8 inside a
band nearly as wide. **Haiku is the one case where more data changed the
picture rather than just widening the band around it**: the point estimate
itself collapsed from +9.3 to +1.6 as the paired SE fell from 7.4 to 1.2 —
more repeats per case genuinely bought precision here, because pairing
removes the between-case spread that dominates the single-sample table above,
and what is left (within-case, across-repeat noise) really does shrink with
n. **The honest reading of the whole family: a small case-controlled sample
(5 cases) cannot distinguish any of these four directions from noise, on any
model, at any sample size tested.** The split was never "two models each
direction, both solid" — it was four point estimates that happened to point
in a way that read as a pattern, and the only one worth calling a result at
all is that Haiku's estimate shrank toward zero as data accumulated, which is
what noise collapsing under more repeats looks like, not what a real effect
sharpening under more repeats looks like.

Beginner follows its own rules about as well as advanced now — see above — and
still reads worst on the judge, on all four models. That is the signature of a style whose stated
rules do not capture what makes it good, which is why the optimizer could not fix
it by rewording them — and **COS-17 shows the signature survives the rewrite that
fixed the rules half.** The hand rewrites moved beginner's rules from last of
three on every tier to parity with advanced, and its judge up
10.7 / 12.5 / 20.2 / 11.3 points on Haiku / Sonnet / Opus / Fable — and it is
still last on the judge everywhere. (The Sonnet and Opus rises of 12.5 and 20.2
are inflated by an unknown amount — their historical figures were graded against a
15-word sentence cap the file never stated; see *The judge column carries a defect
the rules column had corrected*, below. **Haiku's 10.7 and Fable's 11.3 are not**:
both baselines ran nine hours after the fix.) Opus's 66.1 is the best beginner
judge score in the current table and
still 3.9 points under the 70% bar; Haiku's 48.2 is 21.8 under it.
(Individual two-cell samples inside optimizer runs have scored higher; those are
not comparable with a 150-cell arm and are not a style's score.)

### The judge column carries a defect the rules column had corrected

`contracts.json` held beginner to 15-word sentences and intermediate to 18 until
commit `3370e4d`, while all three style files said 20. That commit corrected the
numbers and re-graded the saved transcripts offline, which is where the advanced
and intermediate rows' rules column comes from — the caveat above says so. The
beginner row no longer comes from those runs at all: COS-17 replaced it with
arms measured after the fix, so nothing in this section touches it.

**It could not correct the judge, and the judge was reading the same numbers.**
`judge.mjs` puts them in the prompt verbatim: `HARD LIMITS: sentences under
${contract.maxSentenceWords} words`. Re-scoring is free because a deterministic
check recomputes from the saved reply; a judge score cannot be recomputed without
paying for the call again, so `score` copies the stored value through. Running
`node src/cli.mjs score --rows=results/2026-08-16T12-44-03-883Z/rows.json` today
returns beginner 91.5 / 92.3 on rules — corrected — beside 45.9 / 48.4 on the
judge, which are the originals.

How far it reached, counted over `12-44-03`'s own violation strings:

| style | cap in force | violations | citing 15 words | citing 18 | citing 20 |
|---|---|---|---|---|---|
| beginner | 15 | 64 | **13** | 1 | 3 |
| intermediate | 18 | 47 | 0 | **7** | 1 |
| advanced | 20 | 42 | 0 | 0 | 6 |

Each style's judge quotes its own contract value and almost never another, so
this is not incidental: a fifth of every beginner violation in the run marks the
reply down against a rule no reader of the style could see.

Advanced was graded at 20 throughout and is unaffected. Intermediate's Opus and
Sonnet columns *originally* came from `12-44-03`, before the fix, and its Haiku
and Fable columns from `22-59-53` and `23-48-45`, after it — so that row's judge
column was not comparable across models **when this was written**. It no longer
applies: COS-18 replaced intermediate's Opus and Sonnet halves with
`2026-08-20T12-12-10`, run four days after the fix. Beginner's row was free of
it from the start: its Opus and Sonnet halves were re-measured by COS-16 and its
Haiku and Fable halves by COS-17, all four after the fix. The historical
beginner figures this section describes (37.5 / 48.4 / 45.9 / 53.9) are the ones
the table no longer carries — and of those four, only the Opus and Sonnet pair
ever carried the defect, since `22-59-53` and `23-48-45` ran nine hours after
`3370e4d` landed.

**COS-19 checked this against every cell the four-tier table carries today
(AC #4) and it is fully retired.** No cell in the current table — including
advanced × Fable and intermediate × Fable, still at n=10 and tracked in COS-34
for sample size alone — comes from a run graded before `3370e4d` landed at
13:14 UTC on 2026-08-16. The two Fable cells come from `23-48-45`, nine hours
after; every other cell comes from a run days or weeks later. What remains open
in this table is statistical power on two cells, not contamination on any of
them.

"Haiku is last every time" survives on every row — on intermediate and advanced
because Haiku is last by margins larger than the defect ever was, and on
beginner outright, because no cell in that row ever carried it. COS-4 ran a
fresh beginner arm after the fix and it read 12.8 and 22.3 points higher than
the contaminated one. **How much of that is the corrected cap and how much is
COS-1's added text is not separable** — both changed between the two runs, and
no arm isolates either.

### Does word-cap overrun track model tier? No

Opus overruns the stated word cap more than Sonnet, and with only those two
points it was impossible to tell whether that was Opus or the tier. Two more
points answer it.

The measure is mean reply words divided by *that style's own cap*, so all three
levels pool onto one scale. Reply length is counted with `checks.mjs`'s own
`words()`, the tokenizer `total_length` scores with.

| model | $/cell | mean words ÷ cap | share over cap | `total_length` |
|---|---|---|---|---|
| haiku | 0.0232 | 1.088 | 33.3% | 74.7 |
| sonnet | 0.1013 | **0.961** | 30.0% | 79.1 |
| opus | 0.1493 | **1.300** | 43.3% | 71.7 |
| fable | 0.2345 | 1.229 | 40.0% | 75.0 |

**The answer is in the point estimates, before any inference.** A tier gradient
predicts that each step up the range overruns more than the step below it. In
tier order the sequence is 1.088, 0.961, 1.300, 1.229, so two of the three
adjacent steps go the *wrong way*: Haiku overruns more than Sonnet above it, and
Opus overruns more than Fable above it. Only one step out of three has the sign
a gradient needs.

The paired comparisons agree, and are weaker than they first look. Differences
are paired on (style × case) so that case and style cancel:

| comparison | mean difference | 95% CI | corrected for six tests |
|---|---|---|---|
| haiku − sonnet | +0.127 | [+0.034, +0.219] | [−0.016, +0.270] |
| sonnet − opus | −0.339 | [−0.643, −0.034] | [−0.811, +0.133] |
| sonnet − fable | **−0.268** | [−0.434, −0.103] | **[−0.525, −0.012]** |
| opus − fable | +0.070 | [−0.118, +0.259] | [−0.221, +0.362] |
| haiku − opus | −0.212 | [−0.557, +0.133] | [−0.747, +0.323] |
| haiku − fable | −0.142 | [−0.350, +0.067] | [−0.465, +0.182] |

The right-hand column is the one to read. Six comparisons are drawn from the same
15 units, so the uncorrected intervals understate the chance that one of them
clears zero by luck; Bonferroni over exactly those six leaves **only sonnet −
fable** excluding zero, and only barely. Two further cautions in the same
direction: the 15 units are 3 styles × the *same* 5 cases, so differences repeat
within a case and a paired *t* treating them as independent makes every interval
too narrow — clustering to the 5 cases instead widens them again (sonnet − fable
becomes [−0.494, −0.043], still clear of zero; nothing else changes status). And
`total_length` counts every cell, tool-using or not, so the text-block seam
described below does not touch these figures.

So the honest reading is narrow and it is enough. **Nothing in this data resolves
a tier gradient, and the point estimates run against one at two of three steps.**
The one comparison that survives correction says the *second-smallest* model
keeps to the cap better than the *largest* one, which is the opposite of what a
gradient predicts. What the data does not do is prove no gradient exists —
the wide intervals on the other five comparisons are consistent with small
effects in either direction. It rules out the effect being large enough to matter
at this sample size, and it removes the reason to suspect one.

**COS-18 found the variable that does predict cap adherence, and it is not the
model.** It is the shape of reply the case asks for. On 600 cells across
intermediate and advanced, Opus and Sonnet, the shared five:

| | status updates | everything else |
|---|---|---|
| advanced / opus | 0 of 60 over cap | 24 of 90 (27%) |
| advanced / sonnet | 0 of 60 | 30 of 90 (33%) |
| intermediate / opus | 0 of 60 | 69 of 90 (77%) |
| intermediate / sonnet | 0 of 60 | 48 of 90 (53%) |

**Not one of 240 status updates exceeds its cap**, on either style or either
model. The same file and the same model, asked for an explanation or a report
instead, breaks the cap between a quarter and three-quarters of the time. The tier
table above pools those shapes together, which is part of why overrun reads there
as a property of the model.

Two things are stacked and COS-18 separates them. Non-status replies are longer
everywhere — a shape effect, and advanced shows it while still averaging *inside*
its cap (0.95× and 0.85×). Exceeding the cap on those shapes is a second thing,
and it tracked one property of the style file: whether the cap's own sentence
named a shape. Intermediate's did, and its non-status replies averaged 1.43× and
1.13×. Re-scoping that one sentence took Opus from 1.43× to 0.97×.

This is where the summary's qualifier at the top of the document comes from. The
"roughly twice as often" figure is run `20-10-29`'s, on an advanced style file
that has since been replaced; on the shipped files the ratio is 1.44× (43.3%
against 30.0%). And a larger model does not buy cap adherence — Fable
overruns its cap on 40% of replies.

**COS-17 tested the tier question a second way, and got the same answer.** The
table above pools all three styles on the pre-COS-4 text. Beginner alone, on the
file that ships today, at 150 cells a model:

| model | mean words ÷ 80-word cap, before | after | fall |
|---|---|---|---|
| haiku | 1.406 | **0.899** | 0.507 |
| sonnet | 1.284 | **0.734** | 0.550 |
| opus | 1.686 | **0.786** | 0.900 |
| fable | 1.648 | **0.830** | 0.818 |

The before column is the pre-COS-4 text on the same five cases at 10 cells a model
(`12-44-03` for Opus and Sonnet, `22-59-53` and `23-48-45` for Haiku and Fable);
the after column is 150 cells a model on the file that ships. Those before-side
rows predate the COS-10 text-block seam and one of the five cases is agentic, so
their word counts read slightly high — the fall is directional, not an effect size
to the third digit.

Two readings, and they point the same way. First, **a hand rewrite moved cap
adherence far more than a tier step ever did.** Every tier falls by 0.507 to
0.900; the largest adjacent-tier difference in the table above is 0.339, and only
one of the six comparisons there survives correction at all. Length is a property
of the file, not of the model — which is COS-7's conclusion reached from the other
direction.

Second, **the after column does not track tier either, and it turns in a
different place than COS-7's did.** In tier order it reads 0.899, 0.734, 0.786,
0.830: Sonnet is again the model that keeps best to the cap, but the sequence now
rises monotonically above it instead of turning twice, and Haiku — the smallest
model — is the *worst* overrunner of the four. Whatever ordering the two sequences
have, it is not the capability ordering, and it does not survive a change of style
text. Every mean is under the cap; the ratio no one exceeds is the fact worth
carrying.

Per case, the fall is not concentrated in one shape: **all ten case × model cells
drop.** The two conversational explain-and-report cases fall furthest — Haiku
198.5 → 108.2 words on `conv-explain-cache` and Fable 249.0 → 77.3 — which is the
same non-status shape effect COS-18 isolated, now measured on the third style and
the two other tiers.

### Haiku on the full case set, and what it cannot do at all

The table above uses five cases because that is what Opus, Sonnet and Fable were
measured on. Haiku was also run across the full 13-case pool — 78 cells —
and that run exposes something five conversational cases cannot. Haiku is the
only tier the full pool has ever been run on. Twelve of its 78 cells are the two
write-then-verify cases — the project's largest kind, about 4.8× a conversational
cell — so the full pool is a far heavier run than the five-case table on any
model.

**How much heavier on another tier is not something this project has measured.**
An earlier version of this passage said the same 78 cells on Fable would run "an
order of magnitude more tokens". That figure came from the deleted per-cell
dollar table, and the conversion does not hold: per-token prices differ across
tiers by roughly the same factor the costs did, so a cost span says nothing about
a token span. The per-case ratios above survive because they compare cells at one
price. `elapsedMs`, added under COS-25, is the first per-cell measurement that
means the same thing on every model.

**Six of the 78 cells produced no reply at all.** Every one is
`Reached maximum number of turns (12)`, and every one is a case that requires
editing a file and then running the tests:

| case | what it asks for | haiku cells with no reply |
|---|---|---|
| `agentic-fix-verify` | fix a bug, then run the tests | 5 of 6 |
| `reserve-agentic-write` | add a test, then run the suite | 1 of 6 |
| `agentic-read-report` | read the code and report (no writes) | 0 of 6 |

The like-for-like comparison is `agentic-fix-verify`, the one write-then-verify
case all four tiers have now run: **Haiku 5 aborts in 6 cells, Opus 0 in 6,
Sonnet 0 in 6, Fable 0 in 6** (see below for the size of Fable's six cells, and
what it gave up to finish them). Widening to every saved agentic cell does not
change the picture but does pad the denominator with work that does not
discriminate — Opus is 0 of 21 and Sonnet 0 of 28, but 15 and 22 of those are the
read-only case, where Haiku is also clean at 0 of 8. Neither larger model has
ever been run on `reserve-agentic-write`, so that row is Haiku-only evidence.

Haiku hit the limit on all three styles, which makes it a property of the model
and not of any style file — no rewording of a style can fix it.

This forces a distinction the two-model data never needed. **A cell that answered
badly and a cell that never answered are different failures, and averaging them
together hides the second one.** Haiku's full-pool rule scores read very
differently depending on which question you are asking:

| style | replies | no reply | rules, replies only | rules, counting no-reply as 0 |
|---|---|---|---|---|
| advanced | 23 | 3 | 94.2 | 83.4 |
| intermediate | 24 | 2 | 92.3 | 85.2 |
| beginner | 25 | 1 | 86.6 | 83.3 |

The left number is how well Haiku follows the style when it speaks. The right
number is what a user actually experiences. Quote whichever you mean, and say
which one it is.

### What Haiku does not do

Two rules where the smallest model was expected to fail, and did not:

- **Sentence length.** Measured on the **four conversational cases only** — the
  agentic case is excluded on purpose, because the saved agentic replies predate
  the text-block seam fix described below and are still glued:

  | model | mean sentence words | over the 20-word cap |
  |---|---|---|
  | opus | 10.2 | 6.3% |
  | fable | 10.7 | 8.8% |
  | haiku | 10.1 | 8.1% |
  | sonnet | **12.9** | **19.5%** |

  Haiku is not the long-sentence model — Sonnet is, by a clear margin, and it
  stays the outlier with the top tier added. Across the full 13-case pool Haiku
  holds at 9.6 words and 7.0% over cap on its 60 tool-free cells, so this is
  not an artifact of the easier subset. All figures use `checks.mjs`'s own
  `words()` and `sentences()`, the tokenizer and segmenter `sentence_length`
  scores with. This **reverses** the reading taken from a four-cell probe during
  the sentence cap work; see the experiment ledger.

  These are the same cells re-scored after COS-10 changed `sentences()` to split
  on a single newline. Before that they read Opus 10.6 / 7.9%, Fable 11.1 / 9.6%,
  Haiku 11.3 / 10.0%, Sonnet 13.4 / 20.3%, and Haiku's full-pool figure 11.5 /
  10.6%. Every model got shorter, because a list header is no longer merged into
  its first item, and Haiku moved most (−1.2 words) because it writes the most
  lists. **The conclusion did not move**: Sonnet's lead over the field grew again,
  from 2.1 to 2.2 words and from 10.3 to 10.7 points of over-cap share.

  An earlier revision quoted these over all five cases (Haiku 11.8 / 11.3%,
  Sonnet 13.5 / 19.1%, Opus 11.3 / 10.6%, Fable 11.8 / 10.7%) and over the full
  pool including its agentic cells (12.0 / 12.3%). Those are superseded twice
  over — by the conversational-only pool and by the re-segmentation — and are
  kept here only so an older copy of this file can be identified.
- **Code blocks and filler.** `code_block_size` and `no_filler` score 100.0 on
  every model including Haiku.

Where Haiku is genuinely worse, on the like-for-like five cases, it is worse at
*opening the reply*, not at obeying caps: `leads_with_conclusion` 83.3 against
Sonnet's 100.0 and Opus's 90.0 — the same pre-tool-call narration failure this
document opens with, one tier more pronounced. Fable scores 83.3 on the same
rule, so the top tier is no better at it than the smallest.

### Fable finishes the agentic work and stops obeying the style

`agentic-fix-verify` — fix a bug, then run the tests — is the case that separated
the tiers. Haiku hit the 12-turn limit and returned nothing on 5 of 6 cells.
Fable was run on the same case, three styles, two repeats (`23-53-02`):

| model | aborts on `agentic-fix-verify` |
|---|---|
| haiku | 5 of 6 |
| sonnet | 0 of 6 |
| opus | 0 of 6 |
| fable | 0 of 6 |

Those cells average **4.8× a conversational Fable cell** and spread 1.4× from the
smallest of the six to the largest — the project's largest cells. The top tier
buys completion, and completion is the only thing it buys. Same model, same
style files, same scorer, only the case changes:

| Fable on | rules | judge |
|---|---|---|
| the shared five (30 cells) | 94.1 | 66.6 |
| `agentic-fix-verify` (6 cells) | 79.5 | 41.2 |

The second row is measured on the glued turn, like every agentic figure here —
see "Every agentic figure in this document is measured on a glued turn" below.
Re-scoring it after COS-10 reproduces 79.5 exactly; only a re-run would replace it.

`leads_with_conclusion` scores **16.7** across those six cells. Five of six
replies open with a variant of *"I'll look at the file first."* before the first
tool call — the exact failure this document opens with.

The like-for-like version is `agentic-read-report`, the one agentic case all four
tiers have run under the current style text:

| model | `leads_with_conclusion` on `agentic-read-report` |
|---|---|
| sonnet | 100.0 |
| opus | 50.0 |
| haiku | 16.7 |
| fable | **16.7** |

The top tier is level with the smallest, and both are far behind the two in the
middle. Capability does not touch this rule, which is the strongest evidence in
the project that pre-tool narration is a Claude Code habit rather than a model
limitation. Note the direction is the opposite of the word cap: there Sonnet was
the outlier that complied, here Sonnet complies perfectly again. Whatever these
two rules have in common, tier is not it.

**Every agentic figure in this document is measured on a glued turn.** Until
COS-10, `run.mjs` accumulated assistant text blocks with `text += b.text` and no
separator, so on an agentic turn the pre-tool narration was glued to the
post-tool answer: the saved transcript literally reads `"I'll look at the file
first.The bug is in ..."`. `sentences()` needs whitespace after the full stop to
split, and `paragraphs()` needs a blank line, so the run-on counted as one very
long sentence in one paragraph. Checked by searching for a no-whitespace seam
after sentence-ending punctuation, and splitting cells by whether the model
actually called a tool — that is what produces multiple text blocks — it appears
in **0 of 131 cells that made no tool call** and in most of those that did: 3 of
6 Opus, 1 of 7 Sonnet, 10 of 12 Haiku, 5 of 6 Fable, and 6 of 6 on Fable's
`agentic-fix-verify`. The judge read the same string, which is the separate
finding two sections down.

The four-tier table above is essentially unaffected: only one of its five cases
is agentic, `paragraph_length` still scores 95.8–100.0 on it for every model, and
the artifact is identical in all four columns. `agentic-fix-verify` is where it
bites — `paragraph_length` there reads 16.7, which is the harness, not the style.
So the numbers quoted in this section are `leads_with_conclusion`, `total_length`
and the abort count, all of which the seam cannot touch.

COS-10 fixed the harness: the blocks are kept in order, each turn is saved as
both the full trace and the final message, and every check and case rubric names
which of the two it grades. **It changed nothing in this document.** The glue is
lossy, so a saved row cannot be re-split — re-scoring the transcripts on the
fixed code reproduces every agentic figure above to the decimal, because the only
part of the fix that re-scoring can apply is the newline split, and that does not
touch these particular checks. Replacing an agentic figure with one measured on
the final message costs a re-run of the cells, not a re-score, and no such run has
been bought. `score` now prints how many rows it re-graded predate the fix.

**Every agentic figure in this document is also measured on a fixture whose test
suite failed on arrival.** Three of the four agentic cases ask the model to run
the tests, and until COS-13 `harness/fixtures/repo` shipped a red suite: the
`priceOrder` assertion expected 966 where the code returns 965, so every model
that ran the tests met a failure it had not caused and that had nothing to do
with the rounding bug it was sent to fix. A second assertion expected 850 while
its own comment computed 849, so a model that *correctly* fixed the bug then
broke a passing test and had to decide unaided whether the test or the code was
wrong. And the fixture carried no `package.json` of its own — it is copied to the
workspace root, where nothing sits above it — so `npm test`, the obvious reading
of "run the tests" in a JavaScript repo, died with `ENOENT` before a single test
ran. Only `node --test` worked, and nothing told the model that.

The three reach different sets of cases. The red suite and the missing
`package.json` reach all three cases that run the tests — `agentic-fix-verify`,
`reserve-agentic-write` and `reserve-agentic-session`. The break-on-fix assertion
reaches only the two that fix the bug, `agentic-fix-verify` and
`reserve-agentic-session`, since `reserve-agentic-write` is asked to add a test
rather than to change the code. Either way the more thoroughly a model worked,
the more of this it met. COS-13 made the suite green both before and after a correct fix, so
figures measured after it are not comparable to the ones above on this axis.
Like the glued turn, it cannot be applied backwards: replacing one of these
figures costs a re-run, not a re-score.

Its scope is narrower than the glued turn's but its reach inside that scope is
wider, and the two must not be reasoned about the same way. The glued turn was a
scoring artifact, so it could be traced to the checks that re-segment and ruled
out for the rest. This one changes what the model *wrote*, so on an affected cell
it can move any check, the judge included — no figure on an agentic cell can be
ruled out the way `leads_with_conclusion` and `total_length` were ruled out
above. What does bound it is which cells the fixture reaches at all: every
conversational case is untouched, because those prompts never involve the repo.
`agentic-read-report` is the least exposed of the four — it asks for a reading of
`src/pricing.js` and never for a test run — but a model that ran the suite
unprompted would still have met the failure, so it is not exempt either.

## A content gap that new content did not close

COS-1 acted on the diagnosis above: it hand-wrote the two missing rules into all
three style files — how to report a multi-tool session in one final message, and
how to handle a decision where neither option is clearly better — rather than
running the optimizer, which had already failed at this six times because it can
only re-express rules that exist.

The rules ship and the instrument enforces them. The judge is given each style's
body at grading time, and it quotes the new sections back while marking replies
down: *"the 'When neither option wins' section"*, *"State the assumption you
resolved the tie on"*, *"Report the end state, not the path"*. Thirteen
violations cite them. What did not happen is the score moving.

| case | model | baseline `00-44-03` | with the new rules `00-48-49` | bar |
|---|---|---|---|---|
| `agentic-fix-verify` | opus | 50.0 | 46.2 | 65 |
| `agentic-fix-verify` | sonnet | 40.0 | 42.0 | 65 |
| `conv-decision-holdout` | opus | 48.3 | 51.2 | 65 |
| `conv-decision-holdout` | sonnet | 46.7 | 54.7 | 65 |

Arm mean judge 46.2 → 48.5, inside the noise floor, and the baseline is n=3 per
cell against the new text's n=6. The honest statement is that the gap did not
close, not that anything moved by a stated amount.

**A second, more aggressive pass was measured and rejected.** It restated each
style's own word cap inside the new section, banned narration between tool calls,
and ruled that a threshold-conditional recommendation ("absorb if the bill is
under $75k") is not a recommendation. Arm mean judge fell to **43.6 — below the
original text.** It was reverted in full; no part of it was kept, because the
bullets were never measured separately. Run `01-03-21`.

**Why the rules did not help, from the judge's own violations.** Two failure
modes dominate, and neither is the missing content the task was written about.
The first is length: 70.8% to 82.6% of cells overrun their style's word cap in
*every* arm, before and after — 9/12 on the baseline, 17/24 with the new rules,
19/23 on the rejected pass — with beginner replies at 101–256 words against a cap
of 80. The share does not move in one direction, and no arm comes close to
clearing the cap. The second is that replies hedge the recommendation into a
threshold, or close by asking the reader for figures. Length is the binding
constraint, which is what COS-8 concluded from the opposite direction and what
COS-4 owns.

Those over-cap figures are all on the pre-COS-4 beginner file and on the two
COS-1 cases; COS-4 later took beginner's over-cap share on its own five cases to
14.3%. **And "length is the binding constraint" did not survive being acted on.**
COS-4 cut beginner's mean reply from 103 words to 61 and the judge moved +1.3
[−15.0, +17.6]. The correlation COS-8 measured is real and the length problem was
real; length was not the cause, or not the only one.

**A harness artifact contaminates the agentic half of this measurement.** The
judge was handed the whole turn, not the final message — see the ledger entry
"The seam reaches the judge". In 16 of 16 agentic cells that carry pre-update
narration, a judge violation quotes that narration. It is not an excuse for the
scores: 10 of 18 final updates are over the word cap on their own. But the
`agentic-fix-verify` rows in the table above cannot be read as a clean measure of
the style file. COS-10 separated the final message from the trace and made each
rubric name the one it grades, so a *future* run of these cells will be clean;
a judge score cannot be re-derived offline at any price, so the two rows stand as
they were measured.

No regression came with the change. Run `01-13-15` re-measured the five shared
cases on Haiku against `22-59-53`; every delta is inside the three-point noise
floor.

## Beginner's rules contradicted each other, and fixing that moved length but not the judge

COS-4 rewrote `plain-english-beginner.md`. It is the largest measured change to a
style file in the project and the first one to move reply length at all. It did
not move the judge, and the second half of that sentence is the more useful
result.

**The diagnosis was not a wording gap.** Beginner's file asked for content its own
budget could not fit, and the judge enforced both sides in the same run. "Keep
the whole update under about 80 words" was scoped to status updates, while the
harness applies 80 to *every* reply and tells the judge it is a hard limit;
meanwhile "use everyday analogies" and "explain what a thing IS before you say
what happened to it" were unbounded and cost 15–25 words each. A 222-word
explanation was failed for running "several times over the ~80-word hard limit",
and a 60-word status update was failed because it "never establishes what a
database is". Two more contradictions sat beside it: "skip all internal details"
was read as forbidding the evidence the status shape requires, so "All 14 checks
pass" was quoted as a violation; and the prose invited glossing a technical term
while `no_jargon` banned 28 of them outright at weight 2 — and the file's own
worked example of that rule, "I updated the API (the messenger that lets two
programs talk)", uses one of the 28, so following the example scored 0.667 on the
heaviest-weighted check. (Closed under COS-15: `no_jargon` now grades first use
and forgives a gloss. The figures in this section predate that and are the ones
the run measured; the five that move are corrected where they are quoted.)

**And the file never said which of its shapes a reply should take.** Ten of the
40 judge violations on the three weakest cases in run `02-10-45` say the reply is
missing, omitting or dropping the What I did / Did it work / Next structure — on
replies that are not status updates. They fall on all three: `conv-explain-cache`
3, `agentic-read-report` 3, `conv-followup-drift` 4. (Counted by matching a
missing/omits/lacks/drops/skips verb against a beat name, over the twelve beginner
rows for those cases. The superseded run `12-44-03` gives 4 of 48, all on
`conv-followup-drift`, which is one more reason not to quote that run.) The harness already
disagreed with that: `three_question_structure` is not among the checks for any
of those three cases, and `reserve-scope-estimate`'s rubric says outright that "a
status-update shape or a list of implementation steps is wrong here". The style
file was the only place that failed to say so.

The rewrite added a router naming which of four shapes a reply takes, generalised
the 80-word budget to every reply with a stated cut order, added shapes for
"why does this happen" and for follow-up turns, added a word-counted target
example of the kind `plain-english-advanced.md` has always had, and resolved the
three contradictions.

**What it did, over 144 cells in six arms — 114 of them in the two paired
comparisons below, the other 30 in a rejected second authoring pass:**

| | five shared cases, 10 pairs | six reserve cases, 12 pairs |
|---|---|---|
| deterministic rules ¹ | +5.2 [+0.0, +10.4] | **+7.7 [+5.3, +10.1]**, t=7.06 |
| reply words ¹ | **−42.0 [−78.2, −5.9]** | **−54.7 [−82.0, −27.3]**, t=−4.40 |
| composite ¹ | +3.3 [−6.1, +12.6] | **+7.4 [+0.9, +13.8]**, t=2.52 |
| LLM judge ¹ | +1.3 [−15.0, +17.6] | +7.1 [−7.2, +21.3] |

¹ **The method behind every cell above is now implemented and recorded (COS-27).**
Pair each run's rows by case + model, average repeats within a pair, and take a
two-tailed 95% Student-t interval on the differences —
`node src/cli.mjs interval --before=<rows> --after=<rows> --metric=rules|words|composite|judge`
(`harness/src/interval.mjs`). The reserve column pairs `02-12-24` against
`02-16-47` directly, one repeat each side. The shared-five column's **after**
side pools `02-15-14` and `02-25-39` for all four metrics — `02-25-39` was a
later, larger re-run of the same byte-identical pass-1 text, run because the
first LLM-judge reading was noisy (see its row above); the deterministic
metrics changed nothing by pooling it in, so the published deterministic
figures already reflect the pooled data. Reproduced exactly against what was
already published: deterministic rules (both columns), reply words and LLM
judge (shared five), LLM judge (reserve, mean and t; the interval shifted by
0.1–0.2 from what was printed — most likely a hand-rounding slip when the
table was first typed, since the mean and t match to the published decimal
and no data or method difference explains it). **Reply words on the reserve
column did not reproduce**: the method gives −54.7 [−82.0, −27.3], t=−4.40
against the −55.7 [−83.2, −28.1], t=−4.41 first published — roughly a one-word
shift in the underlying mean, not just a rounding difference. Checked and
ruled out: a code-block-stripping difference (neither run's replies contain
one) and a stale word-count tokenizer (`checks.mjs`'s `words()` is
content-addressed here, not reconstructed from history). No cause was found;
the cell now shows the reproducible value, with the original recorded here
since it cannot be re-derived. Every conclusion is unchanged either way: rules
moved on the reserve set, the shared-five rules interval still touches zero,
and composite's reserve interval still clears zero by less than a point.
**Both rules deltas separately shift slightly under COS-15**, which taught
`no_jargon` to forgive a glossed first use — six of 651 saved rows move, four
in this section's arms (`02-12-24`, `02-15-14`, `02-20-01`, `02-25-39`), two in
`improve` runs elsewhere, only two of the four inside the paired comparisons
this table reports. That shift is orthogonal to the method question above: it
changes what `node src/cli.mjs score` would print against today's checks.mjs,
not what the method reproduces from the rows as saved, which is what this
table shows.

Over-cap share on the shared five fell from 40.0% to 14.3% and mean reply length
from 103 to 61 words. Rules on COS-4's pass-1 text — what shipped until COS-16 —
read 98.5 on Opus and **97.7** on Sonnet — 97.4 before COS-15 taught
`no_jargon` to forgive a glossed first use —
the highest beginner has recorded, against 90.9–92.3 in the four-tier
baseline. `three_question_structure` held at 100.0, so telling the model not to
force the three beats onto an explanation did not cost the beats where they
belong.

**The judge did not move, and the first reading of this run said it did.** At two
cells per pair the shared set showed +7.1 and the reserve set +7.0, and the
agreement between two independent case sets looked like a result. A confirmation
arm on byte-identical text at five repeats — 50 cells, `02-25-39` — took the
shipped arm to seven cells per pair and the shared-set estimate fell to **+1.3,
with an interval four times as wide as the effect.** Sonnet in particular read
70.7 at n=10, 65.8 at n=10, 74.1 at n=15 and 55.0 at n=25 across arms of the same
five cases; pooled over 35 cells of the shipped text it is 58.1 [50.5, 65.6].
**COS-16 pooled it further, to 150 cells (run `19-42-55`): Sonnet reads 60.9,
Opus 66.8 against the 35-cell reading of 73.9** — both inside the 35-cell
interval, which is what the larger arm was for.

**Then COS-16 changed the text, and the judge did not move for that either.** The
file that ships now removes three of the five self-contradictions COS-4 left: the
jargon rule that gave opposite instructions for a word the reader used first, the
proof-number rule that demanded a number which may not exist and said so three
times, and the router's missing precedence between two bullets that both match a
tool-using report. A fourth — the router omitting two of the file's own six
shapes — is retained unfixed, for the reason the next paragraph gives; the fifth
was closed by COS-15 on the contract side. Measured at 150 cells a model on both splits (runs
`2026-08-20T03-03-26` and `03-13-05`, 0 errored cells), it reads rules 99.2 / 97.4
and judge 66.1 / 60.9 on the shared five, 97.0 / 95.2 and 65.4 / 58.1 on reserve.
**All twenty paired intervals — the four pooled metrics on each split, and rules,
judge and reply words per model on each split — contain zero.** Removing three
written contradictions from a style file moved nothing this instrument can
resolve.

The one place it did matter was a regression it removed rather than caused. A
four-edit bundle whose fourth edit added the two missing router shapes — the only
one of the four that *added* a rule instead of removing or bounding one — showed an
Opus reply-length rise of **+1.71 [+0.27, +3.16]** words that none of its four
edits showed alone. Dropping that edit takes the same delta to **−0.12 [−2.28,
+2.04]**. That is an interaction effect visible only because each edit was also
measured on its own, and it is the concrete argument for ablating a style change
rather than shipping the bundle: COS-1 and COS-4 both failed by adopting bundles
they could not decompose, and both of the edits that produced them added rules.

**That is the transferable finding.** Per-cell judge SD on the shipped text is
24.6 pooled (24.1 Opus, 22.8 Sonnet), so the ten-cell arms every judge figure in
this project rests on carry 95% intervals about 30 points wide.

**Most of that spread is the reply, not the judge — but not all of it.** Judging
60 saved replies three times each with four model tiers splits the same 24.6 into
**10.17 points of judge-call noise and 22.58 points of reply**, an intraclass
correlation of 0.83. Score one reply twice with the same judge and the two
numbers differ by 10.8 points on average; on one reply of the sixty they differed
by 55.7. Repeat-judging shrinks only the judge's 17% of the variance, so it is a
small lever, and a slow one — a cell costs about one judge call in wall clock and
repeat-judging only pays when a cell costs eleven.

What sample size does *not* give you is a score. Sonnet measures 60.9 at 150
cells (58.1 at 35) on COS-4's text and 60.9 again on COS-16's; no arm size moves a
point estimate, and neither did the style edit.
What it gives you is precision. On beginner, narrowing one arm's 95% half-width
to ±10 points takes 24 cells per model, ±7 takes 49, ±5 takes 95 and ±4 takes 148
— and no number of judge calls per cell takes ±4 below 123. Detecting a real
difference *between* two arms takes twice that: 48 cells per arm for 10 points,
97 for 7, 189 for 5, 295 for 4. Beginner is the cheapest of the three styles;
under the same judge ±4 costs 169 cells on intermediate and 207 on advanced, so
an arm is sized on the style it measures.

**A bar is stated against a judge, and this project never named one.** Opus grades
the same replies within noise of Sonnet (+2.4 [−1.4, +6.1]), but Haiku marks
+10.8 higher overall and **+18.0 [+12.3, +23.7] on beginner** — an interval wider
than beginner's whole 11.9-point gap to its bar. The three styles rank the same
way under all four judges; the Opus-versus-Sonnet ordering does not, flipping
sign between judges on deltas of one to three points. Sonnet, the configured
judge, is also the least repeatable of the four: judge SD 10.17 against Opus's
5.49.

Deterministic rules and reply length are settled at small arm sizes and were
settled here; the judge is not, and a ten-cell judge difference under about 20
points should be read as unmeasured rather than as a movement.

## Sources

- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) — response length, agentic narration, over-verification, correction narration
- [Output styles — Claude Code docs](https://code.claude.com/docs/en/output-styles) — frontmatter, injection, precedence
- [Issue #6450](https://github.com/anthropics/claude-code/issues/6450) — output styles ignored when they conflict with trained defaults; closed as not planned
- [Issue #10671](https://github.com/anthropics/claude-code/issues/10671) — request to keep output styles
- [Issue #39331](https://github.com/anthropics/claude-code/issues/39331) — VS Code extension does not load `outputStyle` from settings
- [Opus 5 verbose in Claude Code](https://lucadidomenico.studio/en/blog/opus-5-verbose-system-prompt-claude-code) — origin of the `SIMPLE_SYSTEM_PROMPT` advice, which did not replicate here
