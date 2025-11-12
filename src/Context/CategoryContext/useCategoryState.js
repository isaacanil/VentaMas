import { useContext } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { fbAddCategory } from '../../firebase/categories/fbAddCategory';
import { fbAddExpenseCategory } from '../../firebase/expenses/categories/fbAddExpenseCategory';

import { CategoryContext, initCategory, initCategoryState } from './contextState';

const warning = {
    context: 'useCategory debe ser usado dentro de un CategoryProvider',
};

export const useCategoryState = () => {
    const context = useContext(CategoryContext);
    const user = useSelector(selectUser);
    if (!context) { throw new Error(warning.context); }

    const { categoryState, setCategoryState, category, setCategory } = context;

    const onClose = () => {
        setCategoryState(initCategoryState);
        setCategory(initCategory);
    };

    const onSubmit = (cat) => {
        if (typeof categoryState.onSubmit === 'function') {
            categoryState.onSubmit(user, cat);
            onClose();
        } else {
            throw new Error('No onSubmit function provided in categoryState.');
        }
    };

    const configureCategoryModal = (data) => {
        setCategoryState({
            ...categoryState,
            ...data,
        });
    };

    const configureModal = (isOpen, type, onSubmitFunction) => {
        configureCategoryModal({ isOpen, type, onSubmit: onSubmitFunction });
    };

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
        onClose,
    };
};
