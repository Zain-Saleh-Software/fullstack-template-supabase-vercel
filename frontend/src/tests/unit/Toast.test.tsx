import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToastProvider, useToast } from '@/components/ui/Toast'

function TestConsumer() {
    const { addToast } = useToast()
    return (
        <div>
            <button onClick={() => addToast('Success!', 'success')}>Show Success</button>
            <button onClick={() => addToast('Error!', 'error')}>Show Error</button>
            <button onClick={() => addToast('Info!', 'info')}>Show Info</button>
        </div>
    )
}

describe('Toast', () => {
    it('renders and shows success toast', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>,
        )
        act(() => {
            screen.getByText('Show Success').click()
        })
        expect(screen.getByText('Success!')).toBeDefined()
    })

    it('shows error toast', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>,
        )
        act(() => {
            screen.getByText('Show Error').click()
        })
        expect(screen.getByText('Error!')).toBeDefined()
    })

    it('shows info toast', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>,
        )
        act(() => {
            screen.getByText('Show Info').click()
        })
        expect(screen.getByText('Info!')).toBeDefined()
    })
})
