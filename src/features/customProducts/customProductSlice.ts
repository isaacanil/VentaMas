import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Ingredient {
  id: string | number;
  name: string;
  cost: number | string;
  [key: string]: any;
}

interface CustomProductState {
  product: any;
  ingredient: Ingredient[];
  ingredientList: string;
  totalIngredients: {
    value: number;
  };
  totalProductPrice: number;
}

interface CustomProductRootState {
  customProduct: CustomProductState;
}

const initialState: CustomProductState = {
  product: {},
  ingredient: [],
  ingredientList: '',
  totalIngredients: {
    value: 0,
  },
  totalProductPrice: 0,
};
const customProductSlice = createSlice({
  name: 'customProduct',
  initialState,
  reducers: {
    addProduct: (state: CustomProductState, actions: PayloadAction<any>) => {
      state.product = actions.payload;
    },
    addIngredient: (
      state: CustomProductState,
      action: PayloadAction<Ingredient>,
    ) => {
      const ingredientExists = state.ingredient.find(
        ({ id }) => id === action.payload.id,
      );
      if (!ingredientExists) {
        state.ingredient.push(action.payload);
      }
    },
    deleteIngredient: (
      state: CustomProductState,
      action: PayloadAction<{ id: string | number }>,
    ) => {
      const checkingID = state.ingredient.find(
        ({ id }) => id === action.payload.id,
      );
      if (checkingID) {
        state.ingredient.splice(state.ingredient.indexOf(checkingID), 1);
      } else {
        // Ingredient not found
      }
    },
    gettingIngredientList: (state: CustomProductState) => {
      let list: string[] = [];
      state.ingredient.forEach(
        (ingredient) => (list = [...list, ingredient.name]),
      );
      state.ingredientList = list.toString();
    },
    totalPurchase: (state: CustomProductState) => {
      const n = state.ingredient.reduce(
        (total: number, ingredient: Ingredient) =>
          total + Number(ingredient.cost),
        0,
      );
      state.totalIngredients.value = n;
    },
    formatData: (state: CustomProductState) => {
      state.ingredient = [];
      state.ingredientList = '';
      state.totalIngredients = {
        value: 0,
      };
      state.totalProductPrice = 0;
    },
  },
});
export const {
  addIngredient,
  gettingIngredientList,
  totalPurchase,
  deleteIngredient,
  formatData,
} = customProductSlice.actions;

export default customProductSlice.reducer;

export const selectTotalIngredientPrice = (state: CustomProductRootState) =>
  state.customProduct.totalIngredients.value;
export const selectIngredientList = (state: CustomProductRootState) =>
  state.customProduct.ingredient;
export const SelectIngredientsListName = (state: CustomProductRootState) =>
  state.customProduct.ingredientList;
