import { describe, expect, it } from 'vitest';

import { mapData } from './mapData';
import type { HeaderAliases, HeaderMapping, RawData } from './types';

describe('mapData', () => {
  const headerMapping: HeaderMapping<'es'> = {
    es: {
      'codigo de barras': 'identity.barcode',
      nombre: 'name',
      'es visible': 'flags.isVisible',
      metadata: 'metadata',
      fecha: 'dates.createdAt',
    },
  };

  it('normalizes headers, trims strings, and writes nested fields', () => {
    const createdAt = new Date('2026-05-05T12:00:00.000Z');
    const data: RawData = [
      {
        'Código de Barras': '  779123  ',
        'NOMBRE ': '  Acetaminofen  ',
        'Es Visible': true,
        Metadata: { source: 'import' },
        Fecha: createdAt,
        Ignorado: 'no-map',
      },
    ];

    expect(mapData({ data, headerMapping })).toEqual([
      {
        identity: { barcode: '779123' },
        name: 'Acetaminofen',
        flags: { isVisible: true },
        metadata: { source: 'import' },
        dates: { createdAt },
      },
    ]);
  });

  it('does not apply product-specific aliases unless the caller provides them', () => {
    expect(
      mapData({
        data: [{ Codigo: '779123', Facturable: true }],
        headerMapping,
      }),
    ).toEqual([{}]);
  });

  it('applies caller-provided header aliases', () => {
    const headerAliases: HeaderAliases<'es'> = {
      es: {
        codigo: 'Código de Barras',
        facturable: 'Es Visible',
      },
    };

    expect(
      mapData({
        data: [{ Codigo: '779123', Facturable: true }],
        headerMapping,
        headerAliases,
      }),
    ).toEqual([{ identity: { barcode: '779123' }, flags: { isVisible: true } }]);
  });

  it('returns an empty result when language mapping is missing', () => {
    expect(
      mapData({
        data: [{ Nombre: 'Producto' }],
        headerMapping,
        language: 'en',
      }),
    ).toEqual([]);
  });

  it('coerces unsupported mapped values to strings instead of leaking arrays', () => {
    expect(
      mapData({
        data: [{ Nombre: ['Producto', 'A'] as never }],
        headerMapping,
      }),
    ).toEqual([{ name: 'Producto,A' }]);
  });
});
