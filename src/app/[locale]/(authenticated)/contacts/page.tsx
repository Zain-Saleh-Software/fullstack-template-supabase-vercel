import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { contacts, accounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Users, Pencil } from "lucide-react";
import { PermissionGate } from "@/components/rbac/PermissionGate";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { logger } from "@/lib/observability/logger";

async function getContacts() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        const items = await db
            .select({
                id: contacts.id,
                firstName: contacts.firstName,
                lastName: contacts.lastName,
                email: contacts.email,
                phone: contacts.phone,
                jobTitle: contacts.jobTitle,
                accountName: accounts.name,
                createdAt: contacts.createdAt,
            })
            .from(contacts)
            .leftJoin(accounts, eq(contacts.accountId, accounts.id))
            .where(eq(contacts.isDeleted, false))
            .orderBy(desc(contacts.createdAt))
            .limit(50);

        return items;
    } catch (error) {
        logger.error("Error fetching contacts:", { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
}

export default async function ContactsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const contactsList = await getContacts();
    const t = await getTranslations("contacts");
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
                            {contactsList.length} {t("count")}
                        </p>
                    </div>
                    <PermissionGate permission="contact:create">
                        <Link
                            href="/contacts/new"
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
                                        {t("fields.firstName")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.email")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.phone")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.jobTitle")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "right" : "left"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("fields.account")}
                                    </th>
                                    <th className={`px-6 py-3 text-${isRtl ? "left" : "right"} text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400`}>
                                        {t("actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {contactsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            {t("empty")}
                                        </td>
                                    </tr>
                                ) : (
                                    contactsList.map((contact) => (
                                        <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className={`flex items-center ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <div className="flex-shrink-0 rounded-full bg-primary-100 p-2 dark:bg-primary-900">
                                                        <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div className={isRtl ? "mr-4" : "ml-4"}>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {contact.firstName} {contact.lastName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {contact.email || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {contact.phone || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {contact.jobTitle || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                {contact.accountName || "-"}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                                                    <PermissionGate permission="contact:update">
                                                        <Link
                                                            href={`/contacts/${contact.id}/edit`}
                                                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </PermissionGate>
                                                    <PermissionGate permission="contact:delete">
                                                        <DeleteButton
                                                            url={`/api/v1/contacts/${contact.id}`}
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
