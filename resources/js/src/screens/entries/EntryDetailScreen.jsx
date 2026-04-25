import { useEffect, useState } from "react";
import { fetchEntry, closeEntry, reopenEntry, createRecord } from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import { ArrowLeft, Lock, Unlock, Download, Plus, Save, Trash2, Check, AlertCircle } from "lucide-react";

let rowIdCounter = 0;
const nextRowId = () => `row_${++rowIdCounter}`;

export default function EntryDetailScreen({ entryId, onBack, isAdmin }) {
    const [entry, setEntry] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchEntry(entryId);
            setEntry(data);

            // Existing records become "saved" rows
            const existingRows = (data.records ?? []).map((r) => ({
                _id: `existing_${r.id}`,
                dbId: r.id,
                data: r.data ?? {},
                status: "saved",
                error: null,
            }));
            setRows(existingRows);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [entryId]);

    const fields = entry?.template?.schema?.fields ?? [];
    const isOpen = entry?.status === "open";

    function createEmptyRow() {
        const data = {};
        fields.forEach((f) => { data[f.key] = ""; });
        return { _id: nextRowId(), data, status: "draft", error: null };
    }

    const addRow = () => setRows((c) => [...c, createEmptyRow()]);

    const updateCell = (rowId, fieldKey, value) => {
        setRows((c) =>
            c.map((r) =>
                r._id === rowId
                    ? { ...r, data: { ...r.data, [fieldKey]: value }, status: r.dbId ? "saved" : "draft", error: null }
                    : r,
            ),
        );
    };

    const removeRow = (rowId) => {
        setRows((c) => c.filter((r) => r._id !== rowId));
    };

    const saveRow = async (rowId) => {
        const row = rows.find((r) => r._id === rowId);
        if (!row || !entry) return;

        const hasData = Object.values(row.data).some((v) => v !== "" && v != null);
        if (!hasData) {
            setRows((c) => c.map((r) => r._id === rowId ? { ...r, status: "error", error: "Fill in at least one field." } : r));
            return;
        }

        setRows((c) => c.map((r) => (r._id === rowId ? { ...r, status: "saving" } : r)));

        try {
            await createRecord({
                template_id: entry.template.id,
                entry_id: entry.id,
                data: row.data,
            });
            setRows((c) => c.map((r) => (r._id === rowId ? { ...r, status: "saved", error: null } : r)));
        } catch (err) {
            setRows((c) => c.map((r) => (r._id === rowId ? { ...r, status: "error", error: err.message } : r)));
        }
    };

    const handleClose = async () => {
        try {
            const updated = await closeEntry(entry.id);
            setEntry((e) => ({ ...e, status: updated.status }));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleReopen = async () => {
        try {
            const updated = await reopenEntry(entry.id);
            setEntry((e) => ({ ...e, status: updated.status }));
        } catch (err) {
            setError(err.message);
        }
    };

    const exportCsv = () => {
        if (!fields.length) return;
        const header = fields.map((f) => `"${f.label.replaceAll('"', '""')}"`).join(",");
        const dataRows = rows.filter((r) => r.status === "saved").map((r) =>
            fields.map((f) => `"${String(r.data?.[f.key] ?? "").replaceAll('"', '""')}"`).join(",")
        );
        const csv = [header, ...dataRows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${entry?.title?.replace(/\s+/g, "_") ?? "entry"}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const renderCellInput = (field, row) => {
        const value = row.data[field.key] ?? "";
        const baseType = field.base_type ?? "text";
        const disabled = !isOpen || row.status === "saving" || (row.dbId && row.status === "saved");
        const cls = `w-full border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:text-gray-500 disabled:bg-gray-50 ${disabled ? "cursor-not-allowed" : ""}`;

        if (baseType === "number") return <input type="number" value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} placeholder="0" className={cls} />;
        if (baseType === "date") return <input type="date" value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} className={cls} />;
        if (baseType === "boolean") return <select value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} className={`${cls} cursor-pointer`}><option value="">—</option><option value="yes">Yes</option><option value="no">No</option></select>;
        if (baseType === "select") {
            const opts = Array.isArray(field.settings?.options) ? field.settings.options : [];
            return <select value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} className={`${cls} cursor-pointer`}><option value="">Select...</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
        }
        if (baseType === "textarea") return <textarea value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} placeholder={`Enter ${field.label.toLowerCase()}`} className={`${cls} resize-none`} rows={1} />;
        return <input type="text" value={value} onChange={(e) => updateCell(row._id, field.key, e.target.value)} disabled={disabled} placeholder={`Enter ${field.label.toLowerCase()}`} className={cls} />;
    };

    const statusIcon = (row) => {
        if (row.status === "saved") return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><Check className="h-3.5 w-3.5" />Saved</span>;
        if (row.status === "saving") return <span className="text-xs font-medium text-blue-600 animate-pulse">Saving...</span>;
        if (row.status === "error") return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600" title={row.error}><AlertCircle className="h-3.5 w-3.5" />Error</span>;
        return <span className="text-xs text-gray-400">Draft</span>;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton rows={2} />
                <Skeleton variant="table" rows={4} />
            </div>
        );
    }

    if (!entry) return null;

    return (
        <div>
            {/* Back + Header */}
            <div className="mb-4">
                <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Entries
                </button>
                <PageHeader
                    title={entry.title}
                    subtitle={`${entry.project?.name ?? ""} · ${entry.template?.name ?? ""}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <Badge status={entry.status} />
                            {isAdmin && (
                                isOpen ? (
                                    <Button variant="secondary" icon={Lock} onClick={handleClose}>Close Entry</Button>
                                ) : (
                                    <Button variant="secondary" icon={Unlock} onClick={handleReopen}>Reopen</Button>
                                )
                            )}
                            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export CSV</Button>
                        </div>
                    }
                />
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-800">{error}</div>
            )}

            {!isOpen && (
                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    This entry is <strong>closed</strong> and read-only. Reopen it to make changes.
                </div>
            )}

            {/* Inline Grid */}
            {fields.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/80">
                                    <th className="w-10 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                                    {fields.map((f) => (
                                        <th key={f.key} className="px-1 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {f.label}{f.required && <span className="text-red-400 ml-0.5">*</span>}
                                        </th>
                                    ))}
                                    <th className="w-24 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                    {isOpen && <th className="w-20 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, idx) => (
                                    <tr key={row._id} className={`transition-colors ${row.status === "saved" ? "bg-green-50/30" : row.status === "error" ? "bg-red-50/30" : "hover:bg-blue-50/20"}`}>
                                        <td className="px-3 py-1 text-center text-xs font-medium text-gray-400">{idx + 1}</td>
                                        {fields.map((f) => (
                                            <td key={`${row._id}-${f.key}`} className="px-0 py-0 border-l border-gray-100 first:border-l-0">
                                                {renderCellInput(f, row)}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-center">{statusIcon(row)}</td>
                                        {isOpen && (
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    {!row.dbId && row.status !== "saved" && (
                                                        <button type="button" onClick={() => saveRow(row._id)} disabled={row.status === "saving"} className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50" title="Save"><Save className="h-4 w-4" /></button>
                                                    )}
                                                    {!row.dbId && (
                                                        <button type="button" onClick={() => removeRow(row._id)} disabled={row.status === "saving"} className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50" title="Remove"><Trash2 className="h-4 w-4" /></button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {isOpen && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                            <button type="button" onClick={addRow} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700">
                                <Plus className="h-4 w-4" /> Add Row
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
