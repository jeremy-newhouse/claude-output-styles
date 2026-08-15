import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

/** Minimal YAML-frontmatter parse. Output styles only use flat scalar keys. */
export function parseStyle (text, file = 'style.md') {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!m) return { name: basename(file, '.md'), meta: {}, body: text }

  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!kv) continue
    let v = kv[2].trim().replace(/^["']|["']$/g, '')
    if (v === 'true') v = true
    else if (v === 'false') v = false
    meta[kv[1]] = v
  }
  return { name: meta.name || basename(file, '.md'), meta, body: m[2] }
}

export function loadStyle (file) {
  const text = readFileSync(file, 'utf8')
  return { file, text, ...parseStyle(text, file) }
}

/** Rebuild a style file from frontmatter + a new body. */
export function renderStyle (meta, body) {
  const keys = ['name', 'description', 'keep-coding-instructions']
  const fm = keys.filter(k => meta[k] !== undefined).map(k => `${k}: ${meta[k]}`).join('\n')
  return `---\n${fm}\n---\n\n${body.trim()}\n`
}
