const bar = s => '█'.repeat(Math.round(s * 20)).padEnd(20, '░')
const pct = s => `${(s * 100).toFixed(1)}%`

function table (title, rows) {
  if (!rows.length) return ''
  const w = Math.max(...rows.map(r => String(r.key).length), 4)
  const lines = rows.map(r =>
    `  ${String(r.key).padEnd(w)}  ${bar(r.score)} ${pct(r.score).padStart(6)}  ` +
    `rules ${pct(r.rules).padStart(6)}  judge ${pct(r.judge).padStart(6)}  n=${String(r.n).padStart(3)}` +
    (r.errors ? `  errors=${r.errors}` : '')
  )
  return `\n${title}\n${lines.join('\n')}\n`
}

export function renderConsole (summary) {
  let out = `\nOVERALL ${pct(summary.overall)}   cost $${summary.totalCostUsd}\n`
  out += table('BY MODEL', summary.byModel)
  out += table('BY VARIANT', summary.byVariant)
  out += table('BY STYLE x MODEL', summary.byStyleModel)
  out += table('BY CASE', summary.byCase)
  out += table('BY SPLIT', summary.bySplit)

  const f = summary.failures.slice(0, 12)
  if (f.length) {
    out += '\nWORST RULES\n'
    for (const x of f) {
      out += `  ${x.checkId} @ ${x.model} (${x.styleId})  avg ${pct(x.avgScore)}  n=${x.n}\n`
      for (const e of x.evidence.slice(0, 2)) out += `      ${e}\n`
    }
  }
  return out
}

export function renderMarkdown (summary, meta = {}) {
  const md = (title, rows) => rows.length
    ? `\n### ${title}\n\n| | score | rules | judge | n | errors |\n|---|---|---|---|---|---|\n` +
      rows.map(r => `| ${r.key} | ${pct(r.score)} | ${pct(r.rules)} | ${pct(r.judge)} | ${r.n} | ${r.errors} |`).join('\n') + '\n'
    : ''

  return [
    '# Output style adherence report', '',
    `**Overall:** ${pct(summary.overall)}  |  **Cost:** $${summary.totalCostUsd}` +
      (meta.when ? `  |  **Run:** ${meta.when}` : ''), '',
    md('By model', summary.byModel),
    md('By variant', summary.byVariant),
    md('By style x model', summary.byStyleModel),
    md('By case', summary.byCase),
    md('By split (overfit check)', summary.bySplit),
    '\n### Worst rules\n',
    '| rule | model | style | avg | n | evidence |',
    '|---|---|---|---|---|---|',
    ...summary.failures.slice(0, 20).map(f =>
      `| ${f.checkId} | ${f.model} | ${f.styleId} | ${pct(f.avgScore)} | ${f.n} | ${(f.evidence[0] ?? '').replace(/\|/g, '\\|').slice(0, 90)} |`)
  ].join('\n')
}
