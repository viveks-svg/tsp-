/** Builds a CSV document that opens safely in Excel / Google Sheets. */
export const toCsv = (header: string[], rows: unknown[][]) => {
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // Quote, and neutralise spreadsheet formulas.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
};

export const istDateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(d);
