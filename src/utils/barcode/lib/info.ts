import { analyzeBarcodeStructure } from './analyzer';
import type { BarcodeCheckDigitInfo, BarcodeInfo } from './types';

export function isValidBarcode(barcode: string): boolean {
  return analyzeBarcodeStructure(barcode).isValid;
}

export function getBarcodeInfo(barcode: string): BarcodeInfo {
  const analysis = analyzeBarcodeStructure(barcode);
  const checkDigit: BarcodeCheckDigitInfo | null = analysis.checkDigit
    ? {
        ...analysis.checkDigit,
        correctDigit: analysis.checkDigit.calculated,
      }
    : null;

  if (!analysis.isValid)
    return {
      valid: false,
      type: analysis.type || 'Desconocido',
      message: analysis.errorMessage || analysis.error || 'Código inválido',
      error: analysis.error,
      checkDigit,
    };
  let msg = `${analysis.type}`;
  if (analysis.country) msg += ` • ${analysis.country.country}`;
  if (analysis.isVariableWeight) msg += ' • Peso/Precio Variable';
  if (analysis.checkDigit?.isValid) msg += ' • ✓ Válido';
  if (
    analysis.type === 'UPC-E' &&
    analysis.structure &&
    'expanded' in analysis.structure
  ) {
    msg += ` → ${analysis.structure.expanded}`;
  }
  return {
    valid: true,
    type: analysis.type,
    country: analysis.country,
    structure: analysis.structure,
    isVariableWeight: analysis.isVariableWeight,
    message: msg,
    checkDigit,
  };
}

export function isGS1RDCode(barcode: string): boolean {
  const c = analyzeBarcodeStructure(barcode);
  return c.country?.prefix === '746' && c.isValid;
}

export function extractCompanyPrefix(
  barcode: string,
  len = 4,
): string | null {
  if (!isGS1RDCode(barcode)) return null;
  const clean = barcode.replace(/\s/g, '');
  return clean.slice(3, 3 + len);
}

export function extractItemReference(
  barcode: string,
  companyPrefixLength = 4,
): string | null {
  if (!isGS1RDCode(barcode)) return null;
  const clean = barcode.replace(/\s/g, '');
  const itemLength = 9 - companyPrefixLength;
  return clean.slice(
    3 + companyPrefixLength,
    3 + companyPrefixLength + itemLength,
  );
}
