'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

// A second resync once late images have had a moment to change the page height
const LATE_RESYNC_MS = 500

function scrollRoot() {
  return document.scrollingElement ?? document.documentElement
}

function pinTop() {
  // Plain scrollTop rather than scrollTo({ behavior }) - immune to smooth-scroll
  // CSS and to browsers that reject the 'instant' value
  const root = scrollRoot()
  if (root.scrollTop !== 0) root.scrollTop = 0
  // body is the scroller instead of <html> when something sets overflow on it
  if (document.body.scrollTop !== 0) document.body.scrollTop = 0
  // The layout's content pane is also an overflow container; clear it too
  document.querySelectorAll<HTMLElement>('.scroll-container-ios').forEach((el) => {
    if (el.scrollTop !== 0) el.scrollTop = 0
  })
}

/**
 * iOS Safari (seen on iOS 26, with the toolbar collapsed) can paint the page
 * scrolled while the DOM reports scrollTop 0 - the header lands under the status
 * bar and every reading says it is at the top. Setting 0 again is a no-op that
 * never reaches Safari's display, so make a real 1px scroll in one frame and
 * return to 0 a couple of frames later, forcing the display back in sync.
 * Returns a cancel function.
 */
function resyncTop() {
  const root = scrollRoot()
  let frame = requestAnimationFrame(() => {
    // Nothing to scroll means nothing can be out of sync
    if (root.scrollHeight <= root.clientHeight) return
    root.scrollTop = 1
    // Two frames so the 1px offset is committed before it is undone
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (root.scrollTop <= 1) root.scrollTop = 0
      })
    })
  })
  return () => cancelAnimationFrame(frame)
}

/**
 * Pin the window to the top on navigation, and again whenever `ready` flips —
 * pages that render a loading placeholder first swap their real content in
 * after the first pass, and iOS Safari can leave the page part-scrolled
 * (header tucked under the status bar) across that swap.
 */
export function useScrollToTop(ready: boolean = true) {
  const pathname = usePathname()

  // Layout effect so the reset lands before the first paint of the new content
  useLayoutEffect(() => {
    if (!ready) return
    pinTop()

    let cancelResync = resyncTop()
    const late = setTimeout(() => {
      cancelResync()
      cancelResync = resyncTop()
    }, LATE_RESYNC_MS)

    // Once the person touches the page the scroll is theirs - stop adjusting it
    const release = () => {
      clearTimeout(late)
      cancelResync()
      window.removeEventListener('pointerdown', release)
      window.removeEventListener('wheel', release)
    }
    window.addEventListener('pointerdown', release, { passive: true })
    window.addEventListener('wheel', release, { passive: true })

    return release
  }, [pathname, ready])
}
