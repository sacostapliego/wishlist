'use client'

import { useEffect, useState } from 'react'

/**
 * A live readout of scroll and viewport values, for chasing layout glitches on a
 * real phone - it is how the iOS Safari header bug in useScrollToTop was found
 * (every value read 0 while the page was drawn scrolled).
 *
 * Off by default. Turn it on with NEXT_PUBLIC_SCROLL_DEBUG=1 in .env.local and
 * restart the dev server.
 */
export function ScrollDebug() {
  const [text, setText] = useState('')

  useEffect(() => {
    // Read env(safe-area-inset-top) through a probe element
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)

    const id = setInterval(() => {
      const vv = window.visualViewport
      const pane = document.querySelector<HTMLElement>('.scroll-container-ios')
      const back = document.querySelector<HTMLElement>('[aria-label="Go back"]')
      const r = (n: number | undefined) => (n === undefined ? '-' : Math.round(n))
      setText(
        [
          `winY ${r(window.scrollY)} html ${r(document.documentElement.scrollTop)} body ${r(document.body.scrollTop)} pane ${r(pane?.scrollTop)}`,
          `vvTop ${r(vv?.offsetTop)} vvH ${r(vv?.height)} innerH ${r(window.innerHeight)} docH ${r(document.documentElement.scrollHeight)}`,
          `safeTop ${r(probe.offsetHeight)} paneTop ${r(pane?.getBoundingClientRect().top)} backTop ${r(back?.getBoundingClientRect().top)}`,
        ].join('\n')
      )
    }, 250)

    return () => {
      clearInterval(id)
      probe.remove()
    }
  }, [])

  return (
    <pre
      style={{
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
        zIndex: 9999,
        margin: 0,
        padding: '6px 8px',
        background: 'rgba(0,0,0,0.8)',
        color: '#0f0',
        font: '11px/1.4 ui-monospace, monospace',
        borderRadius: 6,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </pre>
  )
}
