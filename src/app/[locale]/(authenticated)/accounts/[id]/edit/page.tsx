import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { AccountForm } from "@/components/forms/account-form";

export default async function EditAccountPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    const t = await getTranslations("accounts");

    const account = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, id))
        .limit(1);

    if (!account.length || account[0].isDeleted) {
        notFound();
    }

    const a = account[0];

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t("edit")}
            </h1>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <AccountForm
                    isEdit
                    initialData={{
                        id: a.id,
                        name: a.name,
                        accountType: a.accountType,
                        status: a.status,
                    }}
                />
            </div>
        </div>
    );
}
