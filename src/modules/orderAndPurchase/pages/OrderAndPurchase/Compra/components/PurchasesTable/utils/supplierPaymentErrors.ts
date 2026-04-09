const stripCallablePrefix = (value: string): string =>
  value.replace(/^functions\/[a-z-]+:\s*/i, '').trim();

export const resolveSupplierPaymentCallableErrorMessage = (
  error: unknown,
  fallbackMessage = 'No se pudo completar la operación con el pago del suplidor.',
): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const message = stripCallablePrefix(String(typedError?.message || ''));

  if (code.includes('permission-denied')) {
    return 'No tienes permisos para completar esta acción.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }
  if (message) {
    return message;
  }

  return fallbackMessage;
};
