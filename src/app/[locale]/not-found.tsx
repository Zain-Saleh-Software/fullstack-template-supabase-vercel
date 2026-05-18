import { Link } from "@/i18n/routing";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFoundPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                        <FileQuestion className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>
                <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
                    404
                </h1>
                <p className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Page not found
                </p>
                <p className="mb-8 text-gray-600 dark:text-gray-400">
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go back home
                </Link>
            </div>
        </div>
    );
}
