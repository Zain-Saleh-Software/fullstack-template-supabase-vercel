"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createBrowserClient } from "@/lib/supabase/browser";
import {
    LayoutDashboard,
    Building2,
    Users,
    LogOut,
    Languages,
    Menu,
    X,
    UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, permission: null as string | null },
    { href: "/accounts", labelKey: "accounts", icon: Building2, permission: "account:read" },
    { href: "/contacts", labelKey: "contacts", icon: Users, permission: "contact:read" },
];

export default function AuthenticatedLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const t = useTranslations();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string; fullName?: string } | null>(null);
    const [locale, setLocale] = useState("en");

    useEffect(() => {
        const init = async () => {
            const resolvedParams = await params;
            setLocale(resolvedParams.locale);
            const supabase = createBrowserClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser({ email: authUser.email, fullName: authUser.user_metadata?.full_name as string });
            }
        };
        init();
    }, [params]);

    const handleLogout = async () => {
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const isRtl = locale === "ar";
    const nextLocale = locale === "en" ? "ar" : "en";

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRtl ? "rtl" : "ltr"}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 ${
                    isRtl ? "right-0 border-l" : "left-0 border-r"
                } ${sidebarOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"} lg:translate-x-0`}
            >
                {/* Logo */}
                <div className={`flex h-16 items-center gap-3 px-6 border-b border-gray-200 dark:border-gray-800 ${isRtl ? "justify-start" : ""}`}>
                    <div className="rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 p-2 text-white">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        VibeCRM
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-400"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                }`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                <span>{t(`navigation.${item.labelKey}`)}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className={`border-t border-gray-200 dark:border-gray-800 p-4`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-400">
                            <UserCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.fullName || user?.email || "User"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                        <LogOut className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
                        <span>{t("auth.logout")}</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Top header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <div className="flex-1" />

                    {/* Language switcher */}
                    <Link
                        href={pathname}
                        locale={nextLocale}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Languages className="h-4 w-4" />
                        <span>{isRtl ? "English" : "العربية"}</span>
                    </Link>
                </header>

                {/* Page content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
