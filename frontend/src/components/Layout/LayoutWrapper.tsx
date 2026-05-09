import { type ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { LocaleProvider } from '@/contexts/LocaleContext'

interface LayoutWrapperProps {
    children: ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    return (
        <LocaleProvider>
            <div className="flex min-h-screen flex-col bg-gray-50">
                <Header />
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
                <Footer />
            </div>
        </LocaleProvider>
    )
}
