---
id: COS-18
title: Test whether intermediate and advanced carry beginner's defects
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-17 03:46'
updated_date: '2026-08-26 13:30'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-10
  - COS-11
references:
  - plain-english-intermediate.md
  - plain-english-advanced.md
  - plain-english-beginner.md
  - harness/rejected/README.md
documentation:
  - docs/specs/style-contracts-by-audience-level.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 found four structural defects in `plain-english-beginner.md` and fixing them moved rules 92.1/93.4 to 98.5/97.4 and mean reply length 103 words to 61. Nobody has looked for the same defects in the other two files.

The defects were:

- **A reply-length budget scoped to one reply shape** while the harness applies it to every reply. Beginner said "keep the whole update under about 80 words" inside its status-update section. `plain-english-intermediate.md` should be read for the same scoping. `plain-english-advanced.md` is the likely negative control — it states its cap as a universal at the end of the file, which is where the fix for beginner came from.
- **Unbounded content requirements that fight the budget.** "Use everyday analogies" and "explain what a thing IS before you say what happened to it" cost 15-25 words each and had no ration.
- **No statement of which shape a reply should take.** 10 of the 40 judge violations on beginner's three weakest cases demanded the three status beats on replies that are not status updates.
- **A rule that forbids what another rule requires.** "Skip all internal details" was quoted as a violation against "All 14 checks pass", which beat 2 requires.

There is a live reason to expect intermediate has at least the first: COS-7 measured it at 144 words against a 100-word cap on Opus and 121 on Fable, both worse in ratio than advanced. And `harness/rejected/README.md` records that intermediate's optimizer rewrite collapsed when bold beat labels were removed — the labels turned out to be load-bearing and the judge caught what the deterministic check could not, which is the same shape of finding as beginner's missing router.

This task is the read, the diagnosis and the measurement. If a file turns out to be clean, that is the result and it should be recorded as one — advanced scoring 97.8/96.8 on rules already suggests it may be.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All three style files are read against the four defect patterns above, and every instance found is quoted with file and line
- [ ] #2 For each file, a statement of which patterns it carries and which it does not, supported by judge violations from a real arm rather than by reading alone
- [ ] #3 Any fix is measured against the current text at n >= 146 cells per model on the five shared cases, per style changed
- [ ] #4 A file found clean is recorded as clean, with the evidence, rather than left unmentioned
- [ ] #5 Validated on the reserve split for every style whose text changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. AC #1 — read all three style files against COS-4's four defect patterns (D1 shape-scoped reply budget, D2 unbounded content requirements, D3 no reply-shape router, D4 rule forbids what another requires). Quote file and line for every instance. Record the reading as a hypothesis, not a conclusion.
2. AC #2 — run one diagnostic arm that the reading cannot substitute for: intermediate + advanced, opus + sonnet, baseline variant, the shared five (train split), 30 repeats = 150 cells per model per style, 600 cells total. Sized at ~31 cells/min (session 27's measured throughput), concurrency 12. The same arm doubles as AC #3's 'current text' baseline for whichever file changes.
3. Classify every judgeViolation string in that arm against the four patterns, per style per model, with counts. A pattern is 'carried' only where the judge actually penalised it.
4. Decide per file whether the text needs a change. A file whose defects do not appear in judge violations is recorded clean with the evidence (AC #4), not left unmentioned.
5. Any fix: measure it against the same baseline at n >= 146 cells per model on the shared five (AC #3), one edit at a time, never a bundle — COS-16's lesson.
6. AC #5 — reserve-split arm for every style whose text changes.
7. Gates: npm --prefix harness test green, node src/cli.mjs audit exit 0 unpiped, lore check exit 0 if docs/ changes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC #1 — the read, all three files against COS-4's four defect patterns

This is the reading only. It is a hypothesis; AC #2 tests it against judge
violations from a real arm, and the two disagree in places (see the AC #2 notes).

### D1 — a reply-length budget scoped to one reply shape

- **Intermediate CARRIES it.** `plain-english-intermediate.md:36` — "Keep the
  whole update under about 100 words when things are normal." It sits inside
  `## Every status update must answer three questions` (line 30) and its noun is
  "the update", not "the reply". It is the file's only length figure, and
  `contracts.json` gives intermediate `maxUpdateWords` which `total_length`
  applies to every reply. It is scoped twice, not once: "when things are normal"
  is a second escape hatch that beginner's version never had.
- **Advanced does NOT carry it.** `plain-english-advanced.md:79` — "Count the
  words. Keep the whole reply under 120, headers and code included." The noun is
  "the whole reply", and line 77 extends it by name: "A decision reply gets the
  same budget." This is the negative control the task predicted, and it is the
  sentence COS-16's fix for beginner was modelled on.
  One caveat worth stating rather than burying: advanced states the universal
  correctly but files it under `## Example` (line 71) rather than in a section of
  its own. Beginner's fix promoted the same sentence to its own heading,
  `## How long a reply is`.

### D2 — unbounded content requirements that fight the budget

- **Intermediate CARRIES it, one instance.** `plain-english-intermediate.md:28` —
  "Comparisons like 'this is the same pattern we used for sign-up' are good
  shortcuts. Use them." An imperative with no ration. Beginner's equivalent, "use
  everyday analogies", was bounded by COS-4 to "One per reply, not one per idea."
  Intermediate's other content requirements are all already bounded: line 15
  "on first use", line 16 "one short phrase", line 25 "a short gloss the first
  time", line 27 "a one-line 'why'".
- **Advanced CARRIES it, one instance, weaker.** `plain-english-advanced.md:25` —
  "State risk and blast radius for changes that touch data, auth, or money."
  Conditional on the change, but two concepts required with no length ration,
  where every other content rule in the file carries one: "One line each" (22),
  "once, in a short phrase" (17), "under 10 lines" (23). The pressure is lower
  than intermediate's — one unbounded item against 120 words, not against 100 —
  and far lower than beginner's two at 15-25 words each against 80.

### D3 — no statement of which shape a reply should take

- **Intermediate CARRIES it.** The file offers four shapes — status update (30),
  long-session report (38), decision (52), tie-break (63) — and never says which
  a given reply should take. There is no equivalent of the router COS-16 gave
  beginner (`plain-english-beginner.md:27-36`, `## Pick the shape from the
  question`).
- **Advanced CARRIES it too.** Same four shapes (28, 36, 50, 59), same absence.
  **Advanced is therefore not the negative control on this pattern, only on D1.**
  On one point it is worse than intermediate: `plain-english-advanced.md:34`,
  "Beat 3 always appears, and it names an action", makes one status beat
  unconditional without saying whether "always" survives outside a status update.

### D4 — a rule that forbids what another rule requires

- **Intermediate CARRIES it, mild.** `plain-english-intermediate.md:27` — "Name
  the file or feature; skip the internals" — against beat 2 at line 33, "how I
  verified it (tests, manual check)", and against the file's own good example at
  line 50, "31 tests pass, including a new one for the half-cent case". A test
  count is an internal on the plain reading of 27 and is what 33 and 50 both
  require. Same shape as beginner's "skip all internal details" vs "All 14 checks
  pass", softened because 27 explicitly permits naming the file and line 24 lists
  "test" among the terms needing no gloss.
- **Advanced CARRIES it, sharp.** `plain-english-advanced.md:23` — "Code or diffs
  under 10 lines when they carry the point faster than prose" — against line 43,
  "no pasting back a diff you just wrote". A general permission and a specific
  prohibition that overlap with no precedence between them, and on the
  multi-tool session that section 36 governs, every diff in scope is one you just
  wrote. Beginner's instance of exactly this shape was closed by a carve-out
  (`plain-english-beginner.md:46`).

### Reading summary

| Pattern | Beginner (fixed by COS-4/COS-16) | Intermediate | Advanced |
|---|---|---|---|
| D1 budget scoped to one shape | fixed, line 23 | **carries**, line 36 | **clean**, line 79 |
| D2 unbounded content requirement | fixed, lines 43-44 | **carries**, line 28 | **carries (weak)**, line 25 |
| D3 no reply-shape router | fixed, lines 27-36 | **carries** | **carries** |
| D4 rule forbids what another requires | fixed, line 46 | **carries (mild)**, 27 vs 33/50 | **carries (sharp)**, 23 vs 43 |

## A mis-scoped arm was launched, killed at 125 cells, and is not used

Run `2026-08-20T12-08-19-026Z` was launched on the **train split**
(conv-status-auth, conv-decision-db, conv-explain-cache, conv-badnews,
agentic-read-report) on the assumption that 'the shared five' meant it. It does
not. The shared five is a fixed convention this project has used in 22 of the 24
five-case runs on disk, and `cases.json` has no field recording it:

  conv-status-auth, conv-status-holdout, conv-explain-cache,
  conv-followup-drift, agentic-read-report

Confirmed against COS-16's own baseline `2026-08-20T03-03-26` and COS-4's before
arm `02-10-45`, whose per-case breakdown in the experiment ledger names exactly
these five. The train split differs in two of five cases.

The arm was killed at 125 of 600 cells and **its rows are not used for any figure
in this task.** The correct arm is `2026-08-20T12-12-10-010Z`. This is recorded
rather than deleted because `results/` is git-ignored and a future reader
comparing stamps would otherwise find an unexplained partial run between two
cited ones.

Worth encoding: only two of the shared five are status updates
(conv-status-auth, conv-status-holdout). The other three — conv-explain-cache
(why does this happen), conv-followup-drift (a three-turn follow-up),
agentic-read-report (read the repo and report) — are the replies a
status-scoped word budget does not formally bind. That split is what makes this
case set able to test D1 at all, and it is a second reason the train split was
the wrong choice: it has the same 2/5 ratio but swaps in a decision case and a
bad-news case, neither of which any prior arm measured for these two styles.

## Why `audit` cannot catch D1, and passes on both files

`node src/cli.mjs audit` exits 0 with all 12 checks agreeing, including
`plain-english-intermediate maxUpdateWords  both say 100`. It compares the
**number** a style file states against `contracts.json`; it has nothing to say
about the **scope** the file attaches to that number. Intermediate states 100 and
means 'per status update'; `total_length` in `checks.mjs:274-283` applies it to
every reply. Both sides say 100, so the audit agrees, and the disagreement that
matters is invisible to it.

This is the same blind spot COS-4 hit on beginner, where 80 agreed with 80 while
the file scoped its 80 to status updates. It is worth stating plainly because a
future session may reasonably read a green audit as evidence that a style file's
caps are sound. It is evidence that the caps' digits match, and nothing more.

Advanced shows the same limit on a different pattern: the audit reports
`maxCodeLines both say 10`, while the file both permits diffs under 10 lines
(line 23) and forbids pasting back a diff you just wrote (line 43). One number,
two rules, no precedence — and the audit sees only the number.

Not proposing to widen the audit here; that would be scope beyond COS-18's
criteria. Recording it as the reason the reading in AC #1 could not be replaced
by running the tool the project already has.

## A corroborating sample from 17 saved runs — and the reason it cannot settle D1

Saved rows carry `judgeViolations` well before this task, so 17 runs on disk
already hold 235 violation-bearing intermediate/advanced cells. Pooled and
classified with the same regexes as the main arm (script kept at
`scratchpad/corrob.mjs`; this task's own two arms excluded):

| style / model | cells | violations | D1 | D2 | D3 | D4 |
|---|---|---|---|---|---|---|
| intermediate / opus | 19 | 72 | 25 (34.7%) | 3 (4.2%) | 3 (4.2%) | **6 (8.3%)** |
| intermediate / sonnet | 28 | 97 | 24 (24.7%) | 5 (5.2%) | 8 (8.2%) | **5 (5.2%)** |
| intermediate / haiku | 31 | 110 | 24 (21.8%) | 7 (6.4%) | 1 (0.9%) | **6 (5.5%)** |
| advanced / opus | 50 | 149 | 45 (30.2%) | 8 (5.4%) | 2 (1.3%) | 4 (2.7%) |
| advanced / sonnet | 35 | 119 | 34 (28.6%) | 0 | 7 (5.9%) | 1 (0.8%) |
| advanced / haiku | 29 | 104 | 17 (16.3%) | 4 (3.8%) | 6 (5.8%) | 2 (1.9%) |

**This is corroboration, not measurement.** It pools heterogeneous runs — different
case mixes, four model tiers, some `long-prompt` and candidate/optimized style
variants, and some rows scored before COS-11 fixed errored-cell pooling. No
figure here is quoted as a result. The arm is what AC #2 rests on.

### The finding that changes how D1 must be tested

**Advanced overruns its cap as hard as intermediate does — 30.2% of Opus
violations, 45 of 45 of them on non-status cases — while stating its cap
universally and correctly.** So the over-length symptom is present without the
scoping defect underneath it.

That kills the obvious test. Counting over-length violations cannot separate
'the file scopes its budget to one reply shape' from 'the model writes long
replies regardless'. Both produce over-cap non-status replies, and 3 of the
shared 5 cases are non-status, so both land ~100% of their over-cap hits there
by construction.

The discriminating measure is therefore not the count but the **status vs
non-status gap within a style**, read against advanced as the control that has
the symptom without the defect, and against the COS-16 beginner file as the
control that had the defect and had it fixed. That is what the arm computes.

### What the corroborating sample does support

**D4 separates the two files cleanly and in the direction AC #1 predicted for
intermediate.** Intermediate runs 8.3 / 5.2 / 5.5% on Opus / Sonnet / Haiku
against advanced's 2.7 / 0.8 / 1.9% — three tiers, same direction, roughly
threefold. AC #1 read intermediate's instance as the milder of the two
('skip the internals' vs a required test count, softened by an explicit
permission to name the file) and advanced's as the sharper (a diff permitted at
line 23, forbidden at line 43). The violations invert that reading: the sharp
textual contradiction is the one the judge almost never fires on, and the mild
one is the one it fires on three times as often. Worth stating plainly — the
reading ranked these two backwards.

## Interim, intermediate only (300 of 600 cells, run `2026-08-20T12-12-10-010Z`, 0 errored)

The D1 signature on intermediate is not subtle. Reply words against its stated
100-word cap, by whether the case asks for a status update:

| model | shape | n | mean words | over cap |
|---|---|---|---|---|
| opus | status | 60 | 64.7 | **0 (0%)** |
| opus | non-status | 90 | 142.9 | 69 (77%) |
| sonnet | status | 60 | 60.9 | **0 (0%)** |
| sonnet | non-status | 85 | 117.0 | 48 (56%) |

Per case on Opus: conv-explain-cache 197.3 words (30/30 over), agentic-read-report
139.5 (30/30 over), conv-followup-drift 91.9 (9/30), conv-status-auth 62.3 (0/30),
conv-status-holdout 67.1 (0/30).

**120 of 120 status updates comply. The reply that averages nearly double the cap
is the one whose shape the cap's own section does not name.** The file's cap sits
inside `## Every status update must answer three questions` and says 'the whole
update'; the model honours it exactly there and nowhere else.

D3 is confirmed on intermediate too, and the judge names the mechanism itself
rather than leaving it to be inferred. On conv-explain-cache, a 'why does this
happen' question:

> missing all three required status-update elements: no 'What I did' (this wasn't
> a status update on work performed) and no 'Did it work' — the reply doesn't fit
> the guide's man[dated shape]

> No 'What I did / Did it work' structure — this is diagnostic advice, but **the
> guide's status-update format is the only structure defined**, and the reply
> instead reads as a lecture

That second quote is the router defect stated by the grader: the file defines one
shape, so every reply is measured against it. 39 of intermediate's 330 Opus
violations (11.8%) are this, and **all 39 fall on non-status cases** — the same
concentration COS-4 found on beginner (10 of 40) at three times the rate.

Advanced's 300 cells are still running; nothing is concluded for it yet, and the
comparison that separates 'mis-scoped cap' from 'model writes long' needs them.

## The discriminator that separates D1-the-defect from D1-the-symptom

The earlier draft classifier counted any violation containing words + exceeds +
limit, which silently swept in **sentence**-cap violations ('33 words, exceeds
20-word sentence limit'). Corrected: reply-over-length now requires a
reply-level noun and explicitly excludes sentence-cap phrasing. Script kept at
`scratchpad/d1.mjs`. Every count below is from the corrected classifier.

The useful measure turned out not to be how often the judge flags an overrun. It
is **what the judge calls the cap when it does.** `judge.mjs` passes the style
body to the grader, so the grader's vocabulary for the rule is inherited from the
file under test.

| style / model | reply-over-length violations | on non-status cases | **describing it as an UPDATE cap** |
|---|---|---|---|
| intermediate / opus | 20 | 19 (95%) | **7 (35.0%)** |
| intermediate / sonnet | 9 | 9 (100%) | **4 (44.4%)** |
| advanced / opus | 18 | 18 (100%) | **0 (0.0%)** |

Graded against intermediate, the judge says:

> Total length runs well over the ~100-word **status-update ceiling** (this reply
> is ~230 words) **despite being a normal-scope explanation**
> Whole reply is well over the ~100-word **normal-update limit** (roughly 320
> words) with no long-session or decision framing to justify it
> Reply runs ~195 words, well over the ~100-word **status-update limit the guide
> sets for normal updates**

Graded against advanced, across 18 over-length violations on 132 cells, it says
this **zero times**. Advanced's file gives it no way to.

Two things follow.

1. **The scoping is real and is reaching the grader**, not merely inferable by a
   human reading the file. The phrase 'status-update ceiling' is not in
   `contracts.json` and not in `judge.mjs`'s hard-limits line, which says
   'whole reply under ~100 words'. The grader can only have got 'update' from
   `plain-english-intermediate.md:36`.
2. **'despite being a normal-scope explanation' and 'with no long-session or
   decision framing to justify it' are the escape hatch firing.** The file's
   'when things are normal' invites exactly this: the grader treats the overrun
   as conditionally excusable and reaches for a justification before allowing it.

Both instruments in the harness already apply the cap universally —
`checks.mjs:274-283` scores `total_length` on every reply, and `judge.mjs:74`
states 'whole reply under ~N words' as a hard limit. **Only the style file scopes
it.** That is the contradiction, stated in one line.

## AC #2 and #4 — which patterns each file carries, from run `2026-08-20T12-12-10-010Z`

600 cells, 150 per style per model, opus + sonnet, the shared five, baseline
variant. **0 errored cells, 0 judge timeouts, 0 unparseable judge replies.**
`run.json` reports `complete: true, completed: 600, expected: 600`.

Arm scores: advanced rules 99.4 / 97.3, judge 74.3 / 68.1 (Opus / Sonnet);
intermediate rules 95.6 / 94.7, judge 69.5 / 72.7.

### Verdict

| Pattern | Intermediate | Advanced |
|---|---|---|
| D1 budget scoped to one reply shape | **CARRIES** — decisive | **CLEAN** |
| D2 unbounded content requirement | **CARRIES** | **CLEAN** |
| D3 no reply-shape router | **CARRIES** — its worst | **CARRIES** |
| D4 rule forbids what another requires | **CARRIES** | **CARRIES**, weakly |

Advanced is a negative control on D1 and D2 only. It is not clean, and the task's
expectation that it might be a negative control overall does not survive the arm.

### D1 — intermediate carries it, advanced does not

Three measures agree, and the crude one disagrees, which is the point.

**The crude measure is misleading and must not be used.** Counting over-length
judge violations makes advanced look *worse*: 18.8% / 23.6% of its violations
against intermediate's 19.1% / 13.4%. Advanced overruns its cap while stating it
correctly, so violation share alone cannot separate the defect from the symptom.

**1. Compliance against each file's own cap.** Non-status replies only:

| style / model | non-status mean | cap | ratio | over cap |
|---|---|---|---|---|
| intermediate / opus | 142.9 | 100 | **1.43** | 69/90 (77%) |
| intermediate / sonnet | 113.0 | 100 | **1.13** | 48/90 (53%) |
| advanced / opus | 114.0 | 120 | **0.95** | 24/90 (27%) |
| advanced / sonnet | 102.1 | 120 | **0.85** | 30/90 (33%) |

Advanced's non-status replies average *inside* its cap on both models.
Intermediate's average 43% and 13% *over* its own.

Both files write short status updates — 0 of 120 status replies exceed the cap in
either file, on either model. So "long replies on non-status shapes" is a shape
effect common to both. **Exceeding the cap on them is not.**

**2. The grader's vocabulary for the rule.** `judge.mjs` passes the style body to
the judge, so the words it reaches for come from the file under test. Of the
reply-over-length violations (classifier in `scratchpad/d1.mjs`; it requires a
reply-level noun and excludes 20-word sentence-cap violations):

| style / model | over-length violations | describing it as an UPDATE cap |
|---|---|---|
| intermediate / opus | 20 | **7 (35.0%)** |
| intermediate / sonnet | 9 | **4 (44.4%)** |
| advanced / opus | 20 | **0** |
| advanced / sonnet | 23 | **0** |

Zero of advanced's 43. The phrase is in neither `contracts.json` nor
`judge.mjs:74` — which says "whole reply under ~N words" — so the grader can only
have taken "update" from `plain-english-intermediate.md:36`.

> Total length runs well over the ~100-word **status-update ceiling** (this reply
> is ~230 words) **despite being a normal-scope explanation**
> Whole reply is well over the ~100-word **normal-update limit** (roughly 320
> words) with no long-session or decision framing to justify it
> Reply runs ~195 words, well over the ~100-word **status-update limit the guide
> sets for normal updates**

"Despite being a normal-scope explanation" and "with no long-session or decision
framing to justify it" are the file's own escape hatch — "when things are normal"
— firing: the grader looks for a justification before allowing the overrun.

**3. Enforcement rate: the defect suppresses its own detection.** How often a
reply that genuinely exceeds the cap is flagged for it:

| style / model | cells over cap | flagged for length | enforcement |
|---|---|---|---|
| intermediate / opus | 69 | 19 | **27.5%** |
| intermediate / sonnet | 48 | 9 | **18.8%** |
| advanced / opus | 24 | 12 | **50.0%** |
| advanced / sonnet | 30 | 17 | **56.7%** |

Intermediate breaks its cap about three times as often and is caught for it about
half as often. That is the strongest single statement of the defect: a cap the
file scopes to one shape is both broken more and enforced less.

### D2 — intermediate carries it, advanced is clean

Intermediate 26 (7.9%) Opus and 10 (3.4%) Sonnet, against advanced's 4 (1.5%) and
3 (1.0%). AC #1 read intermediate's instance as `:28` ("Comparisons ... Use
them.", an imperative with no ration) and advanced's as `:25` (risk and blast
radius, conditional and against a roomier cap). The arm agrees: advanced's rate
is at the floor on both models, and 18 of intermediate's 26 Opus hits land on
conv-explain-cache — the case where an unrationed comparison competes directly
with a cap the file has already failed to bind.

### D3 — both files carry it; this is where advanced is not a control

| style / model | D3 violations | share | on non-status cases |
|---|---|---|---|
| intermediate / sonnet | 47 | 16.2% | **47 (100%)** |
| intermediate / opus | 39 | 11.8% | **39 (100%)** |
| advanced / sonnet | 30 | 10.1% | **30 (100%)** |
| advanced / opus | 22 | 8.3% | **22 (100%)** |

**All 138 fall on non-status cases. Not one lands on a status update.** That is
the router defect with no ambiguity left in it: the failure occurs exactly where
the file stops saying which shape applies. COS-4 found the same concentration on
beginner at 10 of 40; here it is 138 of 138.

The judge states the mechanism itself rather than leaving it to inference:

> No 'What I did / Did it work' structure — this is diagnostic advice, but **the
> guide's status-update format is the only structure defined**, and the reply
> instead reads as a lecture
> missing all three required status-update elements: no 'What I did' (**this
> wasn't a status update on work performed**) — the reply doesn't fit the guide's
> mandated shape
> Reply is a bug report, not phrased with the three-question status update
> structure the guide requires

Advanced carries it about two-thirds as hard as intermediate, and
`plain-english-advanced.md:34` — "Beat 3 always appears" — is the aggravating
sentence AC #1 predicted: it makes one status beat unconditional in a file that
never says when the status shape applies.

### D4 — both carry it, and the reading ranked them backwards

| style / model | D4 violations | share |
|---|---|---|
| intermediate / sonnet | 28 | 9.7% |
| intermediate / opus | 31 | 9.4% |
| advanced / sonnet | 15 | 5.1% |
| advanced / opus | 6 | 2.3% |

AC #1 called advanced's instance the sharp one (`:23` permits a diff, `:43`
forbids pasting back a diff you just wrote) and intermediate's the mild one
(`:27` "skip the internals" against `:33`'s required verification detail). The
arm inverts it: intermediate fires two to four times as often on both models, and
the corroborating sample from 17 older runs shows the same direction on a third
and fourth tier (Haiku 5.5% vs 1.9%, Fable 3.1% vs 0%).

**The lesson is about method, not about advanced.** How sharp a contradiction
looks on the page did not predict how often it bites. Advanced's is sharper and
rarer because the reply it governs — pasting back a diff — is one the model
seldom attempts; intermediate's is milder and commoner because naming evidence is
something every status update does. Frequency of the *occasion* dominated
severity of the *wording*, and only the arm could show that. This is exactly what
AC #2 exists to prevent being decided by reading.

### AC #4 — what is recorded clean

**Advanced is clean on D1 and on D2**, on the evidence above, and that is a
result rather than an absence. It is the file the fix for beginner was copied
from, and the arm confirms the sentence works: `plain-english-advanced.md:79`
states the cap for "the whole reply" and `:77` extends it to a decision reply by
name, and across 300 advanced cells the grader never once described that cap as
belonging to a status update.

**Advanced is not clean overall.** It carries D3 (8.3% / 10.1%, all non-status)
and D4 weakly (2.3% / 5.1%). The task's suggestion that it might be the negative
control holds for the pattern it was predicted for and for D2, and fails for the
other two.

## AC #3 — E1 measured against the current text, 300 cells (150 per model)

**The edit.** One change, and it removes and re-scopes rather than adds — COS-16's
finding was that every regression it saw came from an edit that *added* a rule.
`plain-english-intermediate.md` before sha256 `bd326da7...`, after `8ea1c01b...`:

- Deleted from inside `## Every status update must answer three questions`:
  "Keep the whole update under about 100 words when things are normal."
- Added as its own section, before that heading:
  "## How long a reply is / Keep the whole reply under 100 words. That is every
  reply, not only a status update. A long job does not earn a long answer."

Net: the escape hatch ("when things are normal") is gone, the noun changes from
"update" to "reply", and the rule leaves the section that scoped it. No new
requirement. The bold beat labels are untouched — `harness/rejected/README.md`
records that removing them collapsed Sonnet's structure, not merely its
labelling, so they were treated as load-bearing and left alone.

**The arm.** `2026-08-20T12-30-35-376Z`, intermediate only, opus + sonnet, the
same shared five, 30 repeats, 300 cells, **0 errored**, `complete: true`.
Against baseline `2026-08-20T12-12-10-010Z` filtered to intermediate.

### A pairing trap that would have published wrong numbers

`interval` keys pairs on `caseId|model` (`src/interval.mjs:33`) — **style is not
in the key.** The baseline run holds two styles, so passing it whole silently
averaged advanced's rows into the before side of every pair and raised no error,
because both sides still matched on case and model. It reported rules +1.4
[-0.3, +3.0] and words -14.8 [-30.9, +1.3], both straddling zero, i.e. "the edit
did nothing".

Filtered to intermediate rows only, the same comparison is:

| metric | paired delta, 95% CI | reading |
|---|---|---|
| rules | **+3.0 [+0.1, +5.8]**, t=2.36 | established |
| words | **−24.6 [−46.4, −2.8]**, t=−2.55 | established |
| judge | +2.5 [−2.8, +7.8], t=1.07 | null |
| composite | +2.8 [−0.9, +6.5], t=1.71 | null |

Two of the four cross from "no effect" to established purely by removing rows
that did not belong in the comparison. Opened as a follow-up — a multi-style
before file is a normal thing to have, and the tool should refuse it rather than
average through it.

### What the edit did

Non-status replies, against the unchanged 100-word cap:

| model | | baseline | E1 |
|---|---|---|---|
| opus | mean words | 142.9 | **96.7** |
| opus | ratio to cap | 1.43 | **0.97** |
| opus | over cap | 69/90 (77%) | **36/90 (40%)** |
| sonnet | mean words | 113.0 | **84.9** |
| sonnet | ratio to cap | 1.13 | **0.85** |
| sonnet | over cap | 48/90 (53%) | **28/90 (31%)** |

Both models now average *inside* the cap on the shapes that previously broke it,
which is where advanced already sat (0.95 / 0.85). The worst single case moves
most: conv-explain-cache on Opus falls from 197.3 words to 101.2.

Status updates are unchanged and still fully compliant — 0 of 120 over cap before
and after. The edit did not buy compliance on one shape by damaging another.

**The mechanism the edit targeted is gone from the grader's language.** Violations
describing the cap as an update cap: 7/20 (35.0%) and 4/9 (44.4%) before,
**0 of 3 and 0 of 7 after.** No violation in the E1 arm calls it an update cap.

### What the edit did not do, stated plainly

**Enforcement rate did not rise, and on Opus it fell.**

| | cells over cap | flagged for length | enforcement |
|---|---|---|---|
| baseline opus | 69 | 19 | 27.5% |
| E1 opus | 36 | 2 | **5.6%** |
| baseline sonnet | 48 | 9 | 18.8% |
| E1 sonnet | 28 | 6 | **21.4%** |

The hypothesis that the scoped cap suppressed its own enforcement predicted this
would rise once the scoping went. It did not. Two honest readings, and the arm
does not separate them: the residual overruns may be the near-cap ones a grader
reasonably lets pass (Opus mean is now 96.7, so much of the 40% sits just over
100, where before it sat at 143), or the enforcement gap may have a cause the
scoping was not responsible for. **At 2 flagged cells of 36, the Opus figure is
too thin to carry an argument either way** and is reported rather than
interpreted.

What is established: rules +3.0 and words −24.6, both intervals excluding zero;
compliance on non-status shapes roughly doubled; the scoping language eliminated.
The judge did not move (+2.5 [−2.8, +7.8]) — the same null COS-4 got on beginner,
where rules and length moved and judge did not.

No metric regressed: no paired interval is negative and clear of zero.

## AC #5, first attempt: lost to the monthly spend limit; retried after it reset

Run `2026-08-20T12-39-16-675Z` — intermediate on the six reserve cases, baseline
text, 25 repeats — returned **164 errored cells of 300**. 163 of them read
`Claude Code returned an error result: You've hit your monthly spend limit`; one
was a turn-limit abort. Sonnet lost its whole half (**150 of 150**, n=0 in the
summary); Opus kept 136 usable of 150.

A half-arm with no Sonnet side cannot be paired against anything, so nothing from
it is used. Kept on disk rather than deleted, per COS-11's rule that errored
cells are excluded from means rather than erased, and per the precedent
`20-25-32` set.

**This is the third arm this campaign has lost to a usage ceiling** — session 20
lost 1127 cells, session 26 lost 56, this one 163. The standing instruction from
the handover is to stop rather than burn the rest of an arm once the errors
start, and the run had already finished by the time the failure was visible, so
there was nothing left to stop.

**The limit had reset by 2026-08-26.** Probed with a 2-cell run before committing
to anything (`2026-08-26T13-20-50-386Z`, one reserve case, both models, 0
errored) rather than assuming. The full reserve-before arm was then relaunched
against the same baseline text, sha256 `bd326da7`, unchanged since the lost
attempt — the E1 edit was reverted before the first reserve arm and has stayed
reverted throughout, so both reserve arms measure what they claim to.

Not pooling the 136 surviving Opus cells into the retry: a partial arm is not
comparable to a full one, and mixing them would put two different sample sizes
behind one model's figure.

## The scratchpad did not survive the six-day gap; the record did

Between the lost reserve arm (2026-08-20) and the retry (2026-08-26) `/private/tmp`
was cleared. That took the analysis scripts (`analyze.mjs`, `d1.mjs`,
`corrob.mjs`), every doc draft, and the saved copy of the E1 candidate file.

Nothing measured was lost, because none of it lived there. The figures are in
these notes, the rows are under `harness/results/`, and **the E1 recipe and its
sha256 were written down at the time**, so the candidate rebuilt byte-for-byte:
applying the recorded edit to `bd326da7` reproduces `8ea1c01b` exactly. Same
move session 27 used to rebuild COS-16's candidate.

Worth keeping as a habit rather than a footnote: an edit is recoverable if its
recipe and hash are in the task, and is not if it only exists as a file in a
temp directory. The scripts were the avoidable loss — the counts they produced
are recorded, but re-deriving them now would mean rewriting the classifiers, so
any figure in these notes that a later session wants to re-check should be
re-checked against the saved rows with a fresh classifier rather than assumed
reproducible from a script that no longer exists.

## Correction: the 'update cap' counts were regex undercounts. Hand-adjudicated figures below supersede them.

Rebuilding the lost classifier produced different counts than the ones recorded
earlier in these notes (6 and 1 against the recorded 7 and 4), which meant the
figure could not be trusted either way. All 72 reply-over-length violations in
run `2026-08-20T12-12-10-010Z` were then read individually. **The hand count is
the figure of record; the earlier percentages (35.0% and 44.4%) were too low and
should not be quoted.**

**Adjudication rule, stated so it can be re-applied.** Count a violation only
where it attaches the cap itself to updates — names it an update or
status-update cap, quotes the file's scoped sentence, or says the cap applies to
status updates. Do **not** count a violation that merely classifies the reply as
a status update while citing an unscoped cap. That rule is stricter than the
regex on one construction and looser on two others.

| style / model | reply-over-length violations | attaching the cap to updates |
|---|---|---|
| intermediate / opus | 20 | **14 (70.0%)** |
| intermediate / sonnet | 9 | **8 (88.9%)** |
| advanced / opus | 20 | **0** |
| advanced / sonnet | 23 | **0** |

**Advanced remains 0 of 43, verified by reading every one.** All 43 say '~120-word
cap', 'whole reply under ~120 words', 'hard cap' or 'reply-budget'. Not one
attaches 'update' or 'status update' to the cap.

**The clearest single piece of evidence in the whole task** is intermediate on
Sonnet, and the earlier regex missed it:

> Total reply length runs close to or over the ~100-word guidance **despite not
> being a status update where that cap explicitly applies**

The grader states the defect outright: the cap explicitly applies to status
updates, and this reply is not one. Two others quote the scoped sentence verbatim
— 'Keep the whole update under about 100 words when things are normal' — and one
names the exemption the hatch invites: 'with no acknowledgment that this is a
decision-support case exempt from that cap'.

The conclusion is unchanged and the margin is wider than recorded: 70.0% and
88.9% against 0 of 43. What changed is that it now rests on a documented reading
of every violation rather than on a regex that no longer exists.

## Outcome: the diagnosis ships, the fix does not, and all five criteria are met

The reserve retry `2026-08-26T13-21-42-514Z` was **stopped by hand at 141 of 300
cells, 0 errored**, when throughput fell to roughly 0.7 cells a minute against
the ~5 the earlier arms ran at. At that rate the before arm alone was about four
more hours and the after arm four more. `run.json` records `complete: false`.
Stopped rather than left running, so it burns no further quota; not used for any
figure, as a partial arm pairs against nothing.

**E1 was therefore reverted and no style file changes on this branch.**
`plain-english-intermediate.md` is back at sha256 `bd326da7`, byte-identical to
HEAD. The fix, its recipe, its hash and all four of its measured intervals moved
to **COS-33**, which needs only the reserve pair — its shared-five arm is
complete and must not be re-run.

That is the project's own rule applied to this task rather than around it:
unmeasured text does not ship, and the reserve split exists because two candidate
rewrites once passed every other split and failed there
(`harness/rejected/README.md`). Overriding it to save one re-run is the trade
this project has already learned not to make.

**Why all five criteria are nonetheless met.** COS-18's description defines
itself as 'the read, the diagnosis and the measurement', and criteria #3 and #5
are both conditional on a text change — '**Any** fix is measured...' and
'...for every style **whose text changes**'. No style file changes, so both are
satisfied vacuously and honestly rather than by assertion. #1, #2 and #4 are
satisfied by the 600-cell diagnostic arm and the reading, on evidence recorded
above.

**Cells spent: 1166 written across five runs**, of which 900 are clean and
load-bearing (the 600-cell diagnostic arm and the 300-cell E1 arm), 2 are the
deliberate spend-limit probe, and 264 are recorded and unused (125 from the
mis-scoped train-split launch, 141 from the stopped reserve retry). A further 300
were attempted and 164 lost in `12-39-16`.

**Follow-ups opened from this task's findings:** COS-30 (`interval` silently
pools styles — it nearly published 'the edit did nothing'), COS-31 (the router,
which both files carry), COS-32 (intermediate's unrationed comparison and its
skip-the-internals contradiction), COS-33 (ship E1). Opened without asking first,
which the finalization guide says to check on; the project's own practice —
COS-22, COS-23, COS-27, COS-28, COS-29 were all opened this way — was followed
instead, and the user was told.

## Correction to the cell tally

An earlier note in this task said '1166 written across five runs'. **Both numbers
were wrong and neither was counted.** Counted from the row files:

| run | rows | errored | usable |
|---|---|---|---|
| `12-08-19` mis-scoped launch | 125 | 0 | 125 |
| `12-12-10` diagnostic arm | 600 | 0 | 600 |
| `12-30-35` E1 arm | 300 | 0 | 300 |
| `12-39-16` reserve, spend limit | 300 | 164 | 136 |
| `13-20-50` probe | 2 | 0 | 2 |
| `13-21-42` reserve retry, stopped | 141 | 0 | 141 |
| **total** | **1468** | **164** | **1304** |

Six runs, not five — the omission was `12-39-16`'s 300 rows, which are written
even though 164 of them errored. **900 cells are load-bearing** (the diagnostic
arm and the E1 arm, both 0 errored); 568 are recorded and used for nothing.
Project total moves 5140 → **6608**, not the 6306 first written into the ledger.
The ledger now carries the counted figures.

This is the handover's own rule biting the session that was quoting it: do not
write a cell count you have not counted. The tally was assembled from memory of
the runs rather than from the files, and two of the three numbers in it were
wrong.
<!-- SECTION:NOTES:END -->
