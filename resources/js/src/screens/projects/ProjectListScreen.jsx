import { useEffect, useState } from "react";
import { fetchProjects, createProject, fetchOrgUnits } from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import { FolderOpen, Plus, ChevronRight, Building2 } from "lucide-react";

export default function ProjectListScreen({ filterOrgUnitId, onNavigateToEntries, isAdmin }) {
    const [projects, setProjects] = useState([]);
    const [orgUnits, setOrgUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newOrgUnitId, setNewOrgUnitId] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            const [projectsData, orgData] = await Promise.all([
                fetchProjects(filterOrgUnitId || null),
                fetchOrgUnits(true),
            ]);
            setProjects(projectsData);
            setOrgUnits(orgData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [filterOrgUnitId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await createProject({
                name: newName,
                description: newDescription || null,
                org_unit_id: Number(newOrgUnitId),
            });
            setShowModal(false);
            setNewName("");
            setNewDescription("");
            setNewOrgUnitId("");
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Projects" subtitle="Manage irrigation projects across organizational units" />
                <Skeleton variant="page" rows={6} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Projects"
                subtitle="Manage irrigation projects across organizational units"
                actions={
                    isAdmin ? (
                        <Button onClick={() => {
                            setNewOrgUnitId(filterOrgUnitId ? String(filterOrgUnitId) : (orgUnits.length > 0 ? String(orgUnits[0].id) : ""));
                            setShowModal(true);
                        }} icon={Plus}>
                            New Project
                        </Button>
                    ) : null
                }
            />

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            {projects.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No projects yet</p>
                    <p className="mt-1 text-xs text-gray-400">Create a project to start organizing budget entries.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => onNavigateToEntries?.(project.id)}
                            className="group flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                    <FolderOpen className="h-5 w-5" />
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{project.name}</p>
                                {project.description && (
                                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{project.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {project.org_unit?.name ?? "—"}
                                </span>
                                <span>·</span>
                                <span>{project.entries_count ?? 0} entries</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title="New Project">
                <form onSubmit={handleCreate} className="space-y-4">
                    <InputField
                        label="Project Name"
                        value={newName}
                        onChange={setNewName}
                        placeholder="e.g. Bayanihan CIS"
                    />
                    <InputField
                        label="Description (optional)"
                        value={newDescription}
                        onChange={setNewDescription}
                        placeholder="Brief description..."
                    />
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
                        <span>Organizational Unit</span>
                        <select
                            value={newOrgUnitId}
                            onChange={(e) => setNewOrgUnitId(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 py-2.5 px-3 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-white"
                        >
                            <option value="">Select an office...</option>
                            {orgUnits.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.path ?? u.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving} disabled={!newName.trim() || !newOrgUnitId}>
                            Create Project
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
