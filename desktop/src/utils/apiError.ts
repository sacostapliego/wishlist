/**
 * The sentence the API sent, or a fallback.
 *
 * The backend refuses things deliberately and says why: an item takes
 * contributions rather than being claimed, people have already pledged, the
 * list is not shared. Each of those is worth reading. A hand-written catch-all
 * throws that away and guesses instead - and a wrong guess ("it may already be
 * claimed" on an item nobody has claimed) sends whoever is debugging it looking
 * in the wrong place entirely.
 */
export function apiMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return typeof detail === 'string' && detail ? detail : fallback
}

export default apiMessage
