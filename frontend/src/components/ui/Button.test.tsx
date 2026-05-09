import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
    it('renders with text', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('shows loading state', () => {
        render(<Button loading>Loading</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })
})
