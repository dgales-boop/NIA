import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProjects, createProject, updateProject, deleteProject } from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import SearchInput from "../../components/SearchInput";
import ListPagination from "../../components/ui/ListPagination";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import { FolderOpen, Plus, Pencil, Trash2 } from "lucide-react";

const PER_PAGE = 15;

export default function ProjectListScreen({ onNavigateToEntries, isAdmin }) {
    const [projects, setProjects] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [searchApplied, setSearchApplied] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [tableBusy, setTableBusy] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editProject, setEditProject] = useState(null);

    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [saving, setSaving] = useState(false);

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
            const res = await fetchProjects({
                search: searchApplied || undefined,
                page,
                per_page: PER_PAGE,
            });
            const lastPage = Math.max(1, Number(res.last_page) || 1);
            if (page > lastPage) {
                setPage(lastPage);
                return;
            }
            setProjects(Array.isArray(res.data) ? res.data : []);
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

    const openCreate = () => {
        setEditProject(null);
        setNewName("");
        setNewDescription("");
        setError("");
        setShowModal(true);
    };

    const openEdit = (project) => {
        setEditProject(project);
        setNewName(project.name);
        setNewDescription(project.description ?? "");
        setError("");
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            if (editProject) {
                await updateProject(editProject.id, {
                    name: newName,
                    description: newDescription || null,
                });
            } else {
                await createProject({
                    name: newName,
                    description: newDescription || null,
                });
            }
            setShowModal(false);
            setEditProject(null);
            await loadList();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (project) => {
        if (
            !window.confirm(
                `Delete project "${project.name}"? This is only allowed when the project has no entries.`,
            )
        ) {
            return;
        }
        try {
            setError("");
            await deleteProject(project.id);
            await loadList();
        } catch (err) {
            setError(err.message);
        }
    };

    const total = paginationMeta?.total ?? 0;
    const hasSearch = Boolean(searchApplied);
    const emptyBecauseSearch = projects.length === 0 && total === 0 && hasSearch;
    const emptyNoProjects = projects.length === 0 && total === 0 && !hasSearch;

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Projects" />
                <Skeleton variant="page" rows={6} />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Projects"
                subtitle="Each project groups budget entries (site, program, or fiscal unit). Column layouts come from templates, not from the project name."
                actions={
                    isAdmin ? (
                        <Button onClick={openCreate} icon={Plus}>
                            New Project
                        </Button>
                    ) : null
                }
            />

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-3">
                <SearchInput
                    id="projects-search"
                    placeholder="Search projects by name or description…"
                    aria-label="Search projects"
                    onDebouncedChange={handleSearchDebounced}
                    className="max-w-xl"
                />
                <span className="text-sm text-gray-500 tabular-nums">{total} projects</span>
            </div>

            {emptyNoProjects ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No projects yet</p>
                    <p className="mt-1 text-xs text-gray-400">Create a project to start organizing budget entries.</p>
                </div>
            ) : emptyBecauseSearch ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">No matching projects</p>
                    <p className="mt-1 text-xs text-gray-400">Try a different search term.</p>
                </div>
            ) : (
                <div
                    className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${tableBusy ? "opacity-60 pointer-events-none" : ""}`}
                >
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/80">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Project
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Entries
                                </th>
                                {isAdmin && (
                                    <th className="w-32 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {projects.map((project) => (
                                <tr key={project.id} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => onNavigateToEntries?.(project.id)}
                                            className="text-left font-semibold text-gray-900 hover:text-blue-700"
                                        >
                                            {project.name}
                                        </button>
                                    </td>
                                    <td className="max-w-md px-4 py-3 text-gray-600">
                                        <span className="line-clamp-2 text-xs">{project.description || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600">{project.entries_count ?? 0}</td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEdit(project);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md p-1.5 text-blue-700 hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(project);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-md p-1.5 text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
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
                open={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditProject(null);
                    setError("");
                }}
                title={editProject ? "Edit Project" : "New Project"}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <InputField
                        label="Project Name"
                        value={newName}
                        onChange={setNewName}
                    />
                    <InputField
                        label="Description (optional)"
                        value={newDescription}
                        onChange={setNewDescription}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowModal(false);
                                setEditProject(null);
                                setError("");
                            }}
                            type="button"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={saving} disabled={!newName.trim()}>
                            {editProject ? "Save" : "Create Project"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
