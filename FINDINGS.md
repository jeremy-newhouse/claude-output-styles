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

**Every added instruction layer made it worse.** Restating the style's rules in
`CLAUDE.md` was the single most damaging change, costing 9.4 points. Forcing the
long system prompt — the fix circulating in blog posts — cost 4.5 points.

This replicates in the two-model run: `all-fixes` lost ground on both models
(Opus 84.6% → 81.0%, Sonnet 87.0% → 84.8%).

The result matches Anthropic's guidance for Opus 5: instructions stack on top of
what the model already does, so adding guardrails costs tokens and output length
without improving adherence. Removing beats adding.

## Recommended changes

**Fix the config.** Set `outputStyle` in `~/.claude/settings.json` to a name that
exists, or add `name:` frontmatter to the `evolv-*.md` files. Right now the
global setting is inert.

**Do not add a CLAUDE.md style section.** It measurably hurts. If a project
CLAUDE.md already restates tone rules, deleting them is an improvement.

**Do not set `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=0`.** It hurt here, despite the
advice circulating online.

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
disappears. Re-graded offline from the saved transcripts at no token cost.

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

**The beginner row is history, not a current measurement.** COS-4 rewrote
`plain-english-beginner.md` after these runs. On the shipped file, pooled over 35
cells a model, beginner reads rules 98.5 / 97.4 and judge 73.9 / 58.1 on Opus and
Sonnet; Haiku and Fable have not been re-measured. The advanced and intermediate
rows are unchanged and current.

| style | rules haiku | rules sonnet | rules opus | rules fable | judge haiku | judge sonnet | judge opus | judge fable |
|---|---|---|---|---|---|---|---|---|
| advanced | 96.0 | 96.8 | 97.8 | 97.9 | 52.9 | 66.0 | 73.9 | **78.3** |
| intermediate | 94.3 | 95.6 | 94.2 | 93.1 | 62.2 | **72.6** | 63.9 | 67.7 |
| beginner | 90.9 | 92.3 | 91.5 | 91.4 | **37.5** | 48.4 | 45.9 | 53.9 |

The composite score is deliberately omitted: each style carries a different
`judgeWeight` (0.3 / 0.4 / 0.5), so composites are not comparable across rows.
Rules and judge are.

Three things this settles. Rule compliance is high everywhere and roughly
model-independent — the spread across all twelve cells is 90.9 to 97.9, and it
holds across a **tenfold cost range**: $0.0232 per cell on Haiku to $0.2345 on
Fable, measured. Prose quality is not: beginner sits 15 to 28 points below
advanced depending on the model, and it is the only style where the two halves
disagree sharply. And the two ends of the range fail in opposite halves — Haiku is
last on the judge for all three styles while never giving up more than 1.9 points
of rule score against the best of the other three, and Fable is last on
*intermediate rules* (93.1) while leading the judge on two styles of three.
Whatever a tier gives up, it is not rule-following.

The judge column is *not* a tier ranking. Fable leads on advanced and beginner,
but Sonnet — two tiers down and 2.3× cheaper per cell — beats it on intermediate,
72.6 to 67.7. The only stable fact is at the bottom: Haiku is last every time.

There is one clean split, and it is not a gradient. **Haiku and Sonnet both rank
intermediate above advanced on the judge (62.2 > 52.9 and 72.6 > 66.0); Opus and
Fable both rank advanced above intermediate (73.9 > 63.9 and 78.3 > 67.7).** Read
that as a hypothesis, not a result: it is 10 cells per figure, one judge model,
and the three-model data already showed the same split without enough points to
name it.

Beginner follows its own rules at over 90% and still reads worst, on all four
models. That is the signature of a style whose stated rules do not capture what
makes it good, which is why the optimizer could not fix it by rewording them.
Four models across a tenfold cost spread reproduce the pattern exactly — so it is
a property of the style file, not of any one model's taste. Fable's 53.9 is the
best beginner judge score in this table and still 16 points under the 70% bar.
(Individual two-cell samples inside optimizer runs have scored higher; those are
not comparable with a ten-cell baseline and are not a style's score.)

### The judge column carries a defect the rules column had corrected

`contracts.json` held beginner to 15-word sentences and intermediate to 18 until
commit `3370e4d`, while all three style files said 20. That commit corrected the
numbers and re-graded the saved transcripts offline, which is where this table's
rules column comes from — the caveat above says so.

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

Advanced was graded at 20 throughout and is unaffected. For beginner and
intermediate the Opus and Sonnet columns come from `12-44-03`, before the fix,
and the Haiku and Fable columns from `22-59-53` and `23-48-45`, after it — so
**those two rows' judge columns are not comparable across models**. "Haiku is
last every time" survives only because Haiku is last by margins larger than the
effect. The rule is simply that a judge figure predating `3370e4d` is quotable
only for advanced; anything resting on the other two needs a fresh arm. COS-4
paid for one, and beginner read 12.8 and 22.3 points higher on it. **How much of
that is the corrected cap and how much is COS-1's added text is not separable** —
both changed between the two runs, and no arm isolates either.

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
The one comparison that survives correction says the *second-cheapest* model
keeps to the cap better than the *most expensive* one, which is the opposite of
what a gradient predicts. What the data does not do is prove no gradient exists —
the wide intervals on the other five comparisons are consistent with small
effects in either direction. It rules out the effect being large enough to matter
at this sample size, and it removes the reason to suspect one.

This is where the summary's qualifier at the top of the document comes from. The
"roughly twice as often" figure is run `20-10-29`'s, on an advanced style file
that has since been replaced; on the shipped files the ratio is 1.44× (43.3%
against 30.0%). And spending more per token does not buy cap adherence — Fable
overruns its cap on 40% of replies.

### Haiku on the full case set, and what it cannot do at all

The table above uses five cases because that is what Opus, Sonnet and Fable were
measured on. Haiku was also run across the full 13-case pool — 78 cells, $1.88 —
and that run exposes something five conversational cases cannot. Haiku is the
only tier cheap enough to afford the whole pool: at Fable's measured rates the
same 78 cells come to roughly $27 — 66 at $0.2345 plus the 12 cells of its two
write-then-verify cases at $0.9681.

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
Sonnet 0 in 6, Fable 0 in 6** (see below for what Fable's six cells cost, and
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

Two rules where the cheap model was expected to fail, and did not:

- **Sentence length.** Measured on the **four conversational cases only** — the
  agentic case is excluded on purpose, because the text-block seam described
  below makes `sentence_length` unquotable there:

  | model | mean sentence words | over the 20-word cap |
  |---|---|---|
  | opus | 10.6 | 7.9% |
  | fable | 11.1 | 9.6% |
  | haiku | 11.3 | 10.0% |
  | sonnet | **13.4** | **20.3%** |

  Haiku is not the long-sentence model — Sonnet is, by a clear margin, and it
  stays the outlier with the top tier added. Across the full 13-case pool Haiku
  holds at 11.5 words and 10.6% over cap on its 60 tool-free cells, so this is
  not an artifact of the easier subset. All figures use `checks.mjs`'s own
  `words()`, the tokenizer `sentence_length` scores with. This **reverses** the
  reading taken from a four-cell probe during the sentence cap work; see the
  experiment ledger.

  These four numbers replace ones this document previously quoted over all five
  cases (Haiku 11.8 / 11.3%, Sonnet 13.5 / 19.1%, Opus 11.3 / 10.6%, Fable 11.8 /
  10.7%) and one over the full pool including its agentic cells (12.0 / 12.3%).
  Every figure moved by 0.1 to 0.7 words. **The conclusion did not move at all**,
  and Sonnet's lead over the field grew.
- **Code blocks and filler.** `code_block_size` and `no_filler` score 100.0 on
  every model including Haiku.

Where Haiku is genuinely worse, on the like-for-like five cases, it is worse at
*opening the reply*, not at obeying caps: `leads_with_conclusion` 83.3 against
Sonnet's 100.0 and Opus's 90.0 — the same pre-tool-call narration failure this
document opens with, one tier more pronounced. Fable scores 83.3 on the same
rule, so the top tier is no better at it than the cheapest.

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

Those cells averaged $0.9681 and ranged $0.7970 to $1.1315 — 4.8× a conversational
Fable cell ($0.1998), and the six most expensive cells in the project. The top
tier buys completion, and completion is the only thing it buys. Same model, same
style files, same scorer, only the case changes:

| Fable on | rules | judge |
|---|---|---|
| the shared five (30 cells) | 94.1 | 66.6 |
| `agentic-fix-verify` (6 cells) | 79.5 | 41.2 |

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

The top tier is level with the cheapest, and both are far behind the two in the
middle. Capability does not touch this rule, which is the strongest evidence in
the project that pre-tool narration is a Claude Code habit rather than a model
limitation. Note the direction is the opposite of the word cap: there Sonnet was
the outlier that complied, here Sonnet complies perfectly again. Whatever these
two rules have in common, tier is not it.

**Two rules are not quotable on agentic cells, for a harness reason.**
`run.mjs` accumulates assistant text blocks with `text += b.text` and no
separator, so on an agentic turn the pre-tool narration is glued to the post-tool
answer: the saved transcript literally reads `"I'll look at the file first.The
bug is in ..."`. `sentences()` needs whitespace after the full stop to split, and
`paragraphs()` needs a blank line, so the run-on counts as one very long sentence
in one paragraph. Checked by searching for a no-whitespace seam after
sentence-ending punctuation, and splitting cells by whether the model actually
called a tool — that is what produces multiple text blocks — it appears in **0 of
131 cells that made no tool call** and in most of those that did: 3 of 6 Opus,
1 of 7 Sonnet, 10 of 12 Haiku, 5 of 6 Fable, and 6 of 6 on Fable's
`agentic-fix-verify`.

The four-tier table above is essentially unaffected: only one of its five cases
is agentic, `paragraph_length` still scores 95.8–100.0 on it for every model, and
the artifact is identical in all four columns. `agentic-fix-verify` is where it
bites — `paragraph_length` there reads 16.7, which is the harness, not the style.
So the numbers quoted in this section are `leads_with_conclusion`, `total_length`
and the abort count, all of which the seam cannot touch. Fixing it would move
agentic figures already published here, so it is tracked as its own change.

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
judge is handed the whole turn, not the final message — see the ledger entry
"The seam reaches the judge". In 16 of 16 agentic cells that carry pre-update
narration, a judge violation quotes that narration. It is not an excuse for the
scores: 10 of 18 final updates are over the word cap on their own. But
`agentic-fix-verify`'s judge score cannot be read as a clean measure of the style
file until `run.mjs` separates the final message from the trace.

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
while `no_jargon` bans 27 of them outright at weight 2.

**And the file never said which of its shapes a reply should take.** Eight of the
24 judge violations on the three weakest cases were "missing the What I did / Did
it work / Next structure" on replies that are not status updates — an
explanation, a code-reading report, a third-turn follow-up. The harness already
disagreed with that: `three_question_structure` is not among the checks for any
of those three cases, and `reserve-scope-estimate`'s rubric says outright that "a
status-update shape or a list of implementation steps is wrong here". The style
file was the only place that failed to say so.

The rewrite added a router naming which of four shapes a reply takes, generalised
the 80-word budget to every reply with a stated cut order, added shapes for
"why does this happen" and for follow-up turns, added a word-counted target
example of the kind `plain-english-advanced.md` has always had, and resolved the
three contradictions.

**What it did, on 128 cells across two disjoint case sets, paired by case × model:**

| | five shared cases, 10 pairs | six reserve cases, 12 pairs |
|---|---|---|
| deterministic rules | +5.2 [+0.0, +10.4] | **+7.7 [+5.3, +10.1]**, t=7.06 |
| reply words | **−42.0 [−78.2, −5.9]** | **−55.7 [−83.2, −28.1]**, t=−4.41 |
| composite | +3.3 [−6.1, +12.6] | **+7.4 [+0.8, +14.0]**, t=2.52 |
| LLM judge | +1.3 [−15.0, +17.6] | +7.1 [−7.0, +21.2] |

Over-cap share on the shared five fell from 40.0% to 14.3% and mean reply length
from 103 to 61 words. Rules on the shipped text read 98.5 on Opus and 97.4 on
Sonnet — the highest beginner has recorded, against 90.9–92.3 in the four-tier
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

**That is the transferable finding.** Per-cell judge SD is 22 to 32, so the
ten-cell arms every judge figure in this project rests on carry 95% intervals
about 30 points wide. Placing a style above a 70% bar with confidence needs
roughly 151 cells per model — about $32 an arm at the measured $0.107 a cell.
Deterministic rules and reply length are cheap to establish and were established
here; the judge is not, and a ten-cell judge difference under about 20 points
should be read as unmeasured rather than as a movement.

## Sources

- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) — response length, agentic narration, over-verification, correction narration
- [Output styles — Claude Code docs](https://code.claude.com/docs/en/output-styles) — frontmatter, injection, precedence
- [Issue #6450](https://github.com/anthropics/claude-code/issues/6450) — output styles ignored when they conflict with trained defaults; closed as not planned
- [Issue #10671](https://github.com/anthropics/claude-code/issues/10671) — request to keep output styles
- [Issue #39331](https://github.com/anthropics/claude-code/issues/39331) — VS Code extension does not load `outputStyle` from settings
- [Opus 5 verbose in Claude Code](https://lucadidomenico.studio/en/blog/opus-5-verbose-system-prompt-claude-code) — origin of the `SIMPLE_SYSTEM_PROMPT` advice, which did not replicate here
