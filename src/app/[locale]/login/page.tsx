"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
    const t = useTranslations("auth");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createBrowserClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/dashboard");
            } else {
                setCheckingAuth(false);
            }
        };
        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {t("login")}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t("noAccount")}{" "}
                        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            {t("register")}
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Input
                            id="email"
                            type="email"
                            label={t("email")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        <Input
                            id="password"
                            type="password"
                            label={t("password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? t("loading") : t("login")}
                    </Button>
                </form>
            </div>
        </div>
    );
}