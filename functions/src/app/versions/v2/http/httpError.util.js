export const DEFAULT_HTTPS_ERROR_HTTP_STATUS = Object.freeze({
  cancelled: 499,
  unknown: 500,
  'permission-denied': 403,
  unauthenticated: 401,
  'not-found': 404,
  'failed-precondition': 412,
  'resource-exhausted': 429,
  'already-exists': 409,
  'invalid-argument': 400,
  'deadline-exceeded': 504,
  unavailable: 503,
  internal: 500,
  'data-loss': 500,
});

export const ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS = Object.freeze({
  ...DEFAULT_HTTPS_ERROR_HTTP_STATUS,
  'already-exists': 400,
  aborted: 400,
  'deadline-exceeded': 504,
});

export const mapHttpsErrorToHttpStatus = (
  code,
  statusByCode = DEFAULT_HTTPS_ERROR_HTTP_STATUS,
) => statusByCode[code] ?? 400;
