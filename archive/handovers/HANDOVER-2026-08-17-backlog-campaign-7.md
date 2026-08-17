# Handover — campaign 2, item 6: make `two_options_max` see prose option sprawl (COS-9)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `e1119c9`, clean apart from an untracked `system-prompt.md` that is **not ours**; pushed, with `main` fast-forwarded to match | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-9 — two_options_max counts only literal "option a/b/1/2"
labels, so a reply that walks through three or four alternatives in prose and
recommends one still scores 1.000. Queue order for campaign 2 confirmed by user
on 2026-08-17 ("Fix tools first, then everything"); do not re-ask. Risk policy:
record-and-park.

COS-9 should cost $0: re-scoring saved rows is free, and AC #3 is explicitly
"update every figure the change moves, or show it moves none". Do NOT run
improve on a style file — six optimizer rewrites across three styles have
failed and both remaining style tasks say so.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. `lore sync` needs
LORE_BACKLOG_TIMEOUT_MS=120000. Any change to harness/src/*.mjs needs matching
tests; any change to a style file or contracts.json must leave
`node src/cli.mjs audit` at exit 0.

Campaign 2 has NO BUDGET CEILING (user, 2026-08-17: "we have to get everything
tested - no budget"). Measurement issues require n >= 146 non-errored cells per
model.

Session 14 is fully pushed: dev, main, origin/dev and origin/main are all at
e1119c9. Preflight should be clean. The untracked system-prompt.md is NOT ours —
leave it alone, do not stash or commit it.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `e1119c9`, level with `origin/dev` |
| Push state | PR #14 merged as `cb638d4`; `dev`, `origin/dev`, `main`, `origin/main` all at `e1119c9` |
| Cursor issue | COS-9 — To Do, unassigned, no plan recorded, 3 ACs, no dependencies |
| Tracker | `doc-1`, cursor armed at COS-9, campaign 2 at **5 of 18** resolved |
| Feature branches | none, local or remote (`origin/feature/COS-14` pruned) |
| Open PRs | none. PRs #1–#14 all merged, all branches deleted |
| Campaign 1 spend | **$53.00** across eight sessions |
| Campaign 2 spend | **$0.5955** — COS-12 $0.1812, COS-10 $0.4143, COS-11 $0, COS-13 $0, COS-14 $0 |
| Test suite | **124/124** (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |

## What session 14 did, and the one thing worth carrying

COS-14 resolved, $0, all four ACs. `improve` bills `matrix.improve.models` now;
`run` keeps `matrix.models`. The design note is in the task and the tracker.

The transferable trick: **`improve --cases=__none__ --iterations=0` is a free
end-to-end check of the paid path.** Zero cases means the baseline arm measures
nothing, `best.train` is null, and the loop stops before buying a candidate — but
it has already reached and printed the model resolution. That is how the
decoupling was demonstrated on the real CLI rather than asserted from a unit
test: with `improve.models` temporarily set to `['haiku']` while `matrix.models`
still held three, `improve` printed `models: haiku (matrix.improve.models)` and
`run` printed `3 models` in the same session, for $0. Restore the config from a
copy afterwards, and verify with `git diff`.

The review found four things, all fixed before the PR (`b0014af`). The one worth
knowing about: **`--models=` was swallowed**. `pick` turns it into `[]`, which
read as "no flag" and billed the full configured list under a log line naming
the config as the source — output identical to passing no flag at all.
`--models="$CHEAP"` with `CHEAP` unset is the ordinary way to reach it. Now an
error, as is a bare `--models` (which parsed to a model literally named `true`).

**`run` still accepts that bare `--models`, and nine other flags are as loose.**
The user then asked for follow-ups on anything missed, so session 14 swept the
whole argument surface at $0 and opened **COS-24** (queue item 18). `parseArgs`
accepts any `--name` and `pick` accepts whatever follows it, so: an unknown flag
(`run --modles=haiku`) is ignored and the full default matrix runs;
`run --concurrency=abc` starts zero workers, returns `[null, null, null]` and
dies in `summarize` after measuring nothing; `run --no-judge=false` turns the
judge *off* because `'false'` is truthy; `improve --iterations=abc` buys the
baseline arms and prints `adopted v0` without iterating. Ten criteria, all
verified, all in the task. It is appended, not promoted — but the tracker records
the argument for promoting it, since every item from 7 onwards spends money
through this CLI.

COS-23 also gained a fifth criterion: `docs/log.md` is incomplete as well as
unreachable. This session's own merge is the evidence — `374378a` is cited twice
and is not an ancestor of `dev`, while `b0014af` and `2833a95` appear zero times,
because `lore sync` runs before a branch's last commits exist.

## The mechanism COS-9 has to change

`harness/src/checks.mjs:283-305`. The whole check:

```js
const labelled = new Set([...t.matchAll(/option\s+([a-d1-4])/g)].map(m => m[1]))
if (labelled.size <= 2) score += 0.3   // 0.3 for the option cap
if (hasReco) score += 0.4              // /recommend|i'd pick|my pick|.../
if (hasTradeoff) score += 0.3          // /trade-?off|faster|slower|cheaper|.../
```

So a three-option prose reply scores 0.3 + 0.4 + 0.3 = **1.000**: the cap term is
satisfied because `labelled.size` is 0. The label-blindness is deliberate and the
comment above it says why — scoring the literal label penalised the better reply,
the one that leads with the recommendation and names alternatives in prose. **That
reasoning still holds and AC #2 exists to protect it.** The gap is that nothing
replaced it.

Existing test: `harness/test/checks.test.mjs:54`, `two_options_max scores
structure, not literal labels`, with four fixtures — `labelled` and `prose` both
expected at exactly 1, `three` below 0.8, `neither` below 0.5. Read all four
before touching the check; two of them are AC #2.

Consumers: four cases name the check (`harness/cases/cases.json:35,157,219,308`),
one of which is `reserve-three-options`, added by COS-2 specifically to present
three options and see whether the style narrows to two. On that case the
deterministic 70% of the score is currently blind to the failure, leaving the
judge alone to catch it on the smallest split in the pool.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-9 dev`.
3. Read `backlog instructions task-execution`; mark COS-9 In Progress; record the plan.
4. Design against AC #2 first, not AC #1. The easy fix — counting alternatives by
   some prose heuristic — is exactly the change that re-breaks the reply the
   current check was written to protect. Write the AC #2 fixture before the AC #1
   one.
5. AC #3 is the expensive-looking one and is free. `node src/cli.mjs score
   --rows=results/<stamp>/rows.json` re-grades saved transcripts offline at $0.
   The figures at risk are named: `docs/adr/ship-one-style-file-for-every-model.md:34`
   (a `two_options_max` row, 1.00 vs 0.85), `docs/reference/experiment-ledger.md:126`,
   and `FINDINGS.md:205` ("`two_options_max` regressing on Sonnet, 1.00 → 0.50").
   **`results/` is gitignored**, so find the stamps by listing `harness/results/`
   in the working tree — they are not in git.
6. Gates: `npm --prefix harness test` (124 now); `audit` exit 0;
   `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync` then `lore check` exit 0.
7. Update `doc-1` on the branch (COS-9 → Resolved, cursor → COS-20, session log)
   **via `backlog doc update`, never by editing the file**. Commit with
   `Refs: COS-9`, review with `/code-review high` **and wait for it**, push, PR
   into `dev`, rebase-merge, sync, promote `main`, prune.

## Critical context / traps

- **Never edit `backlog/docs/doc-1*.md` or `backlog/tasks/*.md` directly.** Use
  `backlog doc update doc-1 --content "$(cat file)"`, which replaces the whole
  body; strip the frontmatter first, since the CLI re-adds it. The body is ~95KB
  and passes fine.
- **`lore sync` times out at the default 30s.** Use `LORE_BACKLOG_TIMEOUT_MS=120000`.
- **`lore sync` auto-commits under `backlog/`.** Expect `chore(backlog): sync task
  changes` commits on the branch; never `git add` files under `backlog/tasks/`.
  It also rewrites `docs/log.md`, which you do have to commit yourself — and it
  only records commits that already exist, so run it once more after the last
  code commit if you want that commit in the log.
- **Changing a task's status puts the owning story's managed block into drift.**
  Every session so far has needed `lore sync` for that reason alone.
- **An untracked `system-prompt.md` sits at the repo root.** Not ours, not
  ignored. Stage files explicitly; never `git add -A`.
- **`results/` is gitignored.** The ledger is the durable record.
- **The ledger's runs table forbids improve rows** — improve runs go in the
  optimizer table below it.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- **`docs/log.md` cites SHAs that `gh pr merge --rebase` destroys** (COS-23, queue
  item 17). The log is generated on the branch, before the rebase rewrites them,
  so every SHA it names for a merged branch fails `git show` on a fresh clone.
  Do not trust a SHA from that file; read `git log` instead.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Do not let the PR merge while the review is still running.** Session 13 did,
  and its four findings landed with no gate left to hold them — which is why
  COS-22 and COS-23 exist as follow-ups instead of as fixes on a branch. Session
  14 waited (~4 minutes) and fixed all four before opening the PR. Step 6 is a
  gate.
- **Check `git branch --show-current` immediately before committing** when
  anything else may be touching the repo. Session 13 committed onto `main`
  because a parallel task had left `HEAD` there.
- **An assertion can be vacuous and still be green.** Session 14 shipped
  `assert.ok(!('fallback' in resolveImproveModels))` as "the guarantee" that run's
  list cannot leak in; `in` on a function object finds nothing named `fallback`
  whatever the implementation does, so it could not fail. The review caught it.
  Ask of any new assertion: what implementation would make this red?
- **A comment that carries a number is carrying a claim.** The same session wrote
  "3 models x 6 iterations is 18 measured arms" into the file whose job is to let
  a reader budget a paid loop. The loop buys two arms for the baseline, two per
  iteration and two at the reserve gate — 16, not 18 — and the README repeated
  the halving. Derive it from the code before writing it down.
- **Run the thing before you read it.** Four COS-13 defects were found by
  executing something and none by inspection.
- **A guard that has never been observed to fail is not evidence.** Break your own
  check on purpose before trusting it.
- **When you change a shared primitive, ask what its consumers were relying on**
  (COS-11) — COS-9 changes a check that four cases and three published figures
  depend on, so this one applies directly.
- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. Settled.
- **Do not quote a judge figure from a ten-cell arm as a position.** Session 8
  reported "Sonnet already clears the bar" from n=10 and withdrew it at n=35.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · 4 ~~COS-13~~ · 5 ~~COS-14~~ ·
**6 COS-9** — repair the instrument, no arm-sized spend.
7 COS-20 — characterise the judge; may lower the 146-cell figure everything else
is priced on.
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 — the style text.
12 COS-21 · 13 COS-19 — rebuild the published record.
14 COS-4 · 15 COS-1 — the two parked bars, achievability still unproven.
16 COS-22 · 17 COS-23 — opened by session 13 from the late COS-13 review.
18 COS-24 — opened by session 14 from the COS-14 review plus its own probing.
**Appended, not inserted.** All three are cheap repair-phase work by nature and
none blocks anything from 6 to 15, but promoting them into the repair phase
reorders a sequence the user chose from a presented comparison — ask first.
COS-24 has the strongest case for promotion and the tracker says why.
