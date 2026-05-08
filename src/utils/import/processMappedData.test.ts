import { beforeEach, describe, expect, it, vi } from 'vitest';

import { processMappedData } from './processMappedData';

describe('processMappedData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runs transforms sequentially using trimmed nested values', () => {
    const result = processMappedData({
      dataMapped: [
        {
          pricing: {
            price: ' 10.50 ',
          },
        },
      ],
      transformConfig: [
        {
          field: 'pricing.price',
          transform: (value) => Number(value),
        },
        {
          field: 'pricing.price',
          transform: (value) => Number(value) * 1.18,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.pricing).toEqual({
      price: expect.closeTo(12.39, 8),
    });
  });

  it('can read from one source field and write to another nested field', () => {
    const result = processMappedData({
      dataMapped: [{ rawPrice: '250' }],
      transformConfig: [
        {
          field: 'pricing.price',
          source: 'rawPrice',
          transform: (value) => Number(value),
        },
      ],
    });

    expect(result).toEqual([
      {
        rawPrice: '250',
        pricing: {
          price: 250,
        },
      },
    ]);
  });

  it('keeps processing when a transform throws and stores the original value', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = processMappedData({
      dataMapped: [{ name: ' Producto A ' }],
      transformConfig: [
        {
          field: 'name',
          transform: () => {
            throw new Error('bad transform');
          },
        },
      ],
    });

    expect(result).toEqual([{ name: 'Producto A' }]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error transforming value for name:',
      expect.any(Error),
    );
  });
});
