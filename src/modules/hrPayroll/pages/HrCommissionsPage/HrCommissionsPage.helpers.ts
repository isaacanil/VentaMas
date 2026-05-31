import type { HrCommissionEntryRecord } from '@/types/hrPayroll';

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'No se pudo completar la operacion.';
};

export const matchesCommissionSearch = (
  entry: HrCommissionEntryRecord,
  searchTerm: string,
) => {
  if (!searchTerm) return true;
  const haystack = [
    entry.employeeCode,
    entry.employeeNameSnapshot,
    entry.invoiceNumber,
    entry.invoiceId,
    entry.serviceName,
    entry.sourceCommissionId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
};
