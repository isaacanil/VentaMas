type InvoiceErrorNotification = {
  message: string;
  description: string;
  duration?: number;
  action?: 'edit-client-fiscal-data';
};

type InvoiceErrorDetails = {
  message?: string;
  reason?: string;
  details?: string;
};

type InvoiceProviderError = {
  reason?: string;
  status?: string | number;
  code?: string;
  message?: string;
  details?: Record<string, unknown> | null;
};

type InvoiceFailedTask = {
  type?: string;
  lastError?: string;
  providerError?: InvoiceProviderError | null;
  providerReason?: string;
  providerStatus?: string | number;
  providerCode?: string;
  providerMessage?: string;
  providerDetails?: Record<string, unknown> | null;
};

type InvoiceErrorMeta = {
  status?: string;
};

type InvoiceError = {
  name?: string;
  code?: string;
  message?: string;
  details?: string | InvoiceErrorDetails;
  failedTask?: InvoiceFailedTask;
  invoiceMeta?: InvoiceErrorMeta;
};

const DEFAULT_ERROR_NOTIFICATION = {
  message: 'Error al procesar la factura',
  description:
    'Intenta nuevamente o contacta a tu supervisor si el problema persiste.',
  duration: 6,
};

const sanitizeDetail = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const BUYER_DATA_PROVIDER_CODES = new Set([
  'BUYER_RNC_NOT_FOUND',
  'BUYER_RNC_INVALID',
  'BUYER_TAX_ID_NOT_FOUND',
  'BUYER_TAX_ID_INVALID',
  'BUYER_IDENTIFICATION_NOT_FOUND',
  'BUYER_IDENTIFICATION_INVALID',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getProviderDetails = (failedTask: InvoiceFailedTask | null) => {
  if (isRecord(failedTask?.providerDetails)) return failedTask.providerDetails;
  if (isRecord(failedTask?.providerError?.details)) {
    return failedTask.providerError.details;
  }
  return null;
};

const getProviderCode = (failedTask: InvoiceFailedTask | null) =>
  sanitizeDetail(failedTask?.providerCode) ||
  sanitizeDetail(failedTask?.providerError?.code);

const getProviderMessage = (failedTask: InvoiceFailedTask | null) =>
  sanitizeDetail(failedTask?.providerMessage) ||
  sanitizeDetail(failedTask?.providerError?.message);

const getProviderReason = (failedTask: InvoiceFailedTask | null) =>
  sanitizeDetail(failedTask?.providerReason) ||
  sanitizeDetail(failedTask?.providerError?.reason);

const collectProviderText = (failedTask: InvoiceFailedTask | null) =>
  [
    getProviderCode(failedTask),
    getProviderMessage(failedTask),
    getProviderReason(failedTask),
    failedTask?.lastError,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const formatProviderDate = (value: unknown) => {
  const text = sanitizeDetail(value);
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!match) return text;
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const buildProviderBuyerDataDescription = (
  failedTask: InvoiceFailedTask | null,
) => {
  const providerMessage = getProviderMessage(failedTask);
  const providerCode = getProviderCode(failedTask);
  const details = getProviderDetails(failedTask);
  const catalogDownloadedAt = formatProviderDate(details?.catalogDownloadedAt);
  const eNcfReserved = details?.eNcfReserved;

  const parts = [
    providerMessage
      ? `GISYS respondió: ${providerMessage}`
      : 'GISYS rechazó los datos fiscales del comprador.',
  ];

  if (providerCode) {
    parts.push(`Código: ${providerCode}.`);
  }
  if (catalogDownloadedAt) {
    parts.push(`Catálogo DGII usado por GISYS: ${catalogDownloadedAt}.`);
  }
  if (eNcfReserved === false) {
    parts.push('No se reservó e-NCF.');
  }

  parts.push(
    'El RNC/cédula puede pasar el dígito verificador y aun así no estar en el catálogo del proveedor. Verifica el cliente en DGII, guarda los datos y vuelve a intentar la facturación.',
  );

  return parts.join(' ');
};

const buildProviderIssueDescription = (
  failedTask: InvoiceFailedTask | null,
) => {
  const providerMessage = getProviderMessage(failedTask);
  const providerCode = getProviderCode(failedTask);
  if (!providerMessage && !providerCode) return null;

  return [
    providerMessage ? `GISYS respondió: ${providerMessage}` : null,
    providerCode ? `Código: ${providerCode}.` : null,
    'Revisa el detalle fiscal o contacta a soporte si el problema persiste.',
  ]
    .filter(Boolean)
    .join(' ');
};

const collectDetails = (error: InvoiceError | null | undefined) => {
  const details = new Set<string>();
  const addDetail = (value: unknown) => {
    const sanitized = sanitizeDetail(value);
    if (sanitized) details.add(sanitized);
  };

  addDetail(error?.message);

  if (typeof error?.details === 'string') {
    addDetail(error.details);
  } else if (error?.details && typeof error.details === 'object') {
    addDetail(error.details.message);
    addDetail(error.details.reason);
    addDetail(error.details.details);
  }

  if (error?.failedTask?.type) {
    const detail = error.failedTask.lastError
      ? `${error.failedTask.type}: ${error.failedTask.lastError}`
      : `La tarea ${error.failedTask.type} informó un fallo.`;
    addDetail(detail);
  }

  if (error?.invoiceMeta?.status && error.invoiceMeta.status !== 'failed') {
    addDetail(`Estado reportado: ${error.invoiceMeta.status}`);
  }

  return Array.from(details);
};

const isFiscalProviderBuyerDataRejection = (
  failedTask: InvoiceFailedTask | null,
) => {
  if (failedTask?.type !== 'issueElectronicTaxReceipt') return false;

  const providerCode = getProviderCode(failedTask)?.toUpperCase();
  if (providerCode && BUYER_DATA_PROVIDER_CODES.has(providerCode)) {
    return true;
  }

  const detail = collectProviderText(failedTask);
  if (detail.includes('buyer_rnc') || detail.includes('comprador')) {
    return true;
  }

  const mentionsFiscalId =
    detail.includes('rnc') ||
    detail.includes('cedula') ||
    detail.includes('cédula');
  const mentionsBuyer =
    detail.includes('buyer') ||
    detail.includes('comprador') ||
    detail.includes('cliente');

  return mentionsFiscalId && mentionsBuyer;
};

export const getInvoiceErrorNotification = (
  error: InvoiceError | null | undefined,
): InvoiceErrorNotification => {
  if (!error) return DEFAULT_ERROR_NOTIFICATION;

  const normalizedCode =
    typeof error?.code === 'string'
      ? error.code.replace(/^functions\//, '')
      : null;

  if (error?.name === 'AbortError') {
    return {
      message: 'Consulta cancelada',
      description:
        'La verificación del estado de la factura se canceló antes de completarse.',
      duration: 4,
    };
  }

  if (normalizedCode === 'invoice-timeout') {
    return {
      message: 'Confirmación pendiente',
      description:
        'No recibimos confirmación del backend a tiempo. Verifica el historial de facturación antes de intentar nuevamente.',
      duration: 8,
    };
  }

  if (normalizedCode === 'invoice-failed') {
    const failedTask = error?.failedTask || null;
    if (isFiscalProviderBuyerDataRejection(failedTask)) {
      return {
        message: 'Revisa los datos fiscales del cliente',
        description: buildProviderBuyerDataDescription(failedTask),
        duration: 0,
        action: 'edit-client-fiscal-data',
      };
    }

    if (failedTask?.type === 'issueElectronicTaxReceipt') {
      const providerDescription = buildProviderIssueDescription(failedTask);
      if (providerDescription) {
        return {
          message: 'GISYS rechazó el e-CF',
          description: providerDescription,
          duration: 10,
        };
      }
    }

    const fallback = 'Una de las tareas del proceso falló.';
    const taskLabel = failedTask?.type
      ? `Tarea fallida: ${failedTask.type}.`
      : fallback;
    const detail =
      typeof failedTask?.lastError === 'string' ? failedTask.lastError : null;
    return {
      message: 'Factura no finalizada',
      description: detail ? `${taskLabel} ${detail}` : taskLabel,
      duration: 8,
    };
  }

  if (normalizedCode === 'already-exists') {
    return {
      message: 'Venta enviada con cambios',
      description:
        'Detectamos un intento anterior de esta operación con datos distintos. No se creó una factura nueva. Revisa el historial de facturas; si no aparece, vuelve a presionar Facturar.',
      duration: 10,
    };
  }

  if (normalizedCode && normalizedCode.startsWith('cashCount')) {
    return {
      message: 'Cuadre de caja requerido',
      description:
        error?.message || 'Debes abrir un cuadre de caja antes de facturar.',
      duration: 6,
    };
  }

  const detailsReason =
    typeof error?.details === 'object' && error.details
      ? error.details.reason
      : null;

  if (
    normalizedCode === 'failed-precondition' &&
    detailsReason === 'tax-receipt-required'
  ) {
    return {
      message: 'Comprobante requerido',
      description:
        error?.message ||
        'Debes seleccionar un comprobante fiscal válido antes de completar la venta.',
      duration: 6,
    };
  }

  const details = collectDetails(error);

  if (normalizedCode) {
    details.push(`Código: ${normalizedCode}`);
  }

  const sanitizedDetails = details
    .map((detail) => detail.replace(/^Código:\s*/i, '').trim())
    .filter(
      (detail) =>
        detail &&
        !/^error interno/i.test(detail) &&
        detail.toLowerCase() !== 'internal' &&
        !detail.toLowerCase().includes('stack trace') &&
        !detail.toLowerCase().includes('trace id'),
    );

  const mergedDetails = Array.from(new Set(sanitizedDetails));
  const description = mergedDetails.slice(0, 2).join(' | ');

  return {
    ...DEFAULT_ERROR_NOTIFICATION,
    description: description || DEFAULT_ERROR_NOTIFICATION.description,
  };
};
