type CallableErrorLike =
  | {
      code?: string;
      message?: string;
    }
  | null
  | undefined;

const getCallableError = (error: unknown): CallableErrorLike =>
  error && typeof error === 'object'
    ? (error as { code?: string; message?: string })
    : null;

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s_.-]+/g, '');

const isGenericNotFoundMessage = (message: string): boolean => {
  const normalized = normalizeToken(message);
  return normalized.length === 0 || normalized === 'notfound';
};

const isGenericUnimplementedMessage = (message: string): boolean => {
  const normalized = normalizeToken(message);
  return normalized.length === 0 || normalized === 'unimplemented';
};

const isUnavailableCallable = (code: string, message: string): boolean =>
  (code.includes('unimplemented') && isGenericUnimplementedMessage(message)) ||
  (code.includes('not-found') && isGenericNotFoundMessage(message));

export const resolveBillingCallableErrorMessage = (
  error: unknown,
  unavailableMessage: string,
): string => {
  const typedError = getCallableError(error);
  const code = String(typedError?.code || '').toLowerCase();
  const message = String(typedError?.message || '').trim();

  if (isUnavailableCallable(code, message)) {
    return unavailableMessage;
  }
  if (code.includes('permission-denied')) {
    return 'No tienes permisos para ejecutar esta acción.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }
  if (message) {
    return message;
  }
  return 'No se pudo completar la operación de billing.';
};
