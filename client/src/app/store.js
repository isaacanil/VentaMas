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
import invoiceFormReducer from "../features/invoice/invoiceFormSlice";
import productWeightEntryModalSlice from "../features/productWeightEntryModalSlice/productWeightEntryModalSlice";
import * as expenseSlices from '../features/expense';
import * as purchaseSlices from '../features/purchase';
import barcodePrintModalReducer from "../features/barcodePrintModalSlice/barcodePrintModalSlice";
import invoicesSlice from "../features/invoice/invoicesSlice";
import invoicePreviewReducer from "../features/invoice/invoicePreviewSlice";
import accountsReceivableReducer from "../features/accountsReceivable/accountsReceivableSlice";
import accountsReceivablePaymentReducer from "../features/accountsReceivable/accountsReceivablePaymentSlice";
import warehouseReducer from "../features/warehouse/warehouseSlice";
import productStockReducer from "../features/productStock/productStockSlice";
import shelfReducer from "../features/warehouse/shelfSlice";
import rowShelfReducer from "../features/warehouse/rowShelfSlice";
import segmentReducer from "../features/warehouse/segmentSlice";
import productExpirySelectorReducer from "../features/warehouse/productExpirySelectionSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    user: userReducer,
    cart: cartReducer,
    abilities: abilitiesReducer,
    accountsReceivable: accountsReceivableReducer,
    accountsReceivablePayment: accountsReceivablePaymentReducer,
    productWeightEntryModalSlice: productWeightEntryModalSlice,
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
    invoiceForm: invoiceFormReducer,
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
    invoices: invoicesSlice,
    invoicePreview: invoicePreviewReducer,
    ...expenseSlices,
    ...purchaseSlices,
    cashCountState: cashCountState,
    barcodePrintModal: barcodePrintModalReducer,
    warehouse: warehouseReducer,
    shelf: shelfReducer,
    rowShelf: rowShelfReducer,
    segment: segmentReducer,
    productStock: productStockReducer,
    productExpirySelector: productExpirySelectorReducer,
  }
  ,
})