# Rejected candidates

Style rewrites the optimizer produced that did NOT survive cross-model
validation. Kept for the record.

Both were authored by `improve --models=opus`, so the fitness function never saw
Sonnet. On Sonnet they scored better on the deterministic checks and worse with
the judge:

| style | rules | judge | net |
|---|---|---|---|
| beginner | 92.6 → 95.4 | 59.7 → 54.8 | +0.4 |
| intermediate | 93.8 → 94.9 | 77.3 → 65.0 | **−3.0** |

The intermediate rewrite's headline change was "Write the beats as prose, never
as bold labels." The labels turned out to be load-bearing: without them Sonnet
stopped producing the three beats at all, not just labelling them. The judge
caught it; the deterministic check did not, because keyword matching survives a
structural collapse.

## Round 2: cross-model fitness, still rejected

Re-run with `--models=opus,sonnet` and per-style judge weights. Both styles
produced candidates the loop kept on its own train and holdout splits:

| style | train | holdout |
|---|---|---|
| advanced | 0.888 → 0.914 | 0.905 → 0.957 |
| intermediate | 0.810 → 0.849 | 0.861 → 0.904 |

Then tested on four cases the optimizer had **never seen in any split** —
`conv-decision-db`, `conv-badnews`, `agentic-fix-verify`, `conv-decision-holdout`:

| style | opus | sonnet | mean |
|---|---|---|---|
| advanced, in use | 92.9 | 88.7 | **90.8** |
| advanced, candidate | 85.1 | 82.9 | 84.0 |
| intermediate, in use | 74.8 | 84.3 | **79.6** |
| intermediate, candidate | 80.1 | 80.3 | 80.2 |

The advanced candidate is 6.8 points worse out of sample. Rules stayed flat
(98.6/97.3 → 98.0/98.0) while the judge collapsed (79.5/68.8 → 55.0/47.5) — the
same trade every rejected candidate has made. The intermediate candidate is a
wash: it raised Opus and lowered Sonnet by about the same amount.

**Both rejected.** `plain-english-advanced.crossmodel-v2.md` and
`plain-english-intermediate.crossmodel-v2.md`.

### What this says about the method

A train/holdout split drawn from the same small case pool is not enough
protection. Both splits came from the same five cases and the same author, so a
rewrite could satisfy both and still degrade on genuinely unseen prompts. Hold
back cases the optimizer never sees in any split, and treat the loop's own
holdout as a tuning signal rather than a verdict.

That is no longer a manual discipline. `cases.json` carries a `reserve` split
the loop never selects, and `improve` measures the incumbent against the
candidate on it before presenting a winner — rolling back to v0 when the
candidate regresses. Both entries above would now be caught by the harness
itself rather than by a follow-up run. See the three-splits section of
`harness/README.md`.
