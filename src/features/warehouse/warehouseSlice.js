// store/slices/warehouseSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'warehouse',
  selectedWarehouse: null,
  selectedShelf: null,
  selectedRowShelf: null,
  selectedSegment: null,
  breadcrumbs: [{ title: 'Warehouse', key: 'warehouse', data: null }],
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    // Navega a una ubicación o un producto en cualquier nivel
    navigateWarehouse: (state, action) => {
      const { view, data } = action.payload;
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
    },

    // Retrocede un nivel en la navegación
    back: (state) => {
      const viewMap = {
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
      } else if (state.currentView === 'shelf') {
        state.selectedRowShelf = null;
        state.selectedSegment = null;
      } else if (state.currentView === 'rowShelf') {
        state.selectedSegment = null;
      }
    },

    // Nueva acción para navegar a través de los breadcrumbs
    navigateToBreadcrumb: (state, action) => {
      const index = action.payload; // Índice del breadcrumb clicado

      // Actualizar breadcrumbs
      state.breadcrumbs = state.breadcrumbs.slice(0, index + 1);

      // Resetear selecciones basadas en el índice clickeado
      // Recordar: 0=warehouse, 1=shelf, 2=rowShelf, 3=segment
      switch (index) {
        case 0: // Warehouse
          state.selectedShelf = null;
          state.selectedRowShelf = null;
          state.selectedSegment = null;
          state.currentView = 'warehouse';
          break;
        case 1: // Shelf
          state.selectedRowShelf = null;
          state.selectedSegment = null;
          state.currentView = 'shelf';
          break;
        case 2: // RowShelf
          state.selectedSegment = null;
          state.currentView = 'rowShelf';
          break;
        case 3: // Segment
          state.currentView = 'segment';
          break;
        default:
          // Si por alguna razón el índice está fuera de rango, resetear todo
          state.selectedWarehouse = null;
          state.selectedShelf = null;
          state.selectedRowShelf = null;
          state.selectedSegment = null;
          state.currentView = 'warehouse';
      }
    },
  },
});

export const { navigateWarehouse, back, navigateToBreadcrumb } =
  warehouseSlice.actions;
export default warehouseSlice.reducer;

export const selectWarehouse = (state) => state.warehouse;
