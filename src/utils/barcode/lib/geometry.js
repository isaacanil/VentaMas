// Utilidades de geometría GS1 para render y validación de códigos de barras

export const PRINT_DPI = 203;

// Estándares GS1 por tipo de código
export const GS1_STANDARDS = {
  'UPC-A': { xDimension: 0.33, minHeight: 22.85, exactLength: 12 },
  'EAN-13': { xDimension: 0.33, minHeight: 22.85, exactLength: 13 },
  'EAN-8': { xDimension: 0.33, minHeight: 18.28, exactLength: 8 },
  'GTIN-14': { xDimension: 0.33, minHeight: 22.85, exactLength: 14 },
  'Code-128': { xDimension: 0.33, minHeight: 15.0, maxLength: 48 },
};

export const QUIET_ZONE_MULTIPLIER = 10;

export const mmToPixels = (mm, dpi = PRINT_DPI) =>
  Math.round((mm / 25.4) * dpi);

// Devuelve geometría calculada para un tipo GS1 específico
export function getGS1Geometry(dpi = PRINT_DPI, barcodeType) {
  const normalizedType =
    barcodeType && typeof barcodeType === 'string'
      ? barcodeType.startsWith('GTIN-13')
        ? 'EAN-13'
        : barcodeType
      : undefined;
  const standards = GS1_STANDARDS[normalizedType] || GS1_STANDARDS['Code-128'];

  return {
    xPx: Math.max(2, mmToPixels(standards.xDimension, dpi)),
    heightPx: mmToPixels(standards.minHeight, dpi),
    quietZoneMm: standards.xDimension * QUIET_ZONE_MULTIPLIER,
    exactLength: standards.exactLength,
    maxLength: standards.maxLength,
    standards,
  };
}
