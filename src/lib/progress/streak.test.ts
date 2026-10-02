import { describe, it, expect } from 'vitest'
import { streakFromDates } from './streak'

const NOW = new Date(2026, 8, 30, 15, 0, 0).getTime()
const day = (offset: number) => new Date(2026, 8, 30 + offset, 9, 0, 0).toDateString()

describe('streakFromDates', () => {
  it('is zero with no study days', () => {
    expect(streakFromDates([], NOW)).toBe(0)
  })

  it('counts consecutive days across weekday names that sort out of order as strings', () => {
    const dates = Array.from({ length: 12 }, (_, i) => day(-i))
    expect(streakFromDates(dates, NOW)).toBe(12)
  })

  it('still counts a run that ended yesterday', () => {
    expect(streakFromDates([day(-1), day(-2), day(-3)], NOW)).toBe(3)
  })

  it('resets once a full day is missed', () => {
    expect(streakFromDates([day(-2), day(-3)], NOW)).toBe(0)
  })

  it('stops at the first gap', () => {
    expect(streakFromDates([day(0), day(-1), day(-3), day(-4)], NOW)).toBe(2)
  })

  it('ignores duplicates, order and unparseable entries', () => {
    expect(streakFromDates([day(-1), 'not a date', day(0), day(0)], NOW)).toBe(2)
  })
})
