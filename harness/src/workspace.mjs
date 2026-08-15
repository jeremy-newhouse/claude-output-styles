// Builds an isolated workspace that reproduces Claude Code's real output-style
// injection path. Verified against Claude Code 2.1.233 / SDK 0.3.233:
//
//   - systemPrompt MUST be { type: 'preset', preset: 'claude_code' }.
//     With systemPrompt omitted there is no Claude Code system prompt at all,
//     so there is nothing for the style to attach to.
//   - settingSources MUST include BOTH 'project' and 'local'.
//     ['local'] alone does not work: the style setting is read from
//     .claude/settings.local.json, but the output-style *file* is only
//     discovered when the 'project' source is loaded.
//   - The `settings: { outputStyle }` option object is IGNORED for output
//     styles. It must go on disk in .claude/settings.local.json.

import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseStyle } from './style.mjs'

const FIXTURE = new URL('../fixtures/repo/', import.meta.url).pathname

/**
 * @param {object} o
 * @param {string} o.styleText   full .md file contents (frontmatter + body)
 * @param {object} o.variant     harness variant under test
 * @returns {{dir: string, styleName: string, env: Record<string,string>, cleanup: () => void}}
 */
export function buildWorkspace ({ styleText, variant = {} }) {
  const dir = mkdtempSync(join(tmpdir(), 'osh-'))
  mkdirSync(join(dir, '.claude', 'output-styles'), { recursive: true })

  const { name } = parseStyle(styleText)
  let text = styleText

  // Variant: append a short reminder at the very end of the style body.
  // Anthropic's Opus 5 prompting guide recommends this for long system prompts.
  if (variant.tailReminder) {
    text += `\n\n<tone_preference>\n${variant.tailReminder}\n</tone_preference>\n`
  }

  writeFileSync(join(dir, '.claude', 'output-styles', 'style.md'), text)
  writeFileSync(
    join(dir, '.claude', 'settings.local.json'),
    JSON.stringify({ outputStyle: name }, null, 2)
  )

  // Variant: restate the style contract in CLAUDE.md. Claude Code wraps
  // CLAUDE.md in "These instructions OVERRIDE any default behavior and you
  // MUST follow them exactly as written" and re-injects it as a user message,
  // which is a stronger position than the system prompt's style section.
  if (variant.claudeMd) {
    writeFileSync(join(dir, 'CLAUDE.md'), variant.claudeMd)
  }

  if (existsSync(FIXTURE)) cpSync(FIXTURE, dir, { recursive: true })

  const env = {}
  // Variant: force Claude Code's long system prompt. Opus 5 gets an abridged
  // system prompt by default; the long one carries explicit anti-verbosity
  // rules. Gate confirmed in the 2.1.233 binary: truthy forces simple ON,
  // explicit "0"/"false" forces it OFF, otherwise it is model-selected.
  if (variant.simpleSystemPrompt !== undefined) {
    env.CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT = variant.simpleSystemPrompt ? '1' : '0'
  }

  return { dir, styleName: name, env, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}
