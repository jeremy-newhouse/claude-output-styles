// Shared fake `query()` generators for driving a real AbortController abort
// through an injected `queryFn` seam, without spending a model call. Used by
// every test that proves a wall-clock timeout actually fires — run.test.mjs's
// own copies predate this file and cover `runCell`'s cell-level guard, which
// has a different shape (multi-turn, tool calls); these cover the simpler
// single-turn, no-tool query() shape judge.mjs's judge() and improve.mjs's
// rewrite() both use.

/** A query that hangs until aborted, then throws — the SDK's usual abort path. */
export const throwsOnAbort = async function * ({ options }) {
  await new Promise((_resolve, reject) => {
    options.abortController.signal.addEventListener(
      'abort', () => reject(new Error('This operation was aborted')), { once: true })
  })
}

/** A query that hangs until aborted, then ends the iterator with no output at all. */
export const quietOnAbort = async function * ({ options }) {
  await new Promise(resolve => {
    options.abortController.signal.addEventListener('abort', resolve, { once: true })
  })
}
