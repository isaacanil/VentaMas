import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { notification } from 'antd';

const initialState = {
  status: false,
  items: [],
};
const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    addItem: (state: any, action: PayloadAction<any>) => {
      const { id, name, type } = action.payload; // 'type' determina si es categorÃ­a o activeIngredient
      const list = state.items.filter((item) => item.type === type); // Filtramos segÃºn el tipo

      const checkingNameIsDifferent = list.every((item) => item.id !== id);
      if (checkingNameIsDifferent && list.length < 12) {
        state.status = true;
        state.items.push({ id, name, type }); // AÃ±adimos el tipo al objeto
      } else if (list.length === 12) {
        notification.error({
          message: 'Error',
          description: `No puedes agregar mÃ¡s de 12 elementos en la lista de ${type === 'category' ? 'categorÃ­as' : 'ingredientes activos'}`,
        });
      }
    },
    deleteAllItems: (state: any) => {
      state.items = [];
      state.status = false;
    },
    deleteItem: (state: any, action: PayloadAction<any>) => {
      const { id, type } = action.payload;
      const index = state.items.findIndex(
        (item) => item.id === id && item.type === type,
      );

      if (index !== -1) {
        state.items.splice(index, 1); // Eliminamos el elemento
      }

      // Si no quedan elementos de ningÃºn tipo, actualizamos el estado
      if (state.items.length === 0) {
        state.status = false;
      }
    },
  },
});
export const { addItem, deleteAllItems, deleteItem } = categorySlice.actions;

export const SelectCategoryList = (state) => state.category.items;
export const SelectCategoryState = (state) => state.category;
export const SelectCategoryStatus = (state) => state.category.status;
export const SelectCategories = createSelector(SelectCategoryList, (items) =>
  items.filter((item) => item.type === 'category'),
);

export const SelectActiveIngredients = createSelector(
  SelectCategoryList,
  (items) => items.filter((item) => item.type === 'activeIngredient'),
);

export default categorySlice.reducer;


