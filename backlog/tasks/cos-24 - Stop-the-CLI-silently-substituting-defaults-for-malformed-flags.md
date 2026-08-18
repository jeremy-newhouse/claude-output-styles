---
id: COS-24
title: Stop the CLI silently substituting defaults for malformed flags
status: Done
assignee:
  - '@claude'
created_date: '2026-08-17 14:13'
updated_date: '2026-08-18 15:13'
labels:
  - 'doc:stories/make-the-measurements-trustworthy'
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
- [x] #1 An unrecognised flag name stops the CLI with a message naming it, before any cell is measured — run --modles=haiku must not run the default matrix
- [x] #2 A flag written with no =value is an error naming the flag on every subcommand that reads it, rather than the boolean true that today becomes a model named "true", a repeats of 1, or a variant list matching nothing
- [x] #3 A numeric flag whose value is not a number is an error rather than NaN — run --repeats=abc must not silently measure zero cells, and improve --iterations=abc must not buy the baseline arms and then report adopted v0 as if it had iterated
- [x] #4 A list flag whose values match nothing stops the CLI and names the unmatched values, for --variants and --cases on both run and improve, including improve's variants[0] ?? matrix.variants[0] fallback which today substitutes baseline in silence
- [x] #5 improve given more than one variant says so rather than silently using the first
- [x] #6 score --rows with no value fails with a CLI message rather than a raw Node TypeError stack
- [x] #7 --help and -h still short-circuit before any of the new validation, so run --help prints usage, exits 0 and creates no results directory — the COS-5 guard in harness/test/usage.test.mjs still passes
- [x] #8 run --concurrency=abc measures nothing and dies in summarize with a null-property error naming neither the flag nor concurrency; a non-numeric concurrency must be rejected by name before any cell is launched
- [x] #9 A boolean flag rejects a value rather than reading it as truth — run --no-judge=false currently turns the judge off, dropping the 30% judge component from figures that are then quoted alongside runs that kept it
- [x] #10 Every case in the description is exercised through the CLI itself, in the manner of harness/test/usage.test.mjs, since nothing imports cli.mjs and a unit test cannot reach this code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. In harness/src/cli.mjs, add a flag registry: FLAGS[cmd] (allowed flag names
   per subcommand: run, improve, score, judge, audit, interval) and FLAG_TYPES
   (flag name -> 'list' | 'number' | 'boolean' | 'value', shared across
   commands since a flag name means the same thing everywhere it appears).
2. Add validateFlags(cmd, args): for every parsed key except _/help/h, reject
   unknown flags for the command (AC1); reject boolean flags that carry a
   value, e.g. --no-judge=false (AC9); reject non-boolean flags with no value,
   e.g. bare --models/--repeats/--rows (AC2, AC6 as a side effect since
   resolve(args.rows) is never reached with args.rows===true). Call this
   immediately after the existing wantsHelp() early-return and before matrix/
   contracts/allCases are read, so --help still short-circuits first (AC7) and
   unknown-flag/shape errors fire before any config read or cell.
3. Add num(key, raw, fallback): raw===undefined -> fallback; else Number(raw),
   throw naming the flag if not finite. Use it for repeats, concurrency
   (opts, shared by run+improve), improve's iterations, and judge's
   judge-repeats. Covers AC3 and AC8.
4. Add matchList(key, raw, known): raw===undefined -> null (caller applies its
   own default); else split/trim/filter, throw if the resulting list is empty
   or if any entry is not in `known`, naming the unmatched entries. Use it to
   replace the current pick()-based resolution of --variants and --cases
   (top-level, consumed only by run/improve) — NOT --styles or --models,
   which stay open-ended/pre-existing behavior, and NOT judge's own separate
   --cases resolution (judge is outside AC4's stated scope). Covers AC4.
5. In the improve branch: after variants resolve, throw if variants.length>1,
   naming the matched ids and pointing at --variants=<one-id> (AC5). Drop the
   now-unreachable `variants[0] ?? matrix.variants[0]` fallback (matchList
   plus the new check guarantee exactly one). Simplify resolveImproveModels's
   cliModels ternary (args.models===true ? [] : models) to drop the dead
   ===true branch, since validateFlags already rejects a bare --models before
   this line runs, and update the comment above it that currently describes
   the now-impossible case.
6. Extend harness/test/usage.test.mjs (CLI-level, execFileSync, per the task's
   own note that nothing imports cli.mjs) with one assertion per AC1-9 failure
   mode from the task description, each run with --cases naming a real case
   id (or omitted) so nothing is measured before the validation throws, plus
   confirming no results/ directory is created and a non-zero exit. Re-verify
   the existing AC7 test still passes unmodified. Covers AC10.
7. npm --prefix harness test green; re-run the AC7 regression specifically
   after every validation change per the task's own warning.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented via three additions to cli.mjs, all evaluated before any cell measurement:
1. validateFlags(cmd, args) — per-subcommand flag allowlist + per-flag type
   (list/number/boolean/value), run right after the existing wantsHelp()
   guard, before matrix/contracts/cases are even read. Rejects an unknown
   flag by name, a value-taking flag given no value, and a boolean flag
   (--no-judge) given one.
2. num(key, raw, fallback) — Number(raw), throwing by name if not finite.
   Replaces the bare Number(args.repeats ?? ...) at opts construction, plus
   improve's --iterations and judge's --judge-repeats.
3. matchList(key, raw, known) — comma-split against a known id list, throwing
   by name on any unmatched entry or an entirely empty list. Replaces the
   pick()-based resolution of --variants and --cases specifically (not
   --styles/--models, which stay open-ended/pre-existing; not judge's own
   separate --cases filter, out of AC4's stated scope, though it now reuses
   the shared, already-validated result instead of re-parsing).

improve's variant count check is `args.variants !== undefined && variants.length > 1`,
not a bare length check: the default (no --variants flag) resolves to every
configured variant and improve has always silently used only the first of
those (effectively "baseline") — that is README's and npm run improve's
documented invocation. AC5's own wording ("passing two variants") is about an
explicit --variants naming more than one; a bare length>1 check would have
broken every currently-documented bare `improve` call. Verified live (backgrounded,
killed ~2s in) that a bare `improve --styles=plain-english-advanced` still
reaches resolveImproveModels and starts the baseline measurement rather than
throwing — this incurred a small, unintended, real API cost since the kill
came after the loop's first measurement log line, not before it; disclosed to
the user in the session report.

Verified each of the 10 ACs directly against the built CLI (--cases pointed at
a real case id where relevant, so nothing depends on the now-fixed AC4 case
match to reach the flag under test):
- run --modles=haiku -> `"run" does not take --modles`, exit 1, no results/ dir created
- run --models / --variants / --cases / --repeats / --concurrency (bare) -> `--<flag> needs a value`
- run --repeats=abc / --concurrency=abc -> `--<flag>=abc is not a number`
- run --no-judge=false -> `--no-judge does not take a value`
- run --variants=typo -> `--variants matches nothing: typo`; run --cases=typo -> `--cases matches nothing: typo`
- improve --variants=baseline,long-prompt -> `improve takes exactly one variant; matched 2 (baseline,long-prompt)`
- improve --iterations=abc -> `--iterations=abc is not a number`
- score --rows (bare) -> `--rows needs a value` (not ERR_INVALID_ARG_TYPE)
- run --help / improve --help still print usage and exit 0 even with a bad flag alongside them

Added 9 new CLI-level tests to harness/test/usage.test.mjs (execFileSync
against the built CLI, per the task's own note that nothing imports cli.mjs),
one per failure family above, plus the --help-still-wins regression. Full
suite: 195 -> 204, all passing (`npm --prefix harness test`).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Widened cli.mjs's shared pick()/parseArgs into validated flag parsing: an
unknown flag, a value-taking flag given no value, a boolean flag given a
value, a non-numeric repeats/concurrency/iterations/judge-repeats, and an
unmatched --variants/--cases entry now all throw a message naming the flag
before any config is fully resolved or any cell is measured, instead of
silently substituting true/NaN/an empty list/a wrong default. improve given
more than one explicit --variants now errors instead of silently using the
first (the pre-existing default of no --variants flag at all is unchanged,
since that is README's and npm run improve's documented invocation, not the
"passing two variants" bug AC5 describes). Verified all 10 ACs directly
against the built CLI, then locked each down with 9 new CLI-level tests in
harness/test/usage.test.mjs (execFileSync, since nothing imports cli.mjs).
Full suite 195 -> 204, all green.
<!-- SECTION:FINAL_SUMMARY:END -->
