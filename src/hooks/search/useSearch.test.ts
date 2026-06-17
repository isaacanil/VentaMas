import { describe, expect, it } from 'vitest';

import { filterData } from './useSearch';

describe('filterData', () => {
  it('normaliza despues de recortar el termino de busqueda', () => {
    const data = [{ name: 'Té' }, { name: 'Cafe' }];

    expect(filterData(data, ' te ')).toEqual([{ name: 'Té' }]);
  });

  it('devuelve el array original cuando el termino solo tiene espacios', () => {
    const data = [{ name: 'Té' }, { name: 'Cafe' }];

    expect(filterData(data, '   ')).toBe(data);
  });

  it('mantiene la busqueda en fechas por su valor ISO', () => {
    const data = [
      { createdAt: new Date('2024-01-02T03:04:05.000Z'), id: 1 },
      { createdAt: new Date('2025-06-15T10:00:00.000Z'), id: 2 },
    ];

    expect(filterData(data, '2024-01-02')).toEqual([data[0]]);
  });

  it('mantiene el limite de profundidad existente', () => {
    const data = [
      {
        level1: {
          level2: {
            level3: {
              level4: {
                name: 'oculto',
              },
            },
          },
        },
      },
    ];

    expect(filterData(data, 'oculto')).toEqual([]);
  });
});
