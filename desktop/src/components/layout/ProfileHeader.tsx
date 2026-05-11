'use client'

import { Box, HStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../services/api'
import { ProfileSection } from './sidebar/ProfileSection'
import { COLORS } from '../../styles/common'

export function ProfileHeader() {
  const router = useRouter()
  const { user } = useAuth()

  const profileImage = user?.id ? `${API_URL}users/${user.id}/profile-image` : null
  const displayName = user?.name || user?.username || 'Guest'

  return (
    <Box display={{ base: "block", md: "none" }} p={{base:1, md:4}} bg="#141414" color={COLORS.text.primary} >
      <HStack>
        <ProfileSection 
          displayName={displayName}
          profileImage={profileImage}
          isExpanded={true}
          onNavigate={() => router.push('/profile')}
        />
      </HStack>
      
    </Box>
  )
}