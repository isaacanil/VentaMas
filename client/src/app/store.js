import { Iterable } from 'immutable'
import { 
    configureStore,
    createSerializableStateInvariantMiddleware,
    isPlain,
 } from "@reduxjs/toolkit";
import userReducer from '../features/auth/userSlice'
import searchReducer from '../features/search/searchSlice'
import cartReducer from '../features/cart/cartSlice'
import modalReducer from '../features/modals/modalSlice'
import categoryReducer from '../features/category/categorySlicer'
import customProductReducer from '../features/customProducts/customProductSlice'
import addProductReducer from "../features/Firestore/products/addProductSlice";
import addOrderReducer from "../features/addOrder/addOrderModalSlice";
import updateProductReducer from "../features/updateProduct/updateProductSlice";
import alertReducer from "../features/Alert/AlertSlice";
const isSerializable = (value) => Iterable.isIterable(value) || isPlain(value)
const getEntries = (value) => Iterable.isIterable(value) ? value.entries() : Object.entries(value)
const serializableMiddleware = createSerializableStateInvariantMiddleware({
    isSerializable,
    getEntries,
  })

export const store = configureStore({
    reducer: {
        user: userReducer,
        search: searchReducer,
        cart: cartReducer,
        modal: modalReducer,
        category: categoryReducer,
        customProduct: customProductReducer,
        addProduct: addProductReducer,
        addOrder: addOrderReducer,
        updateProduct: updateProductReducer,
     
        alert: alertReducer,
    },
    middleware: [serializableMiddleware],
})