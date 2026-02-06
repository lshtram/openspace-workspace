import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContextMeter } from './ContextMeter'

describe('ContextMeter', () => {
  it('should render with basic props', () => {
    render(<ContextMeter percentage={50} tokens="1000" cost="$0.01" />)

    // Should render the button container
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render SVG circle elements', () => {
    const { container } = render(<ContextMeter percentage={75} tokens="1500" cost="$0.02" />)

    // Check SVG is rendered
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()

    // Check both circles are rendered (background and progress)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
  })

  it('should calculate correct stroke offset for 0% percentage', () => {
    const { container } = render(<ContextMeter percentage={0} tokens="0" cost="$0.00" />)

    const progressCircle = container.querySelectorAll('circle')[1]
    const circumference = 10 * 2 * Math.PI // radius * 2 * PI
    const offset = circumference // 100% offset for 0% fill
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(offset.toString())
  })

  it('should calculate correct stroke offset for 50% percentage', () => {
    const { container } = render(<ContextMeter percentage={50} tokens="1000" cost="$0.01" />)

    const progressCircle = container.querySelectorAll('circle')[1]
    const radius = 10
    const circumference = radius * 2 * Math.PI
    const expectedOffset = circumference - (50 / 100) * circumference
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(expectedOffset.toString())
  })

  it('should calculate correct stroke offset for 100% percentage', () => {
    const { container } = render(<ContextMeter percentage={100} tokens="2000" cost="$0.05" />)

    const progressCircle = container.querySelectorAll('circle')[1]
    const expectedOffset = 0 // Full circle
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(expectedOffset.toString())
  })

  it('should handle null percentage by treating it as 0', () => {
    const { container } = render(<ContextMeter percentage={null} tokens="500" cost="$0.00" />)

    const progressCircle = container.querySelectorAll('circle')[1]
    const circumference = 10 * 2 * Math.PI
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(circumference.toString())
  })

  it('should show tooltip on hover with all metrics', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={60} tokens="1,234" cost="$0.03" />)

    const button = screen.getByRole('button')

    // Hover over the button
    await user.hover(button)

    // All labels should appear (use *AllBy* for multiple matches from Radix UI duplication)
    expect(await screen.findAllByText('Tokens')).toHaveLength(2) // Radix duplicates for accessibility
    expect(await screen.findAllByText('Usage')).toHaveLength(2)
    expect(await screen.findAllByText('Cost')).toHaveLength(2)
  })

  it('should display correct token value in tooltip', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={75} tokens="1500" cost="$0.02" />)

    const button = screen.getByRole('button')
    await user.hover(button)

    const tokenElements = await screen.findAllByText('1500')
    expect(tokenElements.length).toBeGreaterThan(0)
  })

  it('should display correct percentage in tooltip', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={80} tokens="1800" cost="$0.04" />)

    const button = screen.getByRole('button')
    await user.hover(button)

    const percentageElements = await screen.findAllByText('80%')
    expect(percentageElements.length).toBeGreaterThan(0)
  })

  it('should display correct cost in tooltip', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={45} tokens="900" cost="$0.01" />)

    const button = screen.getByRole('button')
    await user.hover(button)

    const costElements = await screen.findAllByText('$0.01')
    expect(costElements.length).toBeGreaterThan(0)
  })

  it('should handle formatted token strings in tooltip', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={90} tokens="10,234" cost="$1.23" />)

    const button = screen.getByRole('button')
    await user.hover(button)

    const tokenElements = await screen.findAllByText('10,234')
    expect(tokenElements.length).toBeGreaterThan(0)
  })

  it('should display 0% when percentage is null in tooltip', async () => {
    const user = userEvent.setup()
    render(<ContextMeter percentage={null} tokens="0" cost="$0.00" />)

    const button = screen.getByRole('button')
    await user.hover(button)

    const percentageElements = await screen.findAllByText('0%')
    expect(percentageElements.length).toBeGreaterThan(0)
  })

  it('should render with very high percentage values', () => {
    const { container } = render(<ContextMeter percentage={150} tokens="3000" cost="$0.10" />)

    const progressCircle = container.querySelectorAll('circle')[1]
    // Offset can go negative for >100%
    const radius = 10
    const circumference = radius * 2 * Math.PI
    const expectedOffset = circumference - (150 / 100) * circumference
    expect(progressCircle.getAttribute('stroke-dashoffset')).toBe(expectedOffset.toString())
  })

  it('should have correct circle radius', () => {
    const { container } = render(<ContextMeter percentage={50} tokens="1000" cost="$0.01" />)

    const circles = container.querySelectorAll('circle')
    circles.forEach((circle) => {
      expect(circle.getAttribute('r')).toBe('10')
    })
  })

  it('should have correct circle center coordinates', () => {
    const { container } = render(<ContextMeter percentage={50} tokens="1000" cost="$0.01" />)

    const circles = container.querySelectorAll('circle')
    circles.forEach((circle) => {
      expect(circle.getAttribute('cx')).toBe('12')
      expect(circle.getAttribute('cy')).toBe('12')
    })
  })

  it('should apply rotation transform to SVG', () => {
    const { container } = render(<ContextMeter percentage={50} tokens="1000" cost="$0.01" />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('-rotate-90')
  })
})
