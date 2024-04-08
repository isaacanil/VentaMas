// features/invoices/invoicesSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Estado inicial para el slice de facturas
const initialState = {
  items: [], // Lista de facturas
  statusFilter: 'all', // Filtro de estado de factura, por ejemplo 'pagado', 'pendiente', 'todos'
  sortKey: 'fecha', // Clave de ordenamiento, por ejemplo 'fecha', 'monto'
  sortOrder: 'asc' // Orden de ordenamiento, 'asc' o 'desc'
};

const invoicesSlice = createSlice({
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
export const { setInvoices, filterInvoicesByStatus, sortInvoices } = invoicesSlice.actions;

// Selector para obtener las facturas filtradas y ordenadas
export const selectFilteredSortedInvoices = (state) => {
  const { items, statusFilter, sortKey, sortOrder } = state.invoices;
  return items
    .filter((invoice) => statusFilter === 'todos' || invoice.status === statusFilter)
    .sort((a, b) => {
      if (sortKey === 'fecha') {
        return sortOrder === 'asc' ? new Date(a[sortKey]) - new Date(b[sortKey]) : new Date(b[sortKey]) - new Date(a[sortKey]);
      } else {
        return sortOrder === 'asc' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
      }
    });
};

// Exporta el reducer
export default invoicesSlice.reducer;
