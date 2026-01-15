// Import necessary libraries
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ProductExpirySelectorState {
  inventory: any[];
  product: any;
  productId: string | null;
  filter: string;
  orderBy: string | null;
  orderAscending: boolean;
  isOpen: boolean;
}

// Initial inventory state
const initialState: ProductExpirySelectorState = {
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
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload;
    },
    openProductExpirySelector: (state, action: PayloadAction<any>) => {
      state.isOpen = true;
      state.product = action.payload;
      state.productId = action.payload.id;
    },
    setOrderBy: (state, action: PayloadAction<string>) => {
      if (state.orderBy === action.payload) {
        state.orderAscending = !state.orderAscending;
      } else {
        state.orderBy = action.payload;
        state.orderAscending = true;
      }
    },
    setProductExpiryState: (state, action: PayloadAction<Partial<ProductExpirySelectorState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    updateInventory: (state, action: PayloadAction<any[]>) => {
      state.inventory = action.payload;
    },
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    clearProductExpirySelector: () => {
      return initialState;
    },
  },
});

// Export actions and reducer
export const {
  setFilter,
  setOrderBy,
  updateInventory,
  openProductExpirySelector,
  setProductExpiryState,
  clearProductExpirySelector,
  setModalOpen,
} = productExpirySelectorSlice.actions;
export default productExpirySelectorSlice.reducer;

const selectInventory = (state: any) => state.productExpirySelector.inventory;
const selectFilter = (state: any) => state.productExpirySelector.filter;
const selectOrderBy = (state: any) => state.productExpirySelector.orderBy;
const selectOrderAscending = (state: any) =>
  state.productExpirySelector.orderAscending;
export const selectProduct = (state: any) => state.productExpirySelector.product;
export const selectProductId = (state: any) => state.productExpirySelector.productId;
export const selectModalOpen = (state: any) => state.productExpirySelector.isOpen;

export const selectFilteredInventory = createSelector(
  [selectInventory, selectFilter, selectOrderBy, selectOrderAscending],
  (inventory: any[], filter: string, orderBy: string | null, orderAscending: boolean) => {
    const filteredInventory = inventory.filter((item: any) =>
      Object.values(item).some((value: any) =>
        value?.toString().toLowerCase().includes(filter.toLowerCase()),
      ),
    );

    if (!orderBy) return filteredInventory;

    return filteredInventory.sort((a: any, b: any) => {
      if (a[orderBy] < b[orderBy]) return orderAscending ? -1 : 1;
      if (a[orderBy] > b[orderBy]) return orderAscending ? 1 : -1;
      return 0;
    });
  },
);


