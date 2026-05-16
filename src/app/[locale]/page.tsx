import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function HomePage() {
  const t = useTranslations("common");
  const authT = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <main className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Fullstack Template
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Production-ready template with Next.js 15, Supabase, Drizzle ORM, and Tailwind v4.
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
          >
            {authT("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-700 transition-colors"
          >
            {authT("register")}
          </Link>
        </div>
      </main>
    </div>
  );
}
