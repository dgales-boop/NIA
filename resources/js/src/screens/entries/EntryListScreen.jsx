import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchEntries,
    createEntry,
    fetchProjectsDropdown,
    updateEntry,
    deleteEntry,
} from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import SearchInput from "../../components/SearchInput";
import ListPagination from "../../components/ui/ListPagination";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import { FileText, Plus, ChevronRight, FolderOpen, Pencil, Trash2 } from "lucide-react";

function templateHasFields(t) {
    const n = Number(t?.fields_count);
    if (Number.isFinite(n) && n > 0) return true;
    return Array.isArray(t?.schema?.fields) && t.schema.fields.length > 0;
}

const PER_PAGE = 15;

export default function EntryListScreen({
    filterProjectId,
    onOpenEntry,
    currentUserId,
    isAdmin,
    templates = [],
}) {
    const [entries, setEntries] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableBusy, setTableBusy] = useState(false);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");

    const [searchApplied, setSearchApplied] = useState("");
    const [page, setPage] = useState(1);

    const [newTitle, setNewTitle] = useState("");
    const [newProjectId, setNewProjectId] = useState("");
    const [newTemplateId, setNewTemplateId] = useState("");
    const [saving, setSaving] = useState(false);
    const entryTitleTouchedRef = useRef(false);

    const initialLoadRef = useRef(true);

    const usableTemplates = templates.filter(templateHasFields);

    const canModifyEntry = (entry) =>
        isAdmin || (currentUserId != null && Number(entry.created_by) === Number(currentUserId));

    const handleSearchDebounced = useCallback((term) => {
        setSearchApplied(term);
        setPage(1);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [filterProjectId]);

    const loadProjectsDropdown = useCallback(async () => {
        try {
            const data = await fetchProjectsDropdown();
            setProjects(Array.isArray(data) ? data : []);
        } catch {
            setProjects([]);
        }
    }, []);

    useEffect(() => {
        loadProjectsDropdown();
    }, [loadProjectsDropdown]);

    const loadEntries = useCallback(async () => {
        const first = initialLoadRef.current;
        if (first) setLoading(true);
        else setTableBusy(true);
        setError("");
        try {
            const res = await fetchEntries({
                projectId: filterProjectId || null,
                status: statusFilter || null,
                search: searchApplied || null,
                page,
                per_page: PER_PAGE,
            });
            const lastPage = Math.max(1, Number(res.last_page) || 1);
            if (page > lastPage) {
                setPage(lastPage);
                return;
            }
            setEntries(Array.isArray(res.data) ? res.data : []);
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
    }, [filterProjectId, statusFilter, searchApplied, page]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    useEffect(() => {
        if (!showCreateModal || !newProjectId || !newTemplateId) {
            return;
        }
        if (entryTitleTouchedRef.current) {
            return;
        }
        const p = projects.find((x) => String(x.id) === String(newProjectId));
        const t = usableTemplates.find((x) => String(x.id) === String(newTemplateId));
        if (!p || !t) {
            return;
        }
        setNewTitle(`${p.name} – ${t.name}`);
    }, [showCreateModal, newProjectId, newTemplateId, projects, usableTemplates]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const entry = await createEntry({
                title: newTitle,
                project_id: Number(newProjectId),
                template_id: Number(newTemplateId),
            });
            setShowCreateModal(false);
            entryTitleTouchedRef.current = false;
            setNewTitle("");
            setNewProjectId("");
            setNewTemplateId("");
            onOpenEntry?.(entry.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (entry) => {
        setEditEntry(entry);
        setNewTitle(entry.title);
        setNewProjectId(String(entry.project_id));
        setNewTemplateId(String(entry.template_id));
        setError("");
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editEntry) return;
        setSaving(true);
        setError("");
        try {
            const payload = { title: newTitle };
            if (isAdmin) {
                payload.project_id = Number(newProjectId);
                payload.template_id = Number(newTemplateId);
            }
            await updateEntry(editEntry.id, payload);
            setEditEntry(null);
            await loadEntries();
            await loadProjectsDropdown();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntry = async (entry) => {
        if (!window.confirm(`Delete entry "${entry.title}"? Related data rows will be removed.`)) {
            return;
        }
        try {
            setError("");
            await deleteEntry(entry.id);
            await loadEntries();
        } catch (err) {
            setError(err.message);
        }
    };

    const total = paginationMeta?.total ?? 0;
    const hasSearch = Boolean(searchApplied);
    const emptyBecauseSearch = entries.length === 0 && total === 0 && hasSearch;
    const emptyNoEntries = entries.length === 0 && total === 0 && !hasSearch;

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Budget Entries" />
                <Skeleton variant="table" rows={5} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Budget Entries"
                actions={
                    <Button
                        onClick={() => {
                            entryTitleTouchedRef.current = false;
                            setNewProjectId(
                                filterProjectId
                                    ? String(filterProjectId)
                                    : projects.length > 0
                                      ? String(projects[0].id)
                                      : "",
                            );
                            setNewTemplateId(
                                usableTemplates.length > 0 ? String(usableTemplates[0].id) : "",
                            );
                            setNewTitle("");
                            setShowCreateModal(true);
                        }}
                        icon={Plus}
                        disabled={
                            projects.length === 0 || usableTemplates.length === 0
                        }
                    >
                        New Entry
                    </Button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="exported">Exported</option>
                </select>
                <SearchInput
                    id="entries-search"
                    placeholder="Search by title, project, or template…"
                    aria-label="Search budget entries"
                    onDebouncedChange={handleSearchDebounced}
                    className="max-w-xl"
                />
                <span className="text-sm text-gray-500 tabular-nums">{total} entries</span>
            </div>

            {emptyNoEntries ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No entries found</p>
                    <p className="mt-1 text-xs text-gray-400">
                        {projects.length === 0
                            ? "Create a project first, then add entries."
                            : "Create a new entry to start entering budget data."}
                    </p>
                </div>
            ) : emptyBecauseSearch ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No matching entries</p>
                    <p className="mt-1 text-xs text-gray-400">Try a different search term or adjust filters.</p>
                </div>
            ) : (
                <div
                    className={`rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden ${tableBusy ? "opacity-60 pointer-events-none" : ""}`}
                >
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Project
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Template
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Records
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Created
                                </th>
                                <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => onOpenEntry?.(entry.id)}
                                            className="text-left font-medium text-gray-900 hover:text-blue-700"
                                        >
                                            {entry.title}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
                                            {entry.project?.name ?? "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{entry.template?.name ?? "—"}</td>
                                    <td className="px-4 py-3 text-center text-gray-600">{entry.records_count ?? 0}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge status={entry.status} />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {new Date(entry.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {canModifyEntry(entry) && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(entry)}
                                                        className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteEntry(entry)}
                                                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onOpenEntry?.(entry.id)}
                                                className="rounded-md p-1.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <ChevronRight className="h-4 w-4" />
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

            <Modal
                open={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    entryTitleTouchedRef.current = false;
                }}
                title="New Budget Entry"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                        <span>Project</span>
                        <select
                            value={newProjectId}
                            onChange={(e) => setNewProjectId(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                        >
                            <option value="">Select a project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                        <span>Template</span>
                        <select
                            value={newTemplateId}
                            onChange={(e) => setNewTemplateId(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                        >
                            <option value="">Select a template…</option>
                            {usableTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <InputField
                        label="Entry title"
                        value={newTitle}
                        onChange={(value) => {
                            entryTitleTouchedRef.current = true;
                            setNewTitle(value);
                        }}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                entryTitleTouchedRef.current = false;
                            }}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={saving}
                            disabled={!newTitle.trim() || !newProjectId || !newTemplateId}
                        >
                            Create Entry
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={Boolean(editEntry)}
                onClose={() => {
                    setEditEntry(null);
                    setError("");
                }}
                title="Edit Budget Entry"
            >
                {editEntry && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <InputField label="Entry title" value={newTitle} onChange={setNewTitle} />
                        {isAdmin && (
                            <>
                                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                                    <span>Project</span>
                                    <select
                                        value={newProjectId}
                                        onChange={(e) => setNewProjectId(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm sm:text-sm bg-white"
                                    >
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                                    <span>Template</span>
                                    <select
                                        value={newTemplateId}
                                        onChange={(e) => setNewTemplateId(e.target.value)}
                                        disabled={(editEntry.records_count ?? 0) > 0}
                                        className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm sm:text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        {usableTemplates.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                {(editEntry.records_count ?? 0) > 0 && (
                                    <p className="text-xs text-amber-700">
                                        The template cannot be changed while this entry has saved data rows.
                                    </p>
                                )}
                            </>
                        )}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => {
                                    setEditEntry(null);
                                    setError("");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={saving} disabled={!newTitle.trim()}>
                                Save
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
