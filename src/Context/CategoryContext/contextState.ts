import { createContext } from 'react';

export const CategoryContext = createContext<any>(null as any);

export const initCategoryState = {
  isOpen: false,
  type: 'create',
  onSubmit: null,
};

export const initCategory = {
  name: '',
  id: '',
};
