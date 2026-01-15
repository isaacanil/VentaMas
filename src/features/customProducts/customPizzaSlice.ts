import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  EmptyNewProduct,
  EmptyProduct,
  EmptyProductSelected,
} from './emptyData';

interface CustomPizzaState {
  products: any[];
  pizzaSlices: any[];
  sizeList: any[];
  isComplete: boolean;
  product: any;
  productSelected: any;
  totalIngredientPrice: number;
  ingredientListNameSelected: string;
  newProduct: any;
}

interface CustomPizzaRootState {
  customPizza: CustomPizzaState;
}

const initialState: CustomPizzaState = {
  products: [],
  pizzaSlices: [],
  sizeList: [],
  isComplete: true,
  product: EmptyProduct,
  productSelected: EmptyProductSelected,
  totalIngredientPrice: 0,
  ingredientListNameSelected: '',
  newProduct: EmptyNewProduct,
};

const customPizzaSlice = createSlice({
  name: 'customPizza',
  initialState,
  reducers: {
    setProducts: (state: CustomPizzaState, action: PayloadAction<any[]>) => {
      state.products = action.payload;
    },
    setIsComplete: (state: CustomPizzaState, action: PayloadAction<boolean>) => {
      state.isComplete = action.payload;
    },
    setProduct: (state: CustomPizzaState, action: PayloadAction<any>) => {
      state.product = action.payload;
    },
    setProductSelected: (state: CustomPizzaState, action: PayloadAction<any>) => {
      state.productSelected = action.payload;
    },
    setTotalIngredientPrice: (state: CustomPizzaState, action: PayloadAction<number>) => {
      state.totalIngredientPrice = action.payload;
    },
    setIngredientListNameSelected: (state: CustomPizzaState, action: PayloadAction<string>) => {
      state.ingredientListNameSelected = action.payload;
    },
    setNewProduct: (state: CustomPizzaState, action: PayloadAction<any>) => {
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

export const selectCustomPizza = (state: CustomPizzaRootState) => state.customPizza;
