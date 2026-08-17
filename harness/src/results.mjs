import { writeFileSync, renameSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { summarize } from './evaluate.mjs'
import { renderMarkdown } from './report.mjs'

export { describeManifest } from './report.mjs'

/**
 * The sibling file that says whether the rows beside it are the whole run.
 * `rows.json` stays a bare array — every saved run in the ledger is one, and
 * `score --rows=` and every offline re-derivation read it as one — so the
 * completeness flag has to live somewhere else.
 */
export const MANIFEST = 'run.json'

/**
 * Write via a temp file and rename. A run is expected to end by being killed,
 * and a kill landing inside a plain writeFileSync would truncate the one file
 * that holds the cells the run paid for. rename(2) is atomic on POSIX, so a
 * reader sees either the previous flush or this one, never half of either.
 */
export function writeAtomic (path, text) {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
}

/**
 * Persist one flush of a run: the rows, their summary, the rendered report and
 * the manifest that describes how far the run got.
 *
 * Call it after every completed cell. The rows are the expensive part; the
 * other three are cheap to regenerate and are kept in step so the directory
 * describes itself at any moment it is interrupted.
 *
 * Rewriting the whole file per cell is quadratic in bytes written, which is
 * deliberate: the largest arm this project plans is 146 cells at a few KB each,
 * so the cumulative write is tens of megabytes against cells that cost real
 * money and take tens of seconds. Appending would be cheaper and would cost the
 * property that makes this worth having — that the file on disk is always a
 * valid, complete-in-itself JSON array.
 *
 * @param {object[]} rows      every cell completed so far, in matrix order
 * @param {number|null} expected  cells the matrix will produce, if known
 * @param {boolean} complete   true only once the run has finished
 */
export function writeResults ({ outDir, rows, stamp, kind = 'run', expected = null, complete = false }) {
  const summary = summarize(rows)
  const manifest = {
    kind,
    stamp,
    complete,
    completed: rows.length,
    expected,
    costUsd: summary.totalCostUsd
  }
  writeAtomic(join(outDir, 'rows.json'), JSON.stringify(rows, null, 2))
  writeAtomic(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
  // The report carries the manifest as a banner: it is the file the runbook
  // sends a reader to first, and an unlabelled partial one reads as a finished
  // arm.
  writeAtomic(join(outDir, 'report.md'), renderMarkdown(summary, { when: stamp, manifest }))
  // Manifest last, deliberately. A kill between the rows and the manifest
  // leaves a manifest that undercounts what is on disk, which reads as "less
  // finished than it is". Writing it first would let a manifest claim cells
  // that never landed, and claim `complete` for a file that is not.
  writeAtomic(join(outDir, MANIFEST), JSON.stringify(manifest, null, 2))
  return { summary, manifest }
}

/** The manifest beside a rows.json, or null if there is none or it is unreadable. */
export function readManifest (rowsPath) {
  const p = join(dirname(rowsPath), MANIFEST)
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

