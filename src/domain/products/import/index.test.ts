import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProcessMappedDataParams } from '@/utils/import/types';

const mocks = vi.hoisted(() => ({
  readExcelFile: vi.fn(),
  processMappedData: vi.fn(
    ({ dataMapped }: ProcessMappedDataParams) => dataMapped,
  ),
}));

vi.mock('@/utils/import/excelReader', () => ({
  readExcelFile: mocks.readExcelFile,
}));

vi.mock('@/utils/import/processMappedData', () => ({
  processMappedData: mocks.processMappedData,
}));

import { getProductAvailableHeaders, importProductData } from './index';

describe('importProductData', () => {
  beforeEach(() => {
    mocks.readExcelFile.mockReset();
    mocks.processMappedData.mockImplementation(
      ({ dataMapped }: ProcessMappedDataParams) => dataMapped,
    );
  });

  it('preserves Spanish product header aliases at the product import boundary', async () => {
    const file = new ArrayBuffer(0);
    mocks.readExcelFile.mockResolvedValue([
      {
        Codigo: ' 779123 ',
        Facturable: 'si',
        Inventariable: 'no',
      },
    ]);

    const result = await importProductData(file, 'es');

    expect(mocks.processMappedData).toHaveBeenCalledWith({
      dataMapped: [
        {
          barcode: '779123',
          isVisible: 'si',
          trackInventory: 'no',
        },
      ],
      transformConfig: expect.any(Array),
    });
    expect(result).toEqual([
      {
        barcode: '779123',
        isVisible: 'si',
        trackInventory: 'no',
      },
    ]);
  });

  it('exposes available product headers without leaking internal mappings', () => {
    const headers = getProductAvailableHeaders('es');

    expect(headers.essential).toContain('Nombre');
    expect(headers.optionalGroups.Precios).toContain('Impuesto');
  });
});
