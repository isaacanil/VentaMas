import type { AccountsPayableRow } from './accountsPayableDashboard';

export const toggleAccountsPayableRowSelection = (
  selectedRowIds: ReadonlySet<string>,
  rowId: string,
  checked: boolean,
): Set<string> => {
  const nextSelectedRowIds = new Set(selectedRowIds);

  if (checked) {
    nextSelectedRowIds.add(rowId);
  } else {
    nextSelectedRowIds.delete(rowId);
  }

  return nextSelectedRowIds;
};

export const selectVisibleAccountsPayableRowIds = (
  rows: AccountsPayableRow[],
): Set<string> => new Set(rows.map((row) => row.id));

export const resolveVisibleSelectedAccountsPayableRows = (
  rows: AccountsPayableRow[],
  selectedRowIds: ReadonlySet<string>,
): AccountsPayableRow[] => rows.filter((row) => selectedRowIds.has(row.id));
