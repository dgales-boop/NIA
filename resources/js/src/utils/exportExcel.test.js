import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import {
    buildWorkbook,
    EXPORT_FONT_FAMILY,
    EXPORT_FONT_SIZE_PT,
} from "./exportExcel.js";

describe("buildWorkbook", () => {
    it("uses consistent Calibri 11pt for title, meta, header, and data", async () => {
        const wb = await buildWorkbook({
            title: "Sample — records export",
            exportedAt: new Date("2026-05-10T12:00:00.000Z"),
            recordCount: 2,
            columns: [
                { field: "loc", headerName: "Location", baseType: "text" },
                { field: "amt", headerName: "Amount", baseType: "number" },
            ],
            rows: [
                { loc: "North", amt: 10 },
                { loc: "South", amt: 20 },
            ],
            includeTotals: true,
        });

        const buf = await wb.xlsx.writeBuffer();
        const read = new ExcelJS.Workbook();
        await read.xlsx.load(buf);
        const sheet = read.getWorksheet("Records");
        expect(sheet).toBeTruthy();

        expect(sheet.getCell(1, 1).font?.size).toBe(EXPORT_FONT_SIZE_PT);
        expect(sheet.getCell(1, 1).font?.name).toBe(EXPORT_FONT_FAMILY);

        expect(sheet.getCell(2, 1).font?.size).toBe(EXPORT_FONT_SIZE_PT);
        expect(sheet.getCell(3, 1).font?.size).toBe(EXPORT_FONT_SIZE_PT);

        const headerRow = 5;
        expect(sheet.getCell(headerRow, 1).font?.size).toBe(EXPORT_FONT_SIZE_PT);
        expect(sheet.getCell(headerRow + 1, 1).font?.size).toBe(EXPORT_FONT_SIZE_PT);
    });

    it("registers an Excel table on the worksheet (header + body, totals separate)", async () => {
        const wb = await buildWorkbook({
            title: "T",
            exportedAt: new Date(),
            recordCount: 1,
            columns: [{ field: "x", headerName: "X", baseType: "text" }],
            rows: [{ x: "a" }],
            includeTotals: false,
        });

        const sheet = wb.getWorksheet("Records");
        expect(sheet).toBeTruthy();
        expect(Object.keys(sheet.tables).length).toBeGreaterThan(0);

        const buf = await wb.xlsx.writeBuffer();
        const read = new ExcelJS.Workbook();
        await read.xlsx.load(buf);
        const sheet2 = read.getWorksheet("Records");
        expect(Object.keys(sheet2.tables).length).toBeGreaterThan(0);
    });
});
