import type { TreasuryActivity } from "@/types";

const VIOLET = [124, 58, 237] as [number, number, number];
const DARK = [18, 18, 28] as [number, number, number];
const MUTED = [100, 100, 120] as [number, number, number];
const LIGHT = [232, 232, 242] as [number, number, number];
const STAT_BG = [240, 238, 252] as [number, number, number];

function formatSig(sig: string) {
  if (sig.length <= 20) return sig;
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

async function buildPdf(
  activities: TreasuryActivity[],
  opts: { network: string; afterDate?: string; beforeDate?: string },
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const period =
    opts.afterDate && opts.beforeDate
      ? `${opts.afterDate} - ${opts.beforeDate}`
      : opts.afterDate
        ? `From ${opts.afterDate}`
        : opts.beforeDate
          ? `Through ${opts.beforeDate}`
          : "All time";

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 56, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SIPHER", 28, 26);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 190);
  doc.text("Treasury Compliance Report  ·  Private & Confidential", 28, 40);

  // Network badge
  const badge = opts.network === "devnet" ? "DEVNET" : "MAINNET";
  doc.setFillColor(...VIOLET);
  doc.roundedRect(W - 80, 16, 56, 18, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(badge, W - 52, 28, { align: "center" });

  // ── Meta row ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${generatedAt}`, 28, 72);
  doc.text(`Period: ${period}`, 200, 72);
  doc.text(`Total transactions: ${activities.length}`, 400, 72);

  // ── Summary stats ────────────────────────────────────────────────────────
  const shielded = activities
    .filter((a) => a.direction === "in" && a.status === "confirmed")
    .reduce((s, a) => s + a.grossAmount, 0);
  const paidOut = activities
    .filter((a) => a.direction === "out" && a.status === "confirmed")
    .reduce((s, a) => s + a.netAmount, 0);
  const fees = activities.reduce((s, a) => s + a.feeAmount, 0);
  const net = shielded - paidOut;

  const stats = [
    { label: "TOTAL SHIELDED", value: `${shielded.toFixed(4)} SOL` },
    { label: "TOTAL PAID OUT", value: `${paidOut.toFixed(4)} SOL` },
    { label: "NET CHANGE", value: `${net >= 0 ? "+" : ""}${net.toFixed(4)} SOL` },
    { label: "FEES PAID", value: `${fees.toFixed(6)} SOL` },
  ];

  const boxW = (W - 56 - stats.length * 8) / stats.length;
  stats.forEach((stat, i) => {
    const x = 28 + i * (boxW + 8);
    doc.setFillColor(...STAT_BG);
    doc.roundedRect(x, 82, boxW, 36, 4, 4, "F");
    doc.setTextColor(...MUTED);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.text(stat.label, x + 8, 95);
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(stat.value, x + 8, 110);
  });

  // ── Transaction table ─────────────────────────────────────────────────────
  const rows = activities.map((a) => [
    new Date(a.createdAt).toLocaleDateString(),
    a.type.charAt(0).toUpperCase() + a.type.slice(1),
    a.asset + (a.outputAsset ? ` -> ${a.outputAsset}` : ""),
    a.grossAmount.toFixed(4),
    a.feeAmount.toFixed(6),
    a.netAmount.toFixed(4),
    a.status.charAt(0).toUpperCase() + a.status.slice(1),
    formatSig(a.signature),
  ]);

  autoTable(doc, {
    head: [["Date", "Type", "Asset", "Gross", "Fee", "Net", "Status", "Signature"]],
    body: rows.length > 0 ? rows : [["—", "No transactions found", "", "", "", "", "", ""]],
    startY: 128,
    margin: { left: 28, right: 28 },
    headStyles: {
      fillColor: VIOLET,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: "bold",
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: DARK,
      cellPadding: 4,
    },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 46 },
      2: { cellWidth: 80 },
      3: { cellWidth: 50 },
      4: { cellWidth: 58 },
      5: { cellWidth: 50 },
      6: { cellWidth: 46 },
      7: { cellWidth: "auto" },
    },
    didDrawPage: () => {
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(
        `Generated by Sipher  ·  Powered by Cloak  ·  Page ${pageCount}`,
        W / 2,
        H - 12,
        { align: "center" },
      );
    },
  });

  return doc;
}

export async function downloadCompliancePdf(
  activities: TreasuryActivity[],
  opts: { network: string; afterDate?: string; beforeDate?: string },
) {
  const doc = await buildPdf(activities, opts);
  doc.save(`sipher-compliance-${Date.now()}.pdf`);
}
