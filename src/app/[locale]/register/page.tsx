"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
    const t = useTranslations("auth");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            router.push("/dashboard");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {t("register")}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t("hasAccount")}{" "}
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            {t("login")}
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
                            id="fullName"
                            type="text"
                            label={t("fullName")}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            autoComplete="name"
                        />
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
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("loading") : t("register")}
                    </Button>
                </form>
            </div>
        </div>
    );
}