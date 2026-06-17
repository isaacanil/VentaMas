import { describe, expect, it } from 'vitest';

import {
  buildSearchIndex,
  filterByDeepSearchText,
  matchesDeepSearchText,
  normalizedIncludes,
  normalizeSearchText,
  normalizeTrimmedSearchText,
} from './searchText';

describe('searchText', () => {
  it('normalizes user-facing search text without accents or uppercase letters', () => {
    expect(normalizeSearchText('Configuración Tesorería ÁÉÍÓÚ')).toBe(
      'configuracion tesoreria aeiou',
    );
  });

  it('keeps surrounding spaces by default for token builders that already own trimming', () => {
    expect(normalizeSearchText('  Nómina  ')).toBe('  nomina  ');
  });

  it('supports trimmed search queries and shortcut labels', () => {
    expect(normalizeTrimmedSearchText('  Tesorería Y Nómina  ')).toBe(
      'tesoreria y nomina',
    );
  });

  it('builds a normalized index that points back to the original text ranges', () => {
    const index = buildSearchIndex('Nómina Ágil');
    const query = 'nomina';
    const matchStart = index.normalized.indexOf(query);
    const matchEnd = matchStart + query.length - 1;
    const originalStart = index.ranges[matchStart]?.start;
    const originalEnd = index.ranges[matchEnd]?.end;

    expect(index.normalized).toBe('nomina agil');
    expect(index.original.slice(originalStart, originalEnd)).toBe('Nómina');
  });

  it('checks normalized includes with trimmed accent-insensitive queries', () => {
    expect(normalizedIncludes('Tesorería', ' tesoreria ')).toBe(true);
    expect(normalizedIncludes('Cuadre de Caja', 'nómina')).toBe(false);
    expect(normalizedIncludes('Cuadre de Caja', '   ')).toBe(true);
  });

  it('filters records by nested string and numeric values', () => {
    const clients = [
      { client: { name: 'José Núñez', phone: '8095551111' }, id: 1 },
      { client: { name: 'Ana Pérez', phone: '8495552222' }, id: 2 },
    ];

    expect(filterByDeepSearchText(clients, 'nunez')).toEqual([clients[0]]);
    expect(filterByDeepSearchText(clients, '2222')).toEqual([clients[1]]);
  });

  it('returns the original array when the search term is empty', () => {
    const clients = [{ client: { name: 'Ana' } }];

    expect(filterByDeepSearchText(clients, '   ')).toBe(clients);
  });

  it('matches date values only when date searches are enabled', () => {
    const record = {
      createdAt: new Date('2024-01-02T03:04:05.000Z'),
    };

    expect(matchesDeepSearchText(record, '2024-01-02')).toBe(false);
    expect(
      matchesDeepSearchText(record, '2024-01-02', { includeDates: true }),
    ).toBe(true);
  });

  it('allows callers to cap deep-search traversal depth', () => {
    const record = {
      level1: {
        level2: {
          level3: {
            level4: {
              name: 'oculto',
            },
          },
        },
      },
    };

    expect(matchesDeepSearchText(record, 'oculto')).toBe(true);
    expect(matchesDeepSearchText(record, 'oculto', { maxDepth: 3 })).toBe(
      false,
    );
  });
});
