import { normalizeRncNumber as normalizeRncInput } from './rncInput.util.js';

const RNC_DIGITS_PATTERN = /^(\d{9}|\d{11})$/;

export class RncValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RncValidationError';
    this.code = 'invalid-rnc';
    this.details = details;
  }
}

const toRncInputString = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  return null;
};

export const normalizeRncNumber = (value) => {
  const rawValue = toRncInputString(value);
  if (!rawValue) {
    throw new RncValidationError('rnc es requerido.', {
      reason: 'missing-rnc',
    });
  }

  const compactValue = normalizeRncInput(rawValue);
  if (!compactValue) {
    throw new RncValidationError('rnc es requerido.', {
      reason: 'missing-rnc',
    });
  }

  if (!/^\d+$/.test(compactValue)) {
    throw new RncValidationError(
      'rnc debe contener solo digitos, espacios o guiones.',
      {
        reason: 'invalid-characters',
      },
    );
  }

  if (!RNC_DIGITS_PATTERN.test(compactValue)) {
    throw new RncValidationError('rnc debe tener exactamente 9 u 11 digitos.', {
      reason: 'invalid-length',
      length: compactValue.length,
    });
  }

  return compactValue;
};

export const resolveRncLookupInput = (payload) => {
  if (
    typeof payload === 'string'
  ) {
    return {
      rnc: normalizeRncNumber(payload),
    };
  }

  const data =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {};

  return {
    rnc: normalizeRncNumber(
      data.rnc ??
        data.rncNumber ??
        data.rnc_number ??
        data.identificationNumber ??
        data.value,
    ),
  };
};
