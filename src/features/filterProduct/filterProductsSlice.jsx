import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  criterio: localStorage.getItem('filterCriterio') || 'nombre',
  orden: localStorage.getItem('filterOrden') || 'asc',
  inventariable: localStorage.getItem('filterInventariable') || 'todos',
  itbis: localStorage.getItem('filterItbis') || 'todos',
  // Nuevos filtros de stock
  stockAvailability: localStorage.getItem('filterStockAvailability') || 'todos', // todos | conStock | sinStock
  stockAlertLevel: localStorage.getItem('filterStockAlertLevel') || 'todos', // todos | bajo | critico | normal
  stockRequirement: localStorage.getItem('filterStockRequirement') || 'todos', // todos | requiere | noRequiere
  
};

export const filterProductsSlice = createSlice({
  name: 'filterProducts',
  initialState,
  reducers: {
    setCriterio: (state, action) => {
      localStorage.setItem('filterCriterio', action.payload);
      state.criterio = action.payload;
    },
    setOrden: (state, action) => {
      localStorage.setItem('filterOrden', action.payload);
      state.orden = action.payload;
    },
    setInventariable: (state, action) => { // Nueva acción
      localStorage.setItem('filterInventariable', action.payload);
      state.inventariable = action.payload;
    },
    setItbis: (state, action) => { // Nueva acción
      localStorage.setItem('filterItbis', action.payload);
      state.itbis = action.payload;
    },
    setStockAvailability: (state, action) => {
      localStorage.setItem('filterStockAvailability', action.payload);
      state.stockAvailability = action.payload;
    },
    setStockAlertLevel: (state, action) => {
      localStorage.setItem('filterStockAlertLevel', action.payload);
      state.stockAlertLevel = action.payload;
    },
    setStockRequirement: (state, action) => {
      localStorage.setItem('filterStockRequirement', action.payload);
      state.stockRequirement = action.payload;
    },
    resetFilters: (state) => {
      // Valores por defecto
      const defaults = {
        criterio: 'nombre',
        orden: 'asc',
        inventariable: 'todos',
        itbis: 'todos',
        stockAvailability: 'todos',
        stockAlertLevel: 'todos',
        stockRequirement: 'todos'
      };
      Object.entries(defaults).forEach(([k,v]) => localStorage.setItem(`filter${k.charAt(0).toUpperCase()+k.slice(1)}`, v));
      state.criterio = defaults.criterio;
      state.orden = defaults.orden;
      state.inventariable = defaults.inventariable;
      state.itbis = defaults.itbis;
      state.stockAvailability = defaults.stockAvailability;
      state.stockAlertLevel = defaults.stockAlertLevel;
      state.stockRequirement = defaults.stockRequirement;
    }
  },
});

export const { setCriterio, setOrden, setInventariable, setItbis, setStockAvailability, setStockAlertLevel, setStockRequirement, resetFilters } = filterProductsSlice.actions;
export default filterProductsSlice.reducer;

export const selectCriterio = (state) => state.filterProducts.criterio;
export const selectOrden = (state) => state.filterProducts.orden;
export const selectInventariable = (state) => state.filterProducts.inventariable;
export const selectItbis = (state) => state.filterProducts.itbis;
export const selectStockAvailability = (state) => state.filterProducts.stockAvailability;
export const selectStockAlertLevel = (state) => state.filterProducts.stockAlertLevel;
export const selectStockRequirement = (state) => state.filterProducts.stockRequirement;
