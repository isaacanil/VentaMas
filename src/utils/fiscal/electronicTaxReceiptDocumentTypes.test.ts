import { describe, expect, it } from 'vitest';

import {
  formatCompactElectronicTaxReceiptLabel,
  formatElectronicTaxReceiptLabel,
  resolveElectronicTaxReceiptDocumentType,
} from './electronicTaxReceiptDocumentTypes';

describe('electronicTaxReceiptDocumentTypes', () => {
  it('mapea comprobantes fiscales legacy a tipos e-CF', () => {
    expect(resolveElectronicTaxReceiptDocumentType('CREDITO FISCAL')).toBe('E31');
    expect(resolveElectronicTaxReceiptDocumentType('CONSUMIDOR FINAL')).toBe('E32');
    expect(resolveElectronicTaxReceiptDocumentType('NOTAS DE CREDITO')).toBe('E34');
    expect(resolveElectronicTaxReceiptDocumentType('GUBERNAMENTAL')).toBe('E45');
    expect(resolveElectronicTaxReceiptDocumentType('B0200000438')).toBe('E32');
  });

  it('solo agrega etiqueta e-CF cuando el modelo electronico esta activo', () => {
    expect(
      formatElectronicTaxReceiptLabel('CONSUMIDOR FINAL', {
        electronicModelEnabled: false,
      }),
    ).toBe('CONSUMIDOR FINAL');

    expect(
      formatElectronicTaxReceiptLabel('CONSUMIDOR FINAL', {
        electronicModelEnabled: true,
      }),
    ).toBe('CONSUMIDOR FINAL e-CF (E32)');
  });

  it('compacta el label e-CF para controles estrechos', () => {
    expect(
      formatCompactElectronicTaxReceiptLabel('CONSUMIDOR FINAL', {
        electronicModelEnabled: true,
      }),
    ).toBe('e-CF (E32)');
  });
});
