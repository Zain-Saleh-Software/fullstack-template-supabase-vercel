"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AccountFormProps {
    initialData?: {
        id?: string;
        name: string;
        accountType: string;
        status: string;
    };
    isEdit?: boolean;
}

export function AccountForm({ initialData, isEdit = false }: AccountFormProps) {
    const t = useTranslations("accounts");
    const commonT = useTranslations("common");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        accountType: initialData?.accountType || "customer",
        status: initialData?.status || "active",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/v1/accounts/${initialData?.id}`
                : "/api/v1/accounts";
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

            router.push("/accounts");
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

            <div className="space-y-4">
                <Input
                    id="name"
                    type="text"
                    label={t("fields.name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <div>
                    <label
                        htmlFor="accountType"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("fields.type")}
                    </label>
                    <select
                        id="accountType"
                        value={formData.accountType}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="customer">Customer</option>
                        <option value="partner">Partner</option>
                        <option value="vendor">Vendor</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("fields.status")}
                    </label>
                    <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
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