// features/invoices/invoicesSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Estado inicial para el slice de facturas
const initialState = {
  items: [], // Lista de facturas
  statusFilter: 'all', // Filtro de estado de factura, por ejemplo 'pagado', 'pendiente', 'todos'
  sortKey: 'fecha', // Clave de ordenamiento, por ejemplo 'fecha', 'monto'
  sortOrder: 'asc', // Orden de ordenamiento, 'asc' o 'desc'
};

const invoicesSlice = (createSlice as any)({
  name: 'invoices',
  initialState,
  reducers: {
    // Acción para establecer las facturas (útil cuando se cargan desde una API)
    setInvoices(state, action) {
      state.items = action.payload;
    },
    // Acción para filtrar las facturas por estado
    filterInvoicesByStatus(state, action) {
      state.statusFilter = action.payload;
    },
    // Acción para ordenar las facturas
    sortInvoices(state, action) {
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
export const selectFilteredSortedInvoices = (state) => {
  const { items, statusFilter, sortKey, sortOrder } = state.invoices;
  const toNumber = (value) => Number(value || 0);
  const toDateValue = (value) => {
    if (value instanceof Date) {
      return value.getTime();
    }
    return Number(value || 0);
  };
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

