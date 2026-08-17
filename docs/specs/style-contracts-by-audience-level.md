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

Every sentence-segmentation figure below was re-derived after COS-10 changed
`sentences()` to split on a single newline; the pre-COS-10 value is given beside
each one, because it is what earlier revisions published and because every one of
them reproduced exactly before its replacement was quoted.

**Sentence caps.** The premise — a non-technical reader needs shorter sentences
than a technical leader — is reasonable, and the styles do not deliver it: at
`12-44-03` all three levels write about the same length, beginner 11.8 words,
intermediate 11.8, advanced 11.0 (12.3 / 12.4 / 11.5 before re-segmentation — the
levels converged rather than separated). Stating a tighter cap does not close that
gap. A paired run of the 20-word and 12-word beginner files across both models and
six cases (`22-27-15`) moved mean sentence length by **+0.25 words, 95% CI [−0.83,
+1.34]** (+0.26, [−0.77, +1.29] before), with six of twelve pairs shorter and six
longer. Quality did not improve either: pooled judge 0.557 → 0.532, and mean reply
length rose from 105 words to 114 against an 80-word cap. Neither of those last
two depends on segmentation.

Opus and Sonnet already write at 11–12 words unprompted, so a 12-word cap has
little to pull against: the share of sentences over 12 words moved 40.3% → 36.8%
on Opus and 40.4% → 41.2% on Sonnet, in opposite directions (42.2 → 38.9 and
42.2 → 42.9 before).

The original account of this section held that Haiku was the exception — that its
baseline of 15.5 words sat well above the cap, so the same one-line change pulled
its over-12 share from 56.3% down to 38.5% (`22-18-53`). **`22-59-53` removed the
grounds for that exception.** It measured the *unchanged* 20-word beginner file on
Haiku at eight cells over the probe's own four cases, and again at twenty-five
cells over all thirteen:

| sample of the untightened file | cells | sentences | mean words | over 12 words |
|---|---|---|---|---|
| `22-18-53` — the probe's baseline arm | 4 | 32 (was 30) | 15.5 (was 16.6) | 56.3% (was 60.0%) |
| `22-59-53`, same 4 cases | 8 | 88 (was 79) | 10.8 (was 12.1) | 35.2% (was 43.0%) |
| `22-59-53`, all 13 cases | 25 | 315 (was 268) | 10.4 (was 12.2) | 30.2% (was 38.4%) |

The probe's tightened arm measured 38.5% (was 40.5%). Haiku's untightened share,
at two and six times that sample, is 35.2% and 30.2% — so the tightened arm now
sits slightly *above* its own configuration's larger-sample range rather than
inside it. Either way the movement the probe reported is fully accounted for by
where its baseline arm happened to land, with no work left for the cap to do; on
the re-segmented numbers the cap looks, if anything, marginally worse than no cap.

That is a statement about the *evidence*, not a proof of no effect. The tightened
arm is also only four cells and has never been re-measured, so it is equally
imprecise; this does not show that a 12-word cap does nothing on Haiku. It shows
there is no longer a measured gap to explain — and a mechanism was published to
explain one.

So the end-state reading holds and needs no Haiku exception. Every model lands in
one band and none of them is far from the others: Opus 36.8% and Sonnet 41.2% of
sentences over 12 words (`22-27-15`), Haiku 38.5% tightened (`22-18-53`) and
30.2% untightened (`22-59-53`).

**Treat that as a band and not as a ranking.** Measured on one consistent slice —
the beginner style, the untightened file, the five shared cases, and only the
cells where the model called no tool, since every saved tool-using reply is
glued — the four models give Opus 36.8%, Haiku
36.1%, Fable 38.6% and Sonnet 40.4%: a **4.3-point spread** across four models.
Before re-segmentation the same slice read Opus 37.6%, Fable 40.7%, Sonnet 41.8%
and Haiku 44.6%, a 7.0-point spread with Haiku on top. Re-segmenting tightened the
band and moved Haiku from highest to second-lowest, which is the clearest possible
argument that the ordering never carried weight — only the observation that all
four sit in one narrow band does, and that observation survived intact. Adding the
top tier changed nothing either time: Fable lands in the middle.

The slice-sensitivity argument this section used to make has largely gone with the
re-segmentation, and it is worth saying so rather than quietly dropping it. Sonnet
read 41.8% on this slice and 47.4% with the tool-using cells pooled back in — a
5.6-point swing that rivalled the whole between-model spread. It now reads 40.4%
and 41.0%, a 0.6-point swing. Most of that gap was the harness under-splitting
tool-using replies, not a property of the cells.

**A small-model probe measures whether an instruction can bind, not whether it
binds** — and a probe small enough to run quickly is small enough that its baseline
arm may not reproduce, which is the failure that actually happened here.
Re-measure a probe's own baseline before building an explanation on the gap it
appears to show.

**Paragraph caps.** Settled offline for free. Mean paragraph length is 1.4 to 1.8
sentences against a cap of 4, and no paragraph in the controlled run exceeds 4.
Re-scoring the same replies at a cap of 3 moves `paragraph_length` by 0.000 to
0.017. The constraint does not bind at any level, so differentiating it cannot
change behaviour.

**Where the real gap was.** The cap that already varies by level — reply length,
80/100/120 — was the one being missed, and missed worst at the lowest level:
beginner averaged 119 words against 80 with half its replies over, intermediate
120 against 100 with 45% over, while advanced sat at 85 against 120 with 15%
over. **Beginner's half of this is closed** — COS-4 took it to 61 words with
14.3% over, without changing the cap; see the open question below. Intermediate
and advanced are unchanged and the rest of this section still describes them. Where sentence length and reply length can be told apart (intermediate,
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

### Conditional caps

A cap can be conditional, and for a while the guard could not say so. Beginner's
file says "Never show code **unless they ask**". That parses to 0, matches
`maxCodeLines: 0`, and was reported as agreement — while the prose granted a
permission the contract had no field to hold, and `code_block_size` scored any
code block 0 at weight 2 whether or not the reader had asked for it. The numbers
agreed and the rules did not.

The same defect ran the other way through the ban lists. Beginner's core rules
say to gloss a term you must keep, with "I updated the API (the messenger that
lets two programs talk)" as the worked example, and `no_jargon` matched the bare
term. A reply following the file's own example lost the heaviest-weighted check
in the contract.

Both are fixed by extending the contract language rather than by editing the
style files, and the two halves were decided separately because they are
conditioned on different things:

- **The gloss is conditioned on the reply**, which is the string a check already
  reads. `no_jargon` was named "avoids unglossed jargon" from the start; only the
  implementation was unconditional. It now grades **first use** and recognises
  two gloss forms — `TERM (a phrase of three words or more)` and
  `a two-word-or-longer expansion (TERM)` — which are the two the shipped files
  demonstrate. The em-dash appositive is deliberately not recognised: "the cache
  — the saved copy" is indistinguishable from "the cache — tests pass", and a
  gloss detector that guesses wrong turns a real violation into a clean score.
- **"Unless they ask" is conditioned on the request**, which no check can see. A
  regex over the prompt would put a guess inside the one instrument whose value
  is being deterministic. So the condition lives where the request does: a
  contract sets `codeOnRequest: true`, a case sets `requestsCode: true`, and the
  audit reports a prose conditional with no matching contract field — and the
  mirror, a contract that lifts a cap the prose never lifts — as a FAIL.

`codeOnRequest` lifts a **ban**, never a **size cap**. No style file states how
long a requested snippet may be, and inventing a number would put a figure in the
scorer that no reader of the style could find.

Only a reader's request is recognised as a condition. Advanced's "Code or diffs
under 10 lines **when they carry the point faster than prose**" is a judgement
the writer makes, not a request the reader sends; nothing outside the writer can
evaluate it, so it stays an ordinary unconditional cap.

### What the by-hand re-read of all three files found

`audit` cannot verify this about itself, so all three files were read against
every contract field by hand. Two findings survive, and neither is a conditional:

- **Advanced states a basis its contract grades differently.** The file says
  "Keep the whole reply under 120, **headers and code included**"; `total_length`
  counts `stripCode(text)`, so code is excluded. The scored cap is more permissive
  than the stated one. Filed rather than fixed here: changing the basis moves
  every `total_length` figure ever published, and changing the prose costs a
  measured arm.
- **Intermediate's "under about 100 words *when things are normal*" is a soft
  cap, and the contract grades it as one.** `total_length` gives full credit at
  the cap and decays to 0 at twice it, so the graded rule is already "about 100,
  with a growing penalty past it" rather than a cliff. No change needed; recorded
  because it reads like a conditional and is not one.

## Open questions

Reply length, code allowance, and the ban lists have never been swept. They were
chosen by judgement when the styles were written. The sentence-cap experiment
above says something about how such a sweep would read: a cap that sits well
inside what the model already does is inert, and one that sits under it changes
behaviour, so "the model ignores the cap" and "the cap was never binding" are
distinguishable only by measuring the baseline first.

The reply-length cap is the concrete case. It binds — beginner missed 80 words
half the time — and it has never been swept, so whether the *number* is right is
still open.

**Whether 80 is achievable is no longer open: it is.** COS-4 rewrote beginner's
prose without touching `maxUpdateWords`, and mean reply length on the five shared
cases fell from 103 words to 61, with the over-cap share going 40.0% to 14.3% and
`total_length` from 66.9 to 99.0. Paired by case × model the drop is −42.0
[−78.2, −5.9] on the shared set and −55.7 [−83.2, −28.1] on reserve. The file was
not missing an instruction to be brief — it said so twice already. It was asking
for content the budget could not fit: an unbounded "use everyday analogies" and
an unbounded "explain what a thing IS before you say what happened to it", against
a cap stated only for status updates while the harness applied it to every reply.
Rationing the first two and generalising the third was enough.

What that does *not* settle is whether 80 is the right number. Rules rose to 98.5
and 97.4 while the judge stayed flat, so shorter replies bought compliance and
not measurably better prose.

The 0.7/0.3 default rules-to-judge split is likewise unswept.

Beginner's contract may be incomplete rather than wrong. It follows every rule it
states and still reads worst of the three, which suggests the rules do not
capture what makes beginner prose good. Tracked as COS-4.

COS-4 confirmed the first half and left the second open. The rules *were*
incomplete — three of them contradicted each other and the file never said which
of its shapes a reply should take — and completing them raised rule compliance to
98.5 / 97.4 and halved reply length. The judge did not move (+1.3 [−15.0, +17.6]),
so what it is responding to in beginner prose is still unnamed. The one thing now
ruled out is that it is length.
