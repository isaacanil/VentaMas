const DEFAULT_ERROR_NOTIFICATION = {
  message: 'Error al procesar la factura',
  description:
    'Intenta nuevamente o contacta a tu supervisor si el problema persiste.',
  duration: 6,
};

const sanitizeDetail = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const collectDetails = (error) => {
  const details = new Set();
  const addDetail = (value) => {
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

export const getInvoiceErrorNotification = (error) => {
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

  if (normalizedCode && normalizedCode.startsWith('cashCount')) {
    return {
      message: 'Cuadre de caja requerido',
      description:
        error?.message || 'Debes abrir un cuadre de caja antes de facturar.',
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
