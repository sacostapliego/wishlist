import api from './api'

/**
 * Guest identity for people who claim items without making an account.
 *
 * The server hands back a random token once, at session creation; it is what
 * proves a guest owns their claims. The display name is public and proves
 * nothing, so it is never used for authorisation.
 *
 * Sessions are scoped to one wishlist, so a guest names themselves once per
 * list rather than once per item.
 */

export interface GuestSession {
  id: string
  wishlist_id: string
  display_name: string
}

interface GuestSessionCreateResponse extends GuestSession {
  token: string
}

const storageKey = (wishlistId: string) => `guest_session:${wishlistId}`

interface StoredGuestSession {
  token: string
  display_name: string
}

function readStored(wishlistId: string): StoredGuestSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(wishlistId))
    return raw ? (JSON.parse(raw) as StoredGuestSession) : null
  } catch {
    return null
  }
}

function writeStored(wishlistId: string, session: StoredGuestSession) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(wishlistId), JSON.stringify(session))
  } catch {
    // Private browsing or a full quota - the claim still works, the guest just
    // cannot undo it later.
  }
}

export function getGuestToken(wishlistId?: string): string | null {
  if (!wishlistId) return null
  return readStored(wishlistId)?.token ?? null
}

export function getGuestDisplayName(wishlistId?: string): string | null {
  if (!wishlistId) return null
  return readStored(wishlistId)?.display_name ?? null
}

export function clearGuestSession(wishlistId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(storageKey(wishlistId))
  } catch {
    // nothing to do
  }
}

/** Headers to attach to any request that should act as this guest. */
export function guestHeaders(wishlistId?: string): Record<string, string> {
  const token = getGuestToken(wishlistId)
  return token ? { 'X-Guest-Token': token } : {}
}

export const guestSessionAPI = {
  /** Names a guest on a shared wishlist and stores the token they get back. */
  start: async (wishlistId: string, displayName: string): Promise<GuestSession> => {
    const response = await api.post<GuestSessionCreateResponse>('/guest-session/', {
      wishlist_id: wishlistId,
      display_name: displayName,
    })

    const { token, ...session } = response.data
    writeStored(wishlistId, { token, display_name: session.display_name })

    return session
  },

  /**
   * Confirms a stored token is still valid. Returns null when it is not, so the
   * caller can drop the stale session and ask for a name again.
   */
  me: async (wishlistId: string): Promise<GuestSession | null> => {
    const token = getGuestToken(wishlistId)
    if (!token) return null

    try {
      const response = await api.get<GuestSession | null>('/guest-session/me', {
        params: { wishlist_id: wishlistId },
        headers: { 'X-Guest-Token': token },
      })

      if (!response.data) {
        clearGuestSession(wishlistId)
        return null
      }

      return response.data
    } catch {
      return null
    }
  },
}

export default guestSessionAPI
