import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import PageHeader from "../../components/layout/PageHeader";
import SearchInput from "../../components/SearchInput";
import ListPagination from "../../components/ui/ListPagination";
import { deleteTemplate, fetchTemplatesPaginated } from "../../services/api";
import { FormInput, Pencil, Trash2 } from "lucide-react";

function columnCount(t) {
    const n = Number(t?.fields_count);
    if (Number.isFinite(n)) return n;
    return Array.isArray(t?.schema?.fields) ? t.schema.fields.length : 0;
}

const PER_PAGE = 15;

export default function FormsListScreen({ onRefreshTemplates, onCreateForm, onEditForm }) {
    const [rows, setRows] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [searchApplied, setSearchApplied] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [tableBusy, setTableBusy] = useState(false);
    const [error, setError] = useState("");

    const initialLoadRef = useRef(true);

    const handleSearchDebounced = useCallback((term) => {
        setSearchApplied(term);
        setPage(1);
    }, []);

    const loadList = useCallback(async () => {
        const first = initialLoadRef.current;
        if (first) setLoading(true);
        else setTableBusy(true);
        setError("");
        try {
            const res = await fetchTemplatesPaginated({
                search: searchApplied || undefined,
                page,
                per_page: PER_PAGE,
            });
            const lastPage = Math.max(1, Number(res.last_page) || 1);
            if (page > lastPage) {
                setPage(lastPage);
                return;
            }
            setRows(Array.isArray(res.data) ? res.data : []);
            setPaginationMeta({
                current_page: res.current_page,
                last_page: res.last_page,
                total: res.total,
                from: res.from,
                to: res.to,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTableBusy(false);
            initialLoadRef.current = false;
        }
    }, [page, searchApplied]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete template "${name}"? This cannot be undone if no entries use it.`)) {
            return;
        }
        try {
            setError("");
            await deleteTemplate(id);
            await onRefreshTemplates?.();
            await loadList();
        } catch (err) {
            setError(err?.message ?? "Delete failed.");
        }
    };

    const total = paginationMeta?.total ?? 0;
    const hasSearch = Boolean(searchApplied);
    const emptyBecauseSearch = rows.length === 0 && total === 0 && hasSearch;
    const emptyNoTemplates = rows.length === 0 && total === 0 && !hasSearch;

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Templates" />
                <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Templates"
                subtitle="Create and edit column definitions. Changes are locked once any data row exists for a template."
                actions={
                    <Button icon={FormInput} onClick={() => onCreateForm?.()}>
                        New template
                    </Button>
                }
            />

            {error && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                    id="templates-search"
                    placeholder="Search templates by name…"
                    aria-label="Search templates"
                    onDebouncedChange={handleSearchDebounced}
                    className="max-w-xl"
                />
                <span className="text-sm text-gray-500 tabular-nums">{total} templates</span>
            </div>

            {emptyNoTemplates ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-600 shadow-sm">
                    No templates yet. Create one to use when adding budget entries.
                </div>
            ) : emptyBecauseSearch ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-600 shadow-sm">
                    No templates match your search.
                </div>
            ) : (
                <div
                    className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${tableBusy ? "opacity-60 pointer-events-none" : ""}`}
                >
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Columns
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Updated
                                </th>
                                <th className="w-36 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{columnCount(t)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {t.updated_at ? new Date(t.updated_at).toLocaleString() : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => onEditForm?.(t.id)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(t.id, t.name)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <ListPagination
                        meta={paginationMeta}
                        disabled={tableBusy}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </div>
    );
}
