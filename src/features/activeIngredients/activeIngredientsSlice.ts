import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Estado inicial
const initialState = {
  activeIngredients: [], // Lista de ingredientes activos
  activeIngredientModal: {
    isOpen: false, // Estado para manejar el modal de ingredientes activos
    initialValues: null, // Valores iniciales para el formulario
  },
};

// Creamos el slice
const activeIngredientsSlice = createSlice({
  name: 'activeIngredients',
  initialState,
  reducers: {
    openModal: (state: any, action: PayloadAction<any>) => {
      state.activeIngredientModal.isOpen = true;
      state.activeIngredientModal.initialValues =
        action.payload.initialValues || null;
    },
    closeModal: (state: any) => {
      state.activeIngredientModal.isOpen = false;
      state.activeIngredientModal.initialValues = null;
    },
    addIngredient: (state: any, action: PayloadAction<any>) => {
      state.activeIngredients.push(action.payload);
    },
    removeIngredient: (state: any, action: PayloadAction<any>) => {
      state.activeIngredients = state.activeIngredients.filter(
        (ingredient) => ingredient.id !== action.payload,
      );
    },
    updateIngredient: (state: any, action: PayloadAction<any>) => {
      const index = state.activeIngredients.findIndex(
        (ingredient) => ingredient.id === action.payload.id,
      );
      if (index !== -1) {
        state.activeIngredients[index] = action.payload;
      }
    },
  },
});

// Exportamos las acciones y el reducer
export const {
  openModal,
  closeModal,
  addIngredient,
  removeIngredient,
  updateIngredient,
} = activeIngredientsSlice.actions;

export default activeIngredientsSlice.reducer;

// Selector para el modal de ingredientes activos
export const selectActiveIngredientModal = (state) =>
  state.activeIngredients.activeIngredientModal;


