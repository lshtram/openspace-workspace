import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const isHidden = false
    const result = cn('base', isHidden && 'hidden', 'visible')
    expect(result).toBe('base visible')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle undefined and null', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })

  it('should merge tailwind classes correctly', () => {
    // twMerge should handle conflicting tailwind classes
    const result = cn('px-4 py-2', 'px-8')
    expect(result).toBe('py-2 px-8')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle objects with boolean values', () => {
    const result = cn({ 'text-red': true, 'text-blue': false })
    expect(result).toBe('text-red')
  })
})

