'use client'

import { Box, HStack, IconButton } from '@chakra-ui/react'
import { LuUsers } from 'react-icons/lu'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../services/api'
import { ProfileSection } from './sidebar/ProfileSection'
import { COLORS } from '../../styles/common'

/**
 * The mobile counterpart to the sidebar's profile row.
 *
 * Friends lives here rather than in the bottom nav because the sidebar — the
 * desktop navigation this stands in for — carries Home, Create and Friends,
 * while the bottom bar carries Home, Create and Claimed. Without this, Friends
 * is unreachable on a phone except through "Show all" on the home page.
 */
export function ProfileHeader() {
  const router = useRouter()
  const { user } = useAuth()

  const profileImage = user?.id ? `${API_URL}users/${user.id}/profile-image` : null
  const displayName = user?.name || user?.username || 'Guest'

  return (
    <Box display={{ base: "block", md: "none" }} p={{base:1, md:4}} bg="#141414" color={COLORS.text.primary} >
      <HStack gap={2}>
        {/* minW={0} lets a long display name clamp instead of pushing the button off screen */}
        <Box flex="1" minW={0}>
          <ProfileSection
            displayName={displayName}
            profileImage={profileImage}
            isExpanded={true}
            onNavigate={() => router.push('/profile')}
          />
        </Box>

        <IconButton
          aria-label="Friends"
          variant="ghost"
          color={COLORS.text.muted}
          flexShrink={0}
          mr={1}
          onClick={() => router.push('/friends')}
          _hover={{ bg: 'whiteAlpha.100' }}
        >
          <LuUsers />
        </IconButton>
      </HStack>
    </Box>
  )
}
