export function exportToCsv(filename: string, headers: string[], rows: string[][]): void {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const content = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * RFC 4180-compliant CSV parser.
 * Correctly handles:
 *   - Fields enclosed in double-quotes
 *   - Quoted fields containing commas ("Smith, John")
 *   - Quoted fields containing newlines
 *   - Escaped double-quotes inside quoted fields ("")
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote: "" → single "
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
        i++;
      } else if (ch === "\r" || ch === "\n") {
        // Handle CRLF as a single line break
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field.trim());
        field = "";
        if (row.some((f) => f !== "")) rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Push the last field / row
  if (field || row.length) {
    row.push(field.trim());
    if (row.some((f) => f !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((values) =>
    headers.reduce<Record<string, string>>((acc, header, idx) => {
      acc[header] = values[idx] ?? "";
      return acc;
    }, {})
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
