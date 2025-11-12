import { createContext } from 'react';

export const CategoryContext = createContext();

export const initCategoryState = {
  isOpen: false,
  type: 'create',
  onSubmit: null,
};

export const initCategory = {
  name: '',
  id: '',
};
