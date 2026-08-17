---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Style contracts by audience level
tags:
  - styles
  - contract
summary: 'The testable contract each of the three styles commits to: caps, vocabulary, code, and structure'
generated:
  by: lore/0.2.0
  at: 2026-08-16T13:05:00.000Z
---

# Style contracts by audience level

## Summary

Three styles share one workflow and differ only in vocabulary depth and density.
Each states a contract that is machine-checkable, which is what makes the harness
possible: `harness/config/contracts.json` encodes the numbers below, and
`harness/src/checks.mjs` enforces them one function per rule.

A style file and its contract must agree. If a style says "sentences under 20
words" and its contract says 18, the measurement is grading a rule nobody wrote.

## Requirements

### Shared across all three levels

Every style guarantees the same five things:

- **Three-question status updates.** What I did, did it work, what you do next.
  All three beats, in that order, with the first appearing early rather than
  after a preamble.
- **Two-option decisions.** Exactly two options, trade-offs on speed, cost, and
  quality, and one recommendation. Never a decision the assistant can safely make
  itself.
- **STE discipline.** Active voice, one idea per sentence, one word one meaning,
  stable names across a conversation.
- **Minimum necessary output.** No elaboration unless asked.
- **Full coding ability.** All three set `keep-coding-instructions: true`, so only
  communication changes, never engineering behaviour.

### Per-level numbers

| | beginner | intermediate | advanced |
|---|---|---|---|
| max sentence words | 20 | 20 | 20 |
| max sentences per paragraph | 4 | 4 | 4 |
| max words per reply | 80 | 100 | 120 |
| max code block lines | 0 — no code | 5 | 10 |
| jargon | none; banned-term list enforced | common terms free, deeper terms glossed once | precise terms correct, buzzwords banned |
| explanation style | everyday analogies | one-line "why" per change | root cause, numbers, blast radius |

Only the reply-length cap and the code and jargon rules vary by level. All three
files state the same sentence and paragraph limits, and that is now a decision
rather than an accident — see "Why sentence and paragraph caps do not vary".

The beginner ban list is explicit and enforced: API, endpoint, middleware,
repository, commit, branch, deploy, migration, schema, regex, async, cache,
token, JWT, null, stack trace, refactor, dependency, runtime, compiler, race
condition, idempotent, mutex, serialization, webhook, CI, CD, SDK. Intermediate
bans a shorter list of genuinely niche terms. Advanced bans none.

### Scoring weights

Rule weights and the rules-versus-judge split differ by level because the binding
constraint differs:

| level | weighted-up rules | `judgeWeight` |
|---|---|---|
| beginner | `no_jargon` x2, `code_block_size` x2, `total_length` x1.5 | 0.5 |
| intermediate | `total_length` x1.5, `code_block_size` x1.5 | 0.4 |
| advanced | `total_length` x1.5, `no_filler` x1.5, `no_process_narration` x1.5 | 0.3 |

Beginner carries the highest judge weight because its rules already pass at over
90% while its prose scores worst — weighting rules higher would let an optimizer
trade quality it cannot afford to lose.

## Design

The contract is deliberately split in two so each half is graded by the right
instrument.

**Machine-checkable rules** live in `contracts.json` as numbers and lists, and in
`checks.mjs` as one function per rule. Each returns a continuous 0..1 rate plus
quoted evidence, so a partially-failing reply produces a partial score the
optimizer can follow, and a failure names the violated rule in the style's own
terms.

**Everything else** — is the conclusion genuinely first, is the level right, has
the tone drifted by turn three — goes to a rubric judge that receives the style
body and is told the guide outranks its taste.

Per-case check lists in `cases/cases.json` are level-agnostic. Every case carries
`no_jargon` and `code_block_size`; the contract decides whether they bite. For
advanced, an empty ban list and a 10-line cap make both free.

### Why sentence and paragraph caps do not vary

They were tried and measured. Beginner was tightened to 12 words, validated on
both models, and reverted.

**Sentence caps.** The premise — a non-technical reader needs shorter sentences
than a technical leader — is reasonable, and the styles do not deliver it: at
`12-44-03` all three levels write about the same length, beginner 12.3 words,
intermediate 12.4, advanced 11.5. Stating a tighter cap does not close that gap.
A paired run of the 20-word and 12-word beginner files across both models and six
cases (`22-27-15`) moved mean sentence length by **+0.26 words, 95% CI [−0.77,
+1.29]**, with six of twelve pairs shorter and six longer. Quality did not
improve either: pooled judge 0.557 → 0.532, and mean reply length rose from 105
words to 114 against an 80-word cap.

Opus and Sonnet already write at 11–12 words unprompted, so a 12-word cap has
little to pull against: the share of sentences over 12 words moved 42.2% → 38.9%
on Opus and 42.2% → 42.9% on Sonnet, in opposite directions.

The original account of this section held that Haiku was the exception — that its
baseline of 16.6 words sat well above the cap, so the same one-line change pulled
its over-12 share from 60.0% down to 40.5% (`22-18-53`). **`22-59-53` removed the
grounds for that exception.** It measured the *unchanged* 20-word beginner file on
Haiku at eight cells over the probe's own four cases, and again at twenty-five
cells over all thirteen:

| sample of the untightened file | cells | sentences | mean words | over 12 words |
|---|---|---|---|---|
| `22-18-53` — the probe's baseline arm | 4 | 30 | 16.6 | 60.0% |
| `22-59-53`, same 4 cases | 8 | 79 | 12.1 | 43.0% |
| `22-59-53`, all 13 cases | 25 | 268 | 12.2 | 38.4% |

The probe's tightened arm measured 40.5%. Haiku's untightened share, at two and
six times that sample, is 43.0% and 38.4% — and 40.5% sits inside that range. The
movement the probe reported is therefore fully accounted for by where its
baseline arm happened to land, with no work left for the cap to do.

That is a statement about the *evidence*, not a proof of no effect. The tightened
arm is also only four cells and has never been re-measured, so it is equally
imprecise; this does not show that a 12-word cap does nothing on Haiku. It shows
there is no longer a measured gap to explain — and a mechanism was published to
explain one.

So the end-state reading holds and needs no Haiku exception. Every model lands in
one band and none of them is far from the others: Opus 38.9% and Sonnet 42.9% of
sentences over 12 words (`22-27-15`), Haiku 40.5% tightened (`22-18-53`) and
38.4% untightened (`22-59-53`).

**Treat that as a band and not as a ranking**, because the movement between
slices is nearly as large as the spread between models. Measured on one
consistent slice — the beginner style, the untightened file, and only the cells
where the model called no tool, since `sentences()` under-splits on the rest —
the four models give Opus 37.6%, Fable 40.7%, Sonnet 41.8% and Haiku 44.6%. That
is a 7.0-point spread across four models, and a single model moves by nearly as
much just by changing which cells are counted: Sonnet reads 41.8% here and 47.4%
if the tool-using cells are pooled back in. With those two numbers so close the
ordering carries no weight — only the observation that all four sit in one broad
band does. Adding the top tier changed nothing: Fable lands in the middle.

**A cheap-model probe measures whether an instruction can bind, not whether it
binds** — and a probe small enough to be cheap is small enough that its baseline
arm may not reproduce, which is the failure that actually happened here.
Re-measure a probe's own baseline before building an explanation on the gap it
appears to show.

**Paragraph caps.** Settled offline for free. Mean paragraph length is 1.4 to 1.8
sentences against a cap of 4, and no paragraph in the controlled run exceeds 4.
Re-scoring the same replies at a cap of 3 moves `paragraph_length` by 0.000 to
0.017. The constraint does not bind at any level, so differentiating it cannot
change behaviour.

**Where the real gap is.** The cap that already varies by level — reply length,
80/100/120 — is the one being missed, and missed worst at the lowest level:
beginner averages 119 words against 80 with half its replies over, intermediate
120 against 100 with 45% over, while advanced sits at 85 against 120 with 15%
over. Where sentence length and reply length can be told apart (intermediate,
where they correlate at only −0.05), the judge tracks reply length at −0.647 and
sentence length at only −0.368.

**The fourth tier reproduces this exactly, which rules out one explanation for
it.** Mean reply words on the five shared cases, against each level's own cap:

| level | cap | opus | sonnet | haiku | fable |
|---|---|---|---|---|---|
| advanced | 120 | 93 | 77 | 91 | 100 |
| intermediate | 100 | 144 | 96 | 110 | **121** |
| beginner | 80 | 135 | 103 | 113 | **132** |

Every model writes comfortably inside the advanced cap and overshoots the
beginner one, and the most capable model overshoots it by 65%. So the lower
levels are not failing because the model cannot manage a shorter reply — it
manages a shorter one at the level where the cap is *loosest*. The caps are being
read as an audience signal rather than as a limit, and the signal points the
wrong way: "explain this simply" is being answered with more words, not fewer.

### Keeping a style file and its contract in agreement

`node src/cli.mjs audit` parses each style file's stated caps out of its own prose
and compares them against `contracts.json`, exiting 1 on any disagreement. The
same comparison runs in `harness/test/contract-audit.test.mjs`, so `npm test`
fails on drift. It recognises the phrasings the shipped styles use:

| contract field | phrasing in the style file |
|---|---|
| `maxSentenceWords` | "sentences under _N_ words" |
| `maxParagraphSentences` | "paragraphs under _N_ sentences" |
| `maxUpdateWords` | "the whole update/reply under _N_" |
| `maxCodeLines` | "code/diffs/snippet under _N_ lines", or "never show code" for 0 |

A cap stated in some other phrasing is reported as **unstated**, not skipped, and
two different numbers for one cap are reported as **ambiguous**. Silence is the
failure mode this guard exists to prevent, so it never resolves an unclear file
by guessing.

## Open questions

Reply length, code allowance, and the ban lists have never been swept. They were
chosen by judgement when the styles were written. The sentence-cap experiment
above says something about how such a sweep would read: a cap that sits well
inside what the model already does is inert, and one that sits under it changes
behaviour, so "the model ignores the cap" and "the cap was never binding" are
distinguishable only by measuring the baseline first.

The reply-length cap is the concrete case. It binds — beginner misses 80 words
half the time — and it has never been swept, so whether 80 is achievable or
merely aspirational is unknown.

The 0.7/0.3 default rules-to-judge split is likewise unswept.

Beginner's contract may be incomplete rather than wrong. It follows every rule it
states and still reads worst of the three, which suggests the rules do not
capture what makes beginner prose good. Tracked as COS-4.
