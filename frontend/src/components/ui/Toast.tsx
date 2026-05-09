import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const addToast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
            setToasts((prev) => [...prev, { id, message, type }])
            setTimeout(() => removeToast(id), 4000)
        },
        [removeToast],
    )

    const typeStyles: Record<ToastType, string> = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${typeStyles[toast.type]} flex min-w-[280px] animate-slide-up items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg`}
                    >
                        <span className="flex-1 text-sm">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-lg leading-none text-white/80 hover:text-white"
                            aria-label="Dismiss"
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
