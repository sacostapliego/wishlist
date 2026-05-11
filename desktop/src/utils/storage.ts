function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key) ?? getCookie(key)
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
    if (key === 'auth_token') {
      setCookie(key, value)
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
    if (key === 'auth_token') {
      deleteCookie(key)
    }
  },
}

export default storage
