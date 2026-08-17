---
id: COS-16
title: Fix the five contradictions COS-4 left in the beginner style file
status: To Do
assignee: []
created_date: '2026-08-17 03:46'
updated_date: '2026-08-17 03:51'
labels:
  - 'doc:stories/close-the-style-quality-gaps'
dependencies:
  - COS-10
  - COS-11
  - COS-12
references:
  - plain-english-beginner.md
  - harness/config/contracts.json
documentation:
  - FINDINGS.md
  - docs/stories/close-the-style-quality-gaps.md
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
COS-4 rewrote `plain-english-beginner.md` to remove three self-contradictions and add a shape router. It succeeded on the deterministic side — rules 92.1/93.4 to 98.5/97.4, mean reply 103 words to 61, over-cap share 40.0% to 14.3% — and introduced five new defects of the same class, which were recorded rather than fixed because the budget was exhausted and shipping unmeasured style text is against the precedent COS-1 set.

All five are in the file as it ships at `31433b8`:

1. **The jargon rules conflict for a word the reader used first.** Line 17 says a product or tool name must be put in plain terms "even if they used the name first"; line 42 says to skip explaining "a word they used first". Asked "why is Redis slow?", the model gets opposite instructions for the same word.
2. **The proof-number rule demands a number that may not exist, and it is stated three times.** Line 44 ("Give it, and give only one"), line 49 ("then the one number that proves it") and line 58 ("One sentence, one number"). The judge already punished this: on `agentic-read-report`, a case with nothing to run, it quoted "the reply never states whether the code was actually tested … no proof number given as required". A replacement was measured only inside a five-edit bundle and never on its own.
3. **Router bullets 1 and 3 both match a tool-using report.** "You finished a job" and "They asked what something is or does" both describe `agentic-read-report`, and the file does not say which wins.
4. **The router omits two of the file's own six shapes** — "Reporting a long session" and "Answering a follow-up". The second is the sharper miss: `conv-followup-drift` produced 4 of the 10 structure violations that motivated the router in the first place.
5. **The file's worked example of the gloss rule uses a banned term.** "I updated the API (the messenger that lets two programs talk)" — "API" is one of the 28 terms `no_jargon` matches at weight 2, with no awareness of the gloss, so following the example scores 0.667 on the heaviest-weighted check. The contract side of this is COS-15; this task owns the prose.

Measure the bundle, then ablate. COS-4 could not tell its two authoring passes apart because each was a five-edit bundle measured once at ten cells a model, and the bundle-versus-bundle comparison was inside the noise. With adequate n, each bullet can be tested on its own, which is the only way to know which of the five earn their place.

Note the trap COS-1 and COS-4 both hit: adding rules to this file has repeatedly failed. Four of the five fixes above remove or bound a rule rather than adding one, which is the shape of the change that did work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the five defects is either fixed or explicitly retained, with the reason recorded
- [ ] #2 The bundle is measured against the shipped text at n >= 146 cells per model on the five shared cases, which is what a 95% half-width of +/-4 points costs at the measured judge SD of 24.6
- [ ] #3 Every individual edit that survives into the shipped file has its own measured effect, so no bullet ships on the strength of the bundle alone
- [ ] #4 Deterministic rule score stays at or above the 98.5/97.4 the current file reaches, and mean reply length does not rise above 61 words
- [ ] #5 Validated on the six reserve cases at the same sample size, before and after
- [ ] #6 node src/cli.mjs audit exits 0 and the shipped file is verified byte-identical to the measured text by checksum
<!-- AC:END -->
