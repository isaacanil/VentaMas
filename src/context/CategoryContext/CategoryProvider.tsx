import React, { useState } from 'react';

import {
  CategoryContext,
  initCategory,
  initCategoryState,
} from './contextState';

export const CategoryProvider = ({ children }) => {
  const [categoryState, setCategoryState] = useState(initCategoryState);
  const [category, setCategory] = useState(initCategory);

  return (
    <CategoryContext.Provider
      value={{ category, setCategory, categoryState, setCategoryState }}
    >
      {children}
    </CategoryContext.Provider>
  );
};
