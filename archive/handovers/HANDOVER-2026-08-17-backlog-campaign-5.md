# Handover — campaign 2, item 4: the agentic fixture contradicts itself (COS-13)

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `7db7d7e`, tree clean, one commit ahead of `origin/dev` at write time (R5 pushes it); `main` at `1c6a34c`, level with `origin/main` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-13 — harness/fixtures/repo asserts applyDiscount(999, 15) is
850 while its own comment computes 849, so a model that correctly fixes the
rounding bug breaks a passing test. Queue order for campaign 2 confirmed by user
on 2026-08-17 ("Fix tools first, then everything"); do not re-ask. Risk policy:
record-and-park.

COS-13 depends on COS-10, which is Done, so it is unblocked. It should cost $0
for ACs #1-#3. AC #4 is the one to think about before starting: it asks for
agentic figures to be re-derived OR marked as measured on the contradictory
fixture. Re-deriving means re-running agentic cells, which is real money;
marking is free. COS-10 already labelled every agentic figure as measured on the
glued turn, so there is an established pattern and probably a sentence to extend
rather than a new one to invent.

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
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `7db7d7e`, one commit ahead of `origin/dev` at write time |
| Push state | `main` and `origin/main` at `1c6a34c`; R5 pushes `dev` and re-promotes `main` |
| Cursor issue | COS-13 — To Do, unassigned, no plan recorded, 4 ACs, depends on COS-10 (Done) |
| Tracker | `doc-1`, cursor armed at COS-13, campaign 2 at 3 of 15 resolved |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#12 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–11 (today's fourth is `-4` suffixed) |
| Campaign 1 spend | **$53.00** across eight sessions |
| Campaign 2 spend | **$0.5955** — COS-12 $0.1812, COS-10 $0.4143, COS-11 $0 |
| Test suite | 112/112 (`npm --prefix harness test`) |
| Gates | `audit` exit 0, `lore check` exit 0 (24 files) |

## The whole fixture, so you can decide before you start

`harness/fixtures/repo/src/pricing.js`:

```js
export function applyDiscount (subtotalCents, percentOff) {
  // BUG: truncates instead of rounding, so a 33% discount on 1000 cents
  // yields 670 instead of 670 -> off-by-one appears at 15% on 999.
  return subtotalCents - Math.floor(subtotalCents * (percentOff / 100))
}
```

`harness/fixtures/repo/test/pricing.test.mjs`:

```js
assert.equal(applyDiscount(999, 15), 850)  // 999 - round(149.85) = 999 - 150
assert.equal(applyDiscount(1000, 33), 670)
assert.equal(priceOrder([{ unitPriceCents: 500, qty: 2 }], { percentOff: 10, country: 'US' }), 966)
```

Read that carefully — **the source comment is self-contradicting too**, and the
task description only names the test. "yields 670 instead of 670" says a number
is wrong by saying it equals itself. AC #3 asks you to check the rest of the
fixture for the same class of problem; this is one, it is in the file the model
reads first, and it is arguably worse than the assertion because it is the
comment that tells the model what the bug *is*.

Arithmetic, so you do not have to redo it:
- `999 * 0.15 = 149.85`. `Math.floor` → 149, so the current code returns **850**.
- Rounding → 150, so a corrected `applyDiscount` returns **849**.
- The assertion says 850 (what the buggy code does) and its comment says 849
  (what the fix should do). The test therefore passes today and fails the moment
  the model fixes the bug it was sent to fix.
- `1000 * 0.33 = 330` exactly, so floor and round agree and that assertion is
  stable under the fix. Same for the `priceOrder` case (`1000 * 0.10 = 100`).

So exactly one assertion moves, and the decision AC #1 asks for is really
"should the fixture's tests describe the buggy behaviour or the intended
behaviour?" Both are defensible; pick one and say why in the task.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-13 dev`.
3. Read `backlog instructions task-execution`; mark COS-13 In Progress; record the plan.
4. Settle AC #1 first — it is a one-line decision and everything else follows.
5. AC #2 is the real risk: the agentic cases exist to make the model *find* a
   bug. If you make the test assert 849, a model that runs the tests now sees a
   failure pointing straight at the bug, which is a much easier task than the
   one every published agentic figure was measured on. Say explicitly whether
   that changes the case's difficulty, because AC #4's re-derive-or-label
   decision depends on the answer.
6. AC #3: check `withTax`, `priceOrder` and `lineTotal` for the same class of
   defect, and record the result **either way** — "checked, found nothing" is
   the required output, not silence.
7. AC #4: the cheap path is labelling, and COS-10 already established the
   pattern and the wording for exactly this ("measured on the glued turn").
   Look at how `FINDINGS.md`, the ledger and `harness/README.md` carry that
   label before writing a second, differently-worded one.
8. Gates: `npm --prefix harness test` (112 now); `audit` exit 0;
   `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync` then `lore check` exit 0.
9. Update `doc-1` on the branch (COS-13 → Resolved, cursor → COS-14, session
   log), commit with `Refs: COS-13`, review with `/code-review high`, push, PR
   into `dev`, rebase-merge, sync, promote `main`, prune.

## What COS-11 left you

- **`checks.mjs` now exports two predicates and they are not interchangeable.**
  `hasTurnText(row)` — is there anything to grade? `producedReply(row)` — may
  this row enter a mean? They differ on exactly one shape: a cell that aborted
  *after* emitting text, which is graded and kept on the row but never pooled.
  If you add a caller, pick deliberately.
- **`summarize()` excludes non-replying cells from every mean** and each group
  carries `n` / `dropped` / `cells`. The field was `errors` before this session
  and is now `dropped`; `report.md`'s column changed with it. Anything you write
  that reads `summary.*.errors` will silently get `undefined`.
- **An unmeasured figure is `null`, not 0**, everywhere — `overall` and every
  group's `score`/`rules`/`judge`. Both renderers print `n/a`. If you do
  arithmetic on a summary figure, guard the null: `null - 0.7` is `-0.7` in JS
  and that is how an unmeasurable arm reads as a regression.
- **`improve`'s KEEP/REVERT is now paired by case**, like the reserve gate.
  `best` carries `trainRows`/`holdoutRows` for that reason. Do not "simplify" it
  back to a difference of two arm means — the review caught that this branch had
  briefly made a rewrite score *higher* for causing an abort.
- **`cli.mjs score` and the live path apply the same guards now.** They used to
  disagree, which quietly undermined every "re-scoring reproduces the published
  figure" claim. Keep them in step.

## Critical context / traps

- **`lore sync` times out at the default 30s.** Use
  `LORE_BACKLOG_TIMEOUT_MS=120000 lore sync`.
- **`lore sync` auto-commits under `backlog/`.** Expect a `chore(backlog): sync
  task changes` commit on the branch; never `git add` files under
  `backlog/tasks/` yourself.
- **Changing a task's status puts the owning story's managed block into drift.**
  Every session so far has needed `lore sync` for that reason alone.
- **`results/` is gitignored.** The ledger is the durable record.
- **The ledger's runs table forbids improve rows** — improve runs go in the
  optimizer table below it.
- Every agentic figure in `docs/` and `FINDINGS.md` is labelled as measured on
  the glued turn (COS-10). COS-13 may need to add a second qualifier to the same
  figures; read the existing label before writing a new one beside it.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **When you change a shared primitive, ask what its consumers were relying on —
  not just whether they still run.** This session excluded aborted cells from
  every mean, checked all five consumers of `summarize()` for null-safety, and
  still shipped a defect to review: `improve`'s KEEP/REVERT compares two arm
  means, and once aborted cells are dropped, a candidate is measured on the
  easier cells that survived. A rewrite could score higher *for breaking a
  case*. Nothing crashed and every test passed. The question that would have
  caught it is "what did the old behaviour silently provide?" — here, the
  aborted cell's 0.3 was acting as a penalty nobody had written down.
- **One predicate for two questions loses data.** The same review found the fix
  zeroing a real `rulesScore` on an aborted-but-non-empty cell — fabricating a
  score to mean "do not trust this", which is the exact defect COS-11 exists to
  remove, pointed the other way.
- **Check which arm a number belongs to before attributing it.** This session
  wrote "pooling six aborts understated the advanced figure by 10.8 points". The
  advanced arm holds 3 of those 6. Fourth session in a row to publish a
  prose-number defect of this shape.
- **A figure written by a session that remembered the discipline needs no
  correction, and checking is cheap.** Four of the five affected runs needed
  nothing; one command each settled it. Do not rewrite what already reads right.
- **Do not run `improve` on a style file.** Six optimizer rewrites across three
  styles have failed. Settled; both remaining style tasks say so.
- **Do not quote a judge figure from a ten-cell arm as a position.** Session 8
  reported "Sonnet already clears the bar" from n=10 and withdrew it at n=35.

## Campaign 2 order, for context (do not re-ask)

1 ~~COS-12~~ · 2 ~~COS-10~~ · 3 ~~COS-11~~ · **4 COS-13** · 5 COS-14 · 6 COS-9 —
repair the instrument, no arm-sized spend.
7 COS-20 — characterise the judge; may lower the 146-cell figure everything else
is priced on.
8 COS-15 · 9 COS-16 · 10 COS-18 · 11 COS-17 — the style text.
12 COS-21 · 13 COS-19 — rebuild the published record.
14 COS-4 · 15 COS-1 — the two parked bars, achievability still unproven.
