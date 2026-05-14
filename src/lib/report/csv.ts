type CsvValue = string | number | boolean | Date | null | undefined;

export type CsvRow = Record<string, CsvValue>;

function formatCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function escapeCsvValue(value: CsvValue) {
  const stringValue = formatCsvValue(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function rowsToCsv(rows: CsvRow[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  const headerLine = headers.map(escapeCsvValue).join(",");

  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );

  return [headerLine, ...bodyLines].join("\n");
}

export function createCsvResponse(filename: string, rows: CsvRow[]) {
  const csv = rowsToCsv(rows);
  const body = `\uFEFF${csv}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function createEmptyCsvResponse(filename: string, headers: string[]) {
  const csv = headers.map(escapeCsvValue).join(",");

  return new Response(`\uFEFF${csv}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString();
}
