---
id: COS-14
title: Give matrix.improve its own model list
status: To Do
assignee: []
created_date: '2026-08-17 03:45'
updated_date: '2026-08-17 03:52'
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
- [ ] #1 matrix.improve carries its own models list, and improve uses it rather than falling back to run's
- [ ] #2 Omitting the key is not a silent inheritance — the behaviour when it is absent is explicit and tested, the way COS-8 handled a missing minReserveDelta
- [ ] #3 harness/README.md's quick-start invocation is safe to copy without --models
- [ ] #4 Config tests cover the new key, following the precedent in harness/test/config.test.mjs
<!-- AC:END -->
