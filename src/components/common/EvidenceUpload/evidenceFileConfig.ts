import type { EvidenceFile, EvidenceFileCategory } from './types';

export const EVIDENCE_FILE_TYPES: EvidenceFileCategory[] = [
  'receipts',
  'invoices',
  'others',
];

export const EVIDENCE_FILE_TYPE_LABELS: Record<string, string> = {
  receipts: 'Recibos',
  invoices: 'Facturas',
  others: 'Otros Documentos',
};

export const EVIDENCE_FILE_TYPE_SELECTOR_LABELS: Record<string, string> = {
  receipts: 'Recibos',
  invoices: 'Facturas',
  others: 'Otros',
};

const EVIDENCE_FILE_GROUPS = new Set(EVIDENCE_FILE_TYPES);

export const getEvidenceGroupType = (file: EvidenceFile) => {
  const type = file.type?.toLowerCase() ?? '';
  return EVIDENCE_FILE_GROUPS.has(type as EvidenceFileCategory)
    ? type
    : 'others';
};

export const getEvidenceRemoveFileId = (file: EvidenceFile) =>
  file.id ?? file.url ?? file.name;
