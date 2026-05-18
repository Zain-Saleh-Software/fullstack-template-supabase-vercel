import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { accounts, contacts } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Building2, Users, TrendingUp, Activity } from "lucide-react";
import { logger } from "@/lib/observability/logger";

async function getStats() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                totalAccounts: 0,
                totalContacts: 0,
                activeAccounts: 0,
                newThisMonth: 0,
            };
        }

        const [{ count: totalAccounts }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(accounts)
            .where(eq(accounts.isDeleted, false));

        const [{ count: totalContacts }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(contacts)
            .where(eq(contacts.isDeleted, false));

        const [{ count: activeAccounts }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(accounts)
            .where(and(eq(accounts.isDeleted, false), eq(accounts.status, "active")));

        const [{ count: newThisMonth }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(accounts)
            .where(
                and(
                    eq(accounts.isDeleted, false),
                    sql`${accounts.createdAt} >= NOW() - INTERVAL '30 days'`
                )
            );

        return {
            totalAccounts: Number(totalAccounts),
            totalContacts: Number(totalContacts),
            activeAccounts: Number(activeAccounts),
            newThisMonth: Number(newThisMonth),
        };
    } catch (error) {
        logger.error("Error fetching stats:", { error: error instanceof Error ? error.message : String(error) });
        return {
            totalAccounts: 0,
            totalContacts: 0,
            activeAccounts: 0,
            newThisMonth: 0,
        };
    }
}

function StatCard({
    title,
    value,
    icon: Icon,
    href,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    href?: string;
}) {
    return (
        <Link
            href={href || "#"}
            className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
            </div>
        </Link>
    );
}

export default async function DashboardPage() {
    const stats = await getStats();
    const t = await getTranslations("dashboard");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {t("welcome")}
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title={t("accounts")}
                        value={stats.totalAccounts}
                        icon={Building2}
                        href="/accounts"
                    />
                    <StatCard
                        title={t("contacts")}
                        value={stats.totalContacts}
                        icon={Users}
                        href="/contacts"
                    />
                    <StatCard
                        title={t("activeAccounts")}
                        value={stats.activeAccounts}
                        icon={TrendingUp}
                        href="/accounts?status=active"
                    />
                    <StatCard
                        title={t("newThisMonth")}
                        value={stats.newThisMonth}
                        icon={Activity}
                        href="/accounts?filter=new"
                    />
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            {t("quickActions")}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/accounts/new"
                                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
                            >
                                {t("newAccount")}
                            </Link>
                            <Link
                                href="/contacts/new"
                                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-600"
                            >
                                {t("newContact")}
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            {t("recentActivity")}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("activityComingSoon")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
