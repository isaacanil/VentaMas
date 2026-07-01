import { describe, expect, it } from 'vitest';

import type { AccountsPayableRow } from './accountsPayableDashboard';
import {
  resolveVisibleSelectedAccountsPayableRows,
  selectVisibleAccountsPayableRowIds,
  toggleAccountsPayableRowSelection,
} from './accountsPayableSelection';

const buildRow = (id: string): AccountsPayableRow =>
  ({ id, reference: id }) as AccountsPayableRow;

describe('accountsPayableSelection', () => {
  it('toggles individual selected row ids without mutating the previous set', () => {
    const previousSelection = new Set(['bill-1']);

    const addedSelection = toggleAccountsPayableRowSelection(
      previousSelection,
      'bill-2',
      true,
    );
    const removedSelection = toggleAccountsPayableRowSelection(
      addedSelection,
      'bill-1',
      false,
    );

    expect([...previousSelection]).toEqual(['bill-1']);
    expect([...addedSelection]).toEqual(['bill-1', 'bill-2']);
    expect([...removedSelection]).toEqual(['bill-2']);
  });

  it('selects all currently visible accounts payable rows', () => {
    const selectedIds = selectVisibleAccountsPayableRowIds([
      buildRow('bill-1'),
      buildRow('bill-2'),
    ]);

    expect([...selectedIds]).toEqual(['bill-1', 'bill-2']);
  });

  it('resolves selected rows only from the current visible dataset', () => {
    const rows = [buildRow('bill-1'), buildRow('bill-2')];
    const selectedRows = resolveVisibleSelectedAccountsPayableRows(
      rows,
      new Set(['bill-2', 'stale-bill']),
    );

    expect(selectedRows).toEqual([rows[1]]);
  });
});
