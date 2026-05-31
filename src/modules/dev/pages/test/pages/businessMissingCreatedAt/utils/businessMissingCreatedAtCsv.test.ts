import { describe, expect, it } from 'vitest';

import type { MissingBusiness } from '../types';
import {
  buildMissingBusinessesCsv,
  createMissingBusinessesCsvFilename,
} from './businessMissingCreatedAtCsv';

const createMissingBusiness = (
  overrides: Partial<MissingBusiness>,
): MissingBusiness => ({
  id: 'business-1',
  name: 'Demo',
  createdAt: null,
  raw: {},
  hasCreatedAtNested: false,
  hasCreatedAtRoot: false,
  ...overrides,
});

describe('businessMissingCreatedAtCsv', () => {
  it('escapes names safely for CSV export', () => {
    const csv = buildMissingBusinessesCsv([
      createMissingBusiness({
        id: 'business-1',
        name: 'Demo "Norte", SRL',
      }),
      createMissingBusiness({
        id: 'business-2',
        name: 'Linea 1\nLinea 2',
      }),
    ]);

    expect(csv).toBe(
      [
        'id,name',
        'business-1,"Demo ""Norte"", SRL"',
        'business-2,Linea 1 Linea 2',
      ].join('\n'),
    );
  });

  it('creates deterministic filenames from a date', () => {
    expect(
      createMissingBusinessesCsvFilename(new Date('2026-05-31T10:20:30.000Z')),
    ).toBe('businesses-missing-createdAt-2026-05-31T10-20-30-000Z.csv');
  });
});
