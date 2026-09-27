import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

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
    id: string;
    wishlist_id: string;
    display_name: string;
}

interface StoredGuestSession {
    token: string;
    display_name: string;
}

const storageKey = (wishlistId: string) => `guest_session:${wishlistId}`;

async function readStored(wishlistId: string): Promise<StoredGuestSession | null> {
    try {
        const raw = await AsyncStorage.getItem(storageKey(wishlistId));
        return raw ? (JSON.parse(raw) as StoredGuestSession) : null;
    } catch {
        return null;
    }
}

export async function getGuestToken(wishlistId?: string): Promise<string | null> {
    if (!wishlistId) return null;
    const stored = await readStored(wishlistId);
    return stored?.token ?? null;
}

export async function getGuestDisplayName(wishlistId?: string): Promise<string | null> {
    if (!wishlistId) return null;
    const stored = await readStored(wishlistId);
    return stored?.display_name ?? null;
}

export async function clearGuestSession(wishlistId: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(storageKey(wishlistId));
    } catch {
        // nothing to do
    }
}

/** Headers to attach to any request that should act as this guest. */
export async function guestHeaders(wishlistId?: string): Promise<Record<string, string>> {
    const token = await getGuestToken(wishlistId);
    return token ? { 'X-Guest-Token': token } : {};
}

export const guestSessionAPI = {
    /** Names a guest on a shared wishlist and stores the token they get back. */
    start: async (wishlistId: string, displayName: string): Promise<GuestSession> => {
        const response = await api.post('/guest-session/', {
            wishlist_id: wishlistId,
            display_name: displayName,
        });

        const { token, ...session } = response.data;

        try {
            await AsyncStorage.setItem(
                storageKey(wishlistId),
                JSON.stringify({ token, display_name: session.display_name })
            );
        } catch {
            // Storage full or unavailable - the claim still works, the guest
            // just cannot undo it later.
        }

        return session as GuestSession;
    },

    /**
     * Confirms a stored token is still valid. Returns null when it is not, so
     * the caller can drop the stale session and ask for a name again.
     */
    me: async (wishlistId: string): Promise<GuestSession | null> => {
        const token = await getGuestToken(wishlistId);
        if (!token) return null;

        try {
            const response = await api.get('/guest-session/me', {
                params: { wishlist_id: wishlistId },
                headers: { 'X-Guest-Token': token },
            });

            if (!response.data) {
                await clearGuestSession(wishlistId);
                return null;
            }

            return response.data as GuestSession;
        } catch {
            return null;
        }
    },
};

export default guestSessionAPI;
