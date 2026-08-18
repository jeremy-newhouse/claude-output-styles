// Flag parsing and validation shared across cli.mjs's subcommands, kept out
// of cli.mjs so it can be imported and tested without executing the CLI
// (importing cli.mjs runs it) — the same reason usage.mjs exists.

// Every flag name a subcommand accepts. Unlisted here means "unrecognised
// flag" for that subcommand (COS-24 AC1). `judge` reads opts.concurrency to
// size its rejudge() call pool, same as run/improve size evaluate()'s pool,
// so it needs the flag too even though usage.mjs's synopsis does not spell
// it out.
export const FLAGS = {
  run: ['styles', 'models', 'variants', 'cases', 'repeats', 'concurrency', 'no-judge'],
  improve: ['styles', 'models', 'variants', 'cases', 'repeats', 'concurrency', 'no-judge', 'iterations'],
  score: ['rows'],
  judge: ['rows', 'judgements', 'judges', 'judge-repeats', 'reference', 'styles', 'cases', 'concurrency'],
  audit: ['styles'],
  interval: ['before', 'after', 'metric']
}

// The only flag with no value at all. Every other flag in FLAGS takes one —
// a single set beats a parallel per-flag type table that a new flag has to
// be classified against for no behavioural payoff (list/number/value all
// enforce exactly the same "has a value" rule; only boolean differs).
export const BOOLEAN_FLAGS = new Set(['no-judge'])

/**
 * Rejects a flag this subcommand does not read, a value-taking flag with no
 * value — bare (`--models`) or written empty (`--models=`), both of which
 * otherwise become a truthy `true` or an empty string that survives a
 * truthy check downstream — and a boolean flag given a value
 * (`--no-judge=false`). Runs before any config is read or any cell is
 * measured. An unrecognised cmd is left alone; cli.mjs checks that itself,
 * before calling this, so a typo'd subcommand gets its own message instead
 * of an incidental flag complaint.
 */
export function validateFlags (cmd, args) {
  const allowed = FLAGS[cmd]
  if (!allowed) return
  for (const key of Object.keys(args)) {
    if (key === '_' || key === 'help' || key === 'h') continue
    if (!allowed.includes(key)) throw new Error(`"${cmd}" does not take --${key} — see --help`)
    const val = args[key]
    if (BOOLEAN_FLAGS.has(key)) {
      if (val !== true) throw new Error(`--${key} does not take a value (got --${key}=${val})`)
    } else if (val === true || val === '') {
      throw new Error(`--${key} needs a value`)
    }
  }
}

export const pick = (val, fallback) => val === undefined ? fallback : String(val).split(',').map(s => s.trim()).filter(Boolean)

/** Number(raw), rejecting anything non-finite by name instead of letting it become NaN downstream. */
export function num (key, raw, fallback) {
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error(`--${key}=${raw} is not a number`)
  return n
}

/** Comma-separated flag values checked against a known id list, naming whatever does not match. */
export function matchList (key, raw, known) {
  if (raw === undefined) return null
  const requested = pick(raw, [])
  if (!requested.length) throw new Error(`--${key} was passed with no values in it`)
  const unmatched = requested.filter(id => !known.includes(id))
  if (unmatched.length) throw new Error(`--${key} matches nothing: ${unmatched.join(', ')}`)
  return requested
}
