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
2. In Claude Code, run `/config`, select **Output style**, and pick a level. (The old `/output-style` command was removed in v2.1.91.) Claude Code writes the choice to that project's `.claude/settings.local.json` — **it does not apply to your other projects**, even if you copied the files to `~/.claude/output-styles/` in step 1. For a user-wide default, set `outputStyle` yourself in `~/.claude/settings.json` instead (see below).
3. Start a new session. The style is part of the system prompt, which is read once at session start — so it takes effect after `/clear` or in your next session, not mid-conversation.
4. Confirm it loaded — see below. Do not skip this.

Switch levels any time — for example, Beginner for a quick status check, Advanced when reviewing an architecture change. Repeat steps 2 and 3.

### How the style name resolves

A style's name comes from its **frontmatter `name:`**, and falls back to the filename only when the file has no YAML frontmatter at all. These three files all carry frontmatter, so their names are:

- `Plain English - Beginner`
- `Plain English - Intermediate`
- `Plain English - Advanced`

Copy those from the list above, not from the section headings earlier in this README: the real names use a plain ASCII hyphen (`-`), while the headings are typeset with an em dash (`—`). They look almost identical and no file provides the em-dash version.

Those are the values to use if you set the style by hand rather than through `/config` — in `~/.claude/settings.json` for a user-wide default, or a project's `.claude/settings.json` / `.claude/settings.local.json` for one repo:

```json
{ "outputStyle": "Plain English - Advanced" }
```

**A name that no file provides fails silently.** Claude Code prints no error and no warning — it runs Default and says nothing. On the machine these styles were written on, a global `outputStyle` naming a style no file provided ran Default across every project but one, for months, unnoticed. That is the whole reason step 4 exists.

### Confirm it loaded

Configured is not the same as loaded, and the silent fallback means settings alone cannot tell you which one you have.

Ask for something the style visibly shapes — a status update — and check the reply against the contract: outcome first, the three beats, inside the level's word cap. If it reads like stock Claude Code, one of two things is wrong. Either the name did not resolve — re-check the frontmatter `name:` against your `outputStyle` value character for character, watching for the em dash — or the setting is scoped to a different project than the one you are in.

For a decisive check, use a canary: add a line to the style body telling Claude to open every reply with a distinctive token, start a session, and see whether it obeys. Remove it afterwards. Asking the model to describe its own system prompt is unreliable.

## Going deeper

- [Install and switch an output style](docs/runbooks/install-and-switch-an-output-style.md) — the full procedure, including project-scoped installs, switching, and rollback.
- [Output style injection mechanics](docs/reference/output-style-injection-mechanics.md) — how Claude Code resolves and places a style, the Agent SDK loading recipe, and where the shipped documentation disagrees with observed behaviour.

## Credits

- [ASD-STE100 Simplified Technical English](https://www.asd-ste100.org/) — sentence length, active voice, and one-word-one-meaning rules.
- ELI5 principles from Reddit's [r/explainlikeimfive](https://www.reddit.com/r/explainlikeimfive/) — plain words, analogies, match the listener's level.
- [Claude Code output styles documentation](https://code.claude.com/docs/en/output-styles) — file format and installation.
