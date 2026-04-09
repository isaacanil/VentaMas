import { describe, expect, it } from 'vitest';

import { CloseAccountingPeriodInputSchema } from '../../../../shared/accountingSchemas.js';

import { parseSchemaOrThrow } from './zodHttps.util.js';

describe('zodHttps.util', () => {
  it('retorna datos parseados cuando el payload es valido', () => {
    const result = parseSchemaOrThrow(CloseAccountingPeriodInputSchema, {
      businessId: 'business-1',
      periodKey: '2026-04',
    });

    expect(result).toMatchObject({
      businessId: 'business-1',
      periodKey: '2026-04',
      note: null,
    });
  });

  it('lanza HttpsError invalid-argument con el primer issue', () => {
    expect(() =>
      parseSchemaOrThrow(
        CloseAccountingPeriodInputSchema,
        {
          businessId: 'business-1',
          periodKey: 'abril-2026',
        },
        'Payload invalido.',
      ),
    ).toThrow(/periodKey/);
  });
});
