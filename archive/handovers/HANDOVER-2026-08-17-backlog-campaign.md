# Handover — raise beginner style prose quality (COS-4), the last queued issue

**Date**: 2026-08-17 | **Grounded against**: `dev` @ `1c35697`, clean tree, level with `origin/dev`; `main` and `origin/main` also at `1c35697` | **Tracker**: `doc-1`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/_repos/claude-output-styles. Tracker:
doc-1. Cursor: COS-4 — raise beginner style prose quality. Judge bar 70% on opus
and sonnet with rules held at or above 92%; currently 45.9 and 48.4. Budget ~$20.
Queue order confirmed by user on 2026-08-16; do not re-ask. Risk policy:
record-and-park — COS-1 has just used it, so there is a worked precedent.

COS-4 is the last issue in the confirmed queue and the hardest one. Read COS-1's
task notes before planning: it attempted the neighbouring problem, failed the
bar, and the reason it failed is the thing COS-4 has to solve.

The finding COS-4 inherits: REPLY LENGTH IS THE BINDING CONSTRAINT, and it is now
measured on two separate case sets. 70.8-82.6% of cells overrun their style's own
word cap in every arm COS-1 measured, before and after, with beginner replies at
101-256 words against a cap of 80. COS-8 reached the same conclusion from the
opposite direction. Two authoring passes that added RULES did not move it, and
the second scored below the original text and was reverted.

Locked decisions: default branch is dev; every issue merges there via a PR
(gh pr merge --rebase --delete-branch) and dev is then fast-forwarded into main
— a session is not done until both are pushed. docs/ prose is edited outside
lore-managed regions and reconciled with `lore sync` then `lore check` (exit 0
required); merely changing a task's status puts the owning story's managed block
into drift, so this is part of finishing ANY task. Any change to
harness/src/*.mjs needs matching tests, and any change to a style file or
contracts.json must leave `node src/cli.mjs audit` at exit 0.
```

## State

| Item | Status |
|---|---|
| Branch | `dev` @ `1c35697`, clean tree |
| Push state | `dev`, `origin/dev`, `main`, `origin/main` all at `1c35697` |
| Cursor issue | COS-4 — To Do, unassigned, no plan recorded |
| Tracker | `doc-1`, cursor armed at COS-4, 6 resolved, 1 queued, 1 blocked |
| Feature branches | none, local or remote |
| Open PRs | none. PRs #1–#8 all merged, all branches deleted |
| Consumed handovers | `archive/handovers/` holds sessions 1–7 (`-7.md` is this session's predecessor) |
| Campaign progress | 6 of 8 resolved, **COS-1 parked not resolved**. Next is session 8, the last queued issue |
| Spend so far | **$34.31** ($0.75 s2, $1.18 s3, $2.42 s4, $1.88 s5, $14.43 s6, $13.66 s7) |
| Test suite | 64/64 (`npm --prefix harness test`), was 56 |

## What session 7 did, and why it matters to COS-4

COS-1 is the campaign's first issue that did not meet its bar. ACs #1–#3 shipped
and merged; **AC #4 was measured twice and missed both times**, so the task is
back at To Do, unassigned, and listed under the tracker's "Not queued — blocked"
with the reason. Nothing was marked Done that was not done.

The measurement is the inheritance:

| case | model | baseline `00-44-03` | shipped `00-48-49` | rejected pass 2 `01-03-21` | bar |
|---|---|---|---|---|---|
| `agentic-fix-verify` | opus | 50.0 | 46.2 | 33.0 | 65 |
| `agentic-fix-verify` | sonnet | 40.0 | 42.0 | 40.3 | 65 |
| `conv-decision-holdout` | opus | 48.3 | 51.2 | 63.0 | 65 |
| `conv-decision-holdout` | sonnet | 46.7 | 54.7 | 36.2 | 65 |

Arm mean judge: baseline 46.2, shipped **48.5**, pass 2 **43.6** — pass 2 was
worse than writing nothing, and was reverted in full.

**The lesson COS-4 must not relearn at its own expense: adding rules to a style
file does not shorten its replies.** Pass 1 added two well-targeted sections and
moved the arm mean 2.3 points. Pass 2 restated each style's own word cap inside
the new section, banned inter-tool narration, and outlawed conditional
recommendations — every one of those written directly from the judge's own
violations — and lost ground. Beginner's problem is not that its file fails to
say "be brief". Its file says so twice already.

## Next steps

1. Preflight: clean tree, `git checkout dev && git pull --ff-only`.
2. `git checkout -b feature/COS-4 dev`.
3. Read `backlog instructions task-execution`; mark COS-4 In Progress; record the plan.
4. Read COS-1's task notes in full (`backlog task view COS-1 --plain`) and
   `docs/stories/close-the-style-quality-gaps.md`. The story's beginner section
   already carries the four-tier evidence and COS-8's length finding.
5. Decide the instrument question before spending anything. The story says it
   out loud: *"Beginner may need a different instrument rather than a different
   wording. Its rules pass while its prose does not."* Beginner scores 90.9–92.3
   on rules across all four tiers and 37.5–53.9 on the judge. A style whose
   stated rules are satisfied by prose the judge dislikes has rules that do not
   capture what makes it good. Two honest options, and picking one is the plan:
   change what beginner asks for, or change what the harness measures.
6. Whatever the approach, **measure a before on the shipped text first**. COS-1's
   baseline cost $2.40 for 12 cells and was worth every cent — the figure in the
   task description was from superseded style text and would not have supported
   any claim of improvement.
7. Gates: `npm --prefix harness test` 64/64; `audit` exit 0; `lore check` exit 0
   after `lore sync`; add every run to the experiment ledger.
8. Update `doc-1` on the branch (COS-4 → Resolved or blocked, cursor → empty,
   session log), commit with `Refs: COS-4`, review with `/code-review high`,
   push, PR into `dev`, rebase-merge, sync, promote `main`, prune.

## Critical context / traps

- **Do not open with an `improve` run.** Six rewrites across three styles have
  failed, beginner's two most decisively (train +6, holdout −8, rejected twice).
  COS-1 added the second reason: the loop optimises rules, and beginner's rules
  already pass. It cannot see the thing that is wrong.
- **The reserve split grew to 6 cases and two of them are agentic.** A bare
  `node src/cli.mjs run` is now 15 cases across every default axis; the two new
  cases alone add 180 cells. `improve` validates over 36 reserve cells a side
  instead of 24. Name `--cases` and `--variants` on every invocation.
- **`reserve-agentic-session` aborts 3 of 6 on Haiku** (`01-33-41`). The reserve
  gate was made error-aware in the same change so this cannot silently flip an
  adoption verdict, but a Haiku improve run will now burn cells that return
  nothing.
- **Filter `!row.error` before quoting any mean.** An errored cell scores 0 on
  every rule *and* 1.0 on the judge — the second half was found this session and
  the biases do not cancel. One abort moved a published figure from 33.0 to 44.2.
  `summarize()` still pools them; only the reserve gate was fixed.
- **`sentence_length` and `paragraph_length` are not quotable on agentic cells**,
  and neither is the judge there. `run.mjs` accumulates every assistant text
  block in a turn, so the scored "final message" is the whole trace. In 16 of 16
  agentic cells carrying pre-update narration, a judge violation quotes it.
  Raised, not fixed, and now a stated blocker on COS-1's AC #4.
- **The agentic fixture contradicts itself** (new, from the review):
  `pricing.test.mjs` asserts 850 while its own comment computes 849, so a model
  that rounds correctly breaks a passing test. Scoring noise on every agentic
  case. Raised, not fixed — patching it moves published numbers.
- `results/` is gitignored. The experiment ledger is the durable record.
- The repo keeps `dev` and `main` in lockstep. A `main` that will not
  fast-forward means it diverged: stop and report rather than forcing it.
- `.claude/handovers/` is gitignored on purpose. Never copy handover content into
  anything committed.

## Do not repeat

- **Compute a rate with the code that defines it, not with a hand-rolled
  equivalent.** This session's sharpest lesson and its most embarrassing. I
  counted over-cap replies with `text.split(/\s+/)` while the harness's
  `total_length` check counts `words(stripCode(text))` — it strips code fences
  first. Four published numbers were wrong, including an over-cap range that
  excluded the very arm the branch ships, plus a "rises monotonically" claim that
  the real sequence (75.0 → 70.8 → 82.6) contradicts. COS-5 recorded the same
  lesson about `words()`; I re-made it one function over. **Import the scorer.**
- **A change that adds a case to a split changes every gate that reads that
  split.** Adding an agentic case to `reserve` put an abort-prone case inside
  `improve`'s adoption gate, where pooled errored rows could flip a verdict on
  the turn limit. The diff documented that exact bias in three places and left
  the code alone. Ask what consumes a config change, not just what produces it.
- **Do not describe a distribution from one side of it.** "8-10 tool calls, so it
  forces the longer session" ignored that `agentic-fix-verify` runs 5-13 with a
  median of 8, and compared a Sonnet-only sample against a two-model range. The
  claim was withdrawn; the Haiku run that would have supported it cost $0.35 and
  should have been run before the claim, not after.
- **Prove a new guard fires.** The five `cases.json` guards were each verified by
  breaking the file on purpose and watching the suite go red. The first attempt
  at that script crashed mid-way and left the file mutated — write the restore as
  a `trap`, not as the last line.
- **When you change a headline result, grep for every document that states the
  old one.** Seventh session running that this found real defects — here the
  "~48%" figure in `FINDINGS.md` and two stories, all of which came from runs on
  style text that no longer ships.
- Do not skip `lore sync` because the change looks code-only. All seven sessions
  needed it purely from moving a task's status.

## Raised, not done — needs the user's call before anyone starts them

Seven items now, all in the tracker with full detail. Ranked by what would most
change future work:

1. **`summarize()` pools errored rows** — every judge mean anyone quotes is
   inflated by aborts and every rules mean deflated. Partly fixed this session in
   `improve`'s reserve gate only; the general case is untouched.
2. **The text-block seam** — now known to corrupt the judge, not only two
   segmentation checks. It is what makes COS-1's AC #4 unmeasurable on the
   agentic half.
3. **`matrix.improve` inherits `run`'s model list** — any model added to
   `matrix.models` is billed on every optimizer iteration of the documented
   invocation.
4. **`run` does not flush rows incrementally** — a killed run loses every paid
   cell. This session ran $13.66 of `run` with that exposure live.
5. **COS-9** — `two_options_max` is blind to prose option sprawl.
6. **The fixture contradicts itself** — 850 asserted, 849 computed in its own
   comment.
7. **`sentences()` merges a list header into its first item**; same subsystem as
   the seam and sensibly one task with it.

## What COS-1 settled, worth saying out loud

The epic's remaining gaps are **not** wording gaps, and now they are not content
gaps either. The two missing rules were written, the judge reads them and grades
against them by name, and the scores did not move. What is left underneath is one
measurable property — replies are 1.3× to 3× their stated cap, everywhere, on
every tier — and one broken instrument.

That is the argument COS-4 inherits, and it is stronger evidence than COS-1 had
when it started: **the next thing to try is not more rules.**
