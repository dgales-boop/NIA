import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const DEBOUNCE_MS = 400;

/**
 * Immediate visual feedback while typing; notifies parent after debounce for server requests.
 */
export default function SearchInput({
    id,
    placeholder = "Search…",
    "aria-label": ariaLabel = "Search",
    defaultValue = "",
    resetKey = "",
    onDebouncedChange,
    className = "",
}) {
    const [draft, setDraft] = useState(defaultValue);
    const timerRef = useRef(null);
    const lastEmittedRef = useRef(defaultValue.trim());

    useEffect(() => {
        setDraft(defaultValue);
        lastEmittedRef.current = defaultValue.trim();
    }, [resetKey]);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const next = draft.trim();
            if (next !== lastEmittedRef.current) {
                lastEmittedRef.current = next;
                onDebouncedChange?.(next);
            }
        }, DEBOUNCE_MS);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [draft, onDebouncedChange]);

    const clear = () => {
        setDraft("");
        lastEmittedRef.current = "";
        onDebouncedChange?.("");
    };

    return (
        <div className={`relative min-w-[200px] max-w-md flex-1 ${className}`}>
            <label htmlFor={id} className="sr-only">
                {ariaLabel}
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" aria-hidden />
            </div>
            <input
                id={id}
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder={placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {draft ? (
                <button
                    type="button"
                    onClick={clear}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            ) : null}
        </div>
    );
}
