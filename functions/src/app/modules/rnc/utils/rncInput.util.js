import { HttpsError } from 'firebase-functions/v2/https';

export const normalizeRncNumber = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/[\s-]/g, '')
    : '';

export const assertValidRncNumber = (value) => {
  const rnc = normalizeRncNumber(value);

  if (!/^\d+$/.test(rnc) || !/^(\d{9}|\d{11})$/.test(rnc)) {
    throw new HttpsError(
      'invalid-argument',
      'El RNC o cedula debe tener exactamente 9 u 11 digitos.',
    );
  }

  return rnc;
};
