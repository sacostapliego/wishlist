import { Avatar } from '@chakra-ui/react'
import { SidebarRow } from './SidebarRow'

interface ProfileSectionProps {
  displayName: string
  profileImage: string | null
  isExpanded: boolean
  onNavigate: () => void
}

export function ProfileSection({ displayName, profileImage, isExpanded, onNavigate }: ProfileSectionProps) {
  return (
    <SidebarRow
      icon={
        <Avatar.Root size="sm">
          <Avatar.Fallback name={displayName} />
          <Avatar.Image src={profileImage || undefined} />
        </Avatar.Root>
      }
      label={displayName}
      ariaLabel="Profile"
      isExpanded={isExpanded}
      onClick={onNavigate}
    />
  )
}
