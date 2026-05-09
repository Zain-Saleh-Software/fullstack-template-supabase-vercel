import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback
            return (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
                        <p className="mb-4 text-gray-600">{this.state.error?.message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
