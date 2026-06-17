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
  error: 'Error GISYS',
  shadow_ready: 'Shadow listo',
  local_failed: 'Error local',
};

export type ElectronicTaxReceiptStatusDisplay = {
  label: string;
  color: string;
};

export const ELECTRONIC_TAX_RECEIPT_FILTER_STATUS = {
  ACCEPTED: 'accepted',
  ACCEPTED_CONDITIONAL: 'accepted_conditional',
  REJECTED: 'rejected',
  PENDING: 'pending',
  ERROR: 'error',
  NOT_APPLICABLE: 'not_applicable',
} as const;

export type ElectronicTaxReceiptFilterStatus =
  (typeof ELECTRONIC_TAX_RECEIPT_FILTER_STATUS)[keyof typeof ELECTRONIC_TAX_RECEIPT_FILTER_STATUS];

export const ELECTRONIC_TAX_RECEIPT_FILTER_OPTIONS: Array<{
  value: ElectronicTaxReceiptFilterStatus;
  label: string;
}> = [
  { value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ACCEPTED, label: 'Aceptado' },
  {
    value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ACCEPTED_CONDITIONAL,
    label: 'Aceptado cond.',
  },
  { value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.REJECTED, label: 'Rechazado' },
  {
    value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.PENDING,
    label: 'Pendiente e-CF',
  },
  { value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ERROR, label: 'Error e-CF' },
  {
    value: ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.NOT_APPLICABLE,
    label: 'No aplica',
  },
];

const FALLBACK_ELECTRONIC_STATUS_DISPLAY: Record<
  string,
  ElectronicTaxReceiptStatusDisplay
> = {
  electronic_pending: { label: 'Pendiente e-CF', color: 'gold' },
  electronic_failed: { label: 'e-CF Fallido', color: 'red' },
};

const TERMINAL_DGII_STATUSES = new Set([
  'accepted',
  'accepted_conditional',
  'rejected',
]);

const PENDING_STATUSES = new Set(['not_checked', 'pending', 'queued']);
const IN_PROGRESS_STATUSES = new Set([
  'not_checked',
  'pending',
  'queued',
  'submitted',
  'processing',
  'issued',
]);
const RFCE_ACCEPTED_STATUSES = new Set(['accepted', 'accepted_conditional']);
const RFCE_ERROR_STATUSES = new Set(['error', 'failed', 'rejected']);
const ERROR_STATUSES = new Set(['error', 'failed', 'local_failed']);

const normalizeStatus = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const normalizeCode = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const pushUnique = (target: string[], value: unknown) => {
  const normalized = normalizeCode(value);
  if (normalized && !target.includes(normalized)) {
    target.push(normalized);
  }
};

export const isRfceElectronicTaxReceipt = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): boolean => {
  if (!snapshot) return false;
  return (
    snapshot.routing?.rfceToDgii === true ||
    snapshot.routing?.channel === 'recepcion_fc' ||
    Boolean(snapshot.rfceStatus) ||
    Boolean(snapshot.rfceSubmissionStatus) ||
    Boolean(snapshot.rfceDgiiCode) ||
    Boolean(snapshot.rfceDgiiEstado)
  );
};

const resolveRfceTerminalStatusKey = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  const rfceStatus = normalizeStatus(snapshot?.rfceStatus);
  const rfceSubmissionStatus = normalizeStatus(snapshot?.rfceSubmissionStatus);
  const status = rfceStatus || rfceSubmissionStatus;

  if (status && RFCE_ACCEPTED_STATUSES.has(status)) return status;
  if (status && RFCE_ERROR_STATUSES.has(status)) {
    return status === 'rejected' ? 'rejected' : 'error';
  }

  const rfceCode = normalizeCode(snapshot?.rfceDgiiCode);
  const rfceEstado = normalizeStatus(snapshot?.rfceDgiiEstado);
  if (
    (rfceCode === '1' || rfceCode === '01') &&
    rfceEstado?.includes('acept')
  ) {
    return 'accepted';
  }

  return null;
};

const isRfceQueued = (snapshot?: ElectronicTaxReceiptSnapshot | null) => {
  if (!isRfceElectronicTaxReceipt(snapshot)) return false;
  if (resolveRfceTerminalStatusKey(snapshot)) return false;
  return (
    normalizeStatus(snapshot?.requestStatus) === 'queued' ||
    normalizeStatus(snapshot?.dgiiSubmissionStatus) === 'queued' ||
    normalizeStatus(snapshot?.rfceSubmissionStatus) === 'queued'
  );
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

  const rfceStatus = resolveRfceTerminalStatusKey(snapshot);
  if (rfceStatus) return rfceStatus;

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

  if (isRfceElectronicTaxReceipt(snapshot)) {
    if (statusKey === 'accepted') return 'Aceptado RFCE';
    if (statusKey === 'accepted_conditional') return 'Aceptado cond. RFCE';
    if (isRfceQueued(snapshot)) return 'En cola RFCE';
  }

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

export const resolveElectronicTaxReceiptStatusColor = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string => {
  const statusKey = resolveElectronicTaxReceiptStatusKey(snapshot);
  if (!statusKey) return 'default';

  if (statusKey === 'accepted' || statusKey === 'accepted_conditional') {
    return 'green';
  }
  if (
    statusKey === 'rejected' ||
    statusKey === 'error' ||
    statusKey === 'failed' ||
    statusKey === 'local_failed'
  ) {
    return 'red';
  }
  if (
    statusKey === 'pending' ||
    statusKey === 'queued' ||
    statusKey === 'not_checked' ||
    statusKey === 'submitted' ||
    statusKey === 'processing' ||
    isRfceQueued(snapshot)
  ) {
    return 'gold';
  }

  const label = resolveElectronicTaxReceiptStatusLabel(snapshot);
  if (label?.toLowerCase().includes('pendiente')) return 'gold';

  return statusKey === 'issued' ? 'blue' : 'default';
};

export const resolveElectronicTaxReceiptStatusDisplay = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
  fallbackStatus?: unknown,
): ElectronicTaxReceiptStatusDisplay | null => {
  const label = resolveElectronicTaxReceiptStatusLabel(snapshot);
  if (label) {
    return {
      label,
      color: resolveElectronicTaxReceiptStatusColor(snapshot),
    };
  }

  const normalizedFallback = normalizeStatus(fallbackStatus);
  if (!normalizedFallback) return null;

  return FALLBACK_ELECTRONIC_STATUS_DISPLAY[normalizedFallback] ?? null;
};

export const resolveElectronicTaxReceiptFilterStatus = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
  fallbackStatus?: unknown,
): ElectronicTaxReceiptFilterStatus => {
  const statusKey = resolveElectronicTaxReceiptStatusKey(snapshot);
  const statusLabel = resolveElectronicTaxReceiptStatusLabel(snapshot);

  if (statusKey === 'accepted') {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ACCEPTED;
  }
  if (statusKey === 'accepted_conditional') {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ACCEPTED_CONDITIONAL;
  }
  if (statusKey === 'rejected') {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.REJECTED;
  }
  if (statusKey && ERROR_STATUSES.has(statusKey)) {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ERROR;
  }
  if (
    statusKey &&
    (IN_PROGRESS_STATUSES.has(statusKey) ||
      statusLabel?.toLowerCase().includes('pendiente') ||
      statusLabel?.toLowerCase().includes('cola'))
  ) {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.PENDING;
  }

  const normalizedFallback = normalizeStatus(fallbackStatus);
  if (normalizedFallback === 'electronic_pending') {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.PENDING;
  }
  if (normalizedFallback === 'electronic_failed') {
    return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.ERROR;
  }

  return ELECTRONIC_TAX_RECEIPT_FILTER_STATUS.NOT_APPLICABLE;
};

export const resolveElectronicTaxReceiptDiagnosticText = (
  snapshot?: ElectronicTaxReceiptSnapshot | null,
): string | null => {
  if (!snapshot) return null;

  const diagnostics: string[] = [];
  const status = resolveElectronicTaxReceiptStatusKey(snapshot);
  pushUnique(diagnostics, snapshot.dgiiMessage);
  pushUnique(diagnostics, snapshot.lastError);
  pushUnique(diagnostics, snapshot.rfceLastErrorMessage);
  pushUnique(diagnostics, snapshot.rfceError);

  if (Array.isArray(snapshot.dgiiMessages)) {
    snapshot.dgiiMessages.forEach((entry) => {
      if (!entry) return;
      const code = normalizeCode(entry.code);
      const message = normalizeCode(entry.message);
      pushUnique(
        diagnostics,
        code && message ? `${code}: ${message}` : message || code,
      );
    });
  }

  if (snapshot.resolutionAction) {
    pushUnique(diagnostics, `Acción sugerida: ${snapshot.resolutionAction}`);
  }
  if (snapshot.requiresDataCorrection === true) {
    pushUnique(diagnostics, 'Requiere corregir datos antes de reenviar.');
  }
  if (snapshot.requiresNewENcf === true) {
    pushUnique(diagnostics, 'Requiere emitir con un e-NCF nuevo.');
  }

  if (
    diagnostics.length > 0 ||
    status === 'rejected' ||
    status === 'error' ||
    status === 'failed' ||
    status === 'local_failed'
  ) {
    pushUnique(
      diagnostics,
      snapshot.dgiiCode && `Código DGII: ${snapshot.dgiiCode}`,
    );
    pushUnique(diagnostics, snapshot.trackId && `TrackID: ${snapshot.trackId}`);
    pushUnique(
      diagnostics,
      snapshot.submissionId && `Submission GISYS: ${snapshot.submissionId}`,
    );
  }

  return diagnostics.length ? diagnostics.join(' | ') : null;
};
