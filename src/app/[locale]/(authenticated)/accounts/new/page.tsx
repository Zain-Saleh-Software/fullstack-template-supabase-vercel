import { getTranslations } from "next-intl/server";
import { AccountForm } from "@/components/forms/account-form";

export default async function NewAccountPage() {
    const t = await getTranslations("accounts");

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t("new")}
            </h1>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <AccountForm />
            </div>
        </div>
    );
}
