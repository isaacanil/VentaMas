import type { MissingBusiness } from '../types';

export const buildMissingBusinessesCsv = (missing: MissingBusiness[]) => {
  const headers = ['id', 'name'];
  const rows = missing.map((business) => [
    business.id,
    sanitizeCsv(business.name),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');
};

export const createMissingBusinessesCsvFilename = (date = new Date()) => {
  return `businesses-missing-createdAt-${date.toISOString().replace(/[:.]/g, '-')}.csv`;
};

const sanitizeCsv = (text: unknown) => {
  if (!text) return '';
  return String(text)
    .replace(/[\n\r]+/g, ' ')
    .trim();
};

const escapeCsv = (value: unknown) => {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
