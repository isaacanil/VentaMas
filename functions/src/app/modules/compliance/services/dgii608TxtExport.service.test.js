import { describe, expect, it } from 'vitest';

import {
  buildDgii608TxtContent,
  buildDgii608TxtRow,
} from './dgii608TxtExport.service.js';

describe('dgii608TxtExport.service', () => {
  it('serializa filas 608 con NCF, fecha y código DGII', () => {
    expect(
      buildDgii608TxtRow({
        data: { NCF: 'B01000000015' },
        voidedAt: '2026-04-20T13:20:00.000Z',
        voidReasonCode: '4',
      }),
    ).toBe('B01000000015|20260420|04');
  });

  it('arma encabezado 608 con cantidad de registros', () => {
    expect(
      buildDgii608TxtContent({
        businessRnc: '101010101',
        periodKey: '2026-04',
        rows: ['B01000000015|20260420|04', 'B04000000009|20260410|06'],
      }),
    ).toBe(
      '608|101010101|202604|000002\r\nB01000000015|20260420|04\r\nB04000000009|20260410|06',
    );
  });

  it('rechaza filas 608 sin código DGII válido', () => {
    expect(() =>
      buildDgii608TxtRow({
        data: { NCF: 'B01000000015' },
        voidedAt: '2026-04-20T13:20:00.000Z',
        voidReasonCode: '',
      }),
    ).toThrow('Tipo de anulación faltante');
  });
});
