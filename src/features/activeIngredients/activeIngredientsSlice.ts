import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ActiveIngredient } from '@/types/products';

type ActiveIngredientRecord = ActiveIngredient & Record<string, unknown>;

interface ActiveIngredientModalState {
  isOpen: boolean;
  initialValues: ActiveIngredientRecord | null;
}

interface ActiveIngredientsState {
  activeIngredients: ActiveIngredientRecord[];
  activeIngredientModal: ActiveIngredientModalState;
}

interface ActiveIngredientsRootState {
  activeIngredients: ActiveIngredientsState;
}

// Estado inicial
const initialState: ActiveIngredientsState = {
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
    openModal: (
      state: ActiveIngredientsState,
      action: PayloadAction<{ initialValues?: ActiveIngredientRecord | null }>,
    ) => {
      state.activeIngredientModal.isOpen = true;
      state.activeIngredientModal.initialValues =
        action.payload.initialValues || null;
    },
    closeModal: (state: ActiveIngredientsState) => {
      state.activeIngredientModal.isOpen = false;
      state.activeIngredientModal.initialValues = null;
    },
    addIngredient: (
      state: ActiveIngredientsState,
      action: PayloadAction<ActiveIngredientRecord>,
    ) => {
      state.activeIngredients.push(action.payload);
    },
    removeIngredient: (
      state: ActiveIngredientsState,
      action: PayloadAction<string>,
    ) => {
      state.activeIngredients = state.activeIngredients.filter(
        (ingredient) => ingredient.id !== action.payload,
      );
    },
    updateIngredient: (
      state: ActiveIngredientsState,
      action: PayloadAction<ActiveIngredientRecord>,
    ) => {
      const index = state.activeIngredients.findIndex(
        (ingredient) => ingredient.id === action.payload.id,
      );
      if (index != -1) {
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
export const selectActiveIngredientModal = (
  state: ActiveIngredientsRootState,
) => state.activeIngredients.activeIngredientModal;
