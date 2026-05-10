import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
    fetchEntry,
    closeEntry,
    reopenEntry,
    markEntryExported,
    bulkStoreRecords,
    updateRecord,
    HttpValidationError,
} from "../../services/api";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/Button";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";
import {
    ArrowLeft,
    Lock,
    Unlock,
    Download,
    FileSpreadsheet,
    Plus,
    Trash2,
    Save,
    RotateCcw,
} from "lucide-react";
import {
    getExportableColumns,
    getRowsForExport,
    buildWorkbook,
    exportToXlsx,
    buildExportFilename,
    EXPORT_MAX_ROWS,
} from "../../utils/exportExcel";

ModuleRegistry.registerModules([AllCommunityModule]);

const MAX_ROWS_PER_SUBMISSION = 500;

const TEXT_MAX_MIN = 255;
const TEXT_MAX_CAP = 10000;
const TEXT_MAX_DEFAULT = 2000;

let rowIdCounter = 0;
const nextClientId = () => `row_${++rowIdCounter}`;

function effectiveTextMax(field) {
    const baseType = field.base_type ?? "text";
    if (baseType === "textarea") {
        const max = Number(field.max) || 5000;
        return Math.min(TEXT_MAX_CAP, Math.max(TEXT_MAX_MIN, max));
    }
    const max = Number(field.max) || TEXT_MAX_DEFAULT;
    return Math.min(TEXT_MAX_CAP, Math.max(TEXT_MAX_MIN, max));
}

function isEmptyValue(value) {
    return value === null || value === "" || value === undefined;
}

function createBlankRow(fields) {
    const row = { __clientId: nextClientId(), __savedDbId: null, __dirty: false };
    for (const f of fields) {
        row[f.key] = "";
    }
    return row;
}

function rowFromRecord(r, fields) {
    const data = r.data ?? {};
    const row = {
        __clientId: `existing_${r.id}`,
        __savedDbId: r.id,
        __dirty: false,
    };
    for (const f of fields) {
        row[f.key] = data[f.key] ?? "";
    }
    return row;
}

function isRowEmpty(row, fields) {
    return !fields.some((f) => !isEmptyValue(row[f.key]));
}

/** Normalize a draft row for API: trim strings; empty optional → null */
function normalizeRowForSubmit(row, fields) {
    const out = {};
    for (const f of fields) {
        const key = f.key;
        let v = row[key];
        const nullable = !(f.required ?? false);
        const baseType = f.base_type ?? "text";

        if (baseType === "number") {
            if (isEmptyValue(v)) {
                out[key] = nullable ? null : "";
                continue;
            }
            const n = typeof v === "number" ? v : Number(String(v).trim());
            out[key] = Number.isFinite(n) ? n : v;
            continue;
        }

        if (typeof v === "string") v = v.trim();
        if (v === "" || v === undefined || v === null) {
            out[key] = nullable ? null : "";
            continue;
        }
        out[key] = v;
    }
    return out;
}

function validateRowData(normalized, fields, rowLabel) {
    const messages = [];

    for (const f of fields) {
        const key = f.key;
        const v = normalized[key];
        const required = !!(f.required ?? false);
        const baseType = f.base_type ?? "text";

        if (required && isEmptyValue(v)) {
            messages.push(`${rowLabel}: ${f.label} is required.`);
            continue;
        }
        if (isEmptyValue(v)) continue;

        if (baseType === "number") {
            if (!isFinite(Number(v))) {
                messages.push(`${rowLabel}: ${f.label} must be a number.`);
            }
            continue;
        }

        if (baseType === "date") {
            if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                messages.push(`${rowLabel}: ${f.label} must be a valid date (YYYY-MM-DD).`);
            }
            continue;
        }

        if (baseType === "boolean") {
            const ok = ["yes", "no", "0", "1", true, false, "true", "false"].includes(v);
            if (!ok) {
                messages.push(`${rowLabel}: ${f.label} is invalid.`);
            }
            continue;
        }

        if (baseType === "select") {
            const opts = Array.isArray(f.settings?.options) ? f.settings.options : [];
            if (opts.length && !opts.map(String).includes(String(v))) {
                messages.push(`${rowLabel}: ${f.label} is invalid.`);
            }
            continue;
        }

        if (baseType === "text" || baseType === "textarea") {
            const str = String(v);
            const max = effectiveTextMax(f);
            if (str.length > max) {
                messages.push(`${rowLabel}: ${f.label} exceeds maximum length (${max}).`);
            }
        }
    }

    return messages;
}

function summarizeLaravelErrors(errors) {
    const lines = [];
    const reField = /^rows\.(\d+)\.(.+)$/;
    const reRowOnly = /^rows\.(\d+)$/;
    for (const [key, msgs] of Object.entries(errors || {})) {
        const arr = Array.isArray(msgs) ? msgs : [msgs];
        const mField = key.match(reField);
        if (mField) {
            const rowNum = Number(mField[1]) + 1;
            const field = mField[2];
            for (const msg of arr) {
                lines.push(`Row ${rowNum} (${field}): ${msg}`);
            }
            continue;
        }
        const mRow = key.match(reRowOnly);
        if (mRow) {
            const rowNum = Number(mRow[1]) + 1;
            for (const msg of arr) {
                lines.push(`Row ${rowNum}: ${msg}`);
            }
            continue;
        }
        for (const msg of arr) {
            lines.push(`${key}: ${msg}`);
        }
    }
    return lines;
}

function canEditRow(data, isOpen) {
    return Boolean(isOpen && data);
}

export default function EntryDetailScreen({ entryId, onBack, isAdmin }) {
    const [entry, setEntry] = useState(null);
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clientMessages, setClientMessages] = useState([]);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportNotice, setExportNotice] = useState(null);

    const gridApiRef = useRef(null);

    useEffect(() => {
        if (!exportNotice) return undefined;
        const t = setTimeout(() => setExportNotice(null), 6000);
        return () => clearTimeout(t);
    }, [exportNotice]);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchEntry(entryId);
            setEntry(data);
            const fields = data.template?.schema?.fields ?? [];
            const existingRows = (data.records ?? []).map((r) => rowFromRecord(r, fields));
            setRowData(existingRows);
            setError("");
            setClientMessages([]);
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
    const readOnlyBanner = !isOpen;
    const mergeExportSuccessWithReadOnly =
        Boolean(exportNotice) &&
        exportNotice.variant === "success" &&
        readOnlyBanner;

    const defaultColDef = useMemo(
        () => ({
            editable: true,
            resizable: true,
            sortable: false,
            filter: false,
            flex: 1,
            minWidth: 120,
        }),
        [],
    );

    const columnDefs = useMemo(() => {
        const cols = [
            {
                colId: "__idx",
                headerName: "#",
                width: 56,
                maxWidth: 64,
                pinned: "left",
                editable: false,
                valueGetter: (p) => (p.node?.rowPinned ? "" : (p.node?.rowIndex ?? 0) + 1),
            },
        ];

        for (const field of fields) {
            const baseType = field.base_type ?? "text";
            const col = {
                colId: field.key,
                field: field.key,
                headerName: field.required ? `${field.label} *` : field.label,
                editable: (p) => canEditRow(p.data, isOpen),
            };

            if (baseType === "number") {
                col.cellDataType = "number";
                col.valueParser = (p) => {
                    const raw = p.newValue;
                    if (raw === "" || raw === null || raw === undefined) return "";
                    const n = Number(String(raw).replace(/,/g, ""));
                    return Number.isFinite(n) ? n : p.oldValue;
                };
            } else if (baseType === "select") {
                const opts = Array.isArray(field.settings?.options) ? field.settings.options : [];
                col.cellEditor = "agSelectCellEditor";
                col.cellEditorParams = { values: ["", ...opts.map(String)] };
            } else if (baseType === "boolean") {
                col.cellEditor = "agSelectCellEditor";
                col.cellEditorParams = { values: ["", "yes", "no"] };
            } else if (baseType === "textarea") {
                col.cellEditor = "agLargeTextCellEditor";
                col.cellEditorParams = { maxLength: effectiveTextMax(field), rows: 3, cols: 30 };
            } else if (baseType === "text") {
                col.cellEditor = "agLargeTextCellEditor";
                col.cellEditorParams = { maxLength: effectiveTextMax(field), rows: 2, cols: 28 };
            } else if (baseType === "date") {
                col.cellEditor = "agTextCellEditor";
            }

            cols.push(col);
        }

        cols.push({
            colId: "__status",
            headerName: "Status",
            width: 110,
            maxWidth: 120,
            pinned: "right",
            editable: false,
            valueGetter: (p) => {
                const d = p.data;
                if (!d) return "";
                if (d.__savedDbId) return d.__dirty ? "Modified" : "Saved";
                return "Draft";
            },
        });

        return cols;
    }, [fields, isOpen]);

    const onCellValueChanged = useCallback((e) => {
        if (!e.data) return;
        setRowData((prev) =>
            prev.map((row) => {
                if (row.__clientId !== e.data.__clientId) return row;
                const next = { ...e.data };
                if (next.__savedDbId) {
                    next.__dirty = true;
                }
                return next;
            }),
        );
    }, []);

    const onGridReady = useCallback((e) => {
        gridApiRef.current = e.api;
    }, []);

    const addRow = useCallback(() => {
        if (!isOpen || !fields.length) return;
        setRowData((prev) => [...prev, createBlankRow(fields)]);
    }, [fields, isOpen]);

    const deleteSelectedRows = useCallback(() => {
        const api = gridApiRef.current;
        if (!api || !isOpen) return;
        const selected = api.getSelectedRows().filter((r) => r && !r.__savedDbId);
        if (!selected.length) return;
        const ids = new Set(selected.map((r) => r.__clientId));
        setRowData((prev) => prev.filter((r) => !ids.has(r.__clientId)));
        api.deselectAll();
    }, [isOpen]);

    const resetDrafts = useCallback(() => {
        if (!isOpen) return;
        setRowData((prev) => prev.filter((r) => r.__savedDbId));
        setClientMessages([]);
        setError("");
    }, [isOpen]);

    const handleSave = useCallback(async () => {
        if (!entry || !fields.length || !isOpen) return;

        const api = gridApiRef.current;
        api?.stopEditing();

        setError("");
        setClientMessages([]);

        const dirtySaved = rowData.filter((r) => r.__savedDbId && r.__dirty);
        const drafts = rowData.filter((r) => !r.__savedDbId);
        const nonEmptyDrafts = drafts.filter((r) => !isRowEmpty(r, fields));

        const clientMessagesAcc = [];

        for (const row of dirtySaved) {
            const normalized = normalizeRowForSubmit(row, fields);
            const rowNum = rowData.findIndex((r) => r.__clientId === row.__clientId) + 1;
            const label = `Row ${rowNum}`;
            clientMessagesAcc.push(...validateRowData(normalized, fields, label));
        }

        const rowsPayload = [];
        for (let i = 0; i < nonEmptyDrafts.length; i++) {
            const row = nonEmptyDrafts[i];
            const normalized = normalizeRowForSubmit(row, fields);
            const label = `New row ${i + 1}`;
            clientMessagesAcc.push(...validateRowData(normalized, fields, label));
            rowsPayload.push(normalized);
        }

        if (clientMessagesAcc.length) {
            setClientMessages(clientMessagesAcc);
            return;
        }

        if (dirtySaved.length === 0 && nonEmptyDrafts.length === 0) {
            setClientMessages(["No changes to save."]);
            return;
        }

        if (nonEmptyDrafts.length > MAX_ROWS_PER_SUBMISSION) {
            setClientMessages([
                `You can save at most ${MAX_ROWS_PER_SUBMISSION} new rows at once. Please split your submission.`,
            ]);
            return;
        }

        setSaving(true);
        try {
            for (const row of dirtySaved) {
                const normalized = normalizeRowForSubmit(row, fields);
                await updateRecord(row.__savedDbId, { data: normalized });
            }
            if (nonEmptyDrafts.length > 0) {
                await bulkStoreRecords({
                    template_id: entry.template.id,
                    entry_id: entry.id,
                    rows: rowsPayload,
                });
            }
            await load();
        } catch (err) {
            if (err instanceof HttpValidationError) {
                setClientMessages(summarizeLaravelErrors(err.errors));
            } else {
                setError(err.message);
            }
        } finally {
            setSaving(false);
        }
    }, [entry, fields, isOpen, rowData]);

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

    const exportCsv = async () => {
        if (!fields.length || !entry) return;
        const header = fields.map((f) => `"${String(f.label).replaceAll('"', '""')}"`).join(",");
        const dataRows = rowData
            .filter((r) => r.__savedDbId)
            .map((r) =>
                fields.map((f) => `"${String(r[f.key] ?? "").replaceAll('"', '""')}"`).join(","),
            );
        const csv = [header, ...dataRows].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${entry?.title?.replace(/\s+/g, "_") ?? "entry"}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        try {
            const updated = await markEntryExported(entry.id);
            const nextStatus = updated?.status ?? "exported";
            setEntry((e) => (e ? { ...e, status: nextStatus } : e));
        } catch (err) {
            const msg = err?.message
                ? String(err.message)
                : "Could not update entry status.";
            setExportNotice({
                variant: "warning",
                text: `CSV downloaded, but the entry could not be marked as exported: ${msg}`,
            });
        }
    };

    const handleExportExcel = async () => {
        if (!fields.length || !entry) {
            setExportNotice({ variant: "error", text: "Nothing to export for this entry." });
            return;
        }
        const api = gridApiRef.current;
        if (!api) {
            setExportNotice({ variant: "error", text: "Grid is not ready yet. Try again in a moment." });
            return;
        }

        setExportNotice(null);
        const rowResult = getRowsForExport(api, { preferSelected: true, maxRows: EXPORT_MAX_ROWS });

        if (!rowResult.ok) {
            if (rowResult.error === "EMPTY") {
                setExportNotice({
                    variant: "error",
                    text: "No rows to export. Add or load records, or clear the row selection to export all displayed rows.",
                });
                return;
            }
            if (rowResult.error === "OVER_LIMIT") {
                setExportNotice({
                    variant: "error",
                    text: `This export would include ${rowResult.count.toLocaleString()} rows, which exceeds the limit of ${EXPORT_MAX_ROWS.toLocaleString()}. Narrow your selection or filters and try again.`,
                });
                return;
            }
            setExportNotice({ variant: "error", text: "Export could not read the grid. Please try again." });
            return;
        }

        setExporting(true);
        try {
            const columns = getExportableColumns(columnDefs, fields);
            const workbook = await buildWorkbook({
                title: `${entry.title} — records export`,
                exportedAt: new Date(),
                recordCount: rowResult.count,
                columns,
                rows: rowResult.rows,
                includeTotals: true,
            });
            const filename = buildExportFilename(entry.title);
            await exportToXlsx({ workbook, filename });
            const scope = rowResult.usedSelection ? "selected rows" : "displayed rows";
            let noticeText = `Exported ${rowResult.count.toLocaleString()} ${scope} to ${filename}.`;
            try {
                const updated = await markEntryExported(entry.id);
                const nextStatus = updated?.status ?? "exported";
                setEntry((e) => (e ? { ...e, status: nextStatus } : e));
            } catch (err) {
                const msg = err?.message
                    ? String(err.message)
                    : "Could not update entry status.";
                noticeText += ` ${msg}`;
            }
            setExportNotice({
                variant: "success",
                text: noticeText,
            });
        } catch (err) {
            setExportNotice({
                variant: "error",
                text: err?.message ? `Export failed: ${err.message}` : "Export failed. Please try again.",
            });
        } finally {
            setExporting(false);
        }
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
        <div className="entry-detail-root max-w-[1600px] space-y-3">
            <div className="mb-4">
                <button
                    type="button"
                    onClick={() => onBack?.(entry.project_id)}
                    className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Entries
                </button>
                <PageHeader
                    dense
                    title={entry.title}
                    subtitle={`${entry.project?.name ?? ""} · ${entry.template?.name ?? ""}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge status={entry.status} />
                            {isAdmin &&
                                (isOpen ? (
                                    <Button variant="secondary" icon={Lock} onClick={handleClose}>
                                        Close Entry
                                    </Button>
                                ) : (
                                    <Button variant="secondary" icon={Unlock} onClick={handleReopen}>
                                        Reopen
                                    </Button>
                                ))}
                            <Button
                                variant="secondary"
                                icon={FileSpreadsheet}
                                onClick={handleExportExcel}
                                loading={exporting}
                                disabled={exporting}
                            >
                                Export Excel
                            </Button>
                            <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={exporting}>
                                Export CSV
                            </Button>
                        </div>
                    }
                />
            </div>

            {error && (
                <div className="mb-2 rounded-md bg-red-50 px-2.5 py-1.5 border border-red-200 text-xs leading-snug text-red-800">
                    {error}
                </div>
            )}

            {mergeExportSuccessWithReadOnly ? (
                <div className="mb-2 rounded-md border border-emerald-200/80 bg-emerald-50/95 px-2.5 py-2 text-xs shadow-sm">
                    <p className="leading-snug text-emerald-950">{exportNotice.text}</p>
                    <p className="mt-1.5 border-t border-emerald-200/70 pt-1.5 text-[11px] leading-snug text-amber-900">
                        {entry.status === "exported"
                            ? "Entry is now exported and locked — an admin can reopen if you need to edit."
                            : "Read-only — reopen the entry to make changes."}
                    </p>
                </div>
            ) : (
                <>
                    {exportNotice && (
                        <div
                            className={`mb-2 rounded-md border px-2.5 py-1.5 text-xs leading-snug ${
                                exportNotice.variant === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                                    : exportNotice.variant === "warning"
                                      ? "border-amber-200 bg-amber-50 text-amber-950"
                                      : "border-red-200 bg-red-50 text-red-800"
                            }`}
                        >
                            {exportNotice.text}
                        </div>
                    )}

                    {readOnlyBanner && (
                        <div className="mb-2 rounded-md border border-amber-200/90 bg-amber-50/95 px-2.5 py-1.5 text-[11px] leading-snug text-amber-950">
                            {entry.status === "exported" ? (
                                <>
                                    <strong>Exported</strong> — read-only. An admin can reopen to edit.
                                </>
                            ) : (
                                <>
                                    <strong>Closed</strong> — read-only. Reopen to edit.
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {clientMessages.length > 0 && (
                <div className="mb-2 rounded-md bg-red-50 px-2.5 py-2 border border-red-200 text-xs text-red-800">
                    <p className="font-medium mb-1">Please fix the following:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                        {clientMessages.map((m, i) => (
                            <li key={i}>{m}</li>
                        ))}
                    </ul>
                </div>
            )}

            {fields.length > 0 && (
                <section className="nia-entry-sheet border border-[#7f7f7f] bg-[#fcfcfc] shadow-[inset_0_1px_0_#fff,0_1px_2px_rgba(0,0,0,0.08)]">
                    <div className="nia-entry-sheet__titlebar flex flex-col gap-0.5 border-b border-[#8c8c8c] bg-[#e4e4e4] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-800">
                                Entry data sheet
                            </h2>
                            <p className="text-[11px] leading-snug text-gray-600">
                                One row per record. Edit any cell while the entry is open, then <strong>Save</strong>.
                                New rows must have data; saved rows send only rows you changed.
                            </p>
                        </div>
                    </div>
                    <div className="nia-entry-sheet__toolbar flex flex-wrap items-center gap-1.5 border-b border-[#b4b4b4] bg-[#f0f0f0] px-2 py-1.5">
                        <Button
                            type="button"
                            size="sm"
                            icon={Plus}
                            onClick={addRow}
                            disabled={!isOpen}
                            className="!shadow-none !border-[#adadad] !bg-[#f7f7f7] hover:!bg-[#eaeaea] !text-gray-900"
                            variant="secondary"
                        >
                            Add row
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={Trash2}
                            onClick={deleteSelectedRows}
                            disabled={!isOpen}
                            className="!shadow-none !border-[#adadad] !bg-[#f7f7f7] hover:!bg-[#eaeaea] !text-gray-900"
                        >
                            Delete selected
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            icon={Save}
                            onClick={handleSave}
                            disabled={!isOpen || saving}
                            loading={saving}
                            className="!shadow-none !border-[#1a5c38] !bg-[#217346] hover:!bg-[#1a5c38] !text-white"
                        >
                            Save
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon={RotateCcw}
                            onClick={resetDrafts}
                            disabled={!isOpen}
                            className="!shadow-none !border-[#adadad] !bg-[#f7f7f7] hover:!bg-[#eaeaea] !text-gray-900"
                        >
                            Reset drafts
                        </Button>
                    </div>
                    <div
                        className="nia-entry-grid--excel ag-theme-balham nia-entry-sheet__grid w-full border-t border-[#b4b4b4]"
                        style={{ height: "min(58vh, 560px)", minHeight: "360px" }}
                    >
                        <AgGridReact
                            theme="legacy"
                            rowData={rowData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            getRowId={(p) => p.data.__clientId}
                            onGridReady={onGridReady}
                            onCellValueChanged={onCellValueChanged}
                            rowSelection={{
                                mode: "multiRow",
                                checkboxes: true,
                                headerCheckbox: true,
                                isRowSelectable: (node) => Boolean(node.data),
                                enableClickSelection: true,
                            }}
                        />
                    </div>
                </section>
            )}
        </div>
    );
}
