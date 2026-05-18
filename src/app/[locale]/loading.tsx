import { Loader2 } from "lucide-react";

export default function LoadingBoundary() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600 dark:text-primary-400" />
                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
}