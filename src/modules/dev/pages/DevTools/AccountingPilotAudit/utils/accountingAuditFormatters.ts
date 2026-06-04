export const formatAuditDate = (millis: number | null): string => {
  if (millis === null) return '—';

  return new Date(millis).toLocaleString('es-DO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const formatAuditAmount = (amount: number): string =>
  amount.toLocaleString('es-DO', { minimumFractionDigits: 2 });
