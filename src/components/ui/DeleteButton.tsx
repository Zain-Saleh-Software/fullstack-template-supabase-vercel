"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
    url: string;
    confirmMessage?: string;
    onSuccess?: () => void;
}

export function DeleteButton({
    url,
    confirmMessage = "Are you sure you want to delete this item?",
    onSuccess,
}: DeleteButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm(confirmMessage)) return;

        setLoading(true);
        try {
            const res = await fetch(url, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error?.message || "Failed to delete item");
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert(err instanceof Error ? err.message : "An error occurred while deleting the item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center justify-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors cursor-pointer"
            aria-label="Delete"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    );
}
