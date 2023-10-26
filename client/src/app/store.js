import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../features/auth/userSlice';
import searchReducer from '../features/search/searchSlice';
import cartReducer from '../features/cart/cartSlice';
import modalReducer from '../features/modals/modalSlice';
import categoryReducer from '../features/category/categorySlicer';
import customProductReducer from '../features/customProducts/customProductSlice';
import addProductReducer from "../features/Firestore/products/addProductSlice";
import addOrderReducer from "../features/addOrder/addOrderModalSlice";
import updateProductReducer from "../features/updateProduct/updateProductSlice";
import alertReducer from "../features/Alert/AlertSlice";
import uploadImgReducer from "../features/uploadImg/uploadImageSlice";
import settingReducer from '../features/setting/settingSlice';
import taxReceiptReducer from '../features/taxReceipt/taxReceiptSlice';
import themeReducer from "../features/theme/themeSlice";
import notificationReducer from "../features/notification/notificationSlice";
import navReducer from "../features/nav/navSlice";
import appReducer from "../features/appModes/appModeSlice";
import loaderReducer from "../features/loader/loaderSlice";
import viewerImageReducer from "../features/imageViewer/imageViewerSlice";
import customPizzaReducer from "../features/customProducts/customPizzaSlice";
import productOutflowReducer from "../features/productOutflow/productOutflow";
import clientCartReducer from "../features/clientCart/clientCartSlice";
import businessReducer from "../features/auth/businessSlice";
import abilitiesReducer from "../features/abilities/abilitiesSlice";
import cashCountManagementReducer from "../features/cashCount/cashCountManagementSlice";
import UserNotificationReducer from "../features/UserNotification/UserNotificationSlice";
import usersManagementSlice from "../features/usersManagement/usersManagementSlice";
import filterProductsSliceReducer from "../features/filterProduct/filterProductsSlice";
import noteModalReducer from "../features/noteModal/noteModalSlice";
import cashCountState from "../features/cashCount/cashStateSlice";
import * as expenseSlices from '../features/expense';
import * as purchaseSlices from '../features/purchase';

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    cart: cartReducer,
    abilities: abilitiesReducer,
    filterProducts: filterProductsSliceReducer,
    clientCart: clientCartReducer,
    addOrder: addOrderReducer,
    productOutflow: productOutflowReducer,
    business: businessReducer,
    search: searchReducer,
    category: categoryReducer,
    customProduct: customProductReducer,
    addProduct: addProductReducer,
    updateProduct: updateProductReducer,
    customPizza: customPizzaReducer,
    modal: modalReducer,
    alert: alertReducer,
    notification: notificationReducer,
    setting: settingReducer,
    theme: themeReducer,
    nav: navReducer,
    uploadImg: uploadImgReducer,
    imageViewer: viewerImageReducer,
    taxReceipt: taxReceiptReducer,
    loader: loaderReducer,
    cashCountManagement: cashCountManagementReducer,
    userNotification: UserNotificationReducer,
    usersManagement: usersManagementSlice,
    note: noteModalReducer,
    ...expenseSlices,
    ...purchaseSlices,
    cashCountState: cashCountState,
  }
  ,
})