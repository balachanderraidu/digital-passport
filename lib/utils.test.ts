import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('formats a Date object correctly', () => {
    // Note: Month is 0-indexed in JS Date constructor
    const date = new Date(2023, 0, 15) // Jan 15, 2023
    expect(formatDate(date)).toBe('15 Jan 2023')
  })

  it('formats a date string correctly', () => {
    expect(formatDate('2023/12/25')).toBe('25 Dec 2023')
  })

  it('pads single-digit days with a leading zero', () => {
    const date = new Date(2023, 4, 5) // May 5, 2023
    expect(formatDate(date)).toBe('05 May 2023')
  })

  it('handles leap year dates correctly', () => {
    const date = new Date(2024, 1, 29) // Feb 29, 2024
    expect(formatDate(date)).toBe('29 Feb 2024')
  })

  it('handles empty string gracefully', () => {
    expect(formatDate('')).toBe('Invalid Date')
  })

  it('handles invalid date strings gracefully', () => {
    expect(formatDate('invalid-date')).toBe('Invalid Date')
  })
})
