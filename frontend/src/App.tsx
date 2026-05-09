import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryProvider } from '@/components/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { AppPreloader } from '@/components/AppPreloader'
import { UpdateBanner } from '@/components/UpdateBanner'

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

import { SkeletonTable } from '@/components/ui/Skeleton'

const Loading = () => (
    <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
            <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                </div>
                <SkeletonTable rows={4} cols={3} />
            </div>
        </div>
    </div>
)

function AppContent() {
    return (
        <QueryProvider>
            <ToastProvider>
                <AppPreloader>
                    <ErrorBoundary>
                        <LayoutWrapper>
                            <UpdateBanner />
                            <Suspense fallback={<Loading />}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route
                                        path="/dashboard"
                                        element={
                                            <ProtectedRoute>
                                                <Dashboard />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </LayoutWrapper>
                    </ErrorBoundary>
                </AppPreloader>
            </ToastProvider>
        </QueryProvider>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <LocaleProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </LocaleProvider>
        </BrowserRouter>
    )
}
