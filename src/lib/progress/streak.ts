const DAY_MS = 86_400_000

function localDayStart(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Consecutive study days ending today, or yesterday if today has no study yet.
 * `dates` are `Date.toDateString()` values from the study log. They must be
 * compared as dates: sorted as strings, "Wed ..." lands after "Tue ..." and
 * the run is broken at random.
 */
export function streakFromDates(dates: string[], now: number): number {
  const days = [...new Set(
    dates.map((s) => new Date(s).getTime()).filter((t) => !Number.isNaN(t)).map(localDayStart)
  )].sort((a, b) => b - a)
  if (days.length === 0) return 0

  const today = localDayStart(now)
  // Round, not floor: a DST shift makes a calendar day 23 or 25 hours long.
  const gap = (a: number, b: number) => Math.round((a - b) / DAY_MS)
  if (gap(today, days[0]) > 1) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    if (gap(days[i - 1], days[i]) !== 1) break
    streak++
  }
  return streak
}
