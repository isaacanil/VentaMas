import { describe, expect, it } from 'vitest';

import {
  formatCompactElectronicTaxReceiptLabel,
  formatElectronicTaxReceiptLabel,
  resolveElectronicTaxReceiptDocumentType,
} from './electronicTaxReceiptDocumentTypes';

describe('electronicTaxReceiptDocumentTypes', () => {
  it('mapea comprobantes fiscales legacy a tipos e-CF', () => {
    expect(resolveElectronicTaxReceiptDocumentType('CREDITO FISCAL')).toBe(
      'E31',
    );
    expect(resolveElectronicTaxReceiptDocumentType('CONSUMIDOR FINAL')).toBe(
      'E32',
    );
    expect(resolveElectronicTaxReceiptDocumentType('NOTAS DE DEBITO')).toBe(
      'E33',
    );
    expect(resolveElectronicTaxReceiptDocumentType('NOTAS DE CREDITO')).toBe(
      'E34',
    );
    expect(resolveElectronicTaxReceiptDocumentType('GUBERNAMENTAL')).toBe(
      'E45',
    );
    expect(resolveElectronicTaxReceiptDocumentType('B0300000438')).toBe('E33');
    expect(resolveElectronicTaxReceiptDocumentType('B0200000438')).toBe('E32');
  });

  it('normaliza acentos, mayusculas y espacios al resolver nombres legacy', () => {
    expect(resolveElectronicTaxReceiptDocumentType('  crédito fiscal  ')).toBe(
      'E31',
    );
    expect(resolveElectronicTaxReceiptDocumentType('consumidor final')).toBe(
      'E32',
    );
    expect(resolveElectronicTaxReceiptDocumentType('NOTA de débito')).toBe(
      'E33',
    );
    expect(resolveElectronicTaxReceiptDocumentType('NOTA de crédito')).toBe(
      'E34',
    );
  });

  it('mantiene valores no string fuera de resolucion', () => {
    expect(resolveElectronicTaxReceiptDocumentType(31)).toBeNull();
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
