import { describe, expect, it } from 'vitest';

import {
  assertValidDgii608Header,
  buildDgii608TxtContent,
  buildDgii608TxtRow,
} from './dgii608TxtExport.service.js';

describe('dgii608TxtExport.service', () => {
  it('serializa filas 608 con NCF, fecha y codigo DGII', () => {
    expect(
      buildDgii608TxtRow({
        data: { NCF: 'B0100000015' },
        voidedAt: '2026-04-20T13:20:00.000Z',
        voidReasonCode: '4',
      }),
    ).toBe('B0100000015|20260420|04');
  });

  it('arma encabezado 608 con cantidad de registros', () => {
    expect(
      buildDgii608TxtContent({
        businessRnc: '101010101',
        periodKey: '2026-04',
        rows: ['B0100000015|20260420|04', 'B0400000009|20260410|06'],
      }),
    ).toBe(
      '608|101010101|202604|000002\r\nB0100000015|20260420|04\r\nB0400000009|20260410|06',
    );
  });

  it('rechaza encabezados 608 con mas de 4,999 registros', () => {
    expect(() =>
      assertValidDgii608Header({
        businessRnc: '101010101',
        periodKey: '2026-04',
        rowCount: 4999,
      }),
    ).not.toThrow();

    expect(() =>
      assertValidDgii608Header({
        businessRnc: '101010101',
        periodKey: '2026-04',
        rowCount: 5000,
      }),
    ).toThrow('Cantidad de registros');
  });

  it('rechaza filas 608 sin codigo DGII valido', () => {
    expect(() =>
      buildDgii608TxtRow({
        data: { NCF: 'B0100000015' },
        voidedAt: '2026-04-20T13:20:00.000Z',
        voidReasonCode: '',
      }),
    ).toThrow('Tipo de anulaci');
  });
});
