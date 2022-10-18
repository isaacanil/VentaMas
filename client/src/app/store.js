import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../features/auth/userSlice'
import searchReducer from '../features/search/searchSlice'
import cartReducer from '../features/cart/cartSlice'
import modalReducer from '../features/modals/modalSlice'
import categoryReducer from '../features/category/categorySlicer'
import customProductReducer from '../features/customProducts/customProductSlice'
export const store = configureStore({
    reducer: {
        user: userReducer,
        search: searchReducer,
        cart: cartReducer,
        modal: modalReducer,
        category: categoryReducer,
        customProduct: customProductReducer
    }
})