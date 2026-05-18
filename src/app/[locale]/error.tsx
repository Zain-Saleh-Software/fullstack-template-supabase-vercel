"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/observability/logger";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Error boundary caught", { error: error instanceof Error ? error.message : String(error) });
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                        <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                    Something went wrong
                </h1>
                <p className="mb-8 text-gray-600 dark:text-gray-400">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={reset} variant="primary">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                    <Button onClick={() => window.location.href = "/"} variant="secondary">
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}