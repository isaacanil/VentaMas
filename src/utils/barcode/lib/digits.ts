import { GTIN_MULTIPLIERS, UPC_MULTIPLIERS } from './constants';

// Calcula el dígito de verificación para GTIN-13/EAN-13
export function calculateGTIN13CheckDigit(code: string): string | null {
  if (code.length !== 12) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++)
    sum += parseInt(code[i], 10) * GTIN_MULTIPLIERS[i % 2];
  return ((10 - (sum % 10)) % 10).toString();
}

// Calcula el dígito de verificación para EAN-8
export function calculateEAN8CheckDigit(code: string): string | null {
  if (code.length !== 7) return null;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(code[i], 10) * (i % 2 === 0 ? 3 : 1);
  }
  return ((10 - (sum % 10)) % 10).toString();
}

// Calcula el dígito de verificación para UPC-A
export function calculateUPCACheckDigit(code: string): string | null {
  if (code.length !== 11) return null;
  let sum = 0;
  for (let i = 0; i < 11; i++)
    sum += parseInt(code[i], 10) * UPC_MULTIPLIERS[i % 2];
  return ((10 - (sum % 10)) % 10).toString();
}

// Calcula el dígito de verificación para GTIN-14
export function calculateGTIN14CheckDigit(code: string): string | null {
  if (code.length !== 13) return null;
  let sum = 0;
  for (let i = 0; i < 13; i++)
    sum += parseInt(code[i], 10) * GTIN_MULTIPLIERS[i % 2];
  return ((10 - (sum % 10)) % 10).toString();
}
