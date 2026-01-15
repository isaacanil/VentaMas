import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CostPrice {
  unit: string | number;
  total: string | number;
}

interface TaxData {
  unit: string | number;
  ref: string;
  value: string | number;
  total: number;
}

interface AmountToBuy {
  unit: number;
  total: number;
}

interface AddProductState {
  product: {
    productName: string;
    productImage: string;
    productImageURL: string;
    category: string;
    cost: CostPrice;
    price: {
      unit: number;
      total: number;
    };
    tax: TaxData;
    stock: number;
    netContent: number;
    amountToBuy: AmountToBuy;
    id: string;
  };
}

interface AddProductRootState {
  addProduct: AddProductState;
}

const initialState: AddProductState = {
  product: {
    productName: '',
    productImage: '',
    productImageURL: '',
    category: '',
    cost: {
      unit: '',
      total: '',
    },
    price: {
      unit: 0,
      total: 0,
    },
    tax: {
      unit: 0,
      ref: '',
      value: '',
      total: 0,
    },
    stock: 0,
    netContent: 0,
    amountToBuy: {
      unit: 1,
      total: 1,
    },
    id: '',
  },
};

export const addProductSlice = createSlice({
  name: 'addProduct',
  initialState,
  reducers: {
    addProductData: (state: AddProductState, action: PayloadAction<{ productImage: string }>) => {
      state.product.productImage = action.payload.productImage;
    },
    priceTotal: (state: AddProductState) => {
      if (state.product.cost.total !== '' && state.product.tax.unit !== '') {
        state.product.price.total =
          Number(state.product.cost.total) * Number(state.product.tax.value) +
          Number(state.product.cost.total);
      }
    },
  },
});

export const { addProductData, priceTotal } = addProductSlice.actions;

export const selectProduct = (state: AddProductRootState) => state.addProduct.product;

export default addProductSlice.reducer;
