import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  EmptyNewProduct,
  EmptyProduct,
  EmptyProductSelected,
} from './emptyData';

const customPizzaSlice = createSlice({
  name: 'customPizza',
  initialState: {
    products: [],
    pizzaSlices: [],
    sizeList: [],
    isComplete: true,
    product: EmptyProduct,
    productSelected: EmptyProductSelected,
    totalIngredientPrice: 0,
    ingredientListNameSelected: '',
    newProduct: EmptyNewProduct,
  },
  reducers: {
    setProducts: (state: any, action: PayloadAction<any>) => {
      state.products = action.payload;
    },
    setIsComplete: (state: any, action: PayloadAction<any>) => {
      state.isComplete = action.payload;
    },
    setProduct: (state: any, action: PayloadAction<any>) => {
      state.product = action.payload;
    },
    setProductSelected: (state: any, action: PayloadAction<any>) => {
      state.productSelected = action.payload;
    },
    setTotalIngredientPrice: (state: any, action: PayloadAction<any>) => {
      state.totalIngredientPrice = action.payload;
    },
    setIngredientListNameSelected: (state: any, action: PayloadAction<any>) => {
      state.ingredientListNameSelected = action.payload;
    },
    setNewProduct: (state: any, action: PayloadAction<any>) => {
      state.newProduct = action.payload;
    },
  },
});

export const {
  setProducts,
  setIsComplete,
  setProduct,
  setProductSelected,
  setTotalIngredientPrice,
  setIngredientListNameSelected,
  setNewProduct,
} = customPizzaSlice.actions;

export default customPizzaSlice.reducer;

export const selectCustomPizza = (state) => state.customPizza;


