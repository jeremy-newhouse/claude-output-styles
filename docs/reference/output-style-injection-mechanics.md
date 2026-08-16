---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Output style injection mechanics
tags:
  - mechanics
  - claude-code
summary: How Claude Code resolves, loads, and places a custom output style, verified against 2.1.233
generated:
  by: lore/0.2.0
  at: 2026-08-16T12:45:54.264Z
---

# Output style injection mechanics

Everything below was verified against Claude Code 2.1.233 and Agent SDK 0.3.233
by probing a live session and reading the shipped binary. Where the published
documentation and the observed behaviour disagree, both are stated.

## Details

### Name resolution fails silently

A style's name comes from its frontmatter `name:`, falling back to the filename
when the file has no frontmatter at all. If `outputStyle` in settings names
something no file provides, Claude Code emits no error and runs Default.

This is the failure that started the investigation. A global `settings.json` set
`outputStyle: "standard"` while the candidate files carried no YAML frontmatter,
so they resolved as `evolv-standard`. Every project outside the one repo with a
correct local setting had been running Default for months, silently.

Confirming a style is *configured* is not the same as confirming it is *loaded*.
The cheap check is a canary: put a distinctive instruction in the style body and
see whether a reply obeys it.

### Loading a style through the Agent SDK

Three things are required together. Miss any one and the style is dropped with
no error:

```js
options: {
  systemPrompt: { type: 'preset', preset: 'claude_code' },  // required
  settingSources: ['project', 'local'],                     // both, not one
  cwd: workspaceContainingDotClaudeOutputStyles
}
```

- Omit `systemPrompt` and there is no Claude Code system prompt at all, so the
  style has nothing to attach to.
- `settingSources: ['local']` alone reads the `outputStyle` value but never
  discovers the style *file* under `.claude/output-styles/`.
- The `settings: { outputStyle }` option object is ignored for output styles.
  The value must be on disk in `.claude/settings.local.json`.

### Opus receives a shorter system prompt

Probed directly by asking a session to count its own top-level headings:

| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` | top-level sections |
|---|---|
| `1` | 8 |
| `0` | 12 |

The gate lives in the 2.1.233 binary: a truthy value forces the short prompt on,
an explicit `"0"` or `"false"` forces it off, and otherwise the choice is made
per model. Opus gets the short one by default. The long one carries explicit
anti-verbosity rules the short one drops.

Forcing the long prompt is widely recommended online as the fix for Opus
verbosity. It measured *worse* here — see the injection-layering ADR.

### The style is not last in the prompt

The documentation states that Claude Code "adds each output style's custom
instructions to the end of the system prompt." Observed in a live Opus session,
the `# Output Style:` section sits mid-prompt with five sections after it:
harness rules, session guidance, memory, environment, and delivery policy.

The documentation also states that "all output styles trigger reminders for
Claude to adhere to the output style instructions during the conversation." No
such reminder appeared in a live session transcript, and no matching string
appears in the binary. Treat the style as stated once, at session start, and
never repeated.

Both facts matter for authoring: a rule that must survive to the end of a long
reply belongs at the end of the style body, not buried in a mid-file bullet.

### Scope

Output styles apply to the main conversation only. A subagent runs its own
system prompt and is unaffected. A fork is the exception, since it inherits the
parent's full system prompt.

## Sources

- Claude Code output styles documentation, <https://code.claude.com/docs/en/output-styles>
- Prompting Claude Opus 5, <https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5>
- `harness/probes/system-prompt-size.mjs` — the heading-count probe
- `harness/src/workspace.mjs` — the verified SDK loading recipe
