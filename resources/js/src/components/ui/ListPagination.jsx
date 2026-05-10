import Button from "../Button";

/**
 * @param {{ meta: { current_page: number, last_page: number, total: number, from: number|null, to: number|null }, onPageChange: (page: number) => void, disabled?: boolean }} props
 */
export default function ListPagination({ meta, onPageChange, disabled = false }) {
    if (!meta || meta.last_page <= 1) return null;

    const { current_page: current, last_page: last, total, from, to } = meta;
    const summary =
        from != null && to != null ? (
            <span className="text-sm text-gray-500 tabular-nums">
                {from}–{to} of {total}
            </span>
        ) : (
            <span className="text-sm text-gray-500 tabular-nums">{total} total</span>
        );

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            {summary}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={disabled || current <= 1}
                    onClick={() => onPageChange(current - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-600 tabular-nums">
                    Page {current} of {last}
                </span>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={disabled || current >= last}
                    onClick={() => onPageChange(current + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
