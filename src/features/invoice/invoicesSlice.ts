// features/invoices/invoicesSlice.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type InvoiceStatusFilter = 'todos' | (string & {});
type InvoiceSortOrder = 'asc' | 'desc';

interface InvoiceSummary extends Record<string, unknown> {
  status?: string | null;
  fecha?: string | number | Date | null;
}

interface InvoicesState {
  items: InvoiceSummary[];
  statusFilter: InvoiceStatusFilter;
  sortKey: string;
  sortOrder: InvoiceSortOrder;
}

interface InvoicesSortPayload {
  sortKey: string;
  sortOrder: InvoiceSortOrder;
}

type InvoicesRootState = { invoices: InvoicesState };

// Estado inicial para el slice de facturas
const initialState: InvoicesState = {
  items: [], // Lista de facturas
  statusFilter: 'todos', // Filtro de estado de factura, por ejemplo 'pagado', 'pendiente', 'todos'
  sortKey: 'fecha', // Clave de ordenamiento, por ejemplo 'fecha', 'monto'
  sortOrder: 'asc', // Orden de ordenamiento, 'asc' o 'desc'
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    // Acción para establecer las facturas (útil cuando se cargan desde una API)
    setInvoices(state, action: PayloadAction<InvoiceSummary[]>) {
      state.items = action.payload;
    },
    // Acción para filtrar las facturas por estado
    filterInvoicesByStatus(state, action: PayloadAction<InvoiceStatusFilter>) {
      state.statusFilter = action.payload;
    },
    // Acción para ordenar las facturas
    sortInvoices(state, action: PayloadAction<InvoicesSortPayload>) {
      const { sortKey, sortOrder } = action.payload;
      state.sortKey = sortKey;
      state.sortOrder = sortOrder;
    },
  },
});

// Exporta las acciones
export const { setInvoices, filterInvoicesByStatus, sortInvoices } =
  invoicesSlice.actions;

// Selector para obtener las facturas filtradas y ordenadas
export const selectFilteredSortedInvoices = (state: InvoicesRootState) => {
  const { items, statusFilter, sortKey, sortOrder } = state.invoices;
  const toNumber = (value: unknown) => Number(value || 0);
  const toDateValue = (value: unknown) => new Date(value as string | number | Date).getTime();
  return items
    .filter(
      (invoice) => statusFilter === 'todos' || invoice.status === statusFilter,
    )
    .sort((a, b) => {
      if (sortKey === 'fecha') {
        return sortOrder === 'asc'
          ? toDateValue(a[sortKey]) - toDateValue(b[sortKey])
          : toDateValue(b[sortKey]) - toDateValue(a[sortKey]);
      } else {
        return sortOrder === 'asc'
          ? toNumber(a[sortKey]) - toNumber(b[sortKey])
          : toNumber(b[sortKey]) - toNumber(a[sortKey]);
      }
    });
};

// Exporta el reducer
export default invoicesSlice.reducer;

