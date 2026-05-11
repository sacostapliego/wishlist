import { useState, useEffect, useCallback } from 'react'

type SidebarState = 'expanded' | 'collapsed' | 'hidden'

const SIDEBAR_WIDTHS = {
  expanded: 280,
  collapsed: 80,
  hidden: 0,
}

const STORAGE_KEY = 'sidebar-width'

export function useSidebarResize() {
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored as SidebarState) || 'expanded'
  })

  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, sidebarState)
  }, [sidebarState])

  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const width = e.clientX

      if (width < 120) {
        setSidebarState('hidden')
      } else if (width < 200) {
        setSidebarState('collapsed')
      } else {
        setSidebarState('expanded')
      }
    },
    [isResizing]
  )

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return {
    sidebarState,
    sidebarWidth: SIDEBAR_WIDTHS[sidebarState],
    isResizing,
    handleMouseDown,
    toggleSidebar: () => {
      setSidebarState((prev) => {
        if (prev === 'expanded') return 'collapsed'
        if (prev === 'collapsed') return 'hidden'
        return 'expanded'
      })
    },
  }
}