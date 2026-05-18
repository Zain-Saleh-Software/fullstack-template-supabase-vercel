import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/contact-form";

export default async function EditContactPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>;
}) {
    const { id } = await params;
    const t = await getTranslations("contacts");

    const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, id))
        .limit(1);

    if (!contact.length || contact[0].isDeleted) {
        notFound();
    }

    const c = contact[0];

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t("edit")}
            </h1>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <ContactForm
                    isEdit
                    initialData={{
                        id: c.id,
                        firstName: c.firstName,
                        lastName: c.lastName,
                        email: c.email || undefined,
                        phone: c.phone || undefined,
                        jobTitle: c.jobTitle || undefined,
                        accountId: c.accountId || undefined,
                        isPrimary: c.isPrimary || undefined,
                    }}
                />
            </div>
        </div>
    );
}
