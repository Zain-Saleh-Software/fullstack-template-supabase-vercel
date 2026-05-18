import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/contact-form";

export default async function NewContactPage() {
    const t = await getTranslations("contacts");

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t("new")}
            </h1>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <ContactForm />
            </div>
        </div>
    );
}
