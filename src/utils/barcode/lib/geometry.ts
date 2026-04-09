// Utilidades de geometría GS1 para render y validación de códigos de barras

import type { Gs1Geometry, Gs1Standard, Gs1StandardType } from './types';

export const PRINT_DPI = 203;

// Estándares GS1 por tipo de código
export const GS1_STANDARDS: Record<Gs1StandardType, Gs1Standard> = {
  'UPC-A': { xDimension: 0.33, minHeight: 22.85, exactLength: 12 },
  'EAN-13': { xDimension: 0.33, minHeight: 22.85, exactLength: 13 },
  'EAN-8': { xDimension: 0.33, minHeight: 18.28, exactLength: 8 },
  'GTIN-14': { xDimension: 0.33, minHeight: 22.85, exactLength: 14 },
  'Code-128': { xDimension: 0.33, minHeight: 15.0, maxLength: 48 },
};

export const QUIET_ZONE_MULTIPLIER = 10;

export const mmToPixels = (mm: number, dpi: number = PRINT_DPI): number =>
  Math.round((mm / 25.4) * dpi);

// Devuelve geometría calculada para un tipo GS1 específico
export function getGS1Geometry(
  dpi: number = PRINT_DPI,
  barcodeType?: string,
): Gs1Geometry {
  const normalizedType =
    barcodeType && typeof barcodeType === 'string'
      ? barcodeType.startsWith('GTIN-13')
        ? 'EAN-13'
        : barcodeType
      : undefined;
  const standards =
    normalizedType && normalizedType in GS1_STANDARDS
      ? GS1_STANDARDS[normalizedType as Gs1StandardType]
      : GS1_STANDARDS['Code-128'];

  return {
    xPx: Math.max(2, mmToPixels(standards.xDimension, dpi)),
    heightPx: mmToPixels(standards.minHeight, dpi),
    quietZoneMm: standards.xDimension * QUIET_ZONE_MULTIPLIER,
    exactLength: standards.exactLength,
    maxLength: standards.maxLength,
    standards,
  };
}
