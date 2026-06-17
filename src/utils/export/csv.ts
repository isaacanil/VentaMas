import { downloadBlobFile } from './download';

export const CSV_MIME_TYPE = 'text/csv;charset=utf-8;';

export const escapeCsvCell = (value: unknown): string => {
  const normalized = String(value ?? '');
  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }
  return `"${normalized.replace(/"/g, '""')}"`;
};

export const buildCsvFromRows = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: unknown[][];
}): string =>
  [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\n');

export const buildCsvFromRecords = (
  rows: Array<Record<string, unknown>>,
): string => {
  if (!rows.length) return '';

  const headers = Object.keys(rows[0]);
  return buildCsvFromRows({
    headers,
    rows: rows.map((row) => headers.map((header) => row[header])),
  });
};

export const createCsvBlob = (csv: string): Blob =>
  new Blob([csv], {
    type: CSV_MIME_TYPE,
  });

export const downloadCsvFile = ({
  csv,
  fileName,
}: {
  csv: string;
  fileName: string;
}) => {
  downloadBlobFile({
    blob: createCsvBlob(csv),
    fileName,
  });
};
