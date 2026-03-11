import { describe, it, expect } from 'vitest'
import { formatDate, formatDateTime } from './utils'

describe('utils', () => {
  describe('formatDate', () => {
    it('formats a Date object correctly in en-IN format', () => {
      // Create date without timezone bias to test the formatting structure
      const date = new Date(2023, 11, 25) // Dec 25 2023, local time
      expect(formatDate(date)).toMatch(/25 Dec 2023/i)
    })

    it('formats a date string correctly in en-IN format', () => {
      const dateString = new Date(2023, 11, 25).toISOString()
      expect(formatDate(dateString)).toMatch(/25 Dec 2023/i)
    })

    it('handles single digit days and months properly', () => {
      const date = new Date(2023, 0, 5) // Jan 5 2023
      expect(formatDate(date)).toMatch(/05 Jan 2023/i)
    })
  })

  describe('formatDateTime', () => {
    it('formats a Date object correctly including time', () => {
      const date = new Date(2023, 11, 25, 14, 30) // Dec 25 2023, 14:30
      const formatted = formatDateTime(date)

      // Should contain date parts
      expect(formatted).toMatch(/25 Dec 2023/i)
      // Should contain time parts (could be 14:30 or 02:30 pm depending on en-IN implementation)
      expect(formatted).toMatch(/0?2:30\s*(am|pm)/i)
    })

    it('formats a date string correctly including time', () => {
      const date = new Date(2023, 11, 25, 9, 5) // Dec 25 2023, 09:05
      const dateString = date.toISOString()
      const formatted = formatDateTime(dateString)

      expect(formatted).toMatch(/25 Dec 2023/i)
      expect(formatted).toMatch(/0?9:05\s*(am|pm)/i)
    })

    it('handles edge case: midnight', () => {
      const date = new Date(2023, 11, 25, 0, 0) // Dec 25 2023, 00:00
      const formatted = formatDateTime(date)

      expect(formatted).toMatch(/25 Dec 2023/i)
      expect(formatted).toMatch(/12:00\s*(am|pm)/i)
    })
  })
})
