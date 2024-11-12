import { createSlice } from '@reduxjs/toolkit';

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
    openModal: (state, action) => {
      state.activeIngredientModal.isOpen = true;
      state.activeIngredientModal.initialValues = action.payload.initialValues || null;
    },
    closeModal: (state) => {
      state.activeIngredientModal.isOpen = false;
      state.activeIngredientModal.initialValues = null;
    },
    addIngredient: (state, action) => {
      state.activeIngredients.push(action.payload);
    },
    removeIngredient: (state, action) => {
      state.activeIngredients = state.activeIngredients.filter(
        (ingredient) => ingredient.id !== action.payload
      );
    },
    updateIngredient: (state, action) => {
      const index = state.activeIngredients.findIndex(
        (ingredient) => ingredient.id === action.payload.id
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
export const selectActiveIngredientModal = (state) => state.activeIngredients.activeIngredientModal;
