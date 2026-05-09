import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: /click me/i })).toBeDefined()
    })

    it('handles click events', () => {
        const onClick = vi.fn()
        render(<Button onClick={onClick}>Click</Button>)
        fireEvent.click(screen.getByRole('button'))
        expect(onClick).toHaveBeenCalledOnce()
    })

    it('shows loading state and disables button', () => {
        render(<Button loading>Loading</Button>)
        const btn = screen.getByRole('button')
        expect(btn).toBeDisabled()
    })

    it('applies variant classes', () => {
        const { container } = render(<Button variant="danger">Delete</Button>)
        expect(container.querySelector('button')?.className).toContain('bg-red-500')
    })

    it('applies size classes', () => {
        const { container } = render(<Button size="lg">Large</Button>)
        expect(container.querySelector('button')?.className).toContain('px-6')
    })
})
