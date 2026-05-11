import { useAuth } from '../../context/AuthContext'
import ResponsiveLayout from '../layout/ResponsiveLayout'

/**
 * A route wrapper that allows both authenticated and unauthenticated users.
 * Authenticated users get the full layout (sidebar, etc.).
 * Guests get a minimal layout.
 */
export function PublicOrProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return null // or a loading spinner
  }

  if (isLoggedIn) {
    // Authenticated users get the full layout
    return <ResponsiveLayout />
  }

  // Guest users get a minimal layout (no sidebar)
  return <>{children}</>
}