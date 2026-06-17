import { describe, expect, it } from 'vitest';

import {
  buildCsvFromRecords,
  buildCsvFromRows,
  createCsvBlob,
  escapeCsvCell,
} from './csv';

describe('csv export helpers', () => {
  it('escapes quotes, commas, and newlines', () => {
    expect(escapeCsvCell('Demo "Norte", SRL')).toBe(
      '"Demo ""Norte"", SRL"',
    );
    expect(escapeCsvCell('Linea 1\nLinea 2')).toBe('"Linea 1\nLinea 2"');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('builds csv from explicit headers and row cells', () => {
    expect(
      buildCsvFromRows({
        headers: ['id', 'name'],
        rows: [
          ['business-1', 'Demo'],
          ['business-2', 'Demo, Norte'],
        ],
      }),
    ).toBe(
      ['id,name', 'business-1,Demo', 'business-2,"Demo, Norte"'].join('\n'),
    );
  });

  it('builds csv from record keys using the first row order', () => {
    expect(
      buildCsvFromRecords([
        { id: 'line-1', amount: 10 },
        { id: 'line-2', amount: -5 },
      ]),
    ).toBe(['id,amount', 'line-1,10', 'line-2,-5'].join('\n'));
  });

  it('creates csv blobs with the shared mime type', () => {
    expect(createCsvBlob('a,b').type).toBe('text/csv;charset=utf-8;');
  });
});
