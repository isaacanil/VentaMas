import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { notification } from 'antd';

interface CategoryItem {
  id: string;
  name: string;
  type: 'category' | 'activeIngredient';
}

interface CategoryState {
  status: boolean;
  items: CategoryItem[];
}

const initialState: CategoryState = {
  status: false,
  items: [],
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    addItem: (state: CategoryState, action: PayloadAction<CategoryItem>) => {
      const { id, name, type } = action.payload; // 'type' determina si es categoría o activeIngredient
      const list = state.items.filter((item: CategoryItem) => item.type === type); // Filtramos según el tipo

      const checkingNameIsDifferent = list.every((item: CategoryItem) => item.id !== id);
      if (checkingNameIsDifferent && list.length < 12) {
        state.status = true;
        state.items.push({ id, name, type }); // Añadimos el tipo al objeto
      } else if (list.length === 12) {
        notification.error({
          message: 'Error',
          description: `No puedes agregar más de 12 elementos en la lista de ${type === 'category' ? 'categorías' : 'ingredientes activos'}`,
        });
      }
    },
    deleteAllItems: (state: CategoryState) => {
      state.items = [];
      state.status = false;
    },
    deleteItem: (state: CategoryState, action: PayloadAction<{ id: string; type: string }>) => {
      const { id, type } = action.payload;
      const index = state.items.findIndex(
        (item: CategoryItem) => item.id === id && item.type === type,
      );

      if (index !== -1) {
        state.items.splice(index, 1); // Eliminamos el elemento
      }

      // Si no quedan elementos de ningún tipo, actualizamos el estado
      if (state.items.length === 0) {
        state.status = false;
      }
    },
  },
});
export const { addItem, deleteAllItems, deleteItem } = categorySlice.actions;

interface CategoryRootState {
  category: CategoryState;
}

export const SelectCategoryList = (state: CategoryRootState) => state.category.items;
export const SelectCategoryState = (state: CategoryRootState) => state.category;
export const SelectCategoryStatus = (state: CategoryRootState) => state.category.status;
export const SelectCategories = createSelector(SelectCategoryList, (items: CategoryItem[]) =>
  items.filter((item: CategoryItem) => item.type === 'category'),
);

export const SelectActiveIngredients = createSelector(
  SelectCategoryList,
  (items: CategoryItem[]) => items.filter((item: CategoryItem) => item.type === 'activeIngredient'),
);

export default categorySlice.reducer;


