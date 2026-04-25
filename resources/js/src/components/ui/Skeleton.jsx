export default function Skeleton({ className = "", rows = 1, variant = "line" }) {
    if (variant === "card") {
        return (
            <div className={`animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <div className="h-3 w-1/3 rounded bg-gray-100" />
                </div>
            </div>
        );
    }

    if (variant === "table") {
        return (
            <div className={`animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
                <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3.5">
                    <div className="flex gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-3 w-20 rounded bg-gray-200" />
                        ))}
                    </div>
                </div>
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center gap-6 border-b border-gray-100 px-4 py-4 last:border-b-0">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className={`h-3 rounded bg-gray-${j === 0 ? "200" : "100"}`} style={{ width: `${60 + Math.random() * 60}px` }} />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "page") {
        return (
            <div className={`animate-pulse space-y-6 ${className}`}>
                {/* Header */}
                <div className="space-y-2">
                    <div className="h-6 w-48 rounded bg-gray-200" />
                    <div className="h-4 w-72 rounded bg-gray-100" />
                </div>
                {/* Content */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(rows)].map((_, i) => (
                        <Skeleton key={i} variant="card" />
                    ))}
                </div>
            </div>
        );
    }

    // Default: line skeleton
    return (
        <div className={`animate-pulse space-y-3 ${className}`}>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="h-4 rounded bg-gray-200" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
        </div>
    );
}
