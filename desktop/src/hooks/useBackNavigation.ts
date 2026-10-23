'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * A record of the pages visited *inside this tab of the app*, so a back arrow
 * can tell "the previous page was ours" apart from "the previous page was
 * iMessage / Google / nothing".
 *
 * `router.back()` alone cannot: someone who opens a shared link has no in-app
 * history, and back either does nothing or leaves the site. With this, back
 * steps through what the person actually saw, and falls back to the page's
 * logical parent when there is nothing to step through.
 *
 * Auth pages are left out. Login and register hand off with `replace`, so they
 * never stay in the browser history, and counting them would point back at a
 * page that is no longer there.
 */
const stack: string[] = []
const listeners = new Set<() => void>()

/*
  A `replace` swaps the current history entry instead of adding one, which a
  pathname alone cannot reveal. Replacing through the hook's `replace` sets this so
  the stack swaps its top too. The stack must never hold *more* entries than
  the browser: that is the case where back would leave the site. Holding fewer
  (after a reload, say) only means back goes to the page's parent instead.
*/
let pendingReplace = false

function isTracked(pathname: string) {
  return !pathname.startsWith('/auth')
}

function record(pathname: string) {
  if (!isTracked(pathname)) return

  if (pendingReplace) {
    pendingReplace = false
    if (stack.length === 0) stack.push(pathname)
    else stack[stack.length - 1] = pathname
    listeners.forEach((listener) => listener())
    return
  }

  if (stack[stack.length - 1] === pathname) return

  // Arriving at the entry below the top is taken as a step back (browser back
  // button or swipe). If it was really a link to that page, the stack ends up
  // short, which is the safe direction.
  if (stack[stack.length - 2] === pathname) {
    stack.pop()
  } else {
    stack.push(pathname)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const getDepth = () => stack.length
const getServerDepth = () => 0

/** Mounted once in the root layout. */
export function NavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) record(pathname)
  }, [pathname])

  return null
}

/**
 * @param fallback where back goes when there is no in-app page to return to —
 *   the page's logical parent. `null` means there is no sensible parent (a
 *   guest on a shared list), and the arrow should be hidden.
 */
export function useBackNavigation(fallback: string | null) {
  const router = useRouter()
  const depth = useSyncExternalStore(subscribe, getDepth, getServerDepth)

  const hasHistory = depth > 1

  const replace = (path: string) => {
    pendingReplace = true
    router.replace(path)
  }

  const goBack = () => {
    // Read the stack at click time, not render time — it is up to date by now.
    if (stack.length > 1) {
      router.back()
    } else if (fallback) {
      replace(fallback)
    }
  }

  /**
   * Leave this page for `path` without leaving it behind in history — for when
   * the page stops existing (a deleted item or list). Steps back if `path` is
   * where we came from, so the list is not stacked on top of itself.
   */
  const leaveTo = (path: string) => {
    if (stack[stack.length - 2] === path) {
      router.back()
    } else {
      replace(path)
    }
  }

  return { canGoBack: hasHistory || fallback !== null, goBack, leaveTo, replace }
}

/**
 * Only same-origin paths are allowed as a post-login destination, so a crafted
 * `?next=https://evil.example` link cannot bounce someone off-site.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || next.startsWith('/auth')) {
    return null
  }
  return next
}
