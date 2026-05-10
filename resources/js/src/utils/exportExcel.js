import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const DEFAULT_MAX_ROWS = 5000;

/** Single consistent body size for title, meta, headers, and body (Excel pt). */
export const EXPORT_FONT_FAMILY = "Calibri";
export const EXPORT_FONT_SIZE_PT = 11;

const BORDER_BLACK_THIN = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
};

/** Grid inside the formal table region */
const BORDER_TABLE = BORDER_BLACK_THIN;

const META_BORDER_LIGHT = {
    left: { style: "thin", color: { argb: "FF9CA3AF" } },
    bottom: { style: "thin", color: { argb: "FF9CA3AF" } },
    right: { style: "thin", color: { argb: "FF9CA3AF" } },
};

function fontMeta({ bold = false } = {}) {
    return {
        name: EXPORT_FONT_FAMILY,
        size: EXPORT_FONT_SIZE_PT,
        bold,
        color: { argb: bold ? "FF374151" : "FF1F2937" },
    };
}

function fontTitle() {
    return {
        name: EXPORT_FONT_FAMILY,
        size: EXPORT_FONT_SIZE_PT,
        bold: true,
        color: { argb: "FF111827" },
    };
}

function fontHeader() {
    return {
        name: EXPORT_FONT_FAMILY,
        size: EXPORT_FONT_SIZE_PT,
        bold: true,
        color: { argb: "FF111827" },
    };
}

function fontData({ bold = false } = {}) {
    return {
        name: EXPORT_FONT_FAMILY,
        size: EXPORT_FONT_SIZE_PT,
        bold,
        color: { argb: "FF111827" },
    };
}

const FILL_HEADER = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
const FILL_META = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

/**
 * Human-readable local date/time for the metadata row (not raw ISO).
 * @param {Date|string|number} input
 */
export function formatExportTimestamp(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return String(input);
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(d);
    } catch {
        return d.toLocaleString();
    }
}

/**
 * Build export column descriptors from template fields (excludes #, Status, internal keys).
 * @param {import('ag-grid-community').ColDef[]} _columnDefs
 * @param {object[]} fields template schema fields
 * @returns {{ field: string, headerName: string, baseType: string, fieldDef: object }[]}
 */
export function getExportableColumns(_columnDefs, fields) {
    if (!Array.isArray(fields)) return [];
    return fields.map((f) => ({
        field: f.key,
        headerName: String(f.label ?? f.key),
        baseType: f.base_type ?? "text",
        fieldDef: f,
    }));
}

/**
 * Collect row data from AG Grid in display order. Prefers selected rows when non-empty.
 * @param {import('ag-grid-community').GridApi} api
 * @param {{ preferSelected?: boolean, maxRows?: number }} options
 */
export function getRowsForExport(api, options = {}) {
    const preferSelected = options.preferSelected !== false;
    const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;

    if (!api) {
        return { ok: false, error: "NO_API", rows: [], usedSelection: false, count: 0 };
    }

    const collectDisplayed = () => {
        const out = [];
        api.forEachNodeAfterFilterAndSort((node) => {
            if (node?.data) out.push(node.data);
        });
        return out;
    };

    const collectSelectedInDisplayOrder = () => {
        const out = [];
        api.forEachNodeAfterFilterAndSort((node) => {
            if (node?.data && node.isSelected && node.isSelected()) {
                out.push(node.data);
            }
        });
        return out;
    };

    let rows;
    let usedSelection = false;

    if (preferSelected) {
        const selected = collectSelectedInDisplayOrder();
        if (selected.length) {
            rows = selected;
            usedSelection = true;
        } else {
            rows = collectDisplayed();
        }
    } else {
        rows = collectDisplayed();
    }

    const count = rows.length;
    if (count === 0) {
        return { ok: false, error: "EMPTY", rows: [], usedSelection, count: 0 };
    }
    if (count > maxRows) {
        return { ok: false, error: "OVER_LIMIT", rows: [], usedSelection, count };
    }

    return { ok: true, error: null, rows, usedSelection, count };
}

/**
 * @param {unknown} value cell value from row data
 * @param {{ baseType?: string }} fieldMeta
 * @returns {{ value: unknown, numFmt?: string }}
 */
export function formatExportValue(value, fieldMeta) {
    const baseType = fieldMeta.baseType ?? "text";
    const isEmpty = value === null || value === undefined || value === "";

    if (isEmpty) {
        return { value: null };
    }

    if (baseType === "number") {
        const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
        if (!Number.isFinite(n)) {
            return { value: String(value) };
        }
        const numFmt = Number.isInteger(n) && Math.abs(n) < 1e12 ? "#,##0" : "#,##0.00";
        return { value: n, numFmt };
    }

    if (baseType === "date") {
        const s = String(value).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split("-").map(Number);
            return { value: new Date(Date.UTC(y, m - 1, d)), numFmt: "yyyy-mm-dd" };
        }
        return { value: s };
    }

    return { value: String(value) };
}

function estimateColumnWidth(header, samples, minW = 12, maxW = 55) {
    const lens = [header.length, ...samples.map((s) => String(s ?? "").length)];
    const w = Math.ceil(Math.max(...lens, 8) * 1.12 + 3);
    return Math.min(maxW, Math.max(minW, w));
}

/** @param {{ baseType?: string }} col */
function dataCellAlignment(col, value) {
    const t = col.baseType ?? "text";
    if (t === "number" && typeof value === "number" && Number.isFinite(value)) {
        return { vertical: "middle", horizontal: "right", wrapText: false };
    }
    if (t === "date" && value instanceof Date) {
        return { vertical: "middle", horizontal: "right", wrapText: false };
    }
    return { vertical: "middle", horizontal: "left", wrapText: true };
}

/**
 * @param {object} params
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function buildWorkbook({
    title,
    exportedAt,
    recordCount,
    columns,
    rows,
    includeTotals = true,
}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "NIA";
    const worksheet = workbook.addWorksheet("Records", {
        properties: { defaultRowHeight: 20 },
    });

    const colCount = columns.length;

    const titleRowIndex = 1;
    worksheet.mergeCells(1, 1, 1, colCount);
    const titleCell = worksheet.getCell(titleRowIndex, 1);
    titleCell.value = title;
    titleCell.font = fontTitle();
    titleCell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    titleCell.fill = FILL_META;
    titleCell.border = {
        bottom: { style: "medium", color: { argb: "FF000000" } },
    };

    const exportedLabel = "Exported at:";
    const exportedValue =
        exportedAt instanceof Date || typeof exportedAt === "string" || typeof exportedAt === "number"
            ? formatExportTimestamp(exportedAt)
            : String(exportedAt);

    if (colCount === 1) {
        worksheet.getCell(2, 1).value = `${exportedLabel} ${exportedValue}`;
        worksheet.getCell(2, 1).font = fontMeta({ bold: false });
        worksheet.getCell(2, 1).fill = FILL_META;
        worksheet.getCell(2, 1).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        worksheet.getCell(2, 1).border = { ...META_BORDER_LIGHT };
    } else {
        worksheet.getCell(2, 1).value = exportedLabel;
        worksheet.getCell(2, 1).font = fontMeta({ bold: true });
        worksheet.getCell(2, 1).fill = FILL_META;
        worksheet.getCell(2, 1).alignment = { vertical: "middle", horizontal: "left" };
        worksheet.getCell(2, 1).border = {
            left: META_BORDER_LIGHT.left,
            bottom: META_BORDER_LIGHT.bottom,
        };
        worksheet.mergeCells(2, 2, 2, colCount);
        worksheet.getCell(2, 2).value = exportedValue;
        worksheet.getCell(2, 2).font = fontMeta({ bold: false });
        worksheet.getCell(2, 2).fill = FILL_META;
        worksheet.getCell(2, 2).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        worksheet.getCell(2, 2).border = {
            bottom: META_BORDER_LIGHT.bottom,
            right: META_BORDER_LIGHT.right,
        };
    }

    if (colCount === 1) {
        worksheet.getCell(3, 1).value = `Total records: ${recordCount}`;
        worksheet.getCell(3, 1).font = fontMeta({ bold: true });
        worksheet.getCell(3, 1).fill = FILL_META;
        worksheet.getCell(3, 1).alignment = { vertical: "middle", horizontal: "left" };
        worksheet.getCell(3, 1).border = {
            ...META_BORDER_LIGHT,
            bottom: { style: "medium", color: { argb: "FF000000" } },
        };
    } else {
        worksheet.getCell(3, 1).value = "Total records:";
        worksheet.getCell(3, 1).font = fontMeta({ bold: true });
        worksheet.getCell(3, 1).fill = FILL_META;
        worksheet.getCell(3, 1).alignment = { vertical: "middle", horizontal: "left" };
        worksheet.getCell(3, 1).border = {
            left: META_BORDER_LIGHT.left,
            bottom: { style: "medium", color: { argb: "FF000000" } },
        };
        worksheet.mergeCells(3, 2, 3, colCount);
        worksheet.getCell(3, 2).value = recordCount;
        worksheet.getCell(3, 2).font = fontMeta({ bold: false });
        worksheet.getCell(3, 2).fill = FILL_META;
        worksheet.getCell(3, 2).alignment = { vertical: "middle", horizontal: "left" };
        worksheet.getCell(3, 2).border = {
            bottom: { style: "medium", color: { argb: "FF000000" } },
            right: META_BORDER_LIGHT.right,
        };
    }

    worksheet.getRow(1).height = 22;

    worksheet.addRow([]);

    const headerRowIndex = 5;

    const numericColIndexes = columns
        .map((c, i) => (c.baseType === "number" ? i : -1))
        .filter((i) => i >= 0);
    const sums = numericColIndexes.map(() => 0);
    const sumCounts = numericColIndexes.map(() => 0);

    const uniqueTableColumnNames = [];
    const seenLabels = new Set();
    for (const col of columns) {
        let label = String(col.headerName ?? col.field ?? "");
        let suffix = 2;
        while (seenLabels.has(label)) {
            label = `${String(col.headerName ?? col.field ?? "Column")} (${suffix})`;
            suffix += 1;
        }
        seenLabels.add(label);
        uniqueTableColumnNames.push(label);
    }

    const tableRows = [];
    for (const row of rows) {
        const line = [];
        columns.forEach((col, i) => {
            const raw = row[col.field];
            const { value } = formatExportValue(raw, col);
            line.push(value);
            const ni = numericColIndexes.indexOf(i);
            if (ni >= 0 && typeof value === "number" && Number.isFinite(value)) {
                sums[ni] += value;
                sumCounts[ni] += 1;
            }
        });
        tableRows.push(line);
    }

    if (colCount > 0 && rows.length > 0) {
        worksheet.addTable({
            name: `Tbl_${Date.now()}`,
            ref: `A${headerRowIndex}`,
            headerRow: true,
            totalsRow: false,
            columns: uniqueTableColumnNames.map((name) => ({ name })),
            rows: tableRows,
            style: {
                theme: "TableStyleMedium2",
                showRowStripes: true,
                showColumnStripes: false,
            },
        });

        const headerRow = worksheet.getRow(headerRowIndex);
        columns.forEach((col, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.font = fontHeader();
            cell.fill = FILL_HEADER;
            cell.border = {
                top: { style: "medium", color: { argb: "FF000000" } },
                left: BORDER_BLACK_THIN.left,
                bottom: { style: "medium", color: { argb: "FF000000" } },
                right: BORDER_BLACK_THIN.right,
            };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        });

        rows.forEach((row, ri) => {
            const dataRow = worksheet.getRow(headerRowIndex + 1 + ri);
            columns.forEach((col, i) => {
                const raw = row[col.field];
                const { value, numFmt } = formatExportValue(raw, col);
                const cell = dataRow.getCell(i + 1);
                cell.value = value;
                if (numFmt) cell.numFmt = numFmt;
                cell.font = fontData();
                cell.border = BORDER_TABLE;
                cell.alignment = dataCellAlignment(col, value);
            });
        });
    }

    if (includeTotals && numericColIndexes.length && colCount > 0 && rows.length > 0) {
        const totalsRowIndex = headerRowIndex + rows.length + 1;
        let labelPlaced = false;
        columns.forEach((col, i) => {
            const cell = worksheet.getRow(totalsRowIndex).getCell(i + 1);
            cell.border = BORDER_TABLE;
            cell.font = fontData({ bold: true });
            if (col.baseType === "number") {
                const ni = numericColIndexes.indexOf(i);
                if (ni < 0 || sumCounts[ni] === 0) {
                    cell.value = "";
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEFF1" } };
                    return;
                }
                const sum = sums[ni];
                cell.value = sum;
                cell.numFmt = Math.abs(sum - Math.round(sum)) < 1e-6 ? "#,##0" : "#,##0.00";
                cell.font = fontData({ bold: true });
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEFF1" } };
                cell.alignment = { vertical: "middle", horizontal: "right" };
                return;
            }
            if (!labelPlaced) {
                cell.value = "Totals";
                cell.font = fontData({ bold: true });
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEFF1" } };
                cell.alignment = { vertical: "middle", horizontal: "left" };
                labelPlaced = true;
            } else {
                cell.value = "";
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECEFF1" } };
            }
        });
    }

    const samplesPerCol = columns.map((col) =>
        rows.slice(0, 50).map((r) => {
            const { value } = formatExportValue(r[col.field], col);
            if (value instanceof Date) return value.toISOString().slice(0, 10);
            return value;
        }),
    );

    columns.forEach((col, i) => {
        worksheet.getColumn(i + 1).width = estimateColumnWidth(col.headerName, samplesPerCol[i]);
    });

    worksheet.views = [
        {
            state: "frozen",
            xSplit: 0,
            ySplit: headerRowIndex,
            topLeftCell: `A${headerRowIndex + 1}`,
            activeCell: `A${headerRowIndex + 1}`,
            showGridLines: true,
        },
    ];

    return workbook;
}

/**
 * @param {{ workbook: ExcelJS.Workbook, filename: string }} params
 */
export async function exportToXlsx({ workbook, filename }) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
}

export function buildExportFilename(entryTitle, date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const slug =
        String(entryTitle || "entry-records")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60) || "entry-records";
    return `${slug}-export-${y}-${m}-${d}.xlsx`;
}

export const EXPORT_MAX_ROWS = DEFAULT_MAX_ROWS;
