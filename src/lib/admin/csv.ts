/**
 * Génération CSV — pure et testable. Échappe guillemets, virgules, retours
 * ligne selon RFC 4180. Préfixe anti-injection de formule pour les cellules
 * commençant par = + - @ (sécurité tableurs).
 */

export interface CsvColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCell(raw: string | number | null | undefined): string {
  let s = raw == null ? "" : String(raw);
  // Anti formula-injection (Excel/Sheets).
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}
