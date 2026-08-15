# Plain English Output Styles for Claude Code

Three output styles that make Claude Code communicate in clear, concise, jargon-free language. They are based on the ASD-STE100 Simplified Technical English standard and ELI5 ("Explain Like I'm Five") principles, tuned for an executive who makes many decisions a day and needs the point fast.

Pick the level that matches your technical depth. The workflow is identical across all three — only the vocabulary depth changes.

## What every style guarantees

- **Three-question status updates.** Every update answers: what I did, did it work, what you do next.
- **Two-option decisions.** When Claude needs a call from you, it gives exactly two options, the minimum context to decide, trade-offs on speed / cost / quality, and its recommendation.
- **STE writing discipline.** Sentences under 20 words. Short paragraphs. Active voice. One idea per sentence. One word, one meaning. Any big word is explained right after it appears.
- **Minimum necessary output.** Conversational tone. No elaboration unless you ask. Think "60-second elevator pitch."
- **Full coding ability.** Each style sets `keep-coding-instructions: true`, so only the communication changes — not the engineering.

## The three levels

### Plain English — Beginner (`plain-english-beginner.md`)

For a smart person with **no coding background**. Zero jargon, zero acronyms, no code ever shown unless asked. Uses everyday analogies (a database is a filing cabinet; a server is a helper computer). Explains what a thing *is* before what happened to it. Translates outcomes, never mechanics — no file names, commands, or error text. Updates stay under ~80 words.

> "I fixed the sign-in check. It was rejecting valid users. Yes — sign-in works again. I tested it. Nothing for you to do."

### Plain English — Intermediate (`plain-english-intermediate.md`)

For someone who **works near code but doesn't live in it** (product owner, technical PM). Common terms are fine without explanation: database, API, deploy, branch, test. Deeper terms get a short gloss on first use: "migration (a scripted change to the database's structure)." Code appears only when a snippet under 5 lines says it faster than prose. Each change gets a one-line "why." Updates stay under ~100 words.

> "I fixed the login check in the backend. It used an outdated token rule (a token is the pass a user carries after sign-in). All 14 login tests pass."

### Plain English — Advanced (`plain-english-advanced.md`)

For a **technically fluent leader** who can read code and reason about architecture. Precise terms are correct here — "race condition" beats "timing problem" — but buzzwords and filler are banned. Names the real mechanism: file, function, query, root cause. Includes numbers when they change the decision (latency, cost, test counts). States risk and blast radius for changes touching data, auth, or money. Short diffs welcome. Updates stay under ~120 words.

> "Fixed the 401s. Root cause: `verify_token()` rejected tokens during the signing-key rotation window. 14/14 auth tests pass, plus a new test for the rotation window."

## Quick comparison

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Jargon | None | Common terms only | Precise terms, no buzzwords |
| Code shown | Never (unless asked) | Snippets < 5 lines | Diffs < 10 lines |
| Explanations | Analogies | Gloss uncommon terms | Gloss only niche terms |
| Detail level | Outcomes only | Feature + one-line why | Root cause + numbers + risk |
| Update length | ~80 words | ~100 words | ~120 words |

## Install

1. Copy the three `.md` files to `~/.claude/output-styles/` (all projects) or `.claude/output-styles/` inside a project.
2. In Claude Code, run `/config`, select **Output style**, and pick a level. (The old `/output-style` command was removed in v2.1.91.)
3. The style takes effect after `/clear` or on your next session.

Switch levels any time — for example, Beginner for a quick status check, Advanced when reviewing an architecture change.

## Credits

- [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/) — sentence length, active voice, and one-word-one-meaning rules.
- ELI5 principles from Reddit's [r/explainlikeimfive](https://www.reddit.com/r/explainlikeimfive/) — plain words, analogies, match the listener's level.
- [Claude Code output styles documentation](https://code.claude.com/docs/en/output-styles) — file format and installation.
