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

Standard case set, both models, baseline variant, 2 repeats — 10 cells per pair.
One run, one scoring version, current case prompts, so every cell is comparable.

| style | rules opus | rules sonnet | judge opus | judge sonnet |
|---|---|---|---|---|
| advanced | 97.8 | 96.8 | 73.9 | 66.0 |
| intermediate | 94.2 | 95.6 | 63.9 | 72.6 |
| beginner | 91.5 | 92.3 | **45.9** | **48.4** |

The composite score is deliberately omitted: each style carries a different
`judgeWeight` (0.3 / 0.4 / 0.5), so composites are not comparable across rows.
Rules and judge are.

Two things this settles. Rule compliance is high everywhere and roughly
model-independent — the spread across all six cells is 91.5 to 97.8. Prose
quality is neither: beginner sits 20 points below advanced on both models, and it
is the only style where the two halves disagree sharply.

Beginner follows its own rules at over 90% and still reads worst. That is the
signature of a style whose stated rules do not capture what makes it good, which
is why the optimizer could not fix it by rewording them.

## Sources

- [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) — response length, agentic narration, over-verification, correction narration
- [Output styles — Claude Code docs](https://code.claude.com/docs/en/output-styles) — frontmatter, injection, precedence
- [Issue #6450](https://github.com/anthropics/claude-code/issues/6450) — output styles ignored when they conflict with trained defaults; closed as not planned
- [Issue #10671](https://github.com/anthropics/claude-code/issues/10671) — request to keep output styles
- [Issue #39331](https://github.com/anthropics/claude-code/issues/39331) — VS Code extension does not load `outputStyle` from settings
- [Opus 5 verbose in Claude Code](https://lucadidomenico.studio/en/blog/opus-5-verbose-system-prompt-claude-code) — origin of the `SIMPLE_SYSTEM_PROMPT` advice, which did not replicate here
