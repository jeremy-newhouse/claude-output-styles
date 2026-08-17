---
id: COS-14
title: Give matrix.improve its own model list
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 14:05'
labels:
  - 'doc:stories/harden-the-optimizer-loop'
dependencies: []
references:
  - harness/config/matrix.json
  - harness/src/improve.mjs
  - harness/README.md
documentation:
  - docs/stories/harden-the-optimizer-loop.md
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`matrix.models` is the default for both `run` and `improve`. `harness/README.md`'s own quick-start line is `improve --styles=… --iterations=4` with no `--models`, so any model added to that list is billed on every iteration of every optimizer loop run the documented way.

COS-7 worked around this by deliberately keeping Fable out of `matrix.models` — the top tier costs $0.2345 a baseline cell and $0.9681 on a write-then-verify agentic case, with a worst single cell of $1.1315. That workaround documents the footgun instead of removing it, and it means the most capable tier cannot be added to the default matrix even for plain `run` invocations where it would be wanted.

Giving `matrix.improve` its own `models` key removes the coupling and makes the top tier safe to add.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 matrix.improve carries its own models list, and improve uses it rather than falling back to run's
- [x] #2 Omitting the key is not a silent inheritance — the behaviour when it is absent is explicit and tested, the way COS-8 handled a missing minReserveDelta
- [x] #3 harness/README.md's quick-start invocation is safe to copy without --models
- [x] #4 Config tests cover the new key, following the precedent in harness/test/config.test.mjs
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add DEFAULT_IMPROVE_MODELS and an exported resolveImproveModels({cliModels, cfg, log}) to harness/src/improve.mjs, beside DEFAULT_MIN_RESERVE_DELTA. Precedence: explicit --models > matrix.improve.models > warn + named default. It never receives matrix.models, so inheriting run's list is structurally impossible, not merely avoided.
2. cli.mjs improve branch calls it and passes the result to improveStyle; the run branch keeps using the shared resolution at cli.mjs:68 unchanged.
3. matrix.json: add improve.models set to the three models improve bills today (opus, sonnet, haiku), so the decoupling changes cost/behaviour by nothing. Rewrite the //models comment: drop the 'default for improve too' workaround warning it exists to carry, keep the fable pricing figures and the quoted-id invocation tip. Add a //improve line naming the new key.
4. usage.mjs: the improve line omits --models today, which now reads as 'improve has no model flag'. Add it.
5. Tests. improve.test.mjs covers the resolver directly (CLI wins over cfg; cfg used when no flag; absent key warns and returns the default; an empty array is treated as absent). config.test.mjs asserts improve.models is a non-empty string array and — the cheap proof for AC #3 — that resolving with no --models against the real matrix returns exactly matrix.improve.models. No improve run: six optimizer rewrites have already failed and the AC does not need one.
6. README.md: fix the models bullet, which currently states the coupling as fact, and mark the quick-start improve line with what it now bills.
7. Gates: npm --prefix harness test, node src/cli.mjs audit exit 0, LORE_BACKLOG_TIMEOUT_MS=120000 lore sync then lore check exit 0.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in harness/src/improve.mjs (resolveImproveModels + DEFAULT_IMPROVE_MODELS), wired at harness/src/cli.mjs:112-121, config key added at harness/config/matrix.json improve.models.

Design decision, recorded because it was the awkward part: cli.mjs:68 resolves one model array before the subcommand branch and both paths used it. Rather than move that line, improve now re-resolves its own list inside its branch, so run keeps reading matrix.models unchanged. resolveImproveModels is never passed matrix.models at all — inheriting run's list is structurally impossible in the new code, not merely avoided by a convention a later change could break.

Precedence, deliberate: explicit --models > matrix.improve.models > DEFAULT_IMPROVE_MODELS with a warning. --models wins because aiming a single loop at one tier must not require editing a config file shared with everyone else. The absent-key default is ['haiku'] and only haiku: an absent key has to fail cheap, and haiku is $0.0232 a baseline cell against opus $0.1493 and fable $0.2345, on a list billed once per candidate per iteration. An empty array is treated as absent rather than as zero models, which would otherwise be a silent no-op loop that still pays the author model for rewrites.

matrix.improve.models is set to opus,sonnet,haiku — exactly what improve billed before — so the decoupling changes cost and behaviour by nothing on its own.

Verification, all at $0 spend:
- npm --prefix harness test: 122/122 (117 before, 5 added).
- node src/cli.mjs improve --styles=plain-english-advanced --cases=__none__ --iterations=0 printed 'models: opus,sonnet,haiku (matrix.improve.models)' and 'total spend $0 across 0 saved cells'. Zero cases means the baseline is unmeasurable, so the loop stops before buying a candidate — that is what makes the end-to-end wiring check free.
- Same command with --models=haiku printed 'models: haiku (--models)'.
- node src/cli.mjs run --styles=plain-english-advanced --cases=__none__ still printed '3 models', so run's path is untouched.
- node src/cli.mjs audit exit 0.

No improve run was bought. Every AC is about which list is read, not about what the loop produces from it.

AC evidence.

#1 — Ran the two subcommands with the two lists deliberately divergent (improve.models temporarily ['haiku'], matrix.models still opus,sonnet,haiku): improve printed 'models: haiku (matrix.improve.models)' and run printed '3 models' in the same session. Config restored afterwards. Unit test 'improve reads its own model list, not the matrix-wide one'.

#2 — 'a config missing improve.models warns and uses the named default' asserts the warning text and DEFAULT_IMPROVE_MODELS, deleting the key from a config the way harness/test/improve.test.mjs:430 deletes minReserveDelta. 'an empty improve.models is treated as absent, not as zero models' covers the [] case that the ?? shape of the COS-8 precedent would have missed. Both green.

#3 — 'improve carries its own model list, and it is what the loop resolves' (config.test.mjs) asserts resolveImproveModels with no --models against the real matrix.improve returns exactly matrix.improve.models, and follows it to ['haiku'] when the key changes — so the README line's cost is set by the improve block alone. The live run under #1 is the same claim end-to-end. README.md's models bullet and improve-loop section were rewritten; the old text stated the coupling as fact.

#4 — The new config.test.mjs case asserts improve.models is a non-empty array of non-empty strings, alongside the existing improve assertions at line 70.

Gates: npm --prefix harness test 122/122; node src/cli.mjs audit exit 0. Total spend this task $0.

Branch review (/code-review high, dev...HEAD) found four issues. All four fixed on the branch before the PR was opened; none changed the design.

1. MEDIUM — an empty `--models=` was swallowed. `pick` turns it into [], which the resolver read as 'no flag' and fell through to matrix.improve.models, printing a log line naming the config as the source: byte-identical output to passing no flag at all. `--models="$CHEAP"` with CHEAP unset would buy the full three-model loop while the operator was asking to narrow it. Now an error. A bare `--models` (no =) parsed to boolean true and would have measured a model literally named 'true'; cli.mjs converts it to the same empty case, so it errors too. Verified live: both forms exit 1 with the message, `--models=haiku` still prints 'models: haiku (--models)'. NOTE: `run` still accepts a bare `--models` this way — pre-existing, untouched here because fixing it means changing the shared `pick`, which also governs --styles, --variants and --cases. Flagged for the user rather than silently expanded into this task.

2. LOW — a malformed improve.models was reported as an absent one. `"models": "opus"` is a plausible JSON typo, and the warning said 'is not set' while the reader was looking straight at the key, with the loop measuring haiku instead. The warning now distinguishes absent from present-but-unusable and quotes what it found. A list containing a non-string is treated the same way.

3. LOW — the new budgeting comment in matrix.json understated the loop's billed work: '3 models x 6 iterations is 18 measured arms'. An arm is one split measured once, and the loop buys two for the baseline, two per iteration (improve.mjs:306-307) and two more at the reserve gate (improve.mjs:381-382) — 16 at maxIterations 6, 14 before the gate. Corrected there and in the same halving repeated in harness/README.md. This is the file whose job is to let a reader budget a paid loop.

4. LOW — assert.ok(!('fallback' in resolveImproveModels)) could never fail: `in` on a function object finds nothing named 'fallback' whatever the implementation does, so a test presented as the guarantee against inheriting run's list asserted nothing. Replaced with a resolution against a cfg carrying a run-shaped list under another name, which returns the default — the same claim, actually tested.

Suite 122 -> 124; audit exit 0.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
improve now bills matrix.improve.models instead of matrix.models. cli.mjs resolved one model array before the subcommand branch and handed it to both paths, so every model added for run was also billed once per candidate per optimizer iteration — the coupling COS-7 worked around by keeping Fable out of the default matrix. resolveImproveModels (harness/src/improve.mjs) is never passed run's list, so the inheritance is impossible rather than merely avoided; precedence is --models > matrix.improve.models > a named ['haiku'] default with a warning, the shape COS-8 used for a missing minReserveDelta. improve.models is set to the three models improve already billed, so nothing about cost or behaviour moves on its own.

Verified at $0: with the two lists deliberately divergent, improve printed 'models: haiku (matrix.improve.models)' while run printed '3 models' in the same session; npm --prefix harness test 122/122 including five new cases (CLI override, config list, absent key warns to the default, empty array treated as absent, and the real config resolving to its own list); audit exit 0. No improve run was bought — every criterion is about which list is read.
<!-- SECTION:FINAL_SUMMARY:END -->
