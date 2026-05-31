export const AI_BUSINESS_SEEDING_OPERATIONS = {
  ANALYZE: 'analyze',
  DIAGNOSTICS: 'diagnostics',
  EXECUTE: 'execute',
  STATUS: 'status',
};

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

export const readAiBusinessSeedingOperation = (payload = {}) => {
  const operation =
    readString(payload.operation) ||
    readString(payload.op) ||
    AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE;
  return operation.toLowerCase();
};

export const isAiBusinessSeedingStatusOperation = (operation) =>
  operation === AI_BUSINESS_SEEDING_OPERATIONS.STATUS ||
  operation === AI_BUSINESS_SEEDING_OPERATIONS.DIAGNOSTICS;

export const resolveAiBusinessSeedingOperationTarget = (operation) => {
  if (isAiBusinessSeedingStatusOperation(operation)) {
    return AI_BUSINESS_SEEDING_OPERATIONS.STATUS;
  }

  if (operation === AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE) {
    return AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE;
  }

  if (operation === AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE) {
    return AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE;
  }

  return null;
};
