type CallableErrorLike = {
  code?: string;
  message?: string;
} | null;

export interface CloseCashCountErrorDetails {
  code: string;
  rawMessage: string;
  userMessage: string;
}

const getCallableError = (error: unknown): CallableErrorLike =>
  error && typeof error === 'object'
    ? (error as { code?: string; message?: string })
    : null;

const normalize = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isOutdatedClientError = (code: string, message: string): boolean =>
  (code.includes('internal') || code.includes('client/serialization-error')) &&
  (message.includes('maximum call stack size exceeded') ||
    message.includes('call stack size exceeded') ||
    message.includes('stack size exceeded') ||
    message.includes('converting circular structure') ||
    message.includes('payload serialization'));

export const resolveCloseCashCountError = (
  error: unknown,
): CloseCashCountErrorDetails => {
  const typedError = getCallableError(error);
  const code = normalize(typedError?.code);
  const rawMessage = String(typedError?.message || '').trim();
  const normalizedMessage = normalize(rawMessage);

  if (code.includes('permission-denied')) {
    return {
      code,
      rawMessage,
      userMessage:
        'Tu usuario no tiene acceso activo al negocio o no puede cerrar esta caja.',
    };
  }

  if (code.includes('not-found')) {
    return {
      code,
      rawMessage,
      userMessage: 'No se encontró el cuadre de caja.',
    };
  }

  if (
    code.includes('failed-precondition') ||
    normalizedMessage.includes('negocio actual no coincide') ||
    normalizedMessage.includes('negocio activo') ||
    normalizedMessage.includes('membresía válida')
  ) {
    return {
      code,
      rawMessage,
      userMessage:
        'Tu sesión o negocio activo no coincide con la caja que intentas cerrar.',
    };
  }

  if (isOutdatedClientError(code, normalizedMessage)) {
    return {
      code,
      rawMessage,
      userMessage: 'Tu app parece desactualizada; recarga la aplicación.',
    };
  }

  if (code.includes('unauthenticated')) {
    return {
      code,
      rawMessage,
      userMessage: 'Tu sesión expiró. Inicia sesión nuevamente.',
    };
  }

  if (rawMessage) {
    return {
      code,
      rawMessage,
      userMessage: rawMessage,
    };
  }

  return {
    code,
    rawMessage,
    userMessage: 'No se pudo autorizar el cierre.',
  };
};
