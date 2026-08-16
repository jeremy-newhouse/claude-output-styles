---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Score styles with deterministic checks plus a style-aware judge
tags:
  - harness
  - scoring
summary: Rule compliance is machine-checkable and free; prose quality is not, so both are measured and weighted per style
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:46:28.024Z
---

# Score styles with deterministic checks plus a style-aware judge

## Status

Accepted

## Context

An output style states rules that are mostly machine-checkable: sentence length,
word caps, banned filler, code-block size, required status beats. A regex scores
those for free, reproducibly, and can quote the offending text.

It cannot see whether the conclusion genuinely comes first, whether the technical
level suits the audience, or whether the tone has drifted back to a default
chatty register by the third turn. Those need a model.

Neither instrument is sufficient alone, and the failure modes are asymmetric.

A rewrite that dropped bold beat labels from the intermediate style scored
*higher* on the deterministic structure check while the judge correctly reported
that replies now omitted the beats entirely. The labels turned out to be
load-bearing: keyword matching survived a structural collapse that the judge
caught. Conversely, an early judge penalised a reply for saying "Nothing for
you" — a phrase the style names as correct — because it had never been shown the
style guide and graded against its own taste.

Both instruments have since been corrected. The judge now receives the style body
and is told the guide outranks its taste. The structure check now requires the
beats to appear early and in order rather than merely to appear.

## Decision

Score every reply twice and combine.

Deterministic checks in `harness/src/checks.mjs` carry the default weight of 0.7.
Each check maps to one rule the style actually states, so a failure names the
broken rule and quotes the text. They cost nothing and never drift between
iterations, which makes them safe to run on every loop.

A rubric judge carries 0.3. It receives the style body, the case rubric, the
audience level, and the numeric caps, and is instructed never to penalise a reply
for following the guide or to demand detail the guide says to omit.

The weight is overridable per style via `judgeWeight` on the contract. A style
whose rules already pass while its prose scores poorly needs the judge weighted
up, or the optimizer will trade real quality for rule points. Beginner runs at
0.5 and intermediate at 0.4 for exactly that reason.

## Consequences

Deterministic scores are comparable across every run in the project's history,
because saved transcripts can be re-graded offline at no token cost after a check
is fixed. Judge scores are not comparable across judge revisions.

A judge failure returns a neutral 0.5 with the error recorded on the row rather
than aborting the run. An earlier version propagated the exception and killed a
paid multi-style run partway through.

The 0.7/0.3 default is a judgement call, not a measured optimum. It was chosen
because deterministic checks are trustworthy and free while the judge is neither,
and it has not been swept.
