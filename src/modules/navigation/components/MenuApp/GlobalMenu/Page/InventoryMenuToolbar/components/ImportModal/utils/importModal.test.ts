import { describe, expect, it } from 'vitest';

import {
  flattenPreviewObject,
  isUnsupportedLegacyExcelFile,
  isValidImportFile,
} from './importModal';

const createFile = ({
  name,
  type = '',
}: {
  name: string;
  type?: string;
}) => new File(['demo'], name, { type });

describe('importModal utils', () => {
  it('accepts supported import files by mime type or extension', () => {
    expect(
      isValidImportFile(
        createFile({
          name: 'products.bin',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ),
    ).toBe(true);
    expect(isValidImportFile(createFile({ name: 'products.csv' }))).toBe(true);
    expect(isValidImportFile(createFile({ name: 'products.XLSX' }))).toBe(true);
  });

  it('rejects legacy xls files with a dedicated predicate', () => {
    const file = createFile({ name: 'products.xls' });

    expect(isUnsupportedLegacyExcelFile(file)).toBe(true);
    expect(isValidImportFile(file)).toBe(false);
  });

  it('flattens nested preview rows for table display', () => {
    expect(
      flattenPreviewObject({
        name: 'Producto',
        stock: { current: 3 },
        tags: ['venta', { code: 'A' }],
      }),
    ).toEqual({
      name: 'Producto',
      'stock.current': 3,
      tags: 'venta, {"code":"A"}',
    });
  });
});
