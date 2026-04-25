import { useEffect, useState } from "react";
import { fetchOrgUnits, fetchOrgUnitChildren } from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { Building2, MapPin, ChevronRight, Home, FolderOpen, Layers } from "lucide-react";

const LEVEL_LABELS = {
    region: "Regional Irrigation Office",
    imo: "Irrigation Management Office",
    section: "Section / Irrigation System",
};

const LEVEL_ICONS = {
    region: MapPin,
    imo: Building2,
    section: Layers,
};

export default function OrgTreeScreen({ onNavigateToProjects }) {
    const [items, setItems] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]); // [{id, name, level_type}]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load root regions on mount
    useEffect(() => {
        loadRoots();
    }, []);

    const loadRoots = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await fetchOrgUnits();
            setItems(data);
            setBreadcrumbs([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const drillInto = async (unit) => {
        try {
            setLoading(true);
            setError("");
            const result = await fetchOrgUnitChildren(unit.id);
            setItems(result.children);

            // Build breadcrumb: ancestors of parent + parent itself
            const parentAncestors = result.parent.ancestors || [];
            const newCrumbs = [
                ...parentAncestors,
                {
                    id: result.parent.id,
                    name: result.parent.name,
                    code: result.parent.code,
                    level_type: result.parent.level_type,
                },
            ];
            setBreadcrumbs(newCrumbs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const navigateToCrumb = async (crumbIndex) => {
        if (crumbIndex < 0) {
            // Go back to roots
            await loadRoots();
        } else {
            const crumb = breadcrumbs[crumbIndex];
            await drillInto(crumb);
        }
    };

    const currentLevel = breadcrumbs.length === 0 ? "region" :
        breadcrumbs[breadcrumbs.length - 1].level_type === "region" ? "imo" :
        breadcrumbs[breadcrumbs.length - 1].level_type === "imo" ? "section" : "unit";

    const currentParent = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

    return (
        <div>
            <PageHeader
                title="Organization"
                subtitle="Browse the NIA organizational hierarchy"
            />

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            {/* Breadcrumbs */}
            <nav className="mb-4 flex items-center gap-1.5 flex-wrap text-sm">
                <button
                    onClick={() => navigateToCrumb(-1)}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors ${
                        breadcrumbs.length === 0
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                >
                    <Home className="h-3.5 w-3.5" />
                    All Regions
                </button>
                {breadcrumbs.map((crumb, idx) => (
                    <span key={crumb.id} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        <button
                            onClick={() => navigateToCrumb(idx)}
                            className={`rounded-md px-2 py-1 font-medium transition-colors ${
                                idx === breadcrumbs.length - 1
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            }`}
                        >
                            {crumb.name}
                        </button>
                    </span>
                ))}
            </nav>

            {/* Content */}
            {loading ? (
                <Skeleton variant="page" rows={6} />
            ) : items.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                    <Building2 className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-600">
                        No {LEVEL_LABELS[currentLevel] ?? "units"} found
                    </p>
                    {currentParent && (
                        <p className="mt-1 text-xs text-gray-400">
                            {currentParent.name} has no sub-offices.
                        </p>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {items.length} {LEVEL_LABELS[currentLevel] ?? "Units"}{items.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* List */}
                    <div>
                        {items.map((unit, idx) => {
                            const Icon = LEVEL_ICONS[unit.level_type] ?? Building2;
                            const hasChildren = (unit.children_count ?? 0) > 0;
                            const projectCount = unit.projects_count ?? 0;

                            return (
                                <div
                                    key={unit.id}
                                    className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50/60 ${
                                        idx < items.length - 1 ? "border-b border-gray-100" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            unit.level_type === "region" ? "bg-blue-50 text-blue-600" :
                                            unit.level_type === "imo" ? "bg-emerald-50 text-emerald-600" :
                                            "bg-amber-50 text-amber-600"
                                        }`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{unit.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                                    unit.level_type === "region" ? "bg-blue-100 text-blue-700" :
                                                    unit.level_type === "imo" ? "bg-emerald-100 text-emerald-700" :
                                                    "bg-amber-100 text-amber-700"
                                                }`}>
                                                    {unit.level_type}
                                                </span>
                                                <span className="text-[11px] text-gray-400">{unit.code}</span>
                                                {hasChildren && (
                                                    <span className="text-[11px] text-gray-400">· {unit.children_count} sub-unit{unit.children_count !== 1 ? "s" : ""}</span>
                                                )}
                                                {projectCount > 0 && (
                                                    <span className="text-[11px] text-gray-400">· {projectCount} project{projectCount !== 1 ? "s" : ""}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <button
                                            onClick={() => onNavigateToProjects?.(unit.id)}
                                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                        >
                                            <FolderOpen className="h-3.5 w-3.5" />
                                            Projects
                                        </button>
                                        {hasChildren && (
                                            <button
                                                onClick={() => drillInto(unit)}
                                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                                            >
                                                Browse
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
