import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    formatMessage?: (key: string) => string
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
            const fm = this.props.formatMessage || ((k: string) => k)
            return (
                <div className="flex h-screen items-center justify-center" role="alert">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {fm('error.generic')}
                        </h1>
                        <p className="mb-4 text-gray-600 dark:text-gray-400">{fm('error.reloadPrompt')}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {fm('error.reload')}
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}
