/**
 * How far ahead the home page looks for an upcoming occasion.
 * Beyond this there is no "Up Next" — a hero reading "in 243 days" is worse than none.
 */
export const UPCOMING_HORIZON_DAYS = 60

/**
 * How far ahead the home page shows gifts you've claimed.
 * A gift for an occasion six months out is a commitment, not something you can
 * act on today — it stays on the Items Claimed page, off the home page.
 */
export const CLAIMED_HORIZON_DAYS = 90

/** Days out at which a due date starts reading as urgent. */
export const DUE_SOON_DAYS = 14

/**
 * Parse a YYYY-MM-DD date as LOCAL midnight.
 *
 * `new Date('2026-02-14')` is parsed as UTC midnight, which is the previous day
 * in any timezone west of UTC. That skews every countdown by a day, so dates
 * coming from the API are split and rebuilt locally.
 */
export function parseLocalDate(due_date?: string | null): Date | null {
  if (!due_date) return null

  const [datePart] = due_date.split('T')
  const [year, month, day] = datePart.split('-').map(Number)

  if (!year || !month || !day) return null

  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Whole days from today until the due date.
 * 0 is today, 1 is tomorrow, negative is in the past. Null when undated.
 */
export function daysUntil(due_date?: string | null): number | null {
  const due = parseLocalDate(due_date)
  if (!due) return null

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.round((due.getTime() - startOfToday().getTime()) / msPerDay)
}

/**
 * Returns true if the wishlist is "active":
 * - has a due_date AND that date is today or in the future
 * Returns false if:
 * - due_date is null/undefined (no date = inactive)
 * - due_date is in the past
 */
export function isWishlistActive(due_date?: string | null): boolean {
  const days = daysUntil(due_date)
  return days !== null && days >= 0
}

/**
 * True when the list is still worth showing on home: either it has no date yet
 * (a list being built toward some future occasion) or that date hasn't passed.
 * Only a list whose date is behind us is "previous", and those are left to the
 * full lists page.
 */
export function isWishlistCurrent(due_date?: string | null): boolean {
  const days = daysUntil(due_date)
  return days === null || days >= 0
}

/**
 * True when the date is today or later AND no further out than `horizonDays`.
 * Undated and past dates are both false.
 */
export function isWithinDays(due_date: string | null | undefined, horizonDays: number): boolean {
  const days = daysUntil(due_date)
  return days !== null && days >= 0 && days <= horizonDays
}

/** "today" | "tomorrow" | "in 6 days" — null when undated or past. */
export function formatCountdown(due_date?: string | null): string | null {
  const days = daysUntil(due_date)
  if (days === null || days < 0) return null

  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

/** Urgency of a due date, for badge styling. Null when there is nothing to show. */
export function getDueUrgency(due_date?: string | null): 'soon' | 'later' | null {
  const days = daysUntil(due_date)
  if (days === null || days < 0) return null
  return days <= DUE_SOON_DAYS ? 'soon' : 'later'
}

/** "December 25" */
export function formatDueDate(due_date?: string | null): string | null {
  const due = parseLocalDate(due_date)
  if (!due) return null
  return due.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

interface DatedWishlist {
  due_date?: string | null
}

export interface UpNextGroup<T extends DatedWishlist> {
  /** The shared due date, as the raw YYYY-MM-DD key. */
  dueDate: string
  /** Days from today until that date. */
  days: number
  /** Every list sharing the date. Caller decides the sort. */
  lists: T[]
}

/**
 * The nearest upcoming date within the horizon, with every list falling on it.
 *
 * Grouped by date rather than by list: multiple friends can have a list due on
 * Christmas, and the user thinks in occasions, not in lists.
 */
export function getUpNextGroup<T extends DatedWishlist>(
  lists: T[],
  horizonDays: number = UPCOMING_HORIZON_DAYS
): UpNextGroup<T> | null {
  const byDate = new Map<string, { days: number; lists: T[] }>()

  for (const list of lists) {
    const days = daysUntil(list.due_date)
    if (days === null || days < 0 || days > horizonDays) continue

    // Normalise so '2026-12-25' and '2026-12-25T00:00:00' group together.
    const key = (list.due_date as string).split('T')[0]
    const group = byDate.get(key)

    if (group) {
      group.lists.push(list)
    } else {
      byDate.set(key, { days, lists: [list] })
    }
  }

  if (byDate.size === 0) return null

  const nearest = [...byDate.entries()].sort((a, b) => a[1].days - b[1].days)[0]

  return {
    dueDate: nearest[0],
    days: nearest[1].days,
    lists: nearest[1].lists,
  }
}


/** "1 item" / "3 items" — count and noun, so lists never read "1 items". */
export function formatItemCount(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}
