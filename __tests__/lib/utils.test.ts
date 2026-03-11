import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge basic strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditionals (objects)', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar')
  })

  it('should handle conditionals (ternary/logical)', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
  })

  it('should merge arrays of classes', () => {
    expect(cn(['foo', 'bar'], ['baz'])).toBe('foo bar baz')
  })

  it('should correctly merge Tailwind CSS classes, resolving conflicts', () => {
    // Both 'p-4' and 'p-8' target padding, so 'p-8' should overwrite 'p-4'
    expect(cn('p-4', 'p-8')).toBe('p-8')
    // Both 'bg-red-500' and 'bg-blue-500' target background color, so 'bg-blue-500' should win
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    // Check that it merges correctly with custom classes alongside tailwind classes
    expect(cn('custom-class p-4', 'p-8')).toBe('custom-class p-8')
  })

  it('should correctly handle complex conditional class conflicts', () => {
    // p-2 is overridden by p-4
    expect(cn('p-2 text-red-500', { 'p-4': true, 'text-blue-500': false })).toBe('text-red-500 p-4')
    expect(cn('p-2 text-red-500', { 'p-4': true, 'text-blue-500': true })).toBe('p-4 text-blue-500')
  })

  it('should ignore null, undefined, and empty string', () => {
    expect(cn('foo', null, undefined, '', 'bar')).toBe('foo bar')
  })

  it('should handle heavily nested arrays and conditionals', () => {
    expect(cn('foo', ['bar', { baz: true, qux: false }], null, ['quux', ['corge', 'grault']])).toBe('foo bar baz quux corge grault')
  })
})
