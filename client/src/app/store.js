import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../features/auth/userSlice'
import searchReducer from '../features/search/searchSlice'
import cartReducer from '../features/cart/cartSlice'
import modalReducer from '../features/modals/modalSlice'
export const store = configureStore({
    reducer: {
        user: userReducer,
        search: searchReducer,
        cart: cartReducer,
        modal: modalReducer
    }
})