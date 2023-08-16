import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  criterio: localStorage.getItem('filterCriterio') || 'nombre',
  orden: localStorage.getItem('filterOrden') || 'asc',
  inventariable: localStorage.getItem('filterInventariable') || 'todos',
  itbis: localStorage.getItem('filterItbis') || 'todos',
  
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
  },
});

export const { setCriterio, setOrden, setInventariable, setItbis } = filterProductsSlice.actions;
export default filterProductsSlice.reducer;

export const selectCriterio = (state) => state.filterProducts.criterio;
export const selectOrden = (state) => state.filterProducts.orden;
export const selectInventariable = (state) => state.filterProducts.inventariable;
export const selectItbis = (state) => state.filterProducts.itbis;
