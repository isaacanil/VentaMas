import React, { createContext, useContext, useState } from 'react';
import { selectUser } from '../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { fbAddExpenseCategory } from '../../firebase/expenses/categories/fbAddExpenseCategory';
import { fbAddCategory } from '../../firebase/categories/fbAddCategory';

// Crear el contexto
export const CategoryContext = createContext();

const initCategoryState = {
    isOpen: false,
    type: 'create',
    onSubmit: null,
};
const initCategory = {
    name: '',
    id: '',
};
// Crear el provider
export const CategoryProvider = ({ children }) => {
    const [categoryState, setCategoryState] = useState(initCategoryState);
    const [category, setCategory] = useState(initCategory);
    console.log(category)

    return (
        <CategoryContext.Provider value={{ category, setCategory, categoryState, setCategoryState }}>
            {children}
        </CategoryContext.Provider>
    );
};

// Crear un hook personalizado para usar el diálogo
const warning = {
    context: 'useCategory debe ser usado dentro de un CategoryProvider',
}

export const useCategoryState = () => {
    const context = useContext(CategoryContext);
    const user = useSelector(selectUser)
    if (!context) { throw new Error(warning.context); }

    const { categoryState, setCategoryState, category, setCategory } = context;

    const onClose = () => {
        setCategoryState(initCategoryState);
        setCategory(initCategory);
    };

    const onSubmit = () => {
        if (typeof categoryState.onSubmit === 'function') {
            categoryState.onSubmit(user, category);
            onClose();
        } else {
            throw new Error("No onSubmit function provided in categoryState.");
        }
    }

    const configureCategoryModal = (data) => {
        setCategoryState({
            ...categoryState,
            ...data,
        })
    };

    const configureModal = (isOpen, type, onSubmitFunction) => {
        configureCategoryModal({ isOpen, type, onSubmit: onSubmitFunction, });
    }

    const configureAddProductCategoryModal = () => configureModal(true, 'create', fbAddCategory);
    const configureAddExpenseCategoryModal = () => configureModal(true, 'create', fbAddExpenseCategory);


    return {
        category,
        setCategory,
        categoryState,
        setCategoryState,
        onSubmit,
        configureAddProductCategoryModal,
        configureAddExpenseCategoryModal,
        configureCategoryModal,
        onClose
    };
};

