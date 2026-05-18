"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ContactFormProps {
    initialData?: {
        id?: string;
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        jobTitle?: string;
        accountId?: string;
        isPrimary?: boolean;
    };
    isEdit?: boolean;
}

interface Account {
    id: string;
    name: string;
}

export function ContactForm({ initialData, isEdit = false }: ContactFormProps) {
    const t = useTranslations("contacts");
    const commonT = useTranslations("common");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        jobTitle: initialData?.jobTitle || "",
        accountId: initialData?.accountId || "",
        isPrimary: initialData?.isPrimary || false,
    });

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/v1/accounts?limit=100");
                const data = await res.json();
                setAccounts(data.data || []);
            } catch (err) {
                console.error("Error fetching accounts:", err);
            }
        };
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/v1/contacts/${initialData?.id}`
                : "/api/v1/contacts";
            const method = isEdit ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || "An error occurred");
            }

            router.push("/contacts");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    id="firstName"
                    type="text"
                    label={t("fields.firstName")}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                />
                <Input
                    id="lastName"
                    type="text"
                    label={t("fields.lastName")}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                />
                <Input
                    id="email"
                    type="email"
                    label={t("fields.email")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                    id="phone"
                    type="tel"
                    label={t("fields.phone")}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                    id="jobTitle"
                    type="text"
                    label={t("fields.jobTitle")}
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
                <div>
                    <label
                        htmlFor="accountId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("fields.account")}
                    </label>
                    <select
                        id="accountId"
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                    >
                        <option value="">{t("selectAccount")}</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isPrimary"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t("fields.isPrimary")}
                </label>
            </div>

            <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                    {loading ? commonT("saving") : isEdit ? commonT("update") : commonT("create")}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                >
                    {commonT("cancel")}
                </Button>
            </div>
        </form>
    );
}