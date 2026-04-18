import { describe, expect, it } from 'vitest';

import {
  getDgii608ReasonByCode,
  resolveDgii608Reason,
} from './dgii608ReasonCatalog.service.js';

describe('dgii608ReasonCatalog.service', () => {
  it('resuelve motivos por código DGII', () => {
    expect(getDgii608ReasonByCode('4')).toEqual(
      expect.objectContaining({
        code: '04',
        label: 'Corrección de la información',
      }),
    );
  });

  it('normaliza texto libre legacy a catálogo 608 versionado', () => {
    expect(
      resolveDgii608Reason({
        reasonText: 'Cliente desistió de la compra',
      }),
    ).toEqual(
      expect.objectContaining({
        code: '06',
        label: 'Devolución de productos',
        catalogVersion: 'dgii-608-v1-2025',
        matchSource: 'text',
      }),
    );
  });
});
