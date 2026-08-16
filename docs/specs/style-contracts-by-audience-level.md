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
files state the same sentence and paragraph limits. Whether the lower levels
*should* differ is an open design question, not a settled one — see below.

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

## Open questions

**Do lower levels need tighter sentence caps?** Unanswered. The contracts once
held beginner to 15 words and 3 sentences and intermediate to 18 words — numbers
no style file states. That was a defect, found by reviewing the spec against the
files, and correcting it raised measured rule scores by 0.4 to 1.3 points without
changing any conclusion. The design question it exposed stands: a reader with no
programming background plausibly needs shorter sentences than a technical leader,
and today gets the same limit. Tracked as COS-8.

Nothing currently catches a style file and its contract disagreeing. The mismatch
above survived every run in the project because the harness grades the contract
and never reads the prose limits out of the file.

Whether the per-level numbers are right has never been tested. They were chosen
by judgement when the styles were written and have never been swept. A cap that
is too tight shows up as a rule the model cannot satisfy without hurting the
reply, which is indistinguishable in the current data from a model that ignores
it.

The 0.7/0.3 default rules-to-judge split is likewise unswept.

Beginner's contract may be incomplete rather than wrong. It follows every rule it
states and still reads worst of the three, which suggests the rules do not
capture what makes beginner prose good. Tracked as COS-4.
