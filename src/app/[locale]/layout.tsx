import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import "@fontsource/inter";
import "@fontsource/cairo";

export const metadata = {
  title: "Fullstack Template",
  description: "Next.js + Supabase + Drizzle CRM Template",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ReactQueryProvider>
              {children}
            </ReactQueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
