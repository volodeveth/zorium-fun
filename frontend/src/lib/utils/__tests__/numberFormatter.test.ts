import { formatZoriumBalance } from '../numberFormatter'

describe('formatZoriumBalance', () => {
  // Test full numbers (1-9999)
  test('should display full numbers from 1 to 9999', () => {
    expect(formatZoriumBalance(1)).toBe('1')
    expect(formatZoriumBalance(42)).toBe('42')
    expect(formatZoriumBalance(999)).toBe('999')
    expect(formatZoriumBalance(9999)).toBe('9999')
  })

  // Test K formatting (10K+)
  test('should format thousands with K suffix', () => {
    expect(formatZoriumBalance(10000)).toBe('10K')
    expect(formatZoriumBalance(10200)).toBe('10.2K')
    expect(formatZoriumBalance(20000)).toBe('20K')
    expect(formatZoriumBalance(25500)).toBe('25.5K')
    expect(formatZoriumBalance(100000)).toBe('100K')
    expect(formatZoriumBalance(150000)).toBe('150K')
    expect(formatZoriumBalance(999000)).toBe('999K')
  })

  // Test M formatting (1M+)
  test('should format millions with M suffix', () => {
    expect(formatZoriumBalance(1000000)).toBe('1M')
    expect(formatZoriumBalance(1200000)).toBe('1.2M')
    expect(formatZoriumBalance(10000000)).toBe('10M')
    expect(formatZoriumBalance(10200000)).toBe('10.2M')
    expect(formatZoriumBalance(100000000)).toBe('100M')
    expect(formatZoriumBalance(150000000)).toBe('150M')
  })

  // Test B formatting (1B+)
  test('should format billions with B suffix', () => {
    expect(formatZoriumBalance(1000000000)).toBe('1B')
    expect(formatZoriumBalance(1200000000)).toBe('1.2B')
    expect(formatZoriumBalance(10000000000)).toBe('10B')
    expect(formatZoriumBalance(100000000000)).toBe('100B')
  })

  // Test edge cases
  test('should handle edge cases correctly', () => {
    expect(formatZoriumBalance(0)).toBe('0')
    expect(formatZoriumBalance(9999)).toBe('9999')
    expect(formatZoriumBalance(10000)).toBe('10K')
    expect(formatZoriumBalance(999999)).toBe('999.9K')
    expect(formatZoriumBalance(1000000)).toBe('1M')
  })

  // Test decimal rounding
  test('should round decimals appropriately', () => {
    expect(formatZoriumBalance(10150)).toBe('10.2K') // Rounds 10.15 to 10.2
    expect(formatZoriumBalance(10140)).toBe('10.1K') // Rounds 10.14 to 10.1
    expect(formatZoriumBalance(1150000)).toBe('1.2M') // Rounds 1.15 to 1.2
  })
})