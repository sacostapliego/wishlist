import { Button, HStack, IconButton, Text, VStack, Avatar } from '@chakra-ui/react'
import { COLORS } from '../../../styles/common'

interface ProfileSectionProps {
  displayName: string
  profileImage: string | null
  isExpanded: boolean
  onNavigate: () => void
}

export function ProfileSection({ displayName, profileImage, isExpanded, onNavigate }: ProfileSectionProps) {
  if (isExpanded) {
    return (
      <Button
        variant="ghost"
        justifyContent="flex-start"
        onClick={onNavigate}
        w="100%"
        h="auto"
        py={2}
      >
        <HStack gap={3}>
          <Avatar.Root size="sm">
            <Avatar.Fallback name={displayName} />
            <Avatar.Image src={profileImage || undefined} />
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text fontSize="sm" color={COLORS.text.primary} fontWeight="semibold">
              {displayName}
            </Text>
          </VStack>
        </HStack>
      </Button>
    )
  }

  return (
    <IconButton
      aria-label="Profile"
      variant="ghost"
      onClick={onNavigate}
      w="100%"
    >
      <Avatar.Root size="xs">
        <Avatar.Fallback name={displayName} />
        <Avatar.Image src={profileImage || undefined} />
      </Avatar.Root>
    </IconButton>
  )
}