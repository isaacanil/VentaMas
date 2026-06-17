import type { MissingBusiness } from '../types';
import { buildCsvFromRows } from '@/utils/export/csv';

export const buildMissingBusinessesCsv = (missing: MissingBusiness[]) => {
  const headers = ['id', 'name'];
  const rows = missing.map((business) => [
    business.id,
    sanitizeCsv(business.name),
  ]);

  return buildCsvFromRows({ headers, rows });
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
