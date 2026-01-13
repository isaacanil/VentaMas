import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState = {
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
    addProduct: (state: any, actions: PayloadAction<any>) => {
      state.product = actions.payload;
    },
    addIngredient: (state: any, action: PayloadAction<any>) => {
      const ingredientExists = state.ingredient.find(
        ({ id }) => id === action.payload.id,
      );
      if (!ingredientExists) {
        state.ingredient.push(action.payload);
      }
    },
    deleteIngredient: (state: any, action: PayloadAction<any>) => {
      const checkingID = state.ingredient.find(
        ({ id }) => id === action.payload.id,
      );
      if (checkingID) {
        state.ingredient.splice(state.ingredient.indexOf(checkingID), 1);
      } else {
        // Ingredient not found
      }
    },
    gettingIngredientList: (state: any) => {
      let list = [];
      state.ingredient.map((ingredient) => (list = [...list, ingredient.name]));
      state.ingredientList = list.toString();
    },
    totalPurchase: (state: any) => {
      const n = state.ingredient.reduce(
        (total, ingredient) => total + Number(ingredient.cost),
        0,
      );
      state.totalIngredients.value = n;
    },
    formatData: (state: any) => {
      ((state.ingredient = []),
        (state.ingredientList = ''),
        (state.totalIngredients = {
          value: 0,
        }),
        (state.totalProductPrice = 0));
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

export const selectTotalIngredientPrice = (state) =>
  state.customProduct.totalIngredients.value;
export const selectIngredientList = (state) => state.customProduct.ingredient;
export const SelectIngredientsListName = (state) =>
  state.customProduct.ingredientList;


