// store/slices/warehouseSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'warehouse',
  selectedWarehouse: null,
  selectedShelf: null,
  selectedRowShelf: null,
  selectedSegment: null,
  breadcrumbs: [{ title: 'Warehouse', key: 'warehouse' }],
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    navigateWarehouse: (state, action) => {
      const { view, data } = action.payload;
      state.currentView = view;

      // Actualiza los breadcrumbs
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
          break;
        default:
          state.breadcrumbs = [{ title: 'Warehouse', key: 'warehouse' }];
      }

      if (view === 'warehouse') state.selectedWarehouse = data;
      if (view === 'shelf') state.selectedShelf = data;
      if (view === 'rowShelf') state.selectedRowShelf = data;
      if (view === 'segment') state.selectedSegment = data;
    },
    back: (state) => {
      const viewMap = {
        segment: 'rowShelf',
        rowShelf: 'shelf',
        shelf: 'warehouse',
      };

      state.currentView = viewMap[state.currentView] || 'warehouse';
      state.breadcrumbs.pop();

      // Limpiar selección de datos al retroceder

       if (state.currentView === 'shelf') {
        state.selectedRowShelf = null;
        state.selectedSegment = null;
      } else if (state.currentView === 'rowShelf') {
        state.selectedSegment = null;
      }

    },
  },
});

export const { navigateWarehouse, back } = warehouseSlice.actions;
export default warehouseSlice.reducer;

export const selectWarehouse = (state) => state.warehouse;
