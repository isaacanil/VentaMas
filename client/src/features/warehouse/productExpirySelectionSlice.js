// Import necessary libraries
import { createSelector, createSlice } from '@reduxjs/toolkit';

// Initial inventory state
const initialState = {
  inventory: [],
  product: null,
  productId: null,
  filter: '',
  orderBy: null,
  orderAscending: true,
  isOpen: false,
};

// Slice to manage inventory state
const productExpirySelectorSlice = createSlice({
  name: 'productExpirySelector',
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    openProductExpirySelector: (state, action) => {
      state.isOpen = true;
      state.product = action.payload;
      state.productId = action.payload.id;
    },
    setOrderBy: (state, action) => {
      if (state.orderBy === action.payload) {
        state.orderAscending = !state.orderAscending;
      } else {
        state.orderBy = action.payload;
        state.orderAscending = true;
      }
    },
    setProductExpiryState: (state, action) => {
      return {
        ...state,
        ...action.payload,
      }
    },
    updateInventory: (state, action) => {
      state.inventory = action.payload;
    },
    setModalOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    clearProductExpirySelector: (state) => {
      return initialState;
    }
  },
});

// Export actions and reducer
export const { setFilter, setOrderBy, updateInventory, openProductExpirySelector, setProductExpiryState, clearProductExpirySelector, setModalOpen } = productExpirySelectorSlice.actions;
export default productExpirySelectorSlice.reducer;

const selectInventory = state => state.productExpirySelector.inventory;
const selectFilter = state => state.productExpirySelector.filter;
const selectOrderBy = state => state.productExpirySelector.orderBy;
const selectOrderAscending = state => state.productExpirySelector.orderAscending;
export const selectProduct = state => state.productExpirySelector.product;
export const selectProductId = state => state.productExpirySelector.productId;
export const selectModalOpen = state => state.productExpirySelector.isOpen;

export const selectFilteredInventory = createSelector(
  [selectInventory, selectFilter, selectOrderBy, selectOrderAscending],
  (inventory, filter, orderBy, orderAscending) => {
    const filteredInventory = inventory.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(filter.toLowerCase())
      )
    );

    if (!orderBy) return filteredInventory;

    return filteredInventory.sort((a, b) => {
      if (a[orderBy] < b[orderBy]) return orderAscending ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return orderAscending ? 1 : -1;
      return 0;
    });
  }
);
