import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Building2, Pencil } from "lucide-react";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { logger } from "@/lib/observability/logger";
import { DeleteButton } from "@/components/ui/DeleteButton";

async function getAccounts() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const items = await db
            .select()
            .from(accounts)
            .where(eq(accounts.isDeleted, false))
            .orderBy(desc(accounts.createdAt))
            .limit(50);

        return items;
    } catch (error) {
        logger.error("Error fetching accounts:", { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}

function AccountStatus({ status }: { status: string }) {
    const statusStyles: Record<string, string> = {
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] || statusStyles.active}`}>
            {status}
        </span>
    );
}

function AccountType({ type }: { type: string }) {
    const typeStyles: Record<string, string> = {
        customer: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        partner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        vendor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[type] || typeStyles.customer}`}>
            {type}
        </span>
    );
}

export default async function AccountsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const accountsList = await getAccounts();
    const t = await getTranslations("accounts");
    const { locale } = await params;
    const isRtl = locale === "ar";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {t("title")}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {accountsList.length} {t("count")}
                        </p>
                    </div>
                    <PermissionGate permission="account:create">
                        <Link
                            href="/accounts/new"
                            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                        >
                            {t("new")}
                        </Link>
                    </PermissionGate>
                </div>

                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.name")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.type")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.status")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.created")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "left" : "right"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {accountsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            {t("empty")}
                                        </td>
                                    </tr>
                                ) : (
                                    accountsList.map((account) => (
                                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className={`flex items-center ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2 dark:bg-primary-900">
                                                        <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className={isRtl ? "mr-4" : "ml-4"}>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {account.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <AccountType type={account.accountType} />
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <AccountStatus status={account.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(account.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <PermissionGate permission="account:update">
                                                        <Link
                                                            href={`/accounts/${account.id}/edit`}
                                                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </PermissionGate>
                                                    <PermissionGate permission="account:delete">
                                                        <DeleteButton
                                                            url={`/api/v1/accounts/${account.id}`}
                                                            confirmMessage={t("deleteConfirm")}
                                                        />
                                                    </PermissionGate>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
