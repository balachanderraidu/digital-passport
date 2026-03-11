import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format a valid Date object correctly', () => {
    // Note: The formatted output depends on the timezone if not careful,
    // but the input is new Date(year, monthIndex, day) which is local time.
    // 'en-IN' locale with { day: '2-digit', month: 'short', year: 'numeric' }
    // typically produces "DD MMM YYYY", e.g. "01 Jan 2024" or "1 Jan 2024"
    const date = new Date(2024, 0, 15); // Jan 15, 2024 local time
    // en-IN output for Jan 15 2024 is "15 Jan 2024"
    const formatted = formatDate(date);
    expect(formatted).toBe('15 Jan 2024');
  });

  it('should format a valid date string correctly', () => {
    // ISO string "2024-05-20T12:00:00Z"
    const dateStr = '2024-05-20T12:00:00Z';
    // When parsing this as local time, the day could be 20 or 21 depending on timezone.
    // Let's test using a strict local date string that works across timezones.
    // Or just evaluate against the local Date conversion.
    const expectedDate = new Date(dateStr);
    const expectedFormatted = expectedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    expect(formatDate(dateStr)).toBe(expectedFormatted);
  });

  it('should handle edge cases like leap years', () => {
    const date = new Date(2024, 1, 29); // Feb 29, 2024
    expect(formatDate(date)).toBe('29 Feb 2024');
  });

  it('should handle invalid date strings gracefully by returning "Invalid Date"', () => {
    // JavaScript Date returns "Invalid Date" for invalid dates when formatting in some engines,
    // let's test what `formatDate` returns for an invalid string.
    const result = formatDate('not-a-date');
    expect(result).toBe('Invalid Date');
  });
});
