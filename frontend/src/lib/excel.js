import * as XLSX from "xlsx";

const HEADER_FILL = { fgColor: { rgb: "064E3B" } };
const SECTION_FILL = { fgColor: { rgb: "111827" } };
const AMBER_FILL = { fgColor: { rgb: "FEF3C7" } };
const BLUE_FILL = { fgColor: { rgb: "DBEAFE" } };
const GREEN_FILL = { fgColor: { rgb: "DCFCE7" } };

const WHITE_BOLD = { bold: true, color: { rgb: "FFFFFF" }, sz: 12 };
const BOLD = { bold: true, sz: 11 };

function setCell(ws, addr, value, opts = {}) {
  ws[addr] = { v: value, t: typeof value === "number" ? "n" : "s" };
  if (opts.style) ws[addr].s = opts.style;
  if (opts.fmt) ws[addr].z = opts.fmt;
}

function num(v) { return Number.isFinite(+v) ? +v : 0; }

function avg(arr, k) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + num(x[k]), 0) / arr.length;
}
function sum(arr, k) {
  return arr.reduce((s, x) => s + num(x[k]), 0);
}

function buildContainerSheet(purchase, container) {
  const logs = container.measurements || [];
  const data = [];

  data.push(["Bill of Lading", purchase.bl_number, "", "Container No", container.container_number]);
  data.push(["Supplier", purchase.supplier_name, "", "Country", purchase.country]);
  data.push(["Date", purchase.bl_date, "", "Sr No", `#${container.sr_no}`]);
  data.push([]);
  data.push(["Log #", "LE1 (cm)", "L (cm)", "G1 (cm)", "G2 (cm)", "CBM1", "CFT1", "CBM2", "CFT2", "Warn"]);

  logs.forEach((lg, i) => {
    const warn = lg.g1 < 35 || lg.g2 < 35 ? "⚠" : "";
    data.push([
      lg.log_number ?? i + 1,
      num(lg.le1), num(lg.l), num(lg.g1), num(lg.g2),
      +num(lg.cbm1).toFixed(4),
      +num(lg.cft1).toFixed(4),
      +num(lg.cbm2).toFixed(4),
      +num(lg.cft2).toFixed(4),
      warn,
    ]);
  });

  data.push([]);
  data.push(["TOTAL PIECES", logs.length, "", "TOTAL CBM1", +sum(logs, "cbm1").toFixed(4), "TOTAL CFT1", +sum(logs, "cft1").toFixed(4)]);
  data.push(["AVG CBM1", +avg(logs, "cbm1").toFixed(4), "", "AVG G1", +avg(logs, "g1").toFixed(2), "AVG LE1", +avg(logs, "le1").toFixed(2)]);
  data.push(["TOTAL CBM2", +sum(logs, "cbm2").toFixed(4), "", "TOTAL CFT2", +sum(logs, "cft2").toFixed(4)]);
  data.push(["AVG CBM2", +avg(logs, "cbm2").toFixed(4), "", "AVG G2", +avg(logs, "g2").toFixed(2), "AVG L", +avg(logs, "l").toFixed(2)]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Styles
  ["A1", "D1", "A2", "D2", "A3", "D3"].forEach((a) => {
    if (ws[a]) ws[a].s = { font: WHITE_BOLD, fill: SECTION_FILL, alignment: { vertical: "center" } };
  });
  ["B1", "E1", "B2", "E2", "B3", "E3"].forEach((a) => {
    if (ws[a]) ws[a].s = { font: BOLD, alignment: { vertical: "center" } };
  });

  // Header row at index 4 (row 5)
  const headerRow = 5;
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach((col) => {
    const a = `${col}${headerRow}`;
    if (ws[a]) ws[a].s = { font: WHITE_BOLD, fill: HEADER_FILL, alignment: { horizontal: "center" } };
  });

  // Data rows alternating + colored CBM columns
  logs.forEach((_, i) => {
    const r = headerRow + 1 + i;
    const fillEven = i % 2 === 0;
    ["A", "B", "C", "D", "E", "J"].forEach((col) => {
      const a = `${col}${r}`;
      if (ws[a]) ws[a].s = { alignment: { horizontal: col === "J" ? "center" : "right" }, fill: fillEven ? { fgColor: { rgb: "F8FAFC" } } : undefined };
    });
    ["F", "G"].forEach((col) => {
      const a = `${col}${r}`;
      if (ws[a]) ws[a].s = { alignment: { horizontal: "right" }, fill: BLUE_FILL, font: { color: { rgb: "1E3A8A" }, bold: true } };
    });
    ["H", "I"].forEach((col) => {
      const a = `${col}${r}`;
      if (ws[a]) ws[a].s = { alignment: { horizontal: "right" }, fill: GREEN_FILL, font: { color: { rgb: "065F46" }, bold: true } };
    });
  });

  // Summary rows fills
  const summaryStart = headerRow + 1 + logs.length + 1;
  for (let r = summaryStart; r < summaryStart + 4; r++) {
    ["A", "B", "C", "D", "E", "F", "G"].forEach((col) => {
      const a = `${col}${r}`;
      if (ws[a]) ws[a].s = { fill: AMBER_FILL, font: BOLD };
    });
  }

  ws["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
  ];

  return ws;
}

function buildMasterSheet(purchases, companyName) {
  const data = [];
  data.push([`Company: ${companyName || ""}`]);
  data.push(["Master Summary Report"]);
  data.push([`Generated: ${new Date().toLocaleString()}`]);
  data.push([]);

  // Grand totals
  let g = { pieces: 0, cbm1: 0, cft1: 0, cbm2: 0, cft2: 0 };
  purchases.forEach((p) => {
    (p.containers || []).forEach((c) => {
      const t = c.totals || {};
      g.pieces += c.pieces ?? (c.measurements?.length || 0);
      g.cbm1 += num(t.cbm1); g.cft1 += num(t.cft1);
      g.cbm2 += num(t.cbm2); g.cft2 += num(t.cft2);
    });
  });
  const denom = Math.max(g.pieces, 1);
  data.push(["GRAND TOTALS"]);
  data.push(["Pieces", "CBM1", "CFT1", "Avg CBM1", "CBM2", "CFT2", "Avg CBM2"]);
  data.push([g.pieces, +g.cbm1.toFixed(4), +g.cft1.toFixed(4), +(g.cbm1 / denom).toFixed(4), +g.cbm2.toFixed(4), +g.cft2.toFixed(4), +(g.cbm2 / denom).toFixed(4)]);
  data.push([]);

  // Per BL+Container detail
  data.push(["BL", "Container", "Date", "Supplier", "Country", "Pcs", "CBM1", "CFT1", "AvgCBM1", "AvgG1", "AvgL", "CBM2", "CFT2", "AvgCBM2", "AvgG2"]);

  const headerRowIdx = data.length; // 1-indexed row number = data.length

  purchases.forEach((p) => {
    let bl = { pieces: 0, cbm1: 0, cft1: 0, cbm2: 0, cft2: 0 };
    (p.containers || []).forEach((c) => {
      const t = c.totals || {};
      const pcs = c.pieces ?? (c.measurements?.length || 0);
      bl.pieces += pcs;
      bl.cbm1 += num(t.cbm1); bl.cft1 += num(t.cft1);
      bl.cbm2 += num(t.cbm2); bl.cft2 += num(t.cft2);
      data.push([
        p.bl_number, c.container_number, p.bl_date, p.supplier_name, p.country,
        pcs,
        +num(t.cbm1).toFixed(4), +num(t.cft1).toFixed(4), +num(t.avg_cbm1).toFixed(4),
        +num(t.avg_g1).toFixed(2), +num(t.avg_l).toFixed(2),
        +num(t.cbm2).toFixed(4), +num(t.cft2).toFixed(4), +num(t.avg_cbm2).toFixed(4),
        +num(t.avg_g2).toFixed(2),
      ]);
    });
    data.push([
      `BL ${p.bl_number} Subtotal`, "", "", "", "",
      bl.pieces,
      +bl.cbm1.toFixed(4), +bl.cft1.toFixed(4), "",
      "", "",
      +bl.cbm2.toFixed(4), +bl.cft2.toFixed(4), "", "",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Style top blocks
  ["A1", "A2", "A3"].forEach((a) => {
    if (ws[a]) ws[a].s = { font: { ...WHITE_BOLD, sz: 14 }, fill: SECTION_FILL };
  });
  if (ws["A5"]) ws["A5"].s = { font: { ...WHITE_BOLD }, fill: HEADER_FILL };
  // Grand totals header (row 6)
  ["A6", "B6", "C6", "D6", "E6", "F6", "G6"].forEach((a) => {
    if (ws[a]) ws[a].s = { font: WHITE_BOLD, fill: HEADER_FILL, alignment: { horizontal: "center" } };
  });
  ["A7", "B7", "C7", "D7", "E7", "F7", "G7"].forEach((a) => {
    if (ws[a]) ws[a].s = { fill: AMBER_FILL, font: BOLD, alignment: { horizontal: "right" } };
  });

  // Per-container header
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
  cols.forEach((col) => {
    const a = `${col}${headerRowIdx}`;
    if (ws[a]) ws[a].s = { font: WHITE_BOLD, fill: HEADER_FILL, alignment: { horizontal: "center" } };
  });

  // Subtotal rows: detect by content "BL ... Subtotal"
  const totalRows = data.length + 1; // safety bound; we'll iterate
  for (let r = headerRowIdx + 1; r <= data.length; r++) {
    const a = `A${r}`;
    if (ws[a] && typeof ws[a].v === "string" && ws[a].v.startsWith("BL ")) {
      cols.forEach((col) => {
        const cell = `${col}${r}`;
        if (ws[cell]) ws[cell].s = { fill: AMBER_FILL, font: BOLD };
      });
    }
  }

  ws["!cols"] = cols.map(() => ({ wch: 14 }));
  return ws;
}

export function exportContainerXlsx(purchase, container, companyName) {
  const wb = XLSX.utils.book_new();
  const ws = buildContainerSheet(purchase, container);
  XLSX.utils.book_append_sheet(wb, ws, container.container_number.slice(0, 28));
  XLSX.writeFile(wb, `${purchase.bl_number}_${container.container_number}.xlsx`);
}

export function exportBLXlsx(purchase, companyName) {
  const wb = XLSX.utils.book_new();
  const master = buildMasterSheet([purchase], companyName);
  XLSX.utils.book_append_sheet(wb, master, "Master Summary");
  (purchase.containers || []).forEach((c) => {
    const ws = buildContainerSheet(purchase, c);
    XLSX.utils.book_append_sheet(wb, ws, (c.container_number || "Container").slice(0, 28));
  });
  XLSX.writeFile(wb, `BL_${purchase.bl_number}.xlsx`);
}

export function exportAllXlsx(purchases, companyName) {
  const wb = XLSX.utils.book_new();
  const master = buildMasterSheet(purchases, companyName);
  XLSX.utils.book_append_sheet(wb, master, "Master Summary");
  purchases.forEach((p) => {
    (p.containers || []).forEach((c) => {
      const ws = buildContainerSheet(p, c);
      const sheetName = `${p.bl_number}_${c.container_number}`.slice(0, 28).replace(/[\\/?*[\]]/g, "_");
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  });
  XLSX.writeFile(wb, `TimberLog_All_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
