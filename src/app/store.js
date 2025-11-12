import { configureStore } from '@reduxjs/toolkit';

import abilitiesReducer from '../features/abilities/abilitiesSlice';
import accountsReceivablePaymentReducer from '../features/accountsReceivable/accountsReceivablePaymentSlice';
import accountsReceivableReducer from '../features/accountsReceivable/accountsReceivableSlice';
import activeIngredientsReducer from '../features/activeIngredients/activeIngredientsSlice';
import addOrderReducer from '../features/addOrder/addOrderSlice';
import alertReducer from '../features/Alert/AlertSlice';
import appReducer from '../features/appModes/appModeSlice';
import businessReducer from '../features/auth/businessSlice';
import userReducer from '../features/auth/userSlice';
import barcodePrintModalReducer from '../features/barcodePrintModalSlice/barcodePrintModalSlice';
import cartReducer from '../features/cart/cartSlice';
import cashCountManagementReducer from '../features/cashCount/cashCountManagementSlice';
import cashCountState from '../features/cashCount/cashStateSlice';
import categoryReducer from '../features/category/categorySlicer';
import clientCartReducer from '../features/clientCart/clientCartSlice';
import creditNoteModalReducer from '../features/creditNote/creditNoteModalSlice';
import customPizzaReducer from '../features/customProducts/customPizzaSlice';
import customProductReducer from '../features/customProducts/customProductSlice';
import doctorsReducer from '../features/doctors/doctorsSlice';
import * as expenseSlices from '../features/expense';
import fileReducer from '../features/files/fileSlice';
import filterProductsSliceReducer from '../features/filterProduct/filterProductsSlice';
import addProductReducer from '../features/Firestore/products/addProductSlice';
import viewerImageReducer from '../features/imageViewer/imageViewerSlice';
import insuranceAccountsReceivableReducer from '../features/insurance/insuranceAccountsReceivableSlice';
import insuranceAuthReducer from '../features/insurance/insuranceAuthSlice';
import insuranceConfigModalReducer from '../features/insurance/insuranceConfigModalSlice';
import insuranceReducer from '../features/insurance/insuranceSlice';
import invoiceFormReducer from '../features/invoice/invoiceFormSlice';
import invoicePreviewReducer from '../features/invoice/invoicePreviewSlice';
import invoicesSlice from '../features/invoice/invoicesSlice';
import loaderReducer from '../features/loader/loaderSlice';
import modalReducer from '../features/modals/modalSlice';
import navReducer from '../features/nav/navSlice';
import navigationReducer from '../features/navigation/navigationSlice';
import noteModalReducer from '../features/noteModal/noteModalSlice';
import notificationCenterReducer from '../features/notification/notificationCenterSlice';
import notificationReducer from '../features/notification/notificationSlice';
import productBrandReducer from '../features/productBrands/productBrandSlice';
import productOutflowReducer from '../features/productOutflow/productOutflow';
import deleteProductStockReducer from '../features/productStock/deleteProductStockSlice';
import productStockSimpleReducer from '../features/productStock/productStockSimpleSlice';
import productStockReducer from '../features/productStock/productStockSlice';
import productWeightEntryModalSlice from '../features/productWeightEntryModalSlice/productWeightEntryModalSlice';
import * as purchaseSlices from '../features/purchase';
import searchReducer from '../features/search/searchSlice';
import settingReducer from '../features/setting/settingSlice';
import taxReceiptReducer from '../features/taxReceipt/taxReceiptSlice';
import themeReducer from '../features/theme/themeSlice';
import updateProductReducer from '../features/updateProduct/updateProductSlice';
import uploadImgReducer from '../features/uploadImg/uploadImageSlice';
import UserNotificationReducer from '../features/UserNotification/UserNotificationSlice';
import usersManagementSlice from '../features/usersManagement/usersManagementSlice';
import productExpirySelectorReducer from '../features/warehouse/productExpirySelectionSlice';
import rowShelfModalReducer from '../features/warehouse/rowShelfModalSlice';
import segmentModalReducer from '../features/warehouse/segmentModalSlice';
import shelfModalReducer from '../features/warehouse/shelfModalSlice';
import warehouseModalReducer from '../features/warehouse/warehouseModalSlice';
import warehouseReducer from '../features/warehouse/warehouseSlice';

import { totalsListener } from './middleware/cartTotalsListener';

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
    modal: modalReducer,
    theme: themeReducer,
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
    productBrand: productBrandReducer,

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
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
