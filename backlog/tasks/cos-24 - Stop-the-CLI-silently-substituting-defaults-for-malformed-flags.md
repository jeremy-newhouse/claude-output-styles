---
id: COS-24
title: Stop the CLI silently substituting defaults for malformed flags
status: To Do
assignee: []
created_date: '2026-08-17 14:13'
updated_date: '2026-08-17 14:14'
labels: []
dependencies: []
references:
  - harness/src/cli.mjs
  - harness/src/usage.mjs
  - harness/test/usage.test.mjs
documentation:
  - docs/stories/make-the-measurements-trustworthy.md
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`parseArgs` in `harness/src/cli.mjs` accepts any `--name` and `pick` accepts whatever follows it, so a mistyped or valueless flag does not stop the CLI — it changes what the run measures and says nothing. Every case below was verified in one session at $0, by forcing zero cells with `--cases=__none__` or by calling the affected function directly; the money risk is what the same invocations do with a real case set.

The most expensive one is the unknown flag. `node src/cli.mjs run --modles=haiku --styles=X` prints `3 models` and runs the full default matrix: the flag intended to narrow a paid run is dropped in silence, so the operator buys 5 variants x 3 models x the whole case set instead of the one arm they asked for. COS-5 and COS-7 both record cost accidents of exactly this shape.

Verified behaviour today, one line each:

- `run --modles=haiku` -> unrecognised flag ignored, `cells: 1 styles x 5 variants x 3 models`, the full default matrix.
- `run --models` (no `=`) -> `pick` sees boolean true and yields a model literally named `true`: `1 models`. Every cell then errors against a model that does not exist.
- `run --models=` -> `0 models`, so a paid command measures nothing and still writes a results directory.
- `run --repeats` (no `=`) -> `1 repeats` instead of the configured 2, halving the sample silently.
- `run --repeats=abc` -> `NaN repeats`, printed as `= NaN` cells. `evaluate.mjs:30` loops `r < opts.repeats`, which is false for NaN, so the run measures nothing.
- `run --concurrency=abc` -> the sharpest of them. `pool` (`run.mjs:137`) sizes its workers with `Math.min(limit, items.length)`, and `Array.from({ length: NaN })` is empty, so zero workers start and `Promise.all([])` resolves at once. Verified directly: `pool([1,2,3], NaN, fn)` returns `[null,null,null]` against `[2,4,6]` at limit 2. The run then dies inside `summarize` with `Cannot read properties of null (reading 'iteration')` — a message naming neither concurrency nor the flag — after measuring nothing.
- `run --no-judge=false` -> disables the judge. `cli.mjs:84` is `args['no-judge'] ? false : matrix.run.judge`, and the string `'false'` is truthy, so the flag written to keep the judge on turns it off. That silently drops the 30% judge component, and the resulting figures are not comparable with any other run in the project.
- `run --variants=typo` and `run --variants` -> `0 variants`, another silent zero-cell run. Nothing names the value that matched nothing.
- `improve --variants=typo` -> `cli.mjs:113` is `variants[0] ?? matrix.variants[0]`, so an unmatched name silently becomes `baseline` and the loop reports a verdict for a variant the operator never asked for. Passing two variants silently uses only the first.
- `improve --iterations=abc` -> `maxIterations` is NaN, `improve.mjs:298` loops `i <= NaN`, so the loop buys the baseline train and holdout arms — real spend across the whole model list — then prints `adopted v0` and a normal-looking verdict without ever having iterated.
- `score --rows` (no `=`) -> a raw Node `TypeError [ERR_INVALID_ARG_TYPE]` stack out of `path.resolve`, not a CLI message.

Two are already handled and set the precedent for the rest: `--styles=typo` throws `no contract for style "typo"` before anything is measured, and COS-14 made `improve --models=` and a bare `improve --models` errors rather than a silent fall-back to `matrix.improve.models`. That fix covered one flag on one subcommand because widening it meant changing the shared `pick`, which also governs `--styles`, `--variants` and `--cases`. This task is that widening.

Note for whoever takes this: nothing imports `cli.mjs` — importing it runs it — so these paths cannot be reached by a unit test. `harness/test/usage.test.mjs` already shells out with `execFileSync` and asserts that `run --help` creates no results directory; that is the working precedent for exercising the CLI without spending. The `--help` guard in `usage.mjs` must keep short-circuiting before any new validation, or COS-5's regression (`run --help` launching the whole matrix) comes back inverted as `run --help` failing on a flag it should never have parsed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An unrecognised flag name stops the CLI with a message naming it, before any cell is measured — run --modles=haiku must not run the default matrix
- [ ] #2 A flag written with no =value is an error naming the flag on every subcommand that reads it, rather than the boolean true that today becomes a model named "true", a repeats of 1, or a variant list matching nothing
- [ ] #3 A numeric flag whose value is not a number is an error rather than NaN — run --repeats=abc must not silently measure zero cells, and improve --iterations=abc must not buy the baseline arms and then report adopted v0 as if it had iterated
- [ ] #4 A list flag whose values match nothing stops the CLI and names the unmatched values, for --variants and --cases on both run and improve, including improve's variants[0] ?? matrix.variants[0] fallback which today substitutes baseline in silence
- [ ] #5 improve given more than one variant says so rather than silently using the first
- [ ] #6 score --rows with no value fails with a CLI message rather than a raw Node TypeError stack
- [ ] #7 --help and -h still short-circuit before any of the new validation, so run --help prints usage, exits 0 and creates no results directory — the COS-5 guard in harness/test/usage.test.mjs still passes
- [ ] #8 run --concurrency=abc measures nothing and dies in summarize with a null-property error naming neither the flag nor concurrency; a non-numeric concurrency must be rejected by name before any cell is launched
- [ ] #9 A boolean flag rejects a value rather than reading it as truth — run --no-judge=false currently turns the judge off, dropping the 30% judge component from figures that are then quoted alongside runs that kept it
- [ ] #10 Every case in the description is exercised through the CLI itself, in the manner of harness/test/usage.test.mjs, since nothing imports cli.mjs and a unit test cannot reach this code
<!-- AC:END -->
