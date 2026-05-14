import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryProvider } from '@/components/QueryProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { AppPreloader } from '@/components/AppPreloader'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useLocale } from '@/hooks/useLocale'

const Home = lazy(() => import('@/pages/Home').then((m) => ({ default: m.Home })))
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const ProfilePage = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

const AccountList = lazy(() => import('@/pages/accounts/AccountList').then((m) => ({ default: m.AccountList })))
const AccountDetail = lazy(() => import('@/pages/accounts/AccountDetail').then((m) => ({ default: m.AccountDetail })))
const AccountForm = lazy(() => import('@/pages/accounts/AccountForm').then((m) => ({ default: m.AccountForm })))

const ContactList = lazy(() => import('@/pages/contacts/ContactList').then((m) => ({ default: m.ContactList })))
const ContactDetail = lazy(() => import('@/pages/contacts/ContactDetail').then((m) => ({ default: m.ContactDetail })))
const ContactForm = lazy(() => import('@/pages/contacts/ContactForm').then((m) => ({ default: m.ContactForm })))

import { SkeletonTable } from '@/components/ui/Skeleton'

const Loading = () => (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-8 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <SkeletonTable rows={4} cols={3} />
            </div>
        </div>
    </div>
)

function AppContent() {
    const { t } = useLocale()
    return (
        <QueryProvider>
            <ToastProvider>
                <AppPreloader>
                    <ErrorBoundary formatMessage={t}>
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

                                    <Route
                                        path="/accounts"
                                        element={
                                            <ProtectedRoute>
                                                <AccountList />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/accounts/new"
                                        element={
                                            <ProtectedRoute permission="account:create" redirectTo="/accounts">
                                                <AccountForm />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/accounts/:id"
                                        element={
                                            <ProtectedRoute>
                                                <AccountDetail />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/accounts/:id/edit"
                                        element={
                                            <ProtectedRoute permission="account:update" redirectTo="/accounts">
                                                <AccountForm />
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path="/contacts"
                                        element={
                                            <ProtectedRoute>
                                                <ContactList />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/contacts/new"
                                        element={
                                            <ProtectedRoute permission="contact:create" redirectTo="/contacts">
                                                <ContactForm />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/contacts/:id"
                                        element={
                                            <ProtectedRoute>
                                                <ContactDetail />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/contacts/:id/edit"
                                        element={
                                            <ProtectedRoute permission="contact:update" redirectTo="/contacts">
                                                <ContactForm />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path="/profile"
                                        element={
                                            <ProtectedRoute>
                                                <ProfilePage />
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
            <ThemeProvider>
                <LocaleProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </LocaleProvider>
            </ThemeProvider>
        </BrowserRouter>
    )
}
