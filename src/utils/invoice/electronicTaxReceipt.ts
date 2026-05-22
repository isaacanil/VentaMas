import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceData,
} from '@/types/invoice';

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Aceptado',
  accepted_conditional: 'Aceptado cond.',
  rejected: 'Rechazado',
  submitted: 'Enviado',
  processing: 'Procesando',
  pending: 'Pendiente',
  queued: 'En cola',
  not_checked: 'DGII sin validar',
  issued: 'Emitido',
  shadow_ready: 'Shadow listo',
  local_failed: 'Error local',
};

const TERMINAL_DGII_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'rejected',
]);

const PENDING_STATUSES = new Set(['not_checked', 'pending', 'queued']);

const normalizeStatus = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
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

export const resolveElectronicTaxReceiptStatusKey = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  const validationStatus = normalizeStatus(snapshot?.dgiiValidationStatus);
  if (validationStatus && TERMINAL_DGII_STATUSES.has(validationStatus)) {
    return validationStatus;
  }

  const dgiiStatus = normalizeStatus(snapshot?.dgiiStatus);
  if (dgiiStatus && TERMINAL_DGII_STATUSES.has(dgiiStatus)) {
    return dgiiStatus;
  }

  const lifecycleStatus = normalizeStatus(snapshot?.status);
  if (lifecycleStatus && !PENDING_STATUSES.has(lifecycleStatus)) {
    return lifecycleStatus;
  }

  const localStatus = normalizeStatus(snapshot?.localStatus);
  if (
    snapshot?.eNcf &&
    (localStatus === 'signed_local' ||
      snapshot?.links?.xml ||
      snapshot?.links?.signedXml ||
      snapshot?.links?.pdf)
  ) {
    return 'issued';
  }

  const requestStatus = normalizeStatus(
    snapshot?.requestStatus || snapshot?.dgiiSubmissionStatus,
  );
  return dgiiStatus || requestStatus || validationStatus || lifecycleStatus;
};

export const resolveElectronicTaxReceiptStatusLabel = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  const statusKey = resolveElectronicTaxReceiptStatusKey(snapshot);
  if (!statusKey) return null;

  const hasPendingDgiiStatus =
    normalizeStatus(snapshot?.dgiiValidationStatus) === 'not_checked' ||
    normalizeStatus(snapshot?.dgiiStatus) === 'pending' ||
    normalizeStatus(snapshot?.requestStatus) === 'queued' ||
    normalizeStatus(snapshot?.dgiiSubmissionStatus) === 'queued';

  if (statusKey === 'issued' && hasPendingDgiiStatus) {
    return 'Emitido (DGII pendiente)';
  }

  return STATUS_LABELS[statusKey] || statusKey;
};
