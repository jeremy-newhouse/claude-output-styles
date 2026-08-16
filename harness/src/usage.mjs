// Usage text and the help guard, kept out of cli.mjs so they can be imported
// and tested without executing the CLI (importing cli.mjs runs it).

export const USAGE = `
output-style harness

  node src/cli.mjs run       [--styles=a,b] [--models=opus,sonnet] [--variants=baseline]
                             [--cases=id,id] [--repeats=2] [--concurrency=4] [--no-judge]
  node src/cli.mjs improve   [--styles=a] [--iterations=6] [--variants=baseline]
  node src/cli.mjs score     --rows=results/<stamp>/rows.json
  node src/cli.mjs audit     [--styles=a,b]

  run      evaluate the matrix and write results/<stamp>/{rows,summary,report.md}
  improve  loop: measure -> rewrite the style -> re-measure -> keep if train up and holdout flat,
           then validate the winner on the reserve split and roll back to v0 if it regresses
  score    re-score saved transcripts offline after changing checks.mjs
  audit    check every style file's stated caps against contracts.json; exit 1 on disagreement

  --help   print this and exit, on any subcommand
`

/**
 * True when the argv asks for usage rather than work.
 *
 * `--help` used to be parsed as just another inert flag, so `run --help` ran the
 * entire paid matrix instead of printing this text. Because `run` writes
 * rows.json only after the whole matrix finishes, killing it lost every cell it
 * had already paid for. Any help-shaped argv must short-circuit before the CLI
 * reads config or spends a token.
 */
export function wantsHelp (args) {
  const positionals = args._ ?? []
  const cmd = positionals[0]
  // `-h` is checked among the positionals on purpose: parseArgs only recognises
  // `--`-prefixed flags, so a single-dash `-h` lands in `_` and would otherwise
  // fall straight through to a paid run.
  const shortFlag = positionals.some(a => a === '-h' || a === '-help')
  return Boolean(args.help ?? args.h) || shortFlag || cmd === undefined || cmd === 'help'
}
