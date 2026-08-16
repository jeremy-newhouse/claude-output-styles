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
`conv-decision-holdout` score ~48% on the judge across *every* style, old and
new. Multi-tool sessions and open-ended decisions are handled poorly by all
three styles. That is a content gap, not a wording gap — rewriting the same
rules will not close it.

## Per-model baseline, all three styles

Baseline variant, 2 repeats, five cases, 10 cells per pair. Every cell in this
table answered the *same five prompts* under the *same style text* and was graded
by the *same scoring code*, so the columns are directly comparable. Opus and
Sonnet come from run `12-44-03`, Haiku from `22-59-53`; the two runs are separate
invocations on the same day, which is the only difference between the columns.

| style | rules haiku | rules sonnet | rules opus | judge haiku | judge sonnet | judge opus |
|---|---|---|---|---|---|---|
| advanced | 96.0 | 96.8 | 97.8 | 52.9 | 66.0 | 73.9 |
| intermediate | 94.3 | 95.6 | 94.2 | 62.2 | 72.6 | 63.9 |
| beginner | 90.9 | 92.3 | 91.5 | **37.5** | **48.4** | **45.9** |

The composite score is deliberately omitted: each style carries a different
`judgeWeight` (0.3 / 0.4 / 0.5), so composites are not comparable across rows.
Rules and judge are.

Three things this settles. Rule compliance is high everywhere and roughly
model-independent — the spread across all nine cells is 90.9 to 97.8, and adding
a tier that costs a quarter of Sonnet per cell ($0.024 against $0.101, measured)
widened that spread by 0.6 points. Prose quality is neither: beginner sits 15 to
28 points below advanced depending on the model, and it is the only style where
the two halves disagree sharply. And Haiku is last on the judge for all three
styles while never giving up more than 1.8 points of rule score against the best
of the other two — and on intermediate it beats Opus outright. Whatever the cheap
model gives up, it is not rule-following.

The judge column is *not* a clean tier ranking, though. Opus leads on advanced,
but Sonnet beats it on intermediate (72.6 to 63.9) and on beginner (48.4 to 45.9).
Only the bottom of the range is stable: Haiku is last every time.

Beginner follows its own rules at over 90% and still reads worst, on all three
models. That is the signature of a style whose stated rules do not capture what
makes it good, which is why the optimizer could not fix it by rewording them.
A third model, at a quarter of the cost, reproduces the pattern exactly — so it
is a property of the style file, not of any one model's taste.

### Haiku on the full case set, and what it cannot do at all

The table above uses five cases because that is what Opus and Sonnet were
measured on. Haiku was also run across the full 13-case pool — 78 cells, $1.88 —
and that run exposes something five conversational cases cannot.

**Six of the 78 cells produced no reply at all.** Every one is
`Reached maximum number of turns (12)`, and every one is a case that requires
editing a file and then running the tests:

| case | what it asks for | haiku cells with no reply |
|---|---|---|
| `agentic-fix-verify` | fix a bug, then run the tests | 5 of 6 |
| `reserve-agentic-write` | add a test, then run the suite | 1 of 6 |
| `agentic-read-report` | read the code and report (no writes) | 0 of 6 |

The like-for-like comparison is `agentic-fix-verify`, the one write-then-verify
case all three models have run: **Haiku 5 aborts in 6 cells, Opus 0 in 6, Sonnet
0 in 6.** Widening to every saved agentic cell does not change the picture but
does pad the denominator with work that does not discriminate — Opus is 0 of 21
and Sonnet 0 of 28, but 15 and 22 of those are the read-only case, where Haiku is
also clean at 0 of 8. Neither larger model has ever been run on
`reserve-agentic-write`, so that row is Haiku-only evidence.

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

- **Sentence length.** On the shared five, Haiku averages 11.8-word sentences
  against Sonnet's 13.5 and Opus's 11.3, and runs over the 20-word cap on 11.3%
  of sentences against Sonnet's 19.1% and Opus's 10.6%. Haiku is not the
  long-sentence model — Sonnet is. Across the full 13-case pool Haiku holds at
  12.0 words and 12.3% over cap, so this is not an artifact of the easier
  subset. All figures use `checks.mjs`'s own `words()`, the tokenizer
  `sentence_length` scores with. This **reverses** the reading taken from a
  four-cell probe during the sentence cap work; see the experiment ledger.
- **Code blocks and filler.** `code_block_size` and `no_filler` score 100.0 on
  every model including Haiku.

Where Haiku is genuinely worse, on the like-for-like five cases, it is worse at
*opening the reply*, not at obeying caps: `leads_with_conclusion` 83.3 against
Sonnet's 100.0 and Opus's 90.0 — the same pre-tool-call narration failure this
document opens with, one tier more pronounced.

## Sources

- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) — response length, agentic narration, over-verification, correction narration
- [Output styles — Claude Code docs](https://code.claude.com/docs/en/output-styles) — frontmatter, injection, precedence
- [Issue #6450](https://github.com/anthropics/claude-code/issues/6450) — output styles ignored when they conflict with trained defaults; closed as not planned
- [Issue #10671](https://github.com/anthropics/claude-code/issues/10671) — request to keep output styles
- [Issue #39331](https://github.com/anthropics/claude-code/issues/39331) — VS Code extension does not load `outputStyle` from settings
- [Opus 5 verbose in Claude Code](https://lucadidomenico.studio/en/blog/opus-5-verbose-system-prompt-claude-code) — origin of the `SIMPLE_SYSTEM_PROMPT` advice, which did not replicate here
