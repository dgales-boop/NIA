import { useEffect, useState } from "react";
import { fetchEntries, createEntry, fetchProjects, fetchTemplates } from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import { FileText, Plus, ChevronRight, FolderOpen } from "lucide-react";

export default function EntryListScreen({ filterProjectId, onOpenEntry }) {
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");

    // Create form
    const [newTitle, setNewTitle] = useState("");
    const [newProjectId, setNewProjectId] = useState("");
    const [newTemplateId, setNewTemplateId] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const [entriesData, projectsData, templatesData] = await Promise.all([
                fetchEntries(filterProjectId || null, statusFilter || null),
                fetchProjects(),
                fetchTemplates(),
            ]);
            setEntries(entriesData);
            setProjects(projectsData);
            setTemplates(templatesData.filter((t) => Array.isArray(t?.schema?.fields)));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filterProjectId, statusFilter]);

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
            setShowModal(false);
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

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Budget Entries" subtitle="Create, manage, and review budget data entries" />
                <Skeleton variant="table" rows={5} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Budget Entries"
                subtitle="Create, manage, and review budget data entries"
                actions={
                    <Button onClick={() => {
                        setNewProjectId(filterProjectId ? String(filterProjectId) : (projects.length > 0 ? String(projects[0].id) : ""));
                        setNewTemplateId(templates.length > 0 ? String(templates[0].id) : "");
                        setShowModal(true);
                    }} icon={Plus} disabled={projects.length === 0 || templates.length === 0}>
                        New Entry
                    </Button>
                }
            />

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                </select>
                <span className="text-sm text-gray-500">{entries.length} entries</span>
            </div>

            {entries.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No entries found</p>
                    <p className="mt-1 text-xs text-gray-400">
                        {projects.length === 0
                            ? "Create a project first, then add entries."
                            : "Create a new entry to start entering budget data."}
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Project</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Form</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Records</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Created</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {entries.map((entry) => (
                                <tr
                                    key={entry.id}
                                    onClick={() => onOpenEntry?.(entry.id)}
                                    className="cursor-pointer hover:bg-blue-50/30 transition-colors"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{entry.title}</td>
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
                                    <td className="px-3 py-3">
                                        <ChevronRight className="h-4 w-4 text-gray-300" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Entry Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title="New Budget Entry">
                <form onSubmit={handleCreate} className="space-y-4">
                    <InputField
                        label="Entry Title"
                        value={newTitle}
                        onChange={setNewTitle}
                        placeholder="e.g. Q1 2026 Maintenance Budget"
                    />
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                        <span>Project</span>
                        <select
                            value={newProjectId}
                            onChange={(e) => setNewProjectId(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                        >
                            <option value="">Select a project...</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                        <span>Budget Form Layout</span>
                        <select
                            value={newTemplateId}
                            onChange={(e) => setNewTemplateId(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                        >
                            <option value="">Select a form...</option>
                            {templates.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                        <Button type="submit" loading={saving} disabled={!newTitle.trim() || !newProjectId || !newTemplateId}>
                            Create Entry
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
