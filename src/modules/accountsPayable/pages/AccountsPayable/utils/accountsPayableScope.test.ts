import { describe, expect, it } from 'vitest';

import {
  appendAccountsPayableQueryScopeNotice,
  buildAccountsPayableLimitedSelectionNotice,
  buildAccountsPayableQueryScopeNotice,
} from './accountsPayableScope';

describe('accountsPayableScope', () => {
  it('builds a combined notice for client-filtered and bounded AP queries', () => {
    expect(
      buildAccountsPayableQueryScopeNotice({
        isClientFilteredQuery: true,
        isQueryLimitReached: true,
        queryLimit: 500,
        queryLimitMax: 2000,
        rawDocCount: 500,
      }),
    ).toBe(
      'Modo compatibilidad: se leyeron 500 registros y algunos filtros se aplicaron en el navegador. Consulta acotada a 500 registros de un maximo operativo de 2000.',
    );
  });

  it('keeps scope descriptions clean when no query notice is active', () => {
    expect(
      appendAccountsPayableQueryScopeNotice(
        '3 seleccionadas de 5 cuentas visibles con los filtros actuales.',
        '',
      ),
    ).toBe('3 seleccionadas de 5 cuentas visibles con los filtros actuales.');
  });

  it('appends query scope notices to payment proposal and export descriptions', () => {
    expect(
      appendAccountsPayableQueryScopeNotice(
        'Lote visible con los filtros actuales.',
        'Consulta acotada a 500 registros.',
      ),
    ).toBe(
      'Lote visible con los filtros actuales. Consulta acotada a 500 registros.',
    );
  });

  it('requires explicit selected rows before financial actions on limited AP scopes', () => {
    expect(
      buildAccountsPayableLimitedSelectionNotice({
        actionLabel: 'generar una propuesta de pago',
        hasSelectedRows: false,
        isClientFilteredQuery: true,
        isQueryLimitReached: true,
        queryLimit: 500,
        queryLimitMax: 2000,
        rawDocCount: 501,
      }),
    ).toBe(
      'Selecciona filas específicas antes de generar una propuesta de pago con alcance limitado. Modo compatibilidad: se leyeron 501 registros y algunos filtros se aplicaron en el navegador. Consulta acotada a 500 registros de un maximo operativo de 2000.',
    );
  });

  it('does not require explicit selected rows when the AP scope is complete', () => {
    expect(
      buildAccountsPayableLimitedSelectionNotice({
        actionLabel: 'generar una propuesta de pago',
        hasSelectedRows: false,
        isClientFilteredQuery: false,
        isQueryLimitReached: false,
        queryLimit: 500,
        queryLimitMax: 2000,
        rawDocCount: 120,
      }),
    ).toBeNull();

    expect(
      buildAccountsPayableLimitedSelectionNotice({
        actionLabel: 'generar una propuesta de pago',
        hasSelectedRows: true,
        isClientFilteredQuery: true,
        isQueryLimitReached: true,
        queryLimit: 500,
        queryLimitMax: 2000,
        rawDocCount: 501,
      }),
    ).toBeNull();
  });
});
