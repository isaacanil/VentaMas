
import {configureStore} from "@reduxjs/toolkit";
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
import uploadImgReducer from "../features/uploadImg/uploadImageSlice";
import settingReducer from '../features/setting/settingSlice'
import taxReceiptReducer from '../features/taxReceipt/taxReceiptSlice';
import orderReducer from '../features/order/ordersSlice'
import purchaseReducer from '../features/Purchase/purchaseSlice'
import themeReducer from "../features/theme/themeSlice";
import addPurchaseReducer from "../features/Purchase/addPurchaseSlice";
import notificationReducer from "../features/notification/notificationSlice";
import navReducer from "../features/nav/navSlice";
import appReducer from "../features/appModes/appModeSlice";
import loaderReducer from "../features/loader/loaderSlice";
import viewerImageReducer from "../features/imageViewer/imageViewerSlice";
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
        order: orderReducer,
        updateProduct: updateProductReducer,
        uploadImg: uploadImgReducer,
        alert: alertReducer,
        setting: settingReducer,
        taxReceipt: taxReceiptReducer, 
        purchase: purchaseReducer,
        theme: themeReducer,
        addPurchase: addPurchaseReducer, 
        notification: notificationReducer,
        nav: navReducer,
        app: appReducer,
        loader: loaderReducer,
        imageViewer: viewerImageReducer
    },
})