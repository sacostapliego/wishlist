/**
 * Returns true if the wishlist is "active":
 * - has a due_date AND that date is today or in the future
 * Returns false if:
 * - due_date is null/undefined (no date = inactive)
 * - due_date is in the past
 */
export function isWishlistActive(due_date?: string | null): boolean {
  if (!due_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date)
  due.setHours(0, 0, 0, 0)
  return due >= today
}