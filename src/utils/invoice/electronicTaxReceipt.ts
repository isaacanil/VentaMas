import type { ElectronicTaxReceiptSnapshot, InvoiceData } from '@/types/invoice';

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Aceptado',
  accepted_conditional: 'Aceptado cond.',
  rejected: 'Rechazado',
  submitted: 'Enviado',
  processing: 'Procesando',
  pending: 'Pendiente',
  issued: 'Emitido',
  shadow_ready: 'Shadow listo',
  local_failed: 'Error local',
};

export const resolveElectronicTaxReceiptSnapshot = (
  invoice?: InvoiceData | null,
): ElectronicTaxReceiptSnapshot | null => {
  const direct = invoice?.electronicTaxReceipt;
  if (direct && typeof direct === 'object') return direct;

  const nested = invoice?.fiscal?.electronic;
  if (nested && typeof nested === 'object') return nested;

  return null;
};

export const resolveFiscalDocumentNumber = (
  invoice?: InvoiceData | null,
): string | null => {
  const electronic = resolveElectronicTaxReceiptSnapshot(invoice);
  const electronicNumber =
    typeof electronic?.eNcf === 'string' ? electronic.eNcf.trim() : '';
  if (electronicNumber) return electronicNumber;

  const eNcf = typeof invoice?.eNcf === 'string' ? invoice.eNcf.trim() : '';
  if (eNcf) return eNcf;

  const ncf = typeof invoice?.NCF === 'string' ? invoice.NCF.trim() : '';
  if (ncf) return ncf;

  const comprobante =
    typeof invoice?.comprobante === 'string' ? invoice.comprobante.trim() : '';
  return comprobante || null;
};

export const resolveElectronicTaxReceiptStatusLabel = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  const rawStatus =
    snapshot?.dgiiValidationStatus ||
    snapshot?.dgiiStatus ||
    snapshot?.requestStatus ||
    snapshot?.status ||
    null;
  if (!rawStatus) return null;

  const normalized = String(rawStatus).trim().toLowerCase();
  return STATUS_LABELS[normalized] || rawStatus;
};
