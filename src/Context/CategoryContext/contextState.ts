import { createContext } from 'react';

/**
 * Representa una categoría en el sistema
 */
export interface Category {
  name: string;
  id: string;
  [key: string]: any;
}

/**
 * Usuario con información de negocio para operaciones de categoría
 */
export interface CategoryUser {
  businessID: string;
  id?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Función de callback para enviar una categoría
 */
export type CategorySubmitFunction = (
  user: CategoryUser,
  category: Category | Record<string, any>
) => void | Promise<void> | Promise<boolean>;

/**
 * Estado del modal de categoría
 */
export interface CategoryState {
  isOpen: boolean;
  type: 'create' | 'edit';
  onSubmit: CategorySubmitFunction | null;
}

/**
 * Valor del contexto de categoría
 */
export interface CategoryContextValue {
  category: Category;
  setCategory: React.Dispatch<React.SetStateAction<Category>>;
  categoryState: CategoryState;
  setCategoryState: React.Dispatch<React.SetStateAction<CategoryState>>;
}

export const CategoryContext = createContext<CategoryContextValue | null>(null);

export const initCategoryState: CategoryState = {
  isOpen: false,
  type: 'create',
  onSubmit: null,
};

export const initCategory: Category = {
  name: '',
  id: '',
};
