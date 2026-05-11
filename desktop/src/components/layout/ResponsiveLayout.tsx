'use client'

import type { ReactNode } from 'react'
import { Box, Flex, IconButton } from '@chakra-ui/react'
import { LuPanelLeft } from 'react-icons/lu'
import Sidebar from './SideBar'
import MobileNav from './MobileNav'
import { useSidebarResize } from '../../hooks/useSidebarResize'
import { useScrollToTop } from '../../hooks/useScrollToTop'

interface ResponsiveLayoutProps {
  children?: ReactNode
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { sidebarState, sidebarWidth, isResizing, handleMouseDown, toggleSidebar } = useSidebarResize()
  useScrollToTop()

  return (
    <Flex minH="100vh" bg={{base:"#141414", md:"#070707"}} p={{ base: 0, md: 4 }} gap={{ base: 0, md: 4 }}>
      {/* Show Sidebar Toggle when Hidden */}
      {sidebarState === 'hidden' && (
        <IconButton
          aria-label="Show sidebar"
          position="fixed"
          left="1"
          height="calc(100vh - 32px)"
          display={{ base: "none", md: "flex" }}
          onClick={toggleSidebar}
          zIndex={10}
          variant={"ghost"}
        >
          <LuPanelLeft />
        </IconButton>
      )}

      {/* Desktop Sidebar */}
      <Box
        display={{ base: "none", md: "block" }}
        w={`${sidebarWidth}px`}
        position="fixed"
        left="16px"
        h="calc(100vh - 32px)"
        transition={isResizing ? 'none' : 'width 0.2s'}
        borderRadius="lg"
        overflow="hidden"
      >
        <Sidebar
          isExpanded={sidebarState === 'expanded'}
          isCollapsed={sidebarState === 'collapsed'}
          isHidden={sidebarState === 'hidden'}
          onToggle={toggleSidebar}
        />
      </Box>

      {/* Resize Handle */}
      {sidebarState !== 'hidden' && (
        <Box
          display={{ base: "none", md: "block" }}
          position="fixed"
          left={`calc(${sidebarWidth}px + 35px)`}
          top="16px"
          h="calc(100vh - 32px)"
          w="8px"
          ml="-4px"
          cursor="col-resize"
          onMouseDown={handleMouseDown}
          _hover={{ bg: 'whiteAlpha.300' }}
          transition={isResizing ? 'none' : 'left 0.2s'}
          zIndex={5}
        />
      )}

      {/* Main Content */}
      <Box
        flex="1"
        ml={{ base: 0, md: `calc(${sidebarWidth}px + 35px)` }}
        mb={{ base: '80px', md: 0}}
        transition={isResizing ? 'none' : 'margin-left 0.2s'}
        borderRadius={{ base: 0, md: "lg" }}
        bg="#141414"
        overflowY="auto"
        overflowX="hidden"
        className="scroll-container-ios"
        style={{
          ['--sidebar-width' as string]: `${sidebarWidth}px`,
        } as React.CSSProperties}
      >
        {children}
      </Box>

      {/* Mobile Bottom Nav */}
       <MobileNav />
    </Flex>
  )
}