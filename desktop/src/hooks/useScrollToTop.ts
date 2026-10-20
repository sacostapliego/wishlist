'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Pin the window to the top on navigation, and again whenever `ready` flips —
 * pages that render a loading placeholder first swap their real content in
 * after the first pass, and iOS Safari can leave the page part-scrolled
 * (header tucked under the status bar) across that swap.
 */
export function useScrollToTop(ready: boolean = true) {
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    // Next's router applies its own scroll after child effects run; re-pin a frame later so ours wins
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [pathname, ready])
}
