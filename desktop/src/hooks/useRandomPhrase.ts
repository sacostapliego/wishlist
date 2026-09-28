import { useState } from 'react'

/**
 * Picks one phrase per mount and keeps it, so a label is fresh on each visit
 * but never changes under the viewer's thumb.
 *
 * The pick happens in the useState initialiser, which is only safe because the
 * callers render after a client-side fetch and never appear in server HTML. A
 * caller that is server-rendered would get a hydration mismatch.
 */
export function useRandomPhrase(phrases: readonly string[]): string {
  const [index] = useState(() => Math.floor(Math.random() * phrases.length))
  return phrases[index]
}
