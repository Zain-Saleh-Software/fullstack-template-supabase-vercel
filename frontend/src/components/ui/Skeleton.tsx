interface SkeletonProps {
    className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return <div className={`animate-pulse rounded bg-gray-200 ${className}`} role="status" aria-label="Loading" />
}

export function SkeletonTable({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
    return (
        <div className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                    {Array.from({ length: cols }).map((_, j) => (
                        <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function SkeletonCard() {
    return (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    )
}
