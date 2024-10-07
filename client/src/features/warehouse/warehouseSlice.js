// store/slices/warehouseSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'warehouse',
  selectedWarehouse: null,
  selectedShelf: null,
  selectedRowShelf: null,
  selectedSegment: null,
  selectedProduct: null,  // Producto seleccionado
  breadcrumbs: [{ title: 'Warehouse', key: 'warehouse' }],
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    // Navega a una ubicación o un producto en cualquier nivel
    navigateWarehouse: (state, action) => {
      const { view, data, product } = action.payload;
      state.currentView = view;

      // Actualiza los breadcrumbs según la vista
      switch (view) {
        case 'warehouse':
          state.breadcrumbs = [{ title: data.name, key: 'warehouse' }];
          break;
        case 'shelf':
          state.breadcrumbs[1] = { title: data.name, key: 'shelf' };
          state.breadcrumbs = state.breadcrumbs.slice(0, 2);
          break;
        case 'rowShelf':
          state.breadcrumbs[2] = { title: data.name, key: 'rowShelf' };
          state.breadcrumbs = state.breadcrumbs.slice(0, 3);
          break;
        case 'segment':
          state.breadcrumbs[3] = { title: data.name, key: 'segment' };
          state.breadcrumbs = state.breadcrumbs.slice(0, 4);
          break;
        case 'product':  // Navegar directamente al producto
          // Si el producto está en un almacén
          if (data.location === 'warehouse') {
            state.breadcrumbs[1] = { title: data.name, key: 'product' };
            state.breadcrumbs = state.breadcrumbs.slice(0, 2);
          }
          // Si el producto está en un estante
          if (data.location === 'shelf') {
            state.breadcrumbs[2] = { title: data.name, key: 'product' };
            state.breadcrumbs = state.breadcrumbs.slice(0, 3);
          }
          // Si el producto está en una fila de estantes
          if (data.location === 'rowShelf') {
            state.breadcrumbs[3] = { title: data.name, key: 'product' };
            state.breadcrumbs = state.breadcrumbs.slice(0, 4);
          }
          // Si el producto está en un segmento
          if (data.location === 'segment') {
            state.breadcrumbs[4] = { title: data.name, key: 'product' };
            state.breadcrumbs = state.breadcrumbs.slice(0, 5);
          }
          break;
        default:
          state.breadcrumbs = [{ title: 'Warehouse', key: 'warehouse' }];
      }

      // Actualiza las selecciones de acuerdo al nivel de vista
      if (view === 'warehouse') {
        state.selectedWarehouse = data;
        state.selectedShelf = null;
        state.selectedRowShelf = null;
        state.selectedSegment = null;
      }
      if (view === 'shelf') {
        state.selectedShelf = data;
        state.selectedRowShelf = null;
        state.selectedSegment = null;
      }
      if (view === 'rowShelf') {
        state.selectedRowShelf = data;
        state.selectedSegment = null;
      }
      if (view === 'segment') {
        state.selectedSegment = data;
      }

      // Si se navega a un producto, se actualiza el producto seleccionado
      if (product) {
        state.selectedProduct = product;
      }
    },
    
    // Retrocede un nivel en la navegación
    back: (state) => {
      const viewMap = {
        product: 'segment',
        segment: 'rowShelf',
        rowShelf: 'shelf',
        shelf: 'warehouse',
      };

      state.currentView = viewMap[state.currentView] || 'warehouse';
      state.breadcrumbs.pop();

      // Limpiar selección de productos y datos al retroceder
      if (state.currentView === 'warehouse') {
        state.selectedShelf = null;
        state.selectedRowShelf = null;
        state.selectedSegment = null;
        state.selectedProduct = null;
      } else if (state.currentView === 'shelf') {
        state.selectedRowShelf = null;
        state.selectedSegment = null;
        state.selectedProduct = null;
      } else if (state.currentView === 'rowShelf') {
        state.selectedSegment = null;
        state.selectedProduct = null;
      } else if (state.currentView === 'segment') {
        state.selectedProduct = null;
      }
    },
  },
});

export const { navigateWarehouse, back } = warehouseSlice.actions;
export default warehouseSlice.reducer;

export const selectWarehouse = (state) => state.warehouse;
