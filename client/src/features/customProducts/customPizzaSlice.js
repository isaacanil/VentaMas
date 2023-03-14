import { createSlice } from "@reduxjs/toolkit";
import { EmptyNewProduct, EmptyProduct, EmptyProductSelected } from "./emptyData";

const customPizzaSlice = createSlice({
  name: "customPizza",
  initialState: {
    products: [],
    pizzaSlices: [],
    sizeList: [],
    isComplete: true,
    product: EmptyProduct,
    productSelected: EmptyProductSelected,
    totalIngredientPrice: 0,
    ingredientListNameSelected: "",
    newProduct: EmptyNewProduct,
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setIsComplete: (state, action) => {
      state.isComplete = action.payload;
    },
    setProduct: (state, action) => {
      state.product = action.payload;
    },
    setProductSelected: (state, action) => {
      state.productSelected = action.payload;
    },
    setTotalIngredientPrice: (state, action) => {
      state.totalIngredientPrice = action.payload;
    },
    setIngredientListNameSelected: (state, action) => {
      state.ingredientListNameSelected = action.payload;
    },
    setNewProduct: (state, action) => {
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


