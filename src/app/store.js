import { configureStore } from "@reduxjs/toolkit";

import { totalsListener } from "./middleware/cartTotalsListener";

import userReducer from '../features/auth/userSlice';
import searchReducer from '../features/search/searchSlice';
import cartReducer from '../features/cart/cartSlice';
import modalReducer from '../features/modals/modalSlice';
import categoryReducer from '../features/category/categorySlicer';
import customProductReducer from '../features/customProducts/customProductSlice';
import addProductReducer from "../features/Firestore/products/addProductSlice";
import addOrderReducer from "../features/addOrder/addOrderSlice";
import updateProductReducer from "../features/updateProduct/updateProductSlice";
import alertReducer from "../features/Alert/AlertSlice";
import uploadImgReducer from "../features/uploadImg/uploadImageSlice";
import settingReducer from '../features/setting/settingSlice';
import taxReceiptReducer from '../features/taxReceipt/taxReceiptSlice';
import themeReducer from "../features/theme/themeSlice";
import notificationReducer from "../features/notification/notificationSlice";
import notificationCenterReducer from "../features/notification/notificationCenterSlice";
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
import warehouseModalReducer from "../features/warehouse/warehouseModalSlice";
import shelfModalReducer from "../features/warehouse/shelfModalSlice";
import rowShelfModalReducer from "../features/warehouse/rowShelfModalSlice";
import segmentModalReducer from "../features/warehouse/segmentModalSlice";
import productExpirySelectorReducer from "../features/warehouse/productExpirySelectionSlice";
import activeIngredientsReducer from "../features/activeIngredients/activeIngredientsSlice";
import fileReducer from '../features/files/fileSlice';
import productStockSimpleReducer from '../features/productStock/productStockSimpleSlice';
import deleteProductStockReducer from '../features/productStock/deleteProductStockSlice';
import insuranceReducer from '../features/insurance/insuranceSlice';
import insuranceConfigModalReducer from '../features/insurance/insuranceConfigModalSlice';
import insuranceAuthReducer from '../features/insurance/insuranceAuthSlice';
import insuranceAccountsReceivableReducer from '../features/insurance/insuranceAccountsReceivableSlice';
import navigationReducer from '../features/navigation/navigationSlice'
import creditNoteModalReducer from "../features/creditNote/creditNoteModalSlice";
import doctorsReducer from '../features/doctors/doctorsSlice';

export const store = configureStore({
  reducer: {
    // Core
    app: appReducer,
    nav: navReducer,
    loader: loaderReducer,
    alert: alertReducer,
    navigation: navigationReducer,
    
    // Auth & Users
    user: userReducer,
    business: businessReducer,
    abilities: abilitiesReducer,
    usersManagement: usersManagementSlice,
    
    // UI Components
    modal: modalReducer,    theme: themeReducer,
    setting: settingReducer,
    notification: notificationReducer,
    notificationCenter: notificationCenterReducer,
    userNotification: UserNotificationReducer,
    imageViewer: viewerImageReducer,
    uploadImg: uploadImgReducer,
    note: noteModalReducer,
    
    // Products & Categories
    search: searchReducer,
    category: categoryReducer,
    addProduct: addProductReducer,
    updateProduct: updateProductReducer,
    filterProducts: filterProductsSliceReducer,
    customProduct: customProductReducer,
    customPizza: customPizzaReducer,
    productOutflow: productOutflowReducer,
    activeIngredients: activeIngredientsReducer,
    
    // Cart & Orders
    cart: cartReducer,
    clientCart: clientCartReducer,
    addOrder: addOrderReducer,
    
    // Financial
    cashCountManagement: cashCountManagementReducer,
    cashCountState: cashCountState,
    accountsReceivable: accountsReceivableReducer,
    accountsReceivablePayment: accountsReceivablePaymentReducer,
    insuranceAccountsReceivable: insuranceAccountsReceivableReducer,
    creditNoteModal: creditNoteModalReducer,
    ...expenseSlices,
    ...purchaseSlices,
    
    // Invoicing
    invoiceForm: invoiceFormReducer,
    invoices: invoicesSlice,
    invoicePreview: invoicePreviewReducer,
    taxReceipt: taxReceiptReducer,
    
    // Warehouse & Inventory
    warehouse: warehouseReducer,
    warehouseModal: warehouseModalReducer,
    shelfModal: shelfModalReducer,
    rowShelfModal: rowShelfModalReducer,
    segmentModal: segmentModalReducer,
    productStock: productStockReducer,
    productExpirySelector: productExpirySelectorReducer,
    productStockSimple: productStockSimpleReducer,
    deleteProductStock: deleteProductStockReducer,
    
    // Utilities
    barcodePrintModal: barcodePrintModalReducer,
    productWeightEntryModalSlice: productWeightEntryModalSlice,
    files: fileReducer,
    insurance: insuranceReducer,
    insuranceConfigModal: insuranceConfigModalReducer,
    insuranceAuth: insuranceAuthReducer,
    doctors: doctorsReducer,
  },
  middleware: (getDefault) => getDefault().prepend(totalsListener.middleware),
  devTools: process.env.NODE_ENV !== "production",
})

export default store;